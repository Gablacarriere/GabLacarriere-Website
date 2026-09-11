(() => {
'use strict';
const $=id=>document.getElementById(id),esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const descriptions={announcements:'Updates from Gab and Steph. Only coaches can post here.',practice:'A shared space for practice questions, discoveries and finding practice partners.',stars:'Ask the crew about a concept on the map. Posting here does not unlock a star.',coaching:'Private conversations between one student and the coaching team. Other students cannot see these threads.'};
let roster=[], unreadRows=null, echo=null;
let client,user,coach=false,channel='practice',threads=[],selected=null,offset=0,replies=[],replyOffset=0,pendingThread=null,pendingReply=null,generation=0;
const tf='id,channel,title,body,concept_id,student_id,author_id,author_name,author_role,created_at';
const rf='id,thread_id,body,author_id,author_name,author_role,created_at';
const concepts=(window.ZOUK_ATLAS||[]).flatMap(g=>g.topics.map((t,i)=>({id:g.id+'-'+i,name:t})));
const label=id=>concepts.find(c=>c.id===id)?.name||'Map concept';
const date=v=>new Date(v).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
const who=a=>esc(a.author_name)+(a.author_role==='coach'?' · Coach':'');
function clean(){echo?.stop();echo=null;unreadRows=null;generation++;user=null;threads=[];selected=null;replies=[];$('threadList').replaceChildren();$('threadContent').replaceChildren();$('replyList').replaceChildren();$('threadForm').reset();$('replyForm').reset();$('crewWorkspace').hidden=true;$('crewLogin').hidden=false;$('crewMemberList').replaceChildren();roster=[];paintUnread();}
function message(a,reply=false){return `<article class="crewMessage"><p class="messageMeta">${who(a)} · ${esc(date(a.created_at))}</p><p class="messageText">${esc(a.body)}</p><div class="actions"><a href="mailto:riseadance@gmail.com?subject=Comms%20Deck%20report&body=${encodeURIComponent('Please review '+(reply?'reply ':'conversation ')+a.id+' in thread '+(reply?a.thread_id:a.id)+'.\nMy concern: ')}">Report to Gab</a>${(coach||(reply&&a.author_id===user.id))?`<button type="button" data-remove="${a.id}" data-kind="${reply?'reply':'thread'}">Remove ${reply?'reply':'conversation'}</button>`:''}</div></article>`;}
function unreadBadge(id){return unreadRows?.some(r=>r.thread_id===id)?'<span class="unreadBadge">Unread</span>':'';}
function paintUnread(){
 const counts={};(unreadRows||[]).forEach(r=>counts[r.channel]=(counts[r.channel]||0)+1);
 document.querySelectorAll('[data-channel]').forEach(b=>{const name={announcements:'Announcements',practice:'Practice together',stars:'Ask about a star',coaching:'Private coaching'}[b.dataset.channel];b.innerHTML=esc(name)+(counts[b.dataset.channel]?'<span class="unreadBadge">'+counts[b.dataset.channel]+' unread</span>':'');});
 document.querySelectorAll('[data-thread]').forEach(b=>{b.querySelector('.unreadBadge')?.remove();if(unreadRows?.some(r=>r.thread_id===b.dataset.thread))b.insertAdjacentHTML('beforeend',unreadBadge(b.dataset.thread));});
 $('unreadSummary').textContent=!user?'':unreadRows===null?'Unread updates are unavailable. Use Refresh conversations to retry.':unreadRows.length?unreadRows.length+' unread conversation'+(unreadRows.length===1?'':'s')+' across your crew channels.':'You’re caught up. No unread conversations.';
}
async function markVisible(){
 if(!selected||!echo||$('threadReader').hidden||document.visibilityState==='hidden')return;
 // Use timestamps of the loaded snapshot, preserving database precision. A later reply stays unread.
 const through=[selected.created_at,...replies.map(r=>r.created_at)].sort().at(-1);
 const ok=await echo.read(selected.id,through);if(!ok&&user)$('unreadSummary').textContent='Your conversation opened, but its read status could not be saved. Refresh to retry.';
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')markVisible();});
async function list(reset=true){
 echo?.refresh();const run=++generation;if(reset){offset=0;threads=[];}const wanted=channel;
 $('crewStatus').textContent='Loading conversations…';
 const r=await client.from('crew_threads').select(tf).eq('channel',wanted).order('created_at',{ascending:false}).order('id').range(offset,offset+19);
 if(run!==generation||!user)return;
 if(r.error){$('crewStatus').textContent='Conversations could not load. Try Refresh conversations.';return;}
 threads.push(...r.data);offset+=r.data.length;$('moreThreads').hidden=r.data.length<20;
 $('threadList').innerHTML=threads.map(t=>`<button class="threadRow" data-thread="${t.id}"><strong>${esc(t.title)}</strong>${unreadBadge(t.id)}<small>${who(t)} · ${esc(date(t.created_at))}${t.concept_id?' · '+esc(label(t.concept_id)):''}</small></button>`).join('');
 $('crewStatus').textContent=threads.length?'Conversations loaded. Unread indicators update automatically; refresh to load new messages.':'No conversations here yet. '+(wanted==='announcements'?'Coach updates will appear here.':'You can start the first one.');
}
function choose(next){
 channel=Object.hasOwn(descriptions,next)?next:'practice';selected=null;pendingThread=null;pendingReply=null;$('threadReader').hidden=true;$('threadList').hidden=false;$('threadForm').hidden=true;$('threadForm').reset();$('replyForm').reset();$('replyList').replaceChildren();
 $('channelDescription').textContent=descriptions[channel];document.querySelectorAll('[data-channel]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.channel===channel)));
 $('openCompose').hidden=channel==='announcements'&&!coach;$('conceptField').hidden=channel!=='stars';$('recipientField').hidden=channel!=='coaching'||!coach;
 $('threadConcept').required=channel==='stars';$('threadStudent').required=channel==='coaching'&&coach;
 $('composeAudience').textContent=channel==='coaching'?'Only the selected student and the coaches can read this conversation.':'This conversation is visible to all signed-in mentorship members.';
 list();
}
async function openThread(id,older=false){
 const run=++generation;$('crewStatus').textContent='Loading conversation…';
 const t=await client.from('crew_threads').select(tf).eq('id',id).maybeSingle();
 if(run!==generation||!user)return;
 if(t.error||!t.data){$('crewStatus').textContent='This conversation is unavailable or has been removed.';$('threadReader').hidden=true;return;}
 if(!older){replies=[];replyOffset=0;}
 const r=await client.from('crew_replies').select(rf).eq('thread_id',id).order('created_at',{ascending:false}).order('id').range(replyOffset,replyOffset+49);
 if(run!==generation||!user)return;
 if(r.error){$('crewStatus').textContent='Replies could not load. Refresh to try again.';return;}
 selected=t.data;replies.push(...r.data);replyOffset+=r.data.length;$('moreReplies').hidden=r.data.length<50;
 $('threadContent').innerHTML=`<h2>${esc(selected.title)}</h2><p>${selected.channel==='coaching'?'Private · student and coaches only':selected.concept_id?'Map concept · '+esc(label(selected.concept_id)):'Shared with the mentorship crew'}</p>`+message(selected);
 $('replyList').innerHTML=[...replies].reverse().map(a=>message(a,true)).join('');$('threadList').hidden=true;$('moreThreads').hidden=true;$('threadReader').hidden=false;$('threadForm').hidden=true;
 $('replyForm').hidden=selected.channel==='announcements'&&!coach;$('crewStatus').textContent='Conversation loaded. Refresh to check for new replies.';
 await markVisible();if(run!==generation||!user)return;
 if(!older){$('threadReader').focus({preventScroll:true});$('threadReader').scrollIntoView({block:'start'});}
}
async function safeInsert(table,payload){const r=await client.from(table).insert(payload).select('id').single();if(r.error?.code==='23505'){const check=await client.from(table).select('id').eq('id',payload.id).single();if(!check.error)return check.data;}if(r.error)throw r.error;return r.data;}
$('threadForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!user||!e.target.reportValidity())return;
 const title=$('threadTitle').value.trim(),body=$('threadBody').value.trim();if(title.length<3||!body){$('composeStatus').textContent='Add a topic and message before posting.';return;}
 pendingThread=pendingThread||crypto.randomUUID();const button=e.target.querySelector('[type=submit]');button.disabled=true;$('composeStatus').textContent='Posting…';
 try{const result=await safeInsert('crew_threads',{id:pendingThread,channel,title,body,concept_id:channel==='stars'?$('threadConcept').value:null,student_id:channel==='coaching'?(coach?$('threadStudent').value:user.id):null});pendingThread=null;e.target.reset();$('composeStatus').textContent='Posted.';await openThread(result.id);}catch(_){$('composeStatus').textContent='Post could not be confirmed. Your message is still here. Retry to check the same conversation.';}finally{button.disabled=false;}
});
$('replyForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!selected||!user)return;const body=$('replyBody').value.trim();if(!body)return;
 pendingReply=pendingReply||crypto.randomUUID();const id=selected.id,button=e.target.querySelector('button');button.disabled=true;$('replyStatus').textContent='Sending…';
 try{await safeInsert('crew_replies',{id:pendingReply,thread_id:id,body});pendingReply=null;$('replyBody').value='';$('replyStatus').textContent='Reply sent.';await openThread(id);}catch(_){$('replyStatus').textContent='Reply could not be confirmed. Your text is still here. Retry to check the same reply.';}finally{button.disabled=false;}
});
$('threadReader').addEventListener('click',async e=>{const b=e.target.closest('[data-remove]');if(!b||!user)return;const thread=b.dataset.kind==='thread';if(!confirm(thread?'Remove this conversation and all its replies?':'Remove this reply?'))return;b.disabled=true;const r=await client.from(thread?'crew_threads':'crew_replies').delete().eq('id',b.dataset.remove).select('id');if(r.error||!r.data.length){$('crewStatus').textContent='Could not remove this item. Refresh and try again.';b.disabled=false;return;}if(thread)choose(channel);else await openThread(selected.id);});
async function crewAccess(){
 if(!coach||!user)return;const r=await client.from('crew_members').select('id');if(r.error){$('crewAccessStatus').textContent='Crew access could not load.';return;}if(!user)return;
 const ids=new Set(r.data.map(m=>m.id));$('crewAccess').hidden=false;$('crewMemberList').innerHTML=roster.map(p=>`<button type="button" data-member="${p.id}" data-access="${ids.has(p.id)?'remove':'add'}">${esc(p.display_name||'Student')} · ${ids.has(p.id)?'Remove crew access':'Allow crew access'}</button>`).join('');
}
$('crewMemberList').onclick=async e=>{const b=e.target.closest('[data-member]');if(!b||!coach||!user)return;const remove=b.dataset.access==='remove';if(!confirm((remove?'Remove':'Allow')+' crew access for this student?'))return;b.disabled=true;const r=remove?await client.from('crew_members').delete().eq('id',b.dataset.member).select('id'):await client.from('crew_members').insert({id:b.dataset.member}).select('id');$('crewAccessStatus').textContent=r.error?'Access change could not be confirmed. Refresh before retrying.':'Crew access updated.';await crewAccess();};
$('threadList').onclick=e=>{const b=e.target.closest('[data-thread]');if(b){pendingReply=null;$('replyBody').value='';openThread(b.dataset.thread);}};
$('closeThread').onclick=()=>choose(channel);$('refreshCrew').onclick=()=>{if(coach)crewAccess();echo?.refresh();return selected?openThread(selected.id):list();};$('moreThreads').onclick=()=>list(false);$('moreReplies').onclick=()=>selected&&openThread(selected.id,true);
$('openCompose').onclick=()=>{$('threadForm').hidden=false;$('threadReader').hidden=true;$('composeStatus').textContent='';$('threadTitle').focus();};$('cancelCompose').onclick=()=>{$('threadForm').hidden=true;};
 document.querySelectorAll('[data-channel]').forEach(b=>b.onclick=()=>choose(b.dataset.channel));
(async()=>{try{
 if(!window.supabase||!window.GAB_PORTAL)throw Error();client=supabase.createClient(GAB_PORTAL.supabaseUrl,GAB_PORTAL.supabaseAnonKey);
 const u=await client.auth.getUser();if(!u.data.user){clean();$('crewStatus').textContent='Sign in with your invited mentorship account to read and post.';return;}user=u.data.user;
 const p=await client.from('profiles').select('id,display_name,role').eq('id',user.id).single();if(p.error||!['mentee','coach'].includes(p.data?.role))throw Error();coach=p.data.role==='coach';
 const membership=await client.from('crew_members').select('id').eq('id',user.id).maybeSingle();if(membership.error)throw membership.error;if(!membership.data){clean();$('crewStatus').textContent='Your account is signed in, but crew access is not enabled. Ask Gab or Steph to add you.';return;}
 if(coach){const r=await client.from('profiles').select('id,display_name').eq('role','mentee').order('display_name');if(r.error)throw r.error;roster=r.data;await crewAccess();$('threadStudent').innerHTML='<option value="">Choose a student</option>'+r.data.map(p=>`<option value="${p.id}">${esc(p.display_name||'Student')}</option>`).join('');}
 $('threadConcept').innerHTML=concepts.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');$('crewWorkspace').hidden=false;echo=window.ECHO_UNREAD.start(client,user.id,rows=>{unreadRows=rows;paintUnread();});
 const concept=new URLSearchParams(location.search).get('concept');choose(concepts.some(c=>c.id===concept)?'stars':'practice');if(concept&&concepts.some(c=>c.id===concept)){$('threadConcept').value=concept;$('threadForm').hidden=false;}
 client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){clean();$('crewStatus').textContent='You are signed out. Sign in to return to the crew.';}});
 }catch(_){clean();$('crewStatus').textContent='The member connection could not load. Sign in again or reload this page.';}})();
})();
