/* Zoukable Alien Bond — relationship progression from meaningful learning behavior. */
(() => {
'use strict';
const URL='https://lftguwmyagkehqmaxjig.supabase.co';
const KEY='sb_publishable_YzhfBB0z3emKU-rM8f_18A_Z0RUJUYt';
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let db=null,user=null,profile=null,identity=null,companion=null,levels=[],bond=null,unlocks=[],queue=[],dialog=null,loading=false,uiQueued=false,lastSig='',refreshTimer=null;

const VOICES={
  lumi:{2:'I know this rhythm now.',3:'You keep coming back. I trust that.',4:'Okay, now we can be a little silly.',5:'We have built something steady.',6:'Look at us. Same sky, same journey.'},
  bpmi:{2:'Pattern recognized. You are officially familiar.',3:'Signal stable. Trust level: real.',4:'Bond update: playful mode unlocked.',5:'You keep the beat even when it is quiet.',6:'Crew sync complete. Cosmic status achieved.'},
  nimi:{2:'I am getting used to your little routines.',3:'You came back again. I like that.',4:'I think we can relax around each other now.',5:'Slowly became deeply. That counts.',6:'We grew a whole constellation out of small steps.'},
  orbi:{2:'Your orbit feels familiar now.',3:'Trust is repetition with meaning.',4:'We can wander a little and still find our way back.',5:'This has become part of the journey.',6:'Two travelers, one long orbit.'},
  ziggy:{2:'Hey, I know you now.',3:'You actually follow through. I respect that.',4:'Nice. Playful mode is officially allowed.',5:'We have covered some distance together.',6:'That is a lot of sky behind us.'},
  miso:{2:'Oh. You are one of my people now.',3:'You keep showing up. That feels good.',4:'We can be weird together now, right?',5:'This one feels like home.',6:'Same crew. Same stars. Obviously.'},
  kiko:{2:'I recognize your patterns now.',3:'The details say you are consistent.',4:'You have earned the less-serious version of me.',5:'A lot of small things became one big thing.',6:'I noticed the whole journey.'},
  sprout:{2:'You feel familiar now.',3:'Trust grew quietly. That is usually how it happens.',4:'There is room for play now.',5:'We kept watering this.',6:'That is a lot of growth for two small travelers.'}
};

function css(){
 if(document.getElementById('bond-system-style'))return;
 const s=document.createElement('style');s.id='bond-system-style';s.textContent=`
 .bond-panel{margin-top:20px;padding:20px;border:1px solid #ffffff16;border-radius:24px;background:radial-gradient(circle at 92% 0,#b490ff18,transparent 28%),radial-gradient(circle at 5% 100%,#6de0dc12,transparent 30%),linear-gradient(145deg,#10192b,#0b1322);color:#f7f5ff}.bond-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap}.bond-kicker{font-size:.74rem;letter-spacing:.12em;text-transform:uppercase;font-weight:850;color:#9deaff}.bond-head h2{font-size:clamp(1.8rem,5vw,2.8rem);letter-spacing:-.035em;margin:4px 0 6px}.bond-muted{color:#aab8d0}.bond-badge{padding:10px 13px;border-radius:17px;border:1px solid #d6b8ff36;background:#d6b8ff0c;text-align:right}.bond-badge b{display:block;font-size:1.05rem}.bond-grid{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:14px;margin-top:16px}.bond-card{padding:15px;border:1px solid #ffffff12;border-radius:18px;background:#ffffff06}.bond-expression{display:flex;align-items:center;gap:13px}.bond-expression-orb{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;font-size:1.7rem;background:radial-gradient(circle at 35% 25%,#fff4cf,#c8a8ff 58%,#5f70cf);box-shadow:0 0 30px #a78cff28}.bond-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.bond-stat{padding:10px;border-radius:13px;background:#ffffff07;border:1px solid #ffffff0f}.bond-stat b{display:block;font-size:1.15rem}.bond-bar{height:10px;border-radius:999px;background:#ffffff12;overflow:hidden;margin:10px 0}.bond-bar span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#78e6ed,#b192ff,#f0d19d)}.bond-ladder{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;margin-top:14px}.bond-step{padding:10px 7px;border:1px solid #ffffff10;border-radius:14px;background:#ffffff05;text-align:center;opacity:.45}.bond-step.unlocked{opacity:1}.bond-step.current{border-color:#aeefff;background:#143147}.bond-step .face{font-size:1.35rem}.bond-step strong{display:block;font-size:.75rem;margin-top:4px}.bond-step small{color:#98a7c1;font-size:.68rem}.bond-note{margin-top:12px;font-size:.8rem;color:#9dabc1}.bond-coach{padding:12px 14px;margin-top:12px;border-radius:14px;border:1px solid #ffe2aa29;background:#ffe2aa08;color:#e9dfc9}
 [data-bond-expression]{position:relative}[data-bond-expression] .bond-mood-dot{position:absolute;right:-2px;bottom:-2px;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#11192b;border:2px solid #8ce9ee;font-size:.65rem;z-index:5}.crew-art[data-bond-expression] .bond-mood-dot{right:18%;bottom:10%;width:28px;height:28px;font-size:.8rem}.bond-warm svg{filter:drop-shadow(0 0 9px #ffd8b252)!important}.bond-proud svg{filter:drop-shadow(0 0 12px #ffe7a45e)!important}.bond-playful svg{transform:rotate(-2deg)}.bond-soft-glow svg{filter:drop-shadow(0 0 18px #ba9cff77)!important}.bond-starry svg{filter:drop-shadow(0 0 22px #ffeaa078)!important}
 dialog.bond-dialog{width:min(620px,calc(100% - 28px));padding:0;border:1px solid #ffffff29;border-radius:28px;background:#09111f;color:#f8f6ff;box-shadow:0 34px 100px #000b;overflow:hidden}dialog.bond-dialog::backdrop{background:#02050be1;backdrop-filter:blur(6px)}.bond-scene{padding:30px;text-align:center;background:radial-gradient(circle at 50% 13%,#7057d14a,transparent 34%),radial-gradient(circle at 12% 83%,#2d949c3c,transparent 27%),linear-gradient(155deg,#101a30,#09111f 72%)}.bond-scene .bond-art{width:180px;height:180px;margin:14px auto;display:grid;place-items:center;position:relative}.bond-scene .bond-art svg{max-width:100%;max-height:100%}.bond-scene .bond-art .bond-ring{position:absolute;inset:8px;border:2px solid #c6abff55;border-radius:50%;box-shadow:0 0 30px #a98cff30}.bond-scene h2{font-size:clamp(2.3rem,7vw,3.8rem);letter-spacing:-.05em;line-height:.95;margin:8px 0}.bond-line{max-width:470px;margin:14px auto;padding:12px 14px;border:1px solid #ffffff17;border-radius:15px;background:#ffffff08}.bond-line strong{display:block;color:#c9f7ff}.bond-actions{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:18px}.bond-btn{border-radius:999px;padding:11px 17px;font:inherit;font-weight:900;cursor:pointer}.bond-btn.primary{border:0;background:linear-gradient(90deg,#7ce5ed,#b193ff,#f0d19b);color:#08111f}.bond-btn.secondary{border:1px solid #ffffff28;background:#ffffff08;color:#fff}.bond-unlock-detail{color:#bac6d9;max-width:470px;margin:0 auto}.bond-count{font-size:.75rem;color:#98a7c2;margin-top:10px}
 @media(max-width:900px){.bond-grid{grid-template-columns:1fr}.bond-ladder{grid-template-columns:repeat(3,1fr)}}@media(max-width:560px){.bond-stats{grid-template-columns:1fr}.bond-ladder{grid-template-columns:repeat(2,1fr)}.bond-panel{padding:16px}}
 @media(prefers-reduced-motion:no-preference){.bond-playful svg{animation:bond-bob 3.2s ease-in-out infinite}.bond-starry:after{content:'✦  ✧  ·';position:absolute;inset:auto 0 -8px;text-align:center;color:#ffe8a5;letter-spacing:.5rem;animation:bond-stars 2.8s ease-in-out infinite}@keyframes bond-bob{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-4px) rotate(2deg)}}@keyframes bond-stars{0%,100%{opacity:.4}50%{opacity:1}}.bond-scene .bond-art{animation:bond-pop .55s cubic-bezier(.2,.8,.2,1)}@keyframes bond-pop{0%{opacity:0;transform:scale(.72)}75%{transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}}
 `;document.head.appendChild(s);
}

const faceFor=e=>({curious:'?',warm:'♡',proud:'★',playful:'✦','soft-glow':'☾',starry:'✧'}[e]||'·');
const levelFor=n=>levels.find(x=>Number(x.level)===Number(n))||levels[0]||null;
function nextLevel(){return levels.filter(x=>Number(x.threshold_points)>Number(bond?.bond_points||0)).sort((a,b)=>a.threshold_points-b.threshold_points)[0]||null;}
function expressionClass(e){return 'bond-'+String(e||'curious').replace(/[^a-z-]/g,'');}
function voiceFor(level){const id=identity?.companion_id||'lumi';return VOICES[id]?.[Number(level)]||'We know each other a little better now.';}
function avatarArt(){const a=document.getElementById('avatar');return a?.querySelector('svg')?a.innerHTML:'<div style="font-size:5rem">✦</div>';}

function applyExpression(){
 const l=levelFor(bond?.bond_level),expr=l?.expression||'curious',targets=[document.getElementById('avatar'),document.querySelector('.crew-page .crew-card:first-of-type .crew-art')].filter(Boolean);
 targets.forEach(el=>{el.dataset.bondExpression=expr;el.classList.remove('bond-curious','bond-warm','bond-proud','bond-playful','bond-soft-glow','bond-starry');el.classList.add(expressionClass(expr));let dot=el.querySelector(':scope > .bond-mood-dot');if(!dot){dot=document.createElement('span');dot.className='bond-mood-dot';el.appendChild(dot);}dot.textContent=faceFor(expr);dot.title=`Bond: ${l?.name||'First Contact'} · ${expr.replace('-',' ')}`;});
}

function panelHTML(){
 const l=levelFor(bond?.bond_level)||levels[0],next=nextLevel(),points=Number(bond?.bond_points||0),floor=Number(l?.threshold_points||0),ceil=Number(next?.threshold_points||Math.max(floor+20,points+1)),pct=next?Math.max(0,Math.min(100,(points-floor)/(ceil-floor)*100)):100;
 const name=companion?.name||'Your companion';
 return `<section id="bond-panel" class="bond-panel"><div class="bond-head"><div><div class="bond-kicker">ALIEN BOND</div><h2>${esc(name)} · ${esc(l?.name||'First Contact')}</h2><p class="bond-muted">Bond grows from meaningful return behavior—not from repeating more drills in one sitting.</p></div><div class="bond-badge"><b>${points} Bond</b><span>${next?`${Math.max(0,ceil-points)} to ${esc(next.name)}`:'Highest bond reached'}</span></div></div><div class="bond-grid"><div class="bond-card"><div class="bond-expression"><div class="bond-expression-orb">${faceFor(l?.expression)}</div><div><div class="bond-kicker">CURRENT EXPRESSION</div><h3 style="margin:3px 0">${esc(String(l?.expression||'curious').replace('-',' '))}</h3><p class="bond-muted" style="margin:0">${esc(l?.description||'Your companion is getting to know you.')}</p></div></div><div class="bond-stats"><div class="bond-stat"><b>${Number(bond?.practice_days||0)}</b><span>practice days</span></div><div class="bond-stat"><b>${Number(bond?.quest_completions||0)}</b><span>missions</span></div><div class="bond-stat"><b>${Number(bond?.social_transfer_days||0)}</b><span>social-transfer days</span></div></div></div><div class="bond-card"><div class="bond-kicker">RELATIONSHIP PATH</div><div class="bond-bar"><span style="width:${pct}%"></span></div><p class="bond-muted">${next?`${points} / ${ceil} Bond toward ${esc(next.name)}.`:'You reached the current end of the Bond path.'}</p><div class="bond-ladder">${levels.map(x=>{const unlocked=Number(x.level)<=Number(bond?.bond_level||1),current=Number(x.level)===Number(bond?.bond_level||1);return `<div class="bond-step ${unlocked?'unlocked':''} ${current?'current':''}"><div class="face">${unlocked?faceFor(x.expression):'?'}</div><strong>${esc(x.name)}</strong><small>${x.threshold_points} Bond</small></div>`;}).join('')}</div></div></div><p class="bond-note">One point per distinct practice day + one per completed weekly mission + one per day with intentional/natural social transfer. Bond never changes mastery, recommendations, clearance, or XP.</p>${profile?.role==='coach'?'<div class="bond-coach">Coach view: this card shows your account data, but the system is designed as a student relationship layer. It has no instructional authority.</div>':''}</section>`;
}

function injectPanel(){
 const existing=document.getElementById('bond-panel');
 if(document.body.dataset.chapter!=='crew'){existing?.remove();return;}
 const hero=document.querySelector('.crew-page .crew-hero');if(!hero||!bond)return;
 const sig=[bond.bond_points,bond.bond_level,bond.practice_days,bond.quest_completions,bond.social_transfer_days,identity?.companion_id].join('|');
 if(existing&&lastSig===sig){applyExpression();return;}
 const wrap=document.createElement('div');wrap.innerHTML=panelHTML();const node=wrap.firstElementChild;if(existing)existing.replaceWith(node);else hero.insertAdjacentElement('afterend',node);lastSig=sig;applyExpression();
}
function scheduleUI(){if(uiQueued)return;uiQueued=true;requestAnimationFrame(()=>{uiQueued=false;injectPanel();applyExpression();});}

function ensureDialog(){if(dialog)return dialog;dialog=document.createElement('dialog');dialog.className='bond-dialog';dialog.id='bond-unlock-dialog';document.body.appendChild(dialog);dialog.addEventListener('cancel',e=>e.preventDefault());return dialog;}
async function ack(row){try{await db.rpc('zoukable_ack_bond_unlock',{p_level:Number(row.bond_level)});}catch(_){} }
function showNext(){
 const dlg=ensureDialog();if(dlg.open||!queue.length)return;const row=queue.shift(),l=levelFor(row.bond_level);if(!l){ack(row);return showNext();}const name=companion?.name||'Your companion',art=avatarArt();dlg.innerHTML=`<div class="bond-scene"><div class="bond-kicker">BOND DEEPENED</div><div class="bond-art ${expressionClass(l.expression)}">${art}<span class="bond-ring"></span></div><h2>${esc(l.unlock_title)}</h2><p class="bond-unlock-detail">${esc(l.unlock_detail)}</p><div class="bond-line"><strong>${esc(name)}</strong>${esc(voiceFor(l.level))}</div><div class="bond-actions"><button class="bond-btn primary" data-bond-close>Keep going</button><a class="bond-btn secondary" href="/zoukable/?page=crew">See our Bond →</a></div><div class="bond-count">Bond level ${l.level} · ${esc(l.name)}${queue.length?` · ${queue.length} more moment${queue.length===1?'':'s'} waiting`:''}</div></div>`;
 const close=async()=>{await ack(row);dlg.close();setTimeout(showNext,180);};dlg.querySelector('[data-bond-close]').onclick=close;dlg.querySelector('a').onclick=async()=>{await ack(row);dlg.close();};dlg.showModal();
}

async function refresh(){
 if(loading)return;loading=true;try{
  if(!window.supabase)return;db=db||window.supabase.createClient(URL,KEY);const auth=await db.auth.getUser();user=auth.data?.user||null;if(!user)return;
  const p=await db.from('profiles').select('role').eq('id',user.id).single();profile=p.data;await db.rpc('zoukable_refresh_bond');
  const [lR,bR,uR,iR,cR]=await Promise.all([
   db.from('zoukable_bond_levels').select('*').eq('active',true).order('sort_order'),
   db.from('zoukable_bond_progress').select('*').eq('user_id',user.id).maybeSingle(),
   db.from('zoukable_bond_unlocks').select('*').eq('user_id',user.id).order('bond_level'),
   db.from('zoukable_identities').select('companion_id').eq('user_id',user.id).maybeSingle(),
   db.from('zoukable_companions').select('id,name')
  ]);
  levels=lR.data||[];bond=bR.data||null;unlocks=uR.data||[];identity=iR.data||null;companion=(cR.data||[]).find(x=>x.id===identity?.companion_id)||null;queue=unlocks.filter(x=>!x.seen_at&&Number(x.bond_level)>1);scheduleUI();setTimeout(showNext,700);
 }catch(e){console.warn('Alien Bond',e);}finally{loading=false;}
}
function noticeWatch(){const n=document.getElementById('notice');if(!n)return;new MutationObserver(()=>{const t=(n.textContent||'').toLowerCase();if(t.includes('saved')||t.includes('complete')){clearTimeout(refreshTimer);refreshTimer=setTimeout(refresh,650);}}).observe(n,{childList:true,characterData:true,subtree:true,attributes:true});}
function start(){css();refresh();noticeWatch();new MutationObserver(scheduleUI).observe(document.getElementById('view')||document.body,{childList:true,subtree:true});window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
