(() => {
'use strict';
const URL='https://lftguwmyagkehqmaxjig.supabase.co';
const KEY='sb_publishable_YzhfBB0z3emKU-rM8f_18A_Z0RUJUYt';
let db=null,user=null,access=null,queued=false;
const $=s=>document.querySelector(s);
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const full=()=>access?.full_access===true;
const freeLive=()=>!!access&&access.mode==='live'&&!full();
const mentorship=()=>access?.tier==='mentorship';

function accessLabel(){
 if(!access)return 'Zoukable';
 if(access.tier==='staff')return 'Studio owner · Full';
 if(access.tier==='mentorship')return 'Mentorship · Full included';
 if(access.tier==='pro')return 'Full Zoukable';
 if(access.mode==='beta')return 'Beta · Full preview';
 return 'Free Zoukable';
}
function badgeText(){
 if(!access)return 'BETA';
 if(access.tier==='mentorship')return 'MENTORSHIP';
 if(access.tier==='staff'||access.tier==='pro')return 'FULL';
 if(access.mode==='beta')return 'BETA · FULL';
 return 'FREE';
}
function badgeClass(){
 if(mentorship())return 'z-access-mentorship';
 if(full())return 'z-access-full';
 return 'z-access-free';
}
function compareHTML(){return `<section id="z-access-compare" class="z-access-compare" aria-labelledby="z-access-title"><div class="z-access-compare-head"><div><div class="eyebrow">START FREE · GROW WHEN IT HELPS</div><h2 id="z-access-title">A practice habit first. More intelligence when you need it.</h2><p class="muted">During beta, signed-in testers temporarily receive the complete Zoukable experience. At launch, the core practice loop stays free.</p></div></div><div class="z-access-grid"><article class="z-access-plan"><div class="tagline">FREE ZOUKABLE</div><h3>Build the habit.</h3><ul><li>5 deliberate starter drills</li><li>Practice timer + reflection</li><li>Rhythm Studio</li><li>Social journal</li><li>1 weekly mission</li><li>Explorer, ship and basic progression</li></ul></article><article class="z-access-plan featured"><div class="tagline">FULL ZOUKABLE</div><h3>Let the system adapt.</h3><ul><li>Complete drill library</li><li>Adaptive spaced-review queue</li><li>Self-diagnostics</li><li>3 rotating weekly missions</li><li>Deeper skill and progression intelligence</li><li>Your Free practice history carries forward</li></ul><span class="access-cta">Subscription opens after beta</span></article><article class="z-access-plan"><div class="tagline">MENTORSHIP</div><h3>Full product + a teacher.</h3><ul><li>Everything in Full Zoukable</li><li>Coach-assigned homework</li><li>Personal learning roadmap</li><li>Teacher-priority signals</li><li>Connected Atlas + mentorship context</li><li>No separate Zoukable subscription</li></ul><a class="access-cta" href="/mentorship/">Explore Mentorship →</a></article></div><p class="z-access-future">Full subscription pricing is intentionally being set after beta, using real usage and retention evidence rather than an arbitrary launch price.</p></section>`;}
function injectComparison(){
 const auth=$('#view .auth-grid');
 if(!auth||$('#z-access-compare'))return;
 auth.insertAdjacentHTML('afterend',compareHTML());
}
function setBadges(){
 const word=$('.wordmark .beta');
 if(word){word.textContent=user?badgeText():'BETA';word.classList.remove('z-access-free','z-access-full','z-access-mentorship');if(user)word.classList.add(badgeClass());}
 const connection=$('#connection');
 if(!user&&connection&&/mentorship/i.test(connection.textContent))connection.textContent='Sign in / create account';
 if(user){
  const account=$('.topbar .account');
  let chip=$('#z-access-chip');
  if(account&&!chip){chip=document.createElement('span');chip.id='z-access-chip';chip.className='z-access-chip';account.prepend(chip);}
  if(chip)chip.textContent=accessLabel();
  document.querySelectorAll('.intro .tag').forEach(tag=>{if(/mentorship pilot|pilot/i.test(tag.textContent)||tag.dataset.accessTier==='1'){tag.textContent=accessLabel();tag.dataset.accessTier='1';}});
 }
 const hub=[...document.querySelectorAll('.sidebar-foot a')].find(a=>a.getAttribute('href')==='/mentorship-hub/');
 if(hub&&user&&!mentorship()&&access?.tier!=='staff')hub.textContent='Mentorship · Full included ↗';
}
function bannerHTML(){
 if(!access)return '';
 if(access.mode==='beta')return `<div class="z-access-banner z-access-beta"><strong>Beta preview: Full Zoukable is unlocked.</strong><p>You are testing the complete product. At launch, Free keeps the starter practice loop; Full adds the complete adaptive system. Mentorship will continue to include Full automatically.</p></div>`;
 if(freeLive())return `<div class="z-access-banner"><strong>You’re using Free Zoukable.</strong><p>Your five starter drills, Rhythm Studio, social journal and weekly return mission stay free. Full adds the complete library, adaptive review, diagnostics and the full mission system. <a href="/mentorship/">Mentorship includes Full →</a></p></div>`;
 if(mentorship())return `<div class="z-access-banner"><strong>Full Zoukable is included with your mentorship.</strong><p>Your adaptive practice tools stay connected to coach assignments and your mentorship learning context. No separate software subscription is required.</p></div>`;
 return '';
}
function injectBanner(){
 if(!user||!access)return;
 const chapter=document.body.dataset.chapter||'';
 const intro=$('#view .intro');
 const old=$('#z-access-banner');
 const show=access.mode==='beta'?['journey','today'].includes(chapter):freeLive()?['journey','today','practice','skills'].includes(chapter):mentorship()&&chapter==='journey';
 if(!show){old?.remove();return;}
 if(!intro)return;
 const html=bannerHTML();if(!html){old?.remove();return;}
 if(old){if(old.dataset.chapter===chapter)return;old.remove();}
 intro.insertAdjacentHTML('afterend',html.replace('class="z-access-banner','data-chapter="'+esc(chapter)+'" class="z-access-banner'));
}
function markPremiumControls(){
 if(!freeLive())return;
 document.querySelectorAll('#diagnostic-start,[data-resume-diagnostic]').forEach(el=>{el.classList.add('z-access-premium');el.dataset.zAccessPremium='diagnostic';el.setAttribute('aria-description','Full Zoukable feature');});
}
function rewriteFreeCopy(){
 if(!freeLive())return;
 const notice=$('#notice');
 if(notice&&notice.textContent){
  let text=notice.textContent;
  text=text.replace('Your next review is scheduled.','Your practice history is saved. Full Zoukable uses this evidence for adaptive review scheduling.');
  text=text.replace('Use the diagnostic to build evidence in your current context.','Full Zoukable adds self-diagnostics when you want a more structured evidence check.');
  if(text!==notice.textContent)notice.textContent=text;
 }
 const missionHero=$('.missions-hero h1');
 if(missionHero&&/^Three small missions\./.test(missionHero.textContent))missionHero.innerHTML='One small mission.<br>One learning habit.';
 const missionText=$('.missions-hero .mission-muted');
 if(missionText&&/Missions reward useful return behaviors/.test(missionText.textContent))missionText.textContent='Free Zoukable gives you one weekly return mission. Full adds the rotating three-mission system.';
}
function showGate(kind='feature'){
 const view=$('#view');if(!view)return;
 let gate=$('#z-access-gate');if(!gate){gate=document.createElement('section');gate.id='z-access-gate';gate.className='z-access-gate';const intro=$('#view .intro');(intro||view).insertAdjacentElement(intro?'afterend':'afterbegin',gate);}
 const diagnostic=kind==='diagnostic';
 gate.innerHTML=`<div class="eyebrow">FULL ZOUKABLE</div><h3>${diagnostic?'Diagnostics turn practice evidence into a structured check.':'This belongs to the adaptive layer.'}</h3><p>${diagnostic?'Free Zoukable keeps ordinary practice and reflection available. Full adds diagnostics, the adaptive review queue, the complete drill library and all weekly missions.':'Your Free practice remains available, and your history carries forward if you later unlock Full.'}</p><a href="/mentorship/">Mentorship includes Full Zoukable →</a>`;
 gate.scrollIntoView({behavior:'smooth',block:'center'});
}
function apply(){queued=false;injectComparison();setBadges();injectBanner();markPremiumControls();rewriteFreeCopy();}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply);}
async function resolve(){
 try{
  if(!window.supabase||!window.GAB_ACCESS)return schedule();
  const cfg=window.GAB_PORTAL||{};
  db=window.supabase.createClient(cfg.supabaseUrl||URL,cfg.supabaseAnonKey||KEY);
  const auth=await db.auth.getUser();user=auth.data?.user||null;
  if(user)access=await window.GAB_ACCESS.resolve(db,'zoukable');
  window.ZOUKABLE_ACCESS=access;
 }catch(_){access=user?window.GAB_ACCESS?.fallback?.('zoukable')||null:null;}
 schedule();
}
document.addEventListener('click',event=>{
 if(!freeLive())return;
 const premium=event.target.closest('#diagnostic-start,[data-resume-diagnostic]');
 if(!premium)return;
 event.preventDefault();event.stopImmediatePropagation();showGate('diagnostic');
},true);
function start(){resolve();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});window.addEventListener('focus',resolve);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();