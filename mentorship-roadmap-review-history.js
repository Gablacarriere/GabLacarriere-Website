(() => {
  'use strict';
  if (!location.pathname.startsWith('/mentorship-hub')) return;

  let db=null,user=null,role='mentee',reviews=[],itemTitles=new Map(),selectedStudentId=null,loading=false;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const STOP=new Set(['this','that','with','from','your','their','then','than','into','more','keep','practice','practicing','complete','completed','redirect','student','coach','roadmap','class','next','still','work','working','needs','need','should','could','would','about','after','before','when','where','what','have','has','had','were','been','being','very','also','just']);

  function styles(){
    if(document.getElementById('roadmapReviewHistoryStyles'))return;
    const s=document.createElement('style');s.id='roadmapReviewHistoryStyles';s.textContent=`
      .roadmapDecisionNote{display:grid;gap:5px;margin:9px 0 0}.roadmapDecisionNote span{font-size:.72rem;font-weight:800;color:#b6bfd0}.roadmapDecisionNote input{width:100%;min-height:38px;padding:8px 10px;border-radius:10px;border:1px solid #ffffff20;background:#090e15;color:#fff;font:inherit;font-size:.86rem}.roadmapDecisionNote input:focus{outline:2px solid #7dd8ff66;outline-offset:1px}
      .roadmapReviewHistory{margin-top:18px;padding-top:18px;border-top:1px solid #ffffff16}.roadmapReviewHistoryHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}.roadmapReviewHistoryHead h3{margin:4px 0}.roadmapReviewHistoryHead p{margin:0;color:#9ea8b7;font-size:.86rem}.roadmapReviewTimeline{display:grid;gap:8px}.roadmapReviewEntry{padding:11px 12px;border:1px solid #ffffff13;border-radius:13px;background:#0b1018}.roadmapReviewEntryTop{display:flex;align-items:center;justify-content:space-between;gap:10px}.roadmapReviewEntryTop strong{font-size:.86rem}.roadmapReviewEntryTop time{font-size:.7rem;color:#8794a4}.roadmapReviewEntry p{margin:6px 0 0;color:#b8c1cd;font-size:.82rem;line-height:1.4}.roadmapReviewEntry small{display:block;margin-top:6px;color:#7f8b9a;font-size:.7rem}.roadmapDecision-complete{color:#9fe2c7}.roadmapDecision-continue{color:#9edfff}.roadmapDecision-redirect{color:#d5b6ff}
      .roadmapReviewSignal{display:inline-flex;margin-top:7px;padding:4px 7px;border-radius:999px;border:1px solid #d5b6ff35;background:#d5b6ff0d;color:#d9c8f0;font-size:.66rem;font-weight:850}.roadmapHistoryEmpty{margin:0;color:#7f8b9a;font-size:.82rem;font-style:italic}
      @media(max-width:520px){.roadmapReviewHistoryHead,.roadmapReviewEntryTop{flex-direction:column;align-items:flex-start}}
    `;document.head.appendChild(s);
  }

  async function client(){
    while(!window.supabase||!window.GAB_PORTAL?.supabaseUrl)await sleep(100);
    if(!db)db=window.__HUB_ROADMAP_HISTORY_DB||(window.__HUB_ROADMAP_HISTORY_DB=window.supabase.createClient(window.GAB_PORTAL.supabaseUrl,window.GAB_PORTAL.supabaseAnonKey));
    return db;
  }

  function selectedFromDom(){
    const href=document.getElementById('coachStudentAtlas')?.getAttribute('href')||'';
    try{return new URL(href,location.origin).searchParams.get('student');}catch{return null;}
  }

  async function load(){
    if(loading)return;loading=true;
    try{
      const c=await client(),auth=await c.auth.getUser();user=auth.data?.user||null;if(!user)return;
      const prof=await c.from('profiles').select('role').eq('id',user.id).maybeSingle();role=prof.data?.role||'mentee';
      const [revRes,itemRes]=await Promise.all([
        c.from('mentorship_roadmap_reviews').select('id,roadmap_item_id,student_id,coach_id,decision,note,replacement_item_id,evidence_days,evidence_attempts,evidence_minutes,reviewed_at,student_visible').order('reviewed_at',{ascending:false}).limit(250),
        c.from('mentorship_roadmap_items').select('id,student_id,title,curriculum_node_id,status,horizon')
      ]);
      if(revRes.error)throw revRes.error;if(itemRes.error)throw itemRes.error;
      reviews=revRes.data||[];itemTitles=new Map((itemRes.data||[]).map(x=>[String(x.id),x]));
      selectedStudentId=role==='coach'?(selectedFromDom()||selectedStudentId):user.id;
      enhance();
    }catch(err){console.warn('Roadmap review history',err);}finally{loading=false;}
  }

  function evidenceFromCard(card){
    const text=card?.querySelector('.roadmapEvidenceMeta')?.textContent||'';
    const days=Number(text.match(/(\d+) practice day/)?.[1]||0);
    const attempts=Number(text.match(/(\d+) completed attempt/)?.[1]||0);
    const minutes=Number(text.match(/(\d+) min/)?.[1]||0);
    return{days,attempts,minutes};
  }

  function ensureDecisionInputs(){
    if(role!=='coach')return;
    document.querySelectorAll('.roadmapDecisionPanel').forEach(panel=>{
      if(panel.querySelector('.roadmapDecisionNote'))return;
      const label=document.createElement('label');label.className='roadmapDecisionNote';label.innerHTML='<span>Reason / correction</span><input type="text" maxlength="280" placeholder="One line: what did you observe or why this decision?">';
      const actions=panel.querySelector('.roadmapDecisionActions');actions?.before(label);
    });
  }

  async function decideFromUi(card,action,nextId=null,panel=null){
    const itemId=card?.dataset.roadmapId;if(!itemId)return;
    const note=panel?.querySelector('.roadmapDecisionNote input')?.value.trim()||null;
    const ev=evidenceFromCard(card);
    const status=panel?.querySelector('.roadmapDecisionStatus');if(status)status.textContent='Saving decision and learning note…';
    const c=await client();
    const {data,error}=await c.rpc('coach_decide_roadmap_item',{
      p_item_id:itemId,p_action:action,p_next_item_id:nextId||null,p_note:note,
      p_evidence_days:ev.days||null,p_evidence_attempts:ev.attempts||null,p_evidence_minutes:ev.minutes||null
    });
    if(error){if(status)status.textContent=error.message;return;}
    if(status)status.textContent='Saved.';
    selectedStudentId=data?.student_id||selectedStudentId;
    setTimeout(()=>{document.querySelector(`[data-student="${CSS.escape(String(selectedStudentId||''))}"]`)?.click();load();window.dispatchEvent(new Event('focus'));},140);
  }

  function interceptDecisionClicks(){
    document.addEventListener('click',e=>{
      if(role!=='coach')return;
      const complete=e.target.closest('.roadmapDecisionPanel [data-decision="complete"]');
      const cont=e.target.closest('.roadmapDecisionPanel [data-decision="continue"]');
      const confirm=e.target.closest('.roadmapDecisionPanel [data-confirm-redirect]');
      const btn=complete||cont||confirm;if(!btn)return;
      const panel=btn.closest('.roadmapDecisionPanel'),card=btn.closest('.roadmapStop');if(!panel||!card)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      if(confirm){const id=panel.querySelector('.roadmapRedirectPicker select')?.value;if(!id){const out=panel.querySelector('.roadmapDecisionStatus');if(out)out.textContent='Choose the replacement checkpoint first.';return;}decideFromUi(card,'redirect',id,panel);return;}
      decideFromUi(card,complete?'complete':'continue',null,panel);
    },true);
  }

  function fmtDate(value){try{return new Date(value).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});}catch{return'';}}
  function decisionLabel(d){return d==='complete'?'Completed':d==='continue'?'Keep practicing':'Redirected';}
  function historyMarkup(list,{title='Learning review history'}={}){
    const entries=list.slice(0,8).map(r=>{
      const item=itemTitles.get(String(r.roadmap_item_id));const target=r.replacement_item_id?itemTitles.get(String(r.replacement_item_id)):null;
      const evidence=[r.evidence_days!=null?`${r.evidence_days} days`:null,r.evidence_attempts!=null?`${r.evidence_attempts} attempts`:null,r.evidence_minutes!=null?`${r.evidence_minutes} min`:null].filter(Boolean).join(' · ');
      return `<article class="roadmapReviewEntry"><div class="roadmapReviewEntryTop"><strong class="roadmapDecision-${esc(r.decision)}">${esc(decisionLabel(r.decision))} · ${esc(item?.title||'Roadmap checkpoint')}</strong><time>${esc(fmtDate(r.reviewed_at))}</time></div>${r.note?`<p>${esc(r.note)}</p>`:''}${target?`<small>Redirected toward: ${esc(target.title)}</small>`:''}${evidence?`<small>Evidence at review: ${esc(evidence)}</small>`:''}</article>`;
    }).join('');
    return `<section class="roadmapReviewHistory"><div class="roadmapReviewHistoryHead"><div><span class="badge">Coach learning history</span><h3>${esc(title)}</h3><p>Past review decisions stay attached to the student’s learning story and inform future route suggestions.</p></div></div><div class="roadmapReviewTimeline">${entries||'<p class="roadmapHistoryEmpty">No coach roadmap reviews yet.</p>'}</div></section>`;
  }

  function renderHistory(){
    const sid=role==='coach'?(selectedFromDom()||selectedStudentId):user?.id;if(!sid)return;
    selectedStudentId=sid;const list=reviews.filter(r=>String(r.student_id)===String(sid));
    const host=role==='coach'?document.getElementById('coachRoadmapPanel'):document.getElementById('studentRoadmapModule');if(!host)return;
    let section=host.querySelector(':scope > .roadmapReviewHistory');
    const html=historyMarkup(list,{title:role==='coach'?'Review decisions':'My learning review history'});
    if(section)section.outerHTML=html;else host.insertAdjacentHTML('beforeend',html);
  }

  function keywordsFor(studentId){
    const text=reviews.filter(r=>String(r.student_id)===String(studentId)&&r.note).slice(0,8).map(r=>r.note).join(' ').toLowerCase();
    const words=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(w=>w.length>=4&&!STOP.has(w));
    return new Set(words);
  }

  function boostContainer(container,studentId){
    if(!container)return;const keys=keywordsFor(studentId);if(!keys.size)return;
    const cards=[...container.querySelectorAll(':scope > .roadmapStop.suggested')];if(cards.length<2)return;
    const scored=cards.map((card,index)=>{const text=(card.textContent||'').toLowerCase();let score=0;keys.forEach(k=>{if(text.includes(k))score++;});return{card,index,score};}).sort((a,b)=>b.score-a.score||a.index-b.index);
    scored.forEach(x=>container.appendChild(x.card));
    scored.forEach(x=>{x.card.querySelector('.roadmapReviewSignal')?.remove();if(x.score>0)x.card.insertAdjacentHTML('beforeend','<span class="roadmapReviewSignal">Coach-review signal</span>');});
  }

  function weightRecommendations(){
    const sid=role==='coach'?(selectedFromDom()||selectedStudentId):user?.id;if(!sid)return;
    if(role==='coach')boostContainer(document.querySelector('.roadmapSuggestionGrid'),sid);
    else document.querySelectorAll('#studentRoadmapModule .roadmapStops').forEach(c=>boostContainer(c,sid));
  }

  function enhance(){ensureDecisionInputs();renderHistory();weightRecommendations();}

  async function boot(){
    styles();await load();interceptDecisionClicks();
    document.addEventListener('click',e=>{const s=e.target.closest('[data-student]');if(s){selectedStudentId=s.dataset.student;setTimeout(()=>{load();enhance();},180);}});
    const root=document.getElementById('dashboardView')||document.body;let timer=null;
    new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(enhance,100);}).observe(root,{childList:true,subtree:true});
    window.addEventListener('focus',()=>load());document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
  }
  setTimeout(()=>boot().catch(err=>console.warn('Roadmap review history boot',err)),1050);
})();
