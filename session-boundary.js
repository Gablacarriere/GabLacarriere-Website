// Clear stale account views before restarting after an account boundary.
window.GAB_SESSION = {
  watch(client) {
    let initialized=false, account=null, stopped=false;
    function restart(){
      if(stopped)return;stopped=true;
      window.hubEcho?.stop();
      const note=document.createElement('p');
      note.textContent='Your session changed. Reloading your account view…';
      note.setAttribute('role','status');
      document.body.replaceChildren(note);
      // Detach the old view so pending requests cannot paint into the new document.
      location.replace(location.pathname+location.search);
    }
    client.auth.onAuthStateChange((event,session)=>{
      const next=session?.user?.id||null;
      if(!initialized){initialized=true;account=next;return;}
      if(event==='SIGNED_OUT'&&account){restart();return;}
      if(event==='SIGNED_IN'&&next!==account){restart();return;}
      if(next)account=next;
    });
    window.addEventListener('pageshow',async event=>{
      if(!event.persisted||stopped)return;
      try{const result=await client.auth.getUser();if(result.error||result.data.user?.id!==account)restart();}catch(_){restart();}
    });
  }
};

// Teaching Lab gets a live coach-only curriculum ↔ Zoukable coverage audit.
if(/^\/teaching-lab\/?$/.test(location.pathname)&&!document.querySelector('script[data-teaching-coverage]')){
  const script=document.createElement('script');
  script.src='/teaching-lab-coverage.js?v=1';
  script.defer=true;
  script.dataset.teachingCoverage='1';
  document.head.appendChild(script);
}

// Teaching Lab can hand a generated class directly to the account-backed Session Planner.
if(/^\/teaching-lab\/?$/.test(location.pathname)&&!document.querySelector('script[data-teaching-session-bridge]')){
  const script=document.createElement('script');
  script.src='/teaching-lab-session-bridge.js?v=1';
  script.defer=true;
  script.dataset.teachingSessionBridge='1';
  document.head.appendChild(script);
}

// Mentorship Hub: wire the student-facing post-class recap and longitudinal history.
if(/^\/mentorship-hub\/?$/.test(location.pathname)){
  const loadMentorshipScript=(key,src)=>{
    if(document.querySelector(`script[data-${key}]`))return;
    const script=document.createElement('script');
    script.src=src;
    script.defer=true;
    script.setAttribute(`data-${key}`,'1');
    document.head.appendChild(script);
  };

  loadMentorshipScript('mentorship-latest-session','/mentorship-latest-session.js?v=2');
  loadMentorshipScript('mentorship-learning-timeline','/mentorship-learning-timeline.js?v=2');

  const syncLatestSessionVisibility=()=>{
    const card=document.getElementById('latestSessionStudent');
    if(!card)return;
    const hash=location.hash || '#hub-today';
    card.hidden=hash.startsWith('#hub-') && hash!=='#hub-today';
  };

  const watchHub=()=>{
    syncLatestSessionVisibility();
    const root=document.getElementById('dashboardView');
    if(!root)return;
    let queued=false;
    new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;syncLatestSessionVisibility();});
    }).observe(root,{childList:true,subtree:true});
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watchHub,{once:true});
  else watchHub();
  window.addEventListener('hashchange',syncLatestSessionVisibility);
  window.addEventListener('popstate',syncLatestSessionVisibility);
}
