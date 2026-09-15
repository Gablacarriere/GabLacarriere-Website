(() => {
  'use strict';
  if (!location.pathname.startsWith('/mentorship-hub')) return;

  let db=null,user=null,role=null,rows=new Map(),loading=false;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  function styles(){
    if(document.getElementById('roadmapSessionPlannerStyles'))return;
    const s=document.createElement('style');s.id='roadmapSessionPlannerStyles';s.textContent=`
      .roadmapPlanClass{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:7px 10px;border-radius:999px;border:1px solid #f2dfc54d;background:#f2dfc514;color:#f6e5cf;font-size:.78rem;font-weight:900;text-decoration:none;margin-top:9px}.roadmapPlanClass:hover{background:#f2dfc525;border-color:#f2dfc5}.roadmapPlanClass span{opacity:.72;margin-left:5px;font-size:.68rem}.roadmapPlanClass.existing{border-color:#9fe2c74d;color:#bcefd9;background:#9fe2c70d}
    `;document.head.appendChild(s);
  }

  async function client(){
    while(!window.supabase||!window.GAB_PORTAL?.supabaseUrl)await sleep(100);
    if(!db)db=window.__HUB_ROADMAP_PLANNER_DB||(window.__HUB_ROADMAP_PLANNER_DB=window.supabase.createClient(window.GAB_PORTAL.supabaseUrl,window.GAB_PORTAL.supabaseAnonKey));
    return db;
  }

  async function load(){
    if(loading)return;loading=true;
    try{
      const c=await client(),auth=await c.auth.getUser();user=auth.data?.user||null;if(!user)return;
      const prof=await c.from('profiles').select('role').eq('id',user.id).maybeSingle();role=prof.data?.role||'mentee';if(role!=='coach')return;
      const res=await c.from('mentorship_roadmap_items').select('id,student_id,horizon,status,planner_session_id').in('status',['planned','in_progress']);
      if(res.error)throw res.error;rows=new Map((res.data||[]).map(x=>[String(x.id),x]));enhance();
    }catch(err){console.warn('Roadmap → Session Planner CTA',err);}finally{loading=false;}
  }

  function href(row){
    const url=new URL('/session-planner/',location.origin);
    url.searchParams.set('roadmap',row.id);url.searchParams.set('student',row.student_id);
    if(row.planner_session_id)url.searchParams.set('session',row.planner_session_id);
    return url.pathname+url.search;
  }

  function enhance(){
    if(role!=='coach')return;
    document.querySelectorAll('.roadmapStop[data-roadmap-id]').forEach(card=>{
      const row=rows.get(String(card.dataset.roadmapId||''));
      const prior=card.querySelector('.roadmapPlanClass');
      if(!row||row.horizon!=='next'||!['planned','in_progress'].includes(row.status)){prior?.remove();return;}
      if(prior){prior.href=href(row);prior.classList.toggle('existing',!!row.planner_session_id);prior.innerHTML=row.planner_session_id?'Open class plan <span>↗</span>':'Prepare next class <span>→</span>';return;}
      const link=document.createElement('a');link.className='roadmapPlanClass'+(row.planner_session_id?' existing':'');link.href=href(row);link.innerHTML=row.planner_session_id?'Open class plan <span>↗</span>':'Prepare next class <span>→</span>';
      const actions=card.querySelector('.roadmapActionLinks,.roadmapCoachActions');
      if(actions)actions.insertAdjacentElement('afterend',link);else card.appendChild(link);
    });
  }

  async function boot(){
    styles();await load();
    const root=document.getElementById('dashboardView')||document.body;let timer=null;
    new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(enhance,90);}).observe(root,{childList:true,subtree:true});
    document.addEventListener('click',e=>{if(e.target.closest('[data-student]'))setTimeout(load,180);});
    window.addEventListener('focus',()=>load());document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
  }
  setTimeout(()=>boot(),1150);
})();

(() => {
  if (!location.pathname.startsWith('/mentorship-hub')) return;
  if (document.querySelector('script[data-mentorship-roadmap-origin]')) return;
  const script=document.createElement('script');
  script.src='/mentorship-roadmap-origin.js?v=1';
  script.defer=true;
  script.dataset.mentorshipRoadmapOrigin='1';
  document.head.appendChild(script);
})();

(() => {
  if (!location.pathname.startsWith('/mentorship-hub')) return;
  if (document.querySelector('script[data-mentorship-learning-timeline]')) return;
  const script=document.createElement('script');
  script.src='/mentorship-learning-timeline.js?v=1';
  script.defer=true;
  script.dataset.mentorshipLearningTimeline='1';
  document.head.appendChild(script);
})();
