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
