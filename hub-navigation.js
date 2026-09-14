(() => {
  const dashboard=document.getElementById('dashboardView');
  if(!dashboard)return;
  const sections=[
    ['today','Today','The bridge · Your next step','Start with your current focus and today’s training.'],
    ['practice','Practice','Training deck · Your practice','Your goals, assignments, Zoukable practice and weekly reflection.'],
    ['progress','Progress','Flight log · Your progress','Your saved activity, milestones and training history.'],
    ['resources','Resources','The library · Your resources','Private resources shared through your mentorship.'],
    ['crew','Crew','Crew quarters · Your guides','Meet the people guiding the mentorship ship.'],
    ['account','Account','Your cabin · Account settings','Manage your password and keep your account secure.'],
    ['students','Students','Your coaching deck','Review student activity, priorities and individual training plans.']
  ];
  const panels=[];
  function attach(selector,key,ancestor){
    const node=dashboard.querySelector(selector);
    const panel=ancestor?node?.closest(ancestor):node;
    if(!panel)throw new Error('Missing hub section: '+selector);
    panel.dataset.hubSection=key;panels.push(panel);
  }
  attach('#missionControl','today','section');
  attach('#firstWeekCard','today');
  attach('#todayTraining','today','section');
  attach('#learningSignal','today','section');
  attach('#rewardsBay','progress','section');
  attach('#spaceHistory','progress','section');
  attach('#recentTrainingList','progress','section');
  attach('.studentArea > .portalGrid','practice');
  attach('#weeklyReflectionSection','practice');
  attach('#launchBay','practice');
  attach('#resourcesGrid','resources','section');
  attach('#mentorshipCrew','crew');
  attach('#changePasswordForm','account','section');
  attach('.adminOnly','students');

  const launchBay=dashboard.querySelector('#launchBay .dashCard');
  if(launchBay){
    launchBay.innerHTML='<span class="badge">Connected practice studio</span><h2 style="font-size:clamp(2rem,5vw,3.5rem);margin-top:14px">Open Zoukable</h2><p class="lede" style="margin-bottom:0">Practice teacher-authored drills, retrieve them after a delay, use the rhythm studio, and send your practice evidence back into the same mentorship account.</p><div class="actions"><a class="btn" href="/zoukable/?page=practice&from=hub">Open Zoukable →</a></div><div class="reviewActions" style="margin-top:14px"><a class="smallBtn" href="/zoukable/?page=practice&minutes=5&from=hub">5 min</a><a class="smallBtn" href="/zoukable/?page=practice&minutes=10&from=hub">10 min</a><a class="smallBtn" href="/zoukable/?page=practice&minutes=15&from=hub">15 min</a><a class="smallBtn" href="/zoukable/?page=practice&minutes=20&from=hub">20 min</a><a class="smallBtn" href="/zoukable/?page=practice&minutes=30&from=hub">30 min</a></div><p class="muted" style="margin-top:14px">Your Hub goals and assignments remain here. Zoukable is the practice engine.</p>';
  }

  const nav=document.createElement('nav');
  nav.className='hubNavigation';nav.setAttribute('aria-label','Member area');
  nav.innerHTML='<div class="hubPrimaryLinks">'+sections.map(([key,label])=>'<a href="#hub-'+key+'" data-hub-link="'+key+'">'+label+'</a>').join('')+'<a href="/zoukable/?page=today">Zoukable ↗</a></div><details class="hubOtherSpaces"><summary>Atlas, community & more</summary><div class="hubOtherLinks"><a href="/zoukable/?page=today"><strong>Zoukable</strong><span>Drills, spaced review, rhythm & your hangar ↗</span></a><a href="/zouk-map/#map"><strong>Zouk Atlas</strong><span>Your map and lesson notes ↗</span></a><a href="/comms-deck/"><strong>ECHO</strong><span>Conversations with the crew ↗</span></a><a href="/feedback/"><strong>Give feedback</strong><span>Help improve your experience ↗</span></a><a href="/curriculum-planner/"><strong>Teaching studio</strong><span>Zouk &amp; Lambada curricula and sessions ↗</span></a><a href="/reviews/"><strong>Student stories</strong><span>Read shared experiences ↗</span></a></div></details>';
  const otherSpaces=nav.querySelector('.hubOtherSpaces');
  nav.addEventListener('keydown',event=>{if(event.key==='Escape'&&otherSpaces.open){otherSpaces.open=false;otherSpaces.querySelector('summary').focus();}});
  const heading=document.createElement('div');heading.className='hubPageHeading';heading.tabIndex=-1;

  const zoukableCard=document.createElement('section');
  zoukableCard.className='dashCard spaceCard';
  zoukableCard.dataset.hubSection='today';
  zoukableCard.innerHTML='<div class="kicker">Zoukable Practice Studio</div><h3>Your practice system is connected.</h3><p class="muted">Loading your drills and review signal…</p>';
  panels.push(zoukableCard);

  dashboard.querySelector('.portalTop').after(nav,heading,zoukableCard);
  dashboard.querySelector('.crewLinkRow')?.remove();
  let isCoach=false,current='today',zoukableLoading=false,zoukableLoadedAt=0;

  async function loadZoukableSummary(force=false){
    if(zoukableLoading)return;
    if(!force&&Date.now()-zoukableLoadedAt<30000)return;
    zoukableLoading=true;
    try{
      const cfg=window.GAB_PORTAL||{};
      if(!window.supabase||!cfg.supabaseUrl||!cfg.supabaseAnonKey)return;
      const client=window.__HUB_ZOUKABLE_DB||(window.__HUB_ZOUKABLE_DB=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey));
      const auth=await client.auth.getUser();
      const user=auth.data?.user;
      if(!user)return;
      const now=new Date().toISOString();
      const [progressRes,dueRes,attemptRes,drillRes]=await Promise.all([
        client.from('student_progress').select('xp,missions_completed,current_streak,last_activity_date').eq('student_id',user.id).maybeSingle(),
        client.from('zoukable_review_states').select('drill_id,due_at').eq('user_id',user.id).lte('due_at',now),
        client.from('zoukable_attempts').select('id,completed_at',{count:'exact'}).eq('user_id',user.id).eq('status','completed').order('completed_at',{ascending:false}).limit(1),
        client.from('zoukable_drills').select('id',{count:'exact',head:true}).eq('status','published')
      ]);
      const p=progressRes.data||{};
      const last=attemptRes.data?.[0]?.completed_at;
      const lastText=last?new Date(last).toLocaleDateString(undefined,{month:'short',day:'numeric'}):'not yet';
      zoukableCard.innerHTML='<div class="missionHead"><div><div class="kicker">Zoukable Practice Studio</div><h3>Your drills, reviews and Hub progress are connected.</h3><p class="muted">Completing Zoukable practice now contributes one permanent Member Hub mission per practice day.</p></div><div class="rocketOrb" aria-hidden="true">✦</div></div><div class="xpMeta"><span>✦ '+Number(p.xp||0)+' Hub XP</span><span>🚀 '+Number(p.missions_completed||0)+' missions</span><span>↻ '+(dueRes.data||[]).length+' reviews due</span><span>◇ '+Number(drillRes.count||0)+' published drills</span><span>◷ '+Number(attemptRes.count||0)+' practice bouts</span><span>Last practice '+lastText+'</span></div><div class="actions" style="margin-top:16px"><a class="btn" href="/zoukable/?page=today&from=hub">Open today in Zoukable →</a><a class="smallBtn" href="/zoukable/?page=practice&minutes=10&from=hub">10-minute practice</a></div>';
      zoukableLoadedAt=Date.now();
    }catch(err){
      zoukableCard.innerHTML='<div class="kicker">Zoukable Practice Studio</div><h3>Zoukable is connected.</h3><p class="muted">The live practice summary could not load right now. Your saved practice is unchanged.</p><div class="actions"><a class="btn" href="/zoukable/?page=today">Open Zoukable →</a></div>';
      console.warn('Zoukable hub summary',err);
    }finally{zoukableLoading=false;}
  }

  function pageFromHash(){
    const hash=location.hash.slice(1);
    if(hash.startsWith('hub-'))return hash.slice(4);
    const target=document.getElementById(hash);
    return target?.closest('[data-hub-section]')?.dataset.hubSection || 'today';
  }
  function show(key,focus=false){
    current=sections.some(s=>s[0]===key)&& (key!=='students'||isCoach)?key:'today';
    const info=sections.find(s=>s[0]===current);
    panels.forEach(panel=>{panel.hidden=panel.dataset.hubSection!==current;});
    document.body.classList.toggle('coachView',current==='students');
    document.body.classList.toggle('studentView',current!=='students');
    nav.querySelectorAll('[data-hub-link]').forEach(link=>{
      link.hidden=link.dataset.hubLink==='students'&&!isCoach;
      if(link.dataset.hubLink===current)link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
    heading.innerHTML='<h2>'+info[2]+'</h2><p>'+info[3]+'</p>'+(current==='today'&&!isCoach?'<section class="startHere" aria-labelledby="startHereTitle"><p class="kicker">START HERE</p><h3 id="startHereTitle">Welcome aboard.</h3><p>Your mentorship now has one practice engine. Use Zoukable for drills and spaced review; use Atlas to revisit the lesson context behind what you are practicing.</p><ol><li><strong>Practice.</strong> Open Zoukable for today’s teacher-authored drills and due reviews.</li><li><strong>Understand.</strong> Use Atlas when you want the lesson notes and connected concepts.</li><li><strong>Report back.</strong> Your practice evidence and daily mission activity return to this account automatically.</li></ol><div class="actions"><a class="btn" href="/zoukable/?page=today&from=hub">Open Zoukable →</a><a class="crewQuickLink" href="/zouk-map/#map">Explore my Atlas →</a></div></section>':'');
    if(current==='today') heading.insertAdjacentHTML('beforeend','<section class="shipDirectory" aria-labelledby="shipDirectoryTitle"><div class="shipDirectoryIntro"><p class="kicker">ABOARD THE MOTHERSHIP</p><h3 id="shipDirectoryTitle">Where would you like to go?</h3></div><div class="shipDecks"><a href="/zoukable/?page=today&from=hub"><span class="deckNumber">01 / PRACTICE STUDIO</span><strong>Zoukable</strong><span>Drills, spaced review, rhythm and practice evidence.</span><b aria-hidden="true">↗</b></a><a href="/zouk-map/#practice"><span class="deckNumber">02 / COACH FOCUS</span><strong>My practice note</strong><span>Return to your coach-reviewed lesson focus.</span><b aria-hidden="true">↗</b></a><a href="/zouk-map/#sessions"><span class="deckNumber">03 / LESSON ARCHIVE</span><strong>My lesson notes</strong><span>Revisit what you explored with your coach.</span><b aria-hidden="true">↗</b></a><a href="/zouk-map/#map"><span class="deckNumber">04 / OBSERVATORY</span><strong>My Zouk Atlas</strong><span>Explore your connected discoveries.</span><b aria-hidden="true">↗</b></a><a href="/comms-deck/"><span class="deckNumber">05 / COMMS DECK</span><strong>Talk with the crew</strong><span>Ask questions and share on ECHO.</span><b aria-hidden="true">↗</b></a></div></section>');
    if(current==='today') heading.insertAdjacentHTML('beforeend','<div class="crewLinkRow"><a class="btn" href="/feedback/">Give Feedback →</a><a class="btn" href="/reviews/">Student Reviews →</a>'+(isCoach?'<a class="btn" href="/feedback/#feedbackInbox">Review Feedback →</a>':'')+'</div>');
    if (['today','practice'].includes(current)) heading.insertAdjacentHTML('beforeend',window.GAB_CREW.adventure(current==='today'?'cockpit':'explore'));
    if(current==='today')loadZoukableSummary();
    if(focus)heading.focus({preventScroll:true});
  }
  nav.addEventListener('click',event=>{
    const link=event.target.closest('[data-hub-link]');
    if(!link)return;
    event.preventDefault();otherSpaces.open=false;history.pushState(null,'',link.getAttribute('href'));
    show(link.dataset.hubLink,true);nav.scrollIntoView({block:'start',behavior:'auto'});
  });
  document.getElementById('coachModeTabs').addEventListener('click',event=>{
    const button=event.target.closest('[data-mode]');
    if(button)show(button.dataset.mode==='coach'?'students':'today');
  });
  window.addEventListener('hashchange',()=>show(pageFromHash()));
  window.addEventListener('popstate',()=>show(pageFromHash()));
  window.addEventListener('focus',()=>loadZoukableSummary(true));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')loadZoukableSummary(true);});
  window.HUB_NAV={setCoach(value){isCoach=value===true;show(pageFromHash());loadZoukableSummary(true);}};
  show(pageFromHash());
  setTimeout(()=>loadZoukableSummary(true),900);
})();
