(() => {
  const dashboard=document.getElementById('dashboardView');
  if(!dashboard)return;
  const sections=[
    ['today','Today','Your next step','Start with your current focus and today’s training.'],
    ['practice','Practice','Make room for practice','Your goals, assignments, reviews and weekly reflection.'],
    ['progress','Progress','See your journey','Your saved activity, milestones and training history.'],
    ['resources','Resources','Your learning library','Private resources shared through your mentorship.'],
    ['crew','Crew','Your flight crew','Meet the people guiding the mentorship ship.'],
    ['account','Account','Your account','Manage your password and keep your account secure.'],
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
  const nav=document.createElement('nav');
  nav.className='hubNavigation';nav.setAttribute('aria-label','Member area');
  nav.innerHTML=sections.map(([key,label])=>'<a href="#hub-'+key+'" data-hub-link="'+key+'">'+label+'</a>').join('')+'<a class="hubAtlasLink" href="/zouk-map/#map">Zouk Atlas ↗</a><a href="/comms-deck/">ECHO · Comms Deck ↗</a>';
  const heading=document.createElement('div');heading.className='hubPageHeading';heading.tabIndex=-1;
  dashboard.querySelector('.portalTop').after(nav,heading);
  dashboard.querySelector('.crewLinkRow')?.remove();
  let isCoach=false,current='today';
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
    heading.innerHTML='<h2>'+info[2]+'</h2><p>'+info[3]+'</p>'+(current==='today'&&!isCoach?'<section class="startHere" aria-labelledby="startHereTitle"><p class="kicker">START HERE</p><h3 id="startHereTitle">Welcome aboard.</h3><p>This is the first version of your mentorship space. Start with your coach’s practice focus, then explore how your lessons connect on your map.</p><ol><li><strong>Find your focus.</strong> Open My practice for your latest coach-reviewed note.</li><li><strong>Explore your discoveries.</strong> Select a concept on your map to revisit its lesson.</li><li><strong>Return after your next lesson.</strong> Gab or Steph reviews and records new discoveries.</li></ol><div class="actions"><a class="btn" href="/zouk-map/#practice">Open my practice →</a><a class="crewQuickLink" href="/zouk-map/#map">Explore my map →</a></div><p class="muted">An empty map means your lessons have not been recorded yet. It is not an assessment of your ability.</p></section>':'');
    if (['today','practice'].includes(current)) heading.insertAdjacentHTML('beforeend',window.GAB_CREW.adventure(current==='today'?'cockpit':'explore'));
    if(focus)heading.focus({preventScroll:true});
  }
  nav.addEventListener('click',event=>{
    const link=event.target.closest('[data-hub-link]');
    if(!link)return;
    event.preventDefault();history.pushState(null,'',link.getAttribute('href'));
    show(link.dataset.hubLink,true);nav.scrollIntoView({block:'start',behavior:'auto'});
  });
  // Keep existing alert shortcuts into the coaching deck working.
  document.getElementById('coachModeTabs').addEventListener('click',event=>{
    const button=event.target.closest('[data-mode]');
    if(button)show(button.dataset.mode==='coach'?'students':'today');
  });
  window.addEventListener('hashchange',()=>show(pageFromHash()));
  window.addEventListener('popstate',()=>show(pageFromHash()));
  window.HUB_NAV={setCoach(value){isCoach=value===true;show(pageFromHash());}};
  show(pageFromHash());
})();
