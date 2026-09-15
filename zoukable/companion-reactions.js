/* Context-aware companion moments from real Zoukable learning state. */
(() => {
'use strict';
const URL='https://lftguwmyagkehqmaxjig.supabase.co';
const KEY='sb_publishable_YzhfBB0z3emKU-rM8f_18A_Z0RUJUYt';
const $=s=>document.querySelector(s);
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NAMES={lumi:'Lumi',bpmi:'BPMI',nimi:'Nimi',orbi:'Orbi',ziggy:'Ziggy',miso:'Miso',kiko:'Kiko',sprout:'Sprout'};
const VOICES={
 lumi:{review:'There’s a little light we can revisit.',hard:'That one felt hard last time. We can make it smaller today.',mission:'One of this week’s missions is close.',social:'You carried that skill into real dancing. I noticed.',idle:'A small practice is enough to turn the light back on.',saved:'One small practice, one brighter step.'},
 bpmi:{review:'Return signal detected. One review is waiting.',hard:'That attempt was rough. Let’s lower the noise and try one clean piece.',mission:'Quest signal is almost complete.',social:'Transfer confirmed: practice made it onto the dance floor.',idle:'Ready when you are. One beat is enough to restart.',saved:'Practice logged. Beat by beat.'},
 nimi:{review:'Something familiar is ready to come back.',hard:'That was difficult last time. Gentle is allowed.',mission:'You’re close to finishing a weekly mission.',social:'You tried it in social dancing. That counts differently.',idle:'We can begin with something tiny.',saved:'Small steps count.'},
 orbi:{review:'Something we learned before has come back around.',hard:'Last time was difficult. No rush — we can orbit it again.',mission:'A weekly mission is nearly in reach.',social:'That skill made it into social dancing. Different orbit, same learning.',idle:'No rush. We can start with one quiet orbit.',saved:'Another orbit complete.'},
 ziggy:{review:'Old territory just became new territory again.',hard:'That route was tricky. We can take a smaller path through it.',mission:'One mission is nearly cleared.',social:'You tested it in the wild. Nice.',idle:'Pick one small route and let’s go.',saved:'New route discovered.'},
 miso:{review:'There’s something familiar waiting for us.',hard:'That one was hard. Be kind to the next attempt.',mission:'A Quest Star is getting close.',social:'You brought it into social dancing. That deserves a tiny celebration.',idle:'A little practice is plenty for today.',saved:'That effort counts.'},
 kiko:{review:'A detail from before is ready for another look.',hard:'That attempt showed us exactly where to look next.',mission:'One mission is close. The details are adding up.',social:'You used the skill socially. That is useful evidence.',idle:'Let’s notice one small thing today.',saved:'Tiny details build big changes.'},
 sprout:{review:'Something you planted earlier is ready for another visit.',hard:'That one struggled last time. We can give it a gentler version.',mission:'One weekly mission is almost grown.',social:'You used it socially. That is real growth.',idle:'One small practice is enough to grow something.',saved:'One practice, one little sprout.'}
};
let db=null,user=null,profile=null,identity=null,companionId='lumi',attempts=[],reviews=[],drills=[],skills=[],quests=[],questDefs=[],social=[],lastNotice='',renderQueued=false,lastCardSig='';

function style(){if($('#companion-moment-style'))return;const s=document.createElement('style');s.id='companion-moment-style';s.textContent=`
.companion-moment-card{margin:0 0 20px;padding:15px 17px;border:1px solid rgba(190,168,255,.24);border-radius:19px;background:radial-gradient(circle at 0 0,rgba(151,125,255,.16),transparent 35%),linear-gradient(145deg,#111c31,#0b1424);color:#f8f5ff;display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center}.companion-moment-face{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#fff5cc,#b397ff 55%,#5066d8);box-shadow:0 0 24px #b899ff4d;font-size:1.25rem}.companion-moment-copy strong{display:block}.companion-moment-copy p{margin:3px 0 0;color:#c3cee0}.companion-moment-link{color:#c9f6ff;text-decoration:none;font-weight:850;font-size:.82rem;white-space:nowrap}.companion-reaction{position:fixed;right:20px;bottom:20px;z-index:120;width:min(350px,calc(100% - 32px));padding:14px 16px;border:1px solid #ffffff28;border-radius:18px;background:linear-gradient(145deg,#132239,#0c1424);color:#f8f5ff;box-shadow:0 18px 50px #0008;display:flex;gap:12px;align-items:center;animation:companionIn .28s ease-out}.companion-reaction .orb{width:44px;height:44px;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff5cc,#b397ff 55%,#5066d8);box-shadow:0 0 24px #b899ff66;font-size:1.3rem;flex:0 0 44px}.companion-reaction strong{display:block}.companion-reaction p{margin:2px 0 0;color:#c5cfe2;font-size:.9rem}.companion-reaction small{display:block;margin-top:5px;color:#95a8c5}@keyframes companionIn{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}@media(max-width:640px){.companion-moment-card{grid-template-columns:auto 1fr}.companion-moment-link{grid-column:2}.companion-reaction{right:16px;bottom:16px}}
`;document.head.appendChild(s);}
function voice(key){return (VOICES[companionId]||VOICES.lumi)[key]||VOICES.lumi.idle;}
function drill(id){return drills.find(d=>d.id===id)||null;}
function skill(id){return skills.find(s=>s.id===id)||null;}
function activeQuests(){return quests.filter(q=>!q.completed_at).map(q=>({q,def:questDefs.find(d=>d.id===q.quest_id)})).filter(x=>x.def);}
function dueReviews(){const now=Date.now();return reviews.filter(r=>new Date(r.due_at).getTime()<=now).sort((a,b)=>new Date(a.due_at)-new Date(b.due_at));}
function recentHard(){return attempts.find(a=>a.status==='completed'&&['failed','difficult'].includes(a.result)&&Date.now()-new Date(a.completed_at||a.started_at).getTime()<7*86400000)||null;}
function recentSocial(){return social.find(x=>['intentional','natural'].includes(x.outcome)&&Date.now()-new Date(x.created_at).getTime()<7*86400000)||null;}
function nearQuest(){return activeQuests().map(x=>({...x,remaining:Math.max(0,Number(x.def.target||1)-Number(x.q.progress||0))})).sort((a,b)=>a.remaining-b.remaining)[0]||null;}
function nextMoment(){
 const due=dueReviews()[0];if(due){const d=drill(due.drill_id);return {key:'review',text:voice('review'),detail:d?.title?`Review due: ${d.title}`:'A spaced review is due.',href:'/zoukable/?page=practice',label:'Review →'};}
 const hard=recentHard();if(hard){const d=drill(hard.drill_id);return {key:'hard',text:voice('hard'),detail:d?.title?`Last difficult attempt: ${d.title}`:'Last practice had a difficult attempt.',href:'/zoukable/?page=practice',label:'Try again →'};}
 const q=nearQuest();if(q&&q.remaining<=1){return {key:'mission',text:voice('mission'),detail:`${q.def.title}: ${Math.min(Number(q.q.progress||0),Number(q.def.target||1))}/${q.def.target}`,href:'/zoukable/?page=missions',label:'Open mission →'};}
 const soc=recentSocial();if(soc){const s=skill(soc.skill_id);return {key:'social',text:voice('social'),detail:s?.name?`Social transfer: ${s.name}`:'A recent social transfer is logged.',href:'/zoukable/?page=social',label:'See journal →'};}
 const last=attempts[0];const days=last?Math.floor((Date.now()-new Date(last.completed_at||last.started_at).getTime())/86400000):999;if(days>=2)return {key:'idle',text:voice('idle'),detail:days<999?`${days} days since your last saved practice.`:'Start with one short session.',href:'/zoukable/?page=practice',label:'Start practice →'};
 return null;
}
function injectCard(){if(profile?.role!=='mentee')return;const chapter=document.body.dataset.chapter,existing=$('#companion-moment-card');if(!['today','practice'].includes(chapter)){existing?.remove();lastCardSig='';return;}const m=nextMoment();if(!m){existing?.remove();lastCardSig='';return;}const intro=$('#view .intro');if(!intro)return;const sig=[m.key,m.detail,companionId,chapter].join('|');if(existing&&sig===lastCardSig)return;let box=existing;if(!box){box=document.createElement('section');box.id='companion-moment-card';box.className='companion-moment-card';intro.insertAdjacentElement('afterend',box);}box.innerHTML=`<div class="companion-moment-face" aria-hidden="true">✦</div><div class="companion-moment-copy"><strong>${esc(NAMES[companionId]||'Your companion')}</strong><p>${esc(m.text)}</p><small>${esc(m.detail)}</small></div><a class="companion-moment-link" href="${m.href}">${esc(m.label)}</a>`;lastCardSig=sig;}
function scheduleCard(){if(renderQueued)return;renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;injectCard();});}
function postSaveMessage(a){
 if(!a)return {text:voice('saved'),detail:'Practice saved.'};
 const d=drill(a.drill_id),title=d?.title||'this drill';
 if(a.result==='failed')return {text:voice('hard'),detail:`${title} was marked difficult enough to stop. The next attempt can be smaller.`};
 if(a.result==='difficult')return {text:voice('hard'),detail:`${title} was difficult. That gives the next session useful information.`};
 if(a.result==='easy')return {text:voice('saved'),detail:`${title} felt easy. Zoukable will use that evidence in future review timing.`};
 return {text:voice('saved'),detail:`${title} is saved for future review.`};
}
function showReaction(msg){style();document.querySelector('.companion-reaction')?.remove();const el=document.createElement('aside');el.className='companion-reaction';el.setAttribute('role','status');el.innerHTML=`<div class="orb" aria-hidden="true">✦</div><div><strong>${esc(NAMES[companionId]||'Your companion')}</strong><p>${esc(msg.text)}</p><small>${esc(msg.detail||'')}</small></div>`;document.body.appendChild(el);setTimeout(()=>el.remove(),6200);}
async function reloadRecent(){if(!db||!user)return;const [aR,rR,qR,sR]=await Promise.all([
 db.from('zoukable_attempts').select('id,drill_id,primary_skill_id,status,result,started_at,completed_at').eq('user_id',user.id).order('started_at',{ascending:false}).limit(20),
 db.from('zoukable_review_states').select('drill_id,due_at').eq('user_id',user.id).order('due_at',{ascending:true}).limit(20),
 db.from('zoukable_user_quests').select('quest_id,progress,completed_at,week_start').eq('user_id',user.id).order('week_start',{ascending:false}).limit(6),
 db.from('zoukable_social_logs').select('skill_id,outcome,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(10)
 ]);attempts=aR.data||attempts;reviews=rR.data||reviews;quests=qR.data||quests;social=sR.data||social;scheduleCard();}
function watchNotice(){const notice=$('#notice');if(!notice)return;const check=async()=>{const t=(notice.textContent||'').trim();if(t&&t!==lastNotice&&t.startsWith('Practice saved')){lastNotice=t;await reloadRecent();showReaction(postSaveMessage(attempts[0]));}else if(t)lastNotice=t;};new MutationObserver(check).observe(notice,{childList:true,subtree:true,characterData:true,attributes:true});check();}
async function load(){try{if(!window.supabase)return;db=db||window.supabase.createClient(URL,KEY);const auth=await db.auth.getUser();user=auth.data?.user||null;if(!user)return;const [pR,iR,aR,rR,dR,sR,qR,qdR,soR]=await Promise.all([
 db.from('profiles').select('role').eq('id',user.id).single(),
 db.from('zoukable_identities').select('companion_id').eq('user_id',user.id).maybeSingle(),
 db.from('zoukable_attempts').select('id,drill_id,primary_skill_id,status,result,started_at,completed_at').eq('user_id',user.id).order('started_at',{ascending:false}).limit(20),
 db.from('zoukable_review_states').select('drill_id,due_at').eq('user_id',user.id).order('due_at',{ascending:true}).limit(20),
 db.from('zoukable_drills').select('id,title,primary_skill_id'),
 db.from('zoukable_skills').select('id,name'),
 db.from('zoukable_user_quests').select('quest_id,progress,completed_at,week_start').eq('user_id',user.id).order('week_start',{ascending:false}).limit(6),
 db.from('zoukable_quest_definitions').select('id,title,target').eq('active',true),
 db.from('zoukable_social_logs').select('skill_id,outcome,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(10)
 ]);profile=pR.data;identity=iR.data;companionId=identity?.companion_id||localStorage.getItem('zoukable-companion')||'lumi';attempts=aR.data||[];reviews=rR.data||[];drills=dR.data||[];skills=sR.data||[];quests=qR.data||[];questDefs=qdR.data||[];social=soR.data||[];localStorage.setItem('zoukable-companion',companionId);scheduleCard();}catch(e){console.warn('Companion moments',e);}}
function start(){style();load();watchNotice();new MutationObserver(scheduleCard).observe(document.body,{childList:true,subtree:true});window.addEventListener('focus',()=>{reloadRecent();});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')reloadRecent();});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
