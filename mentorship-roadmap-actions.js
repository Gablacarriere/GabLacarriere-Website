(() => {
  'use strict';
  if (!location.pathname.startsWith('/mentorship-hub')) return;

  let db=null,user=null,role='mentee',rows=new Map(),practiceSkills=new Set(),skillIdsBySlug=new Map(),attempts=[],refreshing=false,refreshQueued=false;

  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  function addStyles(){
    if(document.getElementById('roadmapActionStyles'))return;
    const s=document.createElement('style');
    s.id='roadmapActionStyles';
    s.textContent=`
      .roadmapActionLinks{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px;padding-top:10px;border-top:1px solid #ffffff10}
      .roadmapActionLinks a{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:7px 10px;border-radius:999px;border:1px solid #ffffff20;background:#0d151f;color:#e8edf4;font-size:.78rem;font-weight:850;text-decoration:none}
      .roadmapActionLinks a:hover{border-color:#7dd8ff;background:#142131}
      .roadmapActionLinks a.primaryRoadmapAction{background:#dceefa;color:#0b1720;border-color:#dceefa}
      .roadmapActionLinks a.primaryRoadmapAction:hover{background:#fff}
      .roadmapActionLinks .roadmapNoPractice{display:inline-flex;align-items:center;min-height:34px;padding:7px 9px;color:#778390;font-size:.76rem}
      .roadmapEvidence{margin-top:11px;padding:10px 11px;border:1px solid #ffffff12;border-radius:13px;background:#080d13aa}
      .roadmapEvidenceTop{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .roadmapEvidenceTop strong{font-size:.76rem;letter-spacing:.04em;color:#dfe7f0}
      .roadmapEvidenceTop span{font-size:.7rem;color:#8fa2b9;text-align:right}
      .roadmapEvidenceTrack{height:6px;border-radius:999px;background:#ffffff0d;overflow:hidden;margin-top:8px}
      .roadmapEvidenceFill{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#8ad8d0,#7dd8ff,#d5b6ff)}
      .roadmapEvidenceMeta{margin-top:6px!important;color:#8996a6!important;font-size:.72rem!important;line-height:1.35!important}
      .roadmapStop.evidence-started{border-color:#8ad8d033}
      .roadmapStop.evidence-repeated{border-color:#7dd8ff55}
      .roadmapStop.evidence-review{border-color:#d5b6ff77;box-shadow:inset 0 0 0 1px #d5b6ff12}
      .roadmapReviewSignals{margin:0 0 16px;padding:16px;border:1px solid #d5b6ff3d;border-radius:18px;background:linear-gradient(145deg,#161426,#0f121b)}
      .roadmapReviewSignalsHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
      .roadmapReviewSignalsHead h3{margin:4px 0 3px}.roadmapReviewSignalsHead p{margin:0;color:#aeb6c2;font-size:.9rem}
      .roadmapReviewCount{display:grid;place-items:center;min-width:34px;height:34px;padding:0 9px;border-radius:999px;background:#d5b6ff1b;color:#eadcff;font-weight:900}
      .roadmapReviewQueue{display:grid;gap:8px}
      .roadmapReviewReady{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;padding:11px 12px;border-radius:13px;border:1px solid #ffffff16;background:#0b1018;color:#fff;font:inherit;cursor:pointer}
      .roadmapReviewReady:hover{border-color:#d5b6ff80;background:#141624}.roadmapReviewReady strong{display:block;font-size:.92rem}.roadmapReviewReady span{display:block;color:#9ea8b7;font-size:.78rem;margin-top:2px}.roadmapReviewReady b{flex:0 0 auto;color:#d9c8f0;font-size:.76rem}
      @media(max-width:520px){.roadmapActionLinks a{flex:1 1 auto}.roadmapEvidenceTop,.roadmapReviewSignalsHead{align-items:flex-start;flex-direction:column}.roadmapEvidenceTop span{text-align:left}.roadmapReviewReady{align-items:flex-start;flex-direction:column}}
    `;
    document.head.appendChild(s);
  }

  function loadScript(src,test){
    if(test())return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const existing=[...document.scripts].find(s=>s.src&&s.src.includes(src.split('?')[0]));
      if(existing){let n=0;const timer=setInterval(()=>{if(test()){clearInterval(timer);resolve();}else if(++n>40){clearInterval(timer);reject(new Error('Roadmap link map unavailable'));}},100);return;}
      const s=document.createElement('script');s.src=src;s.onload=()=>test()?resolve():reject(new Error('Roadmap link map unavailable'));s.onerror=()=>reject(new Error('Could not load curriculum links'));document.head.appendChild(s);
    });
  }

  async function getClient(){
    while(!window.supabase||!window.GAB_PORTAL?.supabaseUrl)await sleep(100);
    if(!db)db=window.__HUB_ROADMAP_ACTION_DB||(window.__HUB_ROADMAP_ACTION_DB=window.supabase.createClient(window.GAB_PORTAL.supabaseUrl,window.GAB_PORTAL.supabaseAnonKey));
    return db;
  }

  async function loadPracticeData(client){
    practiceSkills=new Set();skillIdsBySlug=new Map();attempts=[];
    const [skillsRes,drillsRes,attemptsRes]=await Promise.all([
      client.from('zoukable_skills').select('id,slug'),
      client.from('zoukable_drills').select('primary_skill_id,assigned_to,status').eq('status','published'),
      client.from('zoukable_attempts').select('id,user_id,primary_skill_id,completed_at,status,practice_seconds,result,confidence,correctness,consistency,efficiency,adaptability').eq('status','completed').order('completed_at',{ascending:false}).limit(1000)
    ]);
    if(skillsRes.error)return;
    const slugById=new Map((skillsRes.data||[]).map(s=>[s.id,s.slug]));
    (skillsRes.data||[]).forEach(s=>skillIdsBySlug.set(s.slug,s.id));
    if(!drillsRes.error){
      (drillsRes.data||[]).filter(d=>role==='coach'||!d.assigned_to||d.assigned_to===user?.id).forEach(d=>{const slug=slugById.get(d.primary_skill_id);if(slug)practiceSkills.add(slug);});
    }
    if(!attemptsRes.error)attempts=attemptsRes.data||[];
  }

  async function loadRows(){
    if(refreshing){refreshQueued=true;return;}
    refreshing=true;
    try{
      const client=await getClient();
      const auth=await client.auth.getUser();user=auth.data?.user||null;if(!user)return;
      const prof=await client.from('profiles').select('role').eq('id',user.id).maybeSingle();role=prof.data?.role||'mentee';
      let q=client.from('mentorship_roadmap_items').select('id,student_id,curriculum_node_id,title,horizon,status,student_visible,created_at').neq('status','completed');
      if(role!=='coach')q=q.eq('student_id',user.id).eq('student_visible',true);
      const result=await q;
      if(result.error)throw result.error;
      rows=new Map((result.data||[]).map(x=>[String(x.id),x]));
      await loadPracticeData(client);
      document.querySelectorAll('.roadmapActionLinks,.roadmapEvidence').forEach(x=>x.remove());
      document.querySelectorAll('.roadmapStop').forEach(x=>x.classList.remove('evidence-started','evidence-repeated','evidence-review'));
      enhance();
    }catch(err){console.warn('Roadmap actions',err);}
    finally{refreshing=false;if(refreshQueued){refreshQueued=false;setTimeout(loadRows,80);}}
  }

  function atlasHref(row){
    const url=new URL('/zouk-map/',location.origin);
    url.searchParams.set('concept',row.curriculum_node_id);
    if(role==='coach'&&row.student_id)url.searchParams.set('student',row.student_id);
    url.hash='map';
    return url.pathname+url.search+url.hash;
  }

  function mappedSkills(nodeId,{availableOnly=false}={}){
    const links=window.GAB_CURRICULUM_LINKS?.forConcept(nodeId)||[];
    const seen=new Set();
    return links.filter(x=>x?.skill&&!seen.has(x.skill)&&seen.add(x.skill)).filter(x=>!availableOnly||role==='coach'||practiceSkills.has(x.skill));
  }

  function evidenceFor(row){
    if(!row?.curriculum_node_id)return null;
    const skillIds=new Set(mappedSkills(row.curriculum_node_id).map(x=>skillIdsBySlug.get(x.skill)).filter(Boolean));
    if(!skillIds.size)return null;
    const created=row.created_at?new Date(row.created_at).getTime():0;
    const relevant=attempts.filter(a=>a.user_id===row.student_id&&skillIds.has(a.primary_skill_id)&&a.completed_at&&new Date(a.completed_at).getTime()>=created);
    if(!relevant.length)return {state:'not_started',days:0,count:0,seconds:0,last:null,percent:0};
    const days=new Set(relevant.map(a=>String(a.completed_at).slice(0,10))).size;
    const seconds=relevant.reduce((sum,a)=>sum+Number(a.practice_seconds||0),0);
    const last=relevant.map(a=>a.completed_at).filter(Boolean).sort().at(-1)||null;
    const state=days>=3?'review':days>=2?'repeated':'started';
    return {state,days,count:relevant.length,seconds,last,percent:Math.min(100,Math.round(days/3*100))};
  }

  function evidenceMarkup(ev){
    if(!ev)return '';
    const label=ev.state==='review'?'Ready for coach review':ev.state==='repeated'?'Repeated practice':ev.state==='started'?'Practice started':'Not practiced yet';
    const mins=Math.round(ev.seconds/60);
    const meta=ev.count?`${ev.days} practice day${ev.days===1?'':'s'} · ${ev.count} completed attempt${ev.count===1?'':'s'}${mins?` · ${mins} min`:''}`:'Complete a mapped Zoukable drill to begin this checkpoint.';
    return `<div class="roadmapEvidence"><div class="roadmapEvidenceTop"><strong>${label}</strong><span>${ev.percent}% practice evidence</span></div><div class="roadmapEvidenceTrack" aria-label="Practice evidence ${ev.percent}%"><span class="roadmapEvidenceFill" style="width:${ev.percent}%"></span></div><p class="roadmapEvidenceMeta">${meta}${ev.state==='review'?' · Gab still decides when this roadmap objective is complete.':''}</p></div>`;
  }

  function studentName(studentId){
    const button=document.querySelector(`[data-student="${CSS.escape(String(studentId))}"]`);
    return button?.querySelector('strong')?.textContent?.trim()||button?.textContent?.trim()||'Student';
  }

  function renderCoachReviewSignals(){
    if(role!=='coach')return;
    const ready=[...rows.values()].map(row=>({row,ev:evidenceFor(row)})).filter(x=>x.ev?.state==='review').sort((a,b)=>String(b.ev.last||'').localeCompare(String(a.ev.last||'')));
    let root=document.getElementById('roadmapReviewSignals');
    if(!ready.length){root?.remove();return;}
    const host=document.getElementById('roadmapFleetOverview')||document.querySelector('.adminOnly');
    if(!host)return;
    if(!root){root=document.createElement('section');root.id='roadmapReviewSignals';root.className='roadmapReviewSignals';host.prepend(root);}else if(root.parentElement!==host)host.prepend(root);
    const signature=ready.map(x=>`${x.row.id}:${x.ev.days}:${x.ev.count}`).join('|');
    if(root.dataset.signature===signature)return;
    root.dataset.signature=signature;
    root.innerHTML=`<div class="roadmapReviewSignalsHead"><div><span class="badge">Roadmap review queue</span><h3>Ready for coach review</h3><p>Three or more spaced Zoukable practice days. Practice evidence is sufficient for you to reassess the objective; it is not automatic mastery.</p></div><span class="roadmapReviewCount">${ready.length}</span></div><div class="roadmapReviewQueue">${ready.map(x=>`<button type="button" class="roadmapReviewReady" data-review-student="${String(x.row.student_id)}"><div><strong>${studentName(x.row.student_id)} · ${String(x.row.title)}</strong><span>${x.ev.days} practice days · ${x.ev.count} completed attempts</span></div><b>Review →</b></button>`).join('')}</div>`;
    root.querySelectorAll('[data-review-student]').forEach(btn=>btn.addEventListener('click',()=>{
      const student=document.querySelector(`[data-student="${CSS.escape(btn.dataset.reviewStudent)}"]`);
      student?.click();
      setTimeout(()=>document.getElementById('coachRoadmapPanel')?.scrollIntoView({behavior:'smooth',block:'start'}),180);
    }));
  }

  function enhance(){
    document.querySelectorAll('.roadmapStop[data-roadmap-id]').forEach(card=>{
      const id=String(card.dataset.roadmapId||'');
      if(!id)return;
      const row=rows.get(id);if(!row?.curriculum_node_id)return;

      if(!card.querySelector('.roadmapEvidence')){
        const ev=evidenceFor(row);
        if(ev){
          card.insertAdjacentHTML('beforeend',evidenceMarkup(ev));
          if(ev.state!=='not_started')card.classList.add('evidence-'+ev.state);
        }
      }

      if(!card.querySelector('.roadmapActionLinks')){
        const actions=document.createElement('div');actions.className='roadmapActionLinks';
        const atlas=document.createElement('a');atlas.href=atlasHref(row);atlas.textContent='Open in Atlas →';actions.appendChild(atlas);
        if(role!=='coach'){
          const skills=mappedSkills(row.curriculum_node_id,{availableOnly:true});
          skills.slice(0,2).forEach((link,index)=>{
            const a=document.createElement('a');
            const url=new URL('/zoukable/',location.origin);url.searchParams.set('skill',link.skill);url.searchParams.set('from','roadmap');url.searchParams.set('roadmap',row.id);
            a.href=url.pathname+url.search;a.className=index===0?'primaryRoadmapAction':'';a.textContent=skills.length===1?'Train this in Zoukable →':`Train ${link.name||link.skill} →`;actions.prepend(a);
          });
          if(!skills.length){const span=document.createElement('span');span.className='roadmapNoPractice';span.textContent='No mapped Zoukable drill yet';actions.appendChild(span);}
        }
        card.appendChild(actions);
      }
    });
    renderCoachReviewSignals();
  }

  async function boot(){
    addStyles();
    await loadScript('/curriculum-links.js?v=roadmap-actions-1',()=>!!window.GAB_CURRICULUM_LINKS);
    await loadRows();
    const root=document.getElementById('dashboardView')||document.body;
    let timer=null;
    new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{enhance();const unknown=[...document.querySelectorAll('.roadmapStop[data-roadmap-id]')].some(c=>c.dataset.roadmapId&&!rows.has(String(c.dataset.roadmapId)));if(unknown)loadRows();},80);}).observe(root,{childList:true,subtree:true});
    window.addEventListener('focus',()=>loadRows());
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadRows();});
  }

  setTimeout(()=>boot().catch(err=>console.warn('Roadmap action boot',err)),850);
})();
// roadmap-practice-evidence-v5
