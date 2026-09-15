(() => {
  'use strict';
  if (!location.pathname.startsWith('/mentorship-hub')) return;

  let db=null,user=null,role='mentee',rows=new Map(),practiceSkills=new Set(),refreshing=false,refreshQueued=false;

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
      @media(max-width:520px){.roadmapActionLinks a{flex:1 1 auto}}
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

  async function loadPracticeSkills(client){
    practiceSkills=new Set();
    if(role==='coach'||!user)return;
    const [skillsRes,drillsRes]=await Promise.all([
      client.from('zoukable_skills').select('id,slug'),
      client.from('zoukable_drills').select('primary_skill_id,assigned_to,status').eq('status','published')
    ]);
    if(skillsRes.error||drillsRes.error)return;
    const slugById=new Map((skillsRes.data||[]).map(s=>[s.id,s.slug]));
    (drillsRes.data||[]).filter(d=>!d.assigned_to||d.assigned_to===user.id).forEach(d=>{const slug=slugById.get(d.primary_skill_id);if(slug)practiceSkills.add(slug);});
  }

  async function loadRows(){
    if(refreshing){refreshQueued=true;return;}
    refreshing=true;
    try{
      const client=await getClient();
      const auth=await client.auth.getUser();user=auth.data?.user||null;if(!user)return;
      const prof=await client.from('profiles').select('role').eq('id',user.id).maybeSingle();role=prof.data?.role||'mentee';
      await loadPracticeSkills(client);
      let q=client.from('mentorship_roadmap_items').select('id,student_id,curriculum_node_id,title,horizon,status,student_visible').neq('status','completed');
      if(role!=='coach')q=q.eq('student_id',user.id).eq('student_visible',true);
      const result=await q;
      if(result.error)throw result.error;
      rows=new Map((result.data||[]).map(x=>[String(x.id),x]));
      document.querySelectorAll('.roadmapActionLinks').forEach(x=>x.remove());
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

  function uniqueSkills(nodeId){
    const links=window.GAB_CURRICULUM_LINKS?.forConcept(nodeId)||[];
    const seen=new Set();
    return links.filter(x=>x?.skill&&!seen.has(x.skill)&&seen.add(x.skill)).filter(x=>role==='coach'||practiceSkills.has(x.skill));
  }

  function enhance(){
    document.querySelectorAll('.roadmapStop[data-roadmap-id]').forEach(card=>{
      const id=String(card.dataset.roadmapId||'');
      if(!id||card.querySelector('.roadmapActionLinks'))return;
      const row=rows.get(id);if(!row?.curriculum_node_id)return;
      const actions=document.createElement('div');actions.className='roadmapActionLinks';
      const atlas=document.createElement('a');atlas.href=atlasHref(row);atlas.textContent='Open in Atlas →';actions.appendChild(atlas);
      if(role!=='coach'){
        const skills=uniqueSkills(row.curriculum_node_id);
        skills.slice(0,2).forEach((link,index)=>{
          const a=document.createElement('a');a.href='/zoukable/?skill='+encodeURIComponent(link.skill)+'&from=roadmap';a.className=index===0?'primaryRoadmapAction':'';a.textContent=skills.length===1?'Train this in Zoukable →':`Train ${link.name||link.skill} →`;actions.prepend(a);
        });
        if(!skills.length){const span=document.createElement('span');span.className='roadmapNoPractice';span.textContent='No mapped Zoukable drill yet';actions.appendChild(span);}
      }
      card.appendChild(actions);
    });
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
