(() => {
'use strict';
window.ECHO_UNREAD={start(client,userId,update){
 let active=true,run=0,busy=false,again=false;
 async function refresh(){
  if(!active||document.visibilityState==='hidden')return;if(busy){again=true;return;}busy=true;const token=++run;
  try{const rows=[];for(let offset=0;;offset+=500){const r=await client.from('crew_unread').select('thread_id,channel,unread_count').gt('unread_count',0).order('thread_id').range(offset,offset+499);if(r.error)throw r.error;rows.push(...r.data);if(r.data.length<500)break;}if(active&&run===token)update(rows);}catch(_){if(active&&run===token)update(null);}finally{busy=false;if(again){again=false;refresh();}}
 }
 async function read(threadId,through){if(!active)return false;const r=await client.rpc('mark_crew_read',{p_thread:threadId,p_through:through});if(!active)return false;if(r.error)return false;await refresh();return true;}
 const visible=()=>{if(document.visibilityState==='visible')refresh();};
 const subscription=client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||(session?.user&&session.user.id!==userId)){stop();update(null);}});
 const leave=event=>{if(!event.persisted)stop();};
 const timer=setInterval(refresh,30000);document.addEventListener('visibilitychange',visible);window.addEventListener('focus',visible);window.addEventListener('pagehide',leave);window.addEventListener('pageshow',visible);
 function stop(){active=false;run++;clearInterval(timer);document.removeEventListener('visibilitychange',visible);window.removeEventListener('focus',visible);window.removeEventListener('pagehide',leave);window.removeEventListener('pageshow',visible);subscription.data?.subscription?.unsubscribe();}
 refresh();return {refresh,read,stop};
}};
})();
