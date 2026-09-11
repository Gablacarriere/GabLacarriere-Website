// Read the authenticated user's own protected profile. No private student data
// is requested by the Atlas. Curriculum visibility is a display preference.
(async () => {
  const cfg=window.GAB_PORTAL;
  if(!cfg || !window.supabase) return;
  const client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
  let generation=0;
  async function refreshCrew(){
    const run=++generation;
    try {
      const {data:{user},error}=await client.auth.getUser();
      if(error || !user){if(run===generation)window.dispatchEvent(new CustomEvent('atlas-crew',{detail:null}));return;}
      const {data:profile,error:profileError}=await client.from('profiles').select('id,display_name,role').eq('id',user.id).single();
      if(run===generation)window.dispatchEvent(new CustomEvent('atlas-crew',{detail:!profileError&&profile?.role==='coach'?{title:window.GAB_CREW.titleFor(profile),name:profile.display_name}:null}));
    } catch (_) {if(run===generation)window.dispatchEvent(new CustomEvent('atlas-crew',{detail:null}));}
  }
  client.auth.onAuthStateChange(()=>{setTimeout(refreshCrew,0);});
  await refreshCrew();
})();
