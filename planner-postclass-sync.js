(() => {
  'use strict';
  if (!location.pathname.startsWith('/session-planner')) return;

  const params = new URLSearchParams(location.search);
  const roadmapId = params.get('roadmap');
  if (!roadmapId) return;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const rank = {Introduced:1,Practicing:2,Integrating:3,Mastered:4,Confident:4,Fluent:4};
  let db=null,ctx=null,existing=null,statusByConcept=new Map(),activeItems=[],saving=false;

  async function waitFor(test, timeout=12000) {
    const started=Date.now();
    while(Date.now()-started<timeout){const v=test();if(v)return v;await sleep(100);}throw new Error('The class planner did not finish loading.');
  }

  async function client(){
    await waitFor(()=>window.supabase&&window.GAB_PORTAL?.supabaseUrl);
    if(!db)db=window.__POSTCLASS_SYNC_DB||(window.__POSTCLASS_SYNC_DB=window.supabase.createClient(window.GAB_PORTAL.supabaseUrl,window.GAB_PORTAL.supabaseAnonKey));
    return db;
  }

  function sessionId(){return new URLSearchParams(location.search).get('session')||ctx?.item?.planner_session_id||null;}
  function reflectionEl(){return document.querySelector('#teachingWorkbench [data-field="reflection"]:not([data-activity])');}
  function titleEl(){return document.querySelector('#teachingWorkbench [data-field="title"]:not([data-activity])');}
  function localDate(){const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);}

  async function loadContext(){
    const c=await client();
    const {data:{user}}=await c.auth.getUser();if(!user)throw new Error('Sign in to your teacher account to sync this class.');
    const me=await c.from('profiles').select('role').eq('id',user.id).maybeSingle();if(me.error)throw me.error;if(me.data?.role!=='coach')throw new Error('Coach access is required.');
    const itemRes=await c.from('mentorship_roadmap_items').select('id,student_id,curriculum_node_id,title,horizon,status,planner_session_id').eq('id',roadmapId).maybeSingle();
    if(itemRes.error)throw itemRes.error;if(!itemRes.data)throw new Error('This roadmap checkpoint is unavailable.');
    const item=itemRes.data;
    const sid=new URLSearchParams(location.search).get('session')||item.planner_session_id;
    const [studentRes,lessonRes,itemListRes,outcomeRes]=await Promise.all([
      c.from('profiles').select('display_name').eq('id',item.student_id).maybeSingle(),
      c.from('atlas_lessons').select('concepts,lesson_date,created_at,voided').eq('student_id',item.student_id).eq('voided',false).order('created_at',{ascending:false}).limit(120),
      c.from('mentorship_roadmap_items').select('id,curriculum_node_id,title,horizon,status,priority,pinned').eq('student_id',item.student_id).in('status',['planned','in_progress']).order('priority',{ascending:true}),
      sid?c.from('mentorship_class_outcomes').select('id,outcome,recommended_node_id,recommended_title,next_practice,atlas_status,route_applied_at,lesson_date,updated_at').eq('roadmap_item_id',item.id).eq('planner_session_id',sid).maybeSingle():Promise.resolve({data:null,error:null})
    ]);
    if(studentRes.error)throw studentRes.error;if(lessonRes.error)throw lessonRes.error;if(itemListRes.error)throw itemListRes.error;if(outcomeRes.error)throw outcomeRes.error;
    statusByConcept=new Map();
    for(const lesson of lessonRes.data||[]){for(const [id,status] of Object.entries(lesson.concepts||{})){if(!statusByConcept.has(id))statusByConcept.set(id,status);}}
    activeItems=itemListRes.data||[];existing=outcomeRes.data||null;
    ctx={c,item,studentName:studentRes.data?.display_name||'Student'};
    return ctx;
  }

  function concept(id){return window.GAB_CURRICULUM?.concept?.(id)||null;}
  function currentConcept(){return concept(ctx?.item?.curriculum_node_id);}
  function directSupports(){const id=ctx?.item?.curriculum_node_id;return id?(window.GAB_CURRICULUM?.prerequisites?.([id],{recursive:false,track:currentConcept()?.track})||[]):[];}
  function nextConcepts(){const id=ctx?.item?.curriculum_node_id;return id?(window.GAB_CURRICULUM?.next?.([id],{track:currentConcept()?.track,limit:12})||[]):[];}
  function stateScore(id){return rank[statusByConcept.get(id)]||0;}

  function terms(c){
    if(!c)return[];
    return [c.name,c.sourceName,...(c.aliases||[]),...(c.relatedTerms||[])].map(norm).filter(x=>x.length>=4);
  }

  function reflectionScores(){
    const text=norm(reflectionEl()?.value||'');if(!text)return new Map();
    const supports=new Set(directSupports().map(x=>x.id)),nexts=new Set(nextConcepts().map(x=>x.id));
    const scores=new Map();
    for(const c of window.GAB_CURRICULUM?.concepts||[]){
      if(c.id===ctx.item.curriculum_node_id)continue;
      let score=0;
      for(const phrase of terms(c)){
        if(phrase.length>=5&&text.includes(phrase))score+=phrase.includes(' ')?7:4;
        else for(const word of phrase.split(' '))if(word.length>=5&&text.split(' ').includes(word))score+=1;
      }
      if(score){if(supports.has(c.id))score+=4;if(nexts.has(c.id))score+=2;scores.set(c.id,score);}
    }
    return scores;
  }

  function candidateList(outcome){
    const explicit=reflectionScores();
    const activeByConcept=new Map(activeItems.filter(x=>x.curriculum_node_id).map(x=>[x.curriculum_node_id,x]));
    let base=[];
    if(outcome==='redirect'){
      base=[...directSupports()].sort((a,b)=>stateScore(a.id)-stateScore(b.id)||a.tier-b.tier);
      const mentioned=[...(window.GAB_CURRICULUM?.concepts||[])].filter(c=>explicit.has(c.id)).sort((a,b)=>(explicit.get(b.id)||0)-(explicit.get(a.id)||0));
      base=[...mentioned,...base];
    } else if(outcome==='advance') {
      const next=nextConcepts().sort((a,b)=>stateScore(a.id)-stateScore(b.id)||a.tier-b.tier);
      const mentioned=next.filter(c=>explicit.has(c.id)).sort((a,b)=>(explicit.get(b.id)||0)-(explicit.get(a.id)||0));
      base=[...mentioned,...next];
      if(!base.length){
        base=activeItems.filter(x=>x.id!==ctx.item.id&&x.curriculum_node_id).map(x=>concept(x.curriculum_node_id)).filter(Boolean);
      }
    }
    const seen=new Set();
    return base.filter(c=>c&&c.id!==ctx.item.curriculum_node_id&&!seen.has(c.id)&&seen.add(c.id)).slice(0,16).map(c=>({
      id:c.id,title:c.name,status:statusByConcept.get(c.id)||'No Atlas evidence yet',score:explicit.get(c.id)||0,existing:activeByConcept.get(c.id)||null
    }));
  }

  function rationale(outcome,candidate){
    if(outcome==='reinforce')return `Keep ${ctx.item.title} as the active focus. This class will record the concept as Practicing in Atlas.`;
    if(!candidate)return outcome==='advance'?'Complete the current checkpoint and let the saved Roadmap order choose the next active stop.':'Choose the concept that became the new bottleneck.';
    if(candidate.score>0)return `Your reflection mentions ${candidate.title}. ${outcome==='redirect'?'It also fits the current support/relationship graph, so it is a strong bottleneck candidate.':'It is reachable from the current concept, so it is a strong next-class candidate.'}`;
    if(outcome==='redirect')return `${candidate.title} is one of the direct support concepts for the current focus and has ${candidate.status.toLowerCase()}.`;
    return `${candidate.title} is a curriculum branch that follows the current concept; current Atlas evidence: ${candidate.status}.`;
  }

  function addStyles(){
    if(document.getElementById('postClassSyncStyles'))return;
    const s=document.createElement('style');s.id='postClassSyncStyles';s.textContent=`
      #postClassSync{margin:16px auto 4px;padding:18px;border:1px solid #9fe2c74a;border-radius:20px;background:linear-gradient(145deg,#10201d,#101721);width:min(1120px,calc(100% - 36px))}
      #postClassSync .pcsHead{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.pcsKicker{font-size:.72rem;text-transform:uppercase;letter-spacing:.11em;font-weight:900;color:#9fe2c7}.pcsHead h2{font-size:1.35rem;margin:4px 0 5px}.pcsHead p{margin:0;color:#aeb8c3;max-width:760px}.pcsGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.pcsGrid label,.pcsPractice{display:grid;gap:5px;font-size:.75rem;font-weight:850;color:#c7d0da}.pcsGrid select,.pcsGrid input,.pcsPractice textarea{width:100%;border:1px solid #ffffff20;border-radius:11px;background:#090f15;color:#fff;padding:9px 10px;font:inherit}.pcsPractice{margin-top:12px}.pcsPractice textarea{min-height:72px;resize:vertical}.pcsSuggestion{margin-top:12px;padding:12px;border-radius:14px;border:1px solid #ffffff14;background:#091017}.pcsSuggestion strong{display:block;margin-bottom:3px}.pcsSuggestion p{margin:0;color:#aeb8c3;font-size:.84rem}.pcsSuggestion select{width:100%;margin-top:9px;border:1px solid #ffffff20;border-radius:10px;background:#0c131b;color:#fff;padding:8px 9px}.pcsActions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:13px}.pcsActions button{border:0;border-radius:999px;background:#e6f1ec;color:#0c1714;padding:9px 13px;font-weight:900;cursor:pointer}.pcsActions button:disabled{opacity:.5;cursor:not-allowed}.pcsStatus{font-size:.78rem;color:#aab5c1}.pcsSaved{font-size:.74rem;color:#9fe2c7;font-weight:850}.pcsLocked{margin-top:9px;color:#8d9aa8;font-size:.76rem}.pcsLinks{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.pcsLinks a{display:inline-flex;padding:6px 9px;border-radius:999px;border:1px solid #ffffff1c;background:#0b1118;font-size:.74rem;font-weight:800}
      @media(max-width:700px){#postClassSync .pcsHead{flex-direction:column}.pcsGrid{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function render(){
    addStyles();
    let box=document.getElementById('postClassSync');if(!box){box=document.createElement('section');box.id='postClassSync';const anchor=document.getElementById('roadmapPlannerContext');if(anchor)anchor.insertAdjacentElement('afterend',box);else document.getElementById('teachingWorkbench')?.before(box);}
    const locked=!!existing?.route_applied_at;
    const outcome=locked?existing.outcome:(box.querySelector('#pcsOutcome')?.value||'reinforce');
    const candidates=candidateList(outcome);
    let selected=locked?existing.recommended_node_id:(box.querySelector('#pcsTarget')?.value||candidates[0]?.id||'');
    if(selected&&!candidates.some(c=>c.id===selected)&&!locked)selected=candidates[0]?.id||'';
    const candidate=candidates.find(c=>c.id===selected)|| (selected?{id:selected,title:existing?.recommended_title||window.GAB_CURRICULUM?.displayName?.(selected)||selected,status:statusByConcept.get(selected)||'No Atlas evidence yet',score:0}:null);
    const savedDate=existing?.lesson_date||localDate();
    const nextPractice=box.querySelector('#pcsPractice')?.value ?? existing?.next_practice ?? '';
    box.innerHTML=`<div class="pcsHead"><div><div class="pcsKicker">After class · learning sync</div><h2>Close the loop after teaching</h2><p>Your reflection becomes class evidence in Atlas. Your explicit outcome controls the Roadmap; one lesson never auto-awards mastery.</p></div>${existing?`<span class="pcsSaved">${locked?'Route already synced':'Evidence saved'}</span>`:''}</div>
      <div class="pcsGrid"><label>Lesson date<input id="pcsDate" type="date" value="${esc(savedDate)}"></label><label>What should happen now?<select id="pcsOutcome" ${locked?'disabled':''}><option value="reinforce" ${outcome==='reinforce'?'selected':''}>Keep / reinforce this focus</option><option value="advance" ${outcome==='advance'?'selected':''}>Ready to advance</option><option value="redirect" ${outcome==='redirect'?'selected':''}>A different bottleneck is now priority</option></select></label></div>
      <div class="pcsSuggestion"><strong>${outcome==='reinforce'?'Recommended route':'Recommended next concept'}</strong><p>${esc(rationale(outcome,candidate))}</p>${outcome!=='reinforce'?`<select id="pcsTarget" ${locked?'disabled':''}>${outcome==='advance'?'<option value="">Use the existing Roadmap order</option>':''}${candidates.map(c=>`<option value="${esc(c.id)}" ${c.id===selected?'selected':''}>${esc(c.title)} · ${esc(c.status)}${c.existing?' · already on roadmap':''}</option>`).join('')}${locked&&selected&&!candidates.some(c=>c.id===selected)?`<option value="${esc(selected)}" selected>${esc(candidate?.title||selected)}</option>`:''}</select>`:''}</div>
      <label class="pcsPractice">Next practice / homework<textarea id="pcsPractice" maxlength="3000" placeholder="What should the student practice before the next class?">${esc(nextPractice)}</textarea></label>
      ${locked?'<div class="pcsLocked">The route decision has already been applied. You can update the reflection, lesson date, or next-practice note here; change the route itself from the student Roadmap.</div>':''}
      <div class="pcsActions"><button id="pcsSync" type="button">${existing?'Update synced evidence':'Finish & sync class'}</button><span id="pcsStatus" class="pcsStatus" role="status"></span></div>
      <div class="pcsLinks"><a href="/mentorship-hub/?student=${encodeURIComponent(ctx.item.student_id)}#hub-roadmap">Student Roadmap ↗</a>${ctx.item.curriculum_node_id?`<a href="/zouk-map/?student=${encodeURIComponent(ctx.item.student_id)}&concept=${encodeURIComponent(ctx.item.curriculum_node_id)}#map">Student Atlas ↗</a>`:''}</div>`;

    box.querySelector('#pcsOutcome')?.addEventListener('change',render);
    box.querySelector('#pcsTarget')?.addEventListener('change',()=>{const target=box.querySelector('#pcsTarget')?.value||'';const out=box.querySelector('#pcsOutcome')?.value||outcome;const c=candidateList(out).find(x=>x.id===target)||null;box.querySelector('.pcsSuggestion p').textContent=rationale(out,c);});
    box.querySelector('#pcsSync')?.addEventListener('click',sync);
  }

  async function sync(){
    if(saving)return;
    const box=document.getElementById('postClassSync'),status=box?.querySelector('#pcsStatus'),button=box?.querySelector('#pcsSync');
    const reflection=(reflectionEl()?.value||'').trim();
    if(!reflection){if(status)status.textContent='Add your post-class reflection below first.';reflectionEl()?.scrollIntoView({behavior:'smooth',block:'center'});reflectionEl()?.focus();return;}
    const sid=sessionId();if(!sid){if(status)status.textContent='This class plan is missing its session ID.';return;}
    const locked=!!existing?.route_applied_at;
    const outcome=locked?existing.outcome:(box.querySelector('#pcsOutcome')?.value||'reinforce');
    const target=outcome==='reinforce'?null:(locked?existing.recommended_node_id:(box.querySelector('#pcsTarget')?.value||null));
    if(outcome==='redirect'&&!target){if(status)status.textContent='Choose the bottleneck that should become Next.';return;}
    const targetTitle=target?(window.GAB_CURRICULUM?.displayName?.(target)||existing?.recommended_title||target):null;
    const date=box.querySelector('#pcsDate')?.value||localDate();
    const practice=(box.querySelector('#pcsPractice')?.value||'').trim();
    const title=(titleEl()?.value||ctx.item.title||'Class').trim();
    saving=true;if(button)button.disabled=true;if(status)status.textContent='Syncing Atlas evidence and Roadmap…';
    try{
      if(window.TeacherPlannerFlush){const ok=await window.TeacherPlannerFlush();if(ok===false)throw new Error('Save the class plan before syncing its outcome.');}
      const {data,error}=await (await client()).rpc('sync_mentorship_class_outcome',{
        p_roadmap_item_id:ctx.item.id,
        p_planner_session_id:sid,
        p_session_title:title,
        p_lesson_date:date,
        p_reflection:reflection,
        p_next_practice:practice||null,
        p_outcome:outcome,
        p_recommended_node_id:target,
        p_recommended_title:targetTitle
      });
      if(error)throw error;
      existing={...(existing||{}),outcome,recommended_node_id:target,recommended_title:targetTitle,next_practice:practice||null,atlas_status:data?.atlas_status,route_applied_at:existing?.route_applied_at||new Date().toISOString(),lesson_date:date};
      if(status)status.textContent=`Saved · Atlas: ${data?.atlas_status||'class evidence'} · Roadmap updated.`;
      setTimeout(render,350);
    }catch(err){if(status)status.textContent=err.message||'Could not sync this class yet.';}
    finally{saving=false;if(button)button.disabled=false;}
  }

  async function boot(){
    try{
      await waitFor(()=>document.querySelector('#teachingWorkbench #planSelect'));
      await waitFor(()=>window.GAB_CURRICULUM?.concepts);
      await loadContext();
      await waitFor(()=>reflectionEl());
      render();
      let timer=null;
      reflectionEl()?.addEventListener('input',()=>{if(existing?.route_applied_at)return;clearTimeout(timer);timer=setTimeout(render,350);});
    }catch(err){console.warn('Post-class learning sync',err);}
  }
  setTimeout(()=>boot(),900);
})();
