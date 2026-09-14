/* Final polish for Zoukable cosmic identity: safe dialog refresh + coach-only onboarding preview. */
(() => {
'use strict';
const URL='https://lftguwmyagkehqmaxjig.supabase.co';
const KEY='sb_publishable_YzhfBB0z3emKU-rM8f_18A_Z0RUJUYt';
const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let db=null,user=null,profile=null,companions=[],ships=[],previewDialog=null,previewStep=1,previewCompanion=null,previewShip=null,buttonMounted=false;

/* cosmic-identity.js rebuilds an already-open customizer after an equip.
   Browsers normally throw when showModal() is called on an open dialog.
   For our own cosmic dialogs only, treat that refresh as a no-op. */
const nativeShowModal=window.HTMLDialogElement?.prototype?.showModal;
if(nativeShowModal&&!window.__ZOUKABLE_COSMIC_DIALOG_GUARD){
 window.__ZOUKABLE_COSMIC_DIALOG_GUARD=true;
 window.HTMLDialogElement.prototype.showModal=function(){
  if(this.classList?.contains('cosmic-dialog')&&this.open)return;
  return nativeShowModal.call(this);
 };
}

function style(){
 if(document.getElementById('cosmic-preview-style'))return;
 const s=document.createElement('style');s.id='cosmic-preview-style';s.textContent=`
 .cosmic-preview-launch{display:inline-flex;align-items:center;gap:7px;padding:8px 12px;border-radius:999px;border:1px solid #9eefff44;background:#13283a;color:#d9f8ff;font:inherit;font-size:.82rem;font-weight:800;cursor:pointer;margin-left:8px}.cosmic-preview-launch:hover{border-color:#9eefff}
 .cosmic-preview-dialog{width:min(940px,calc(100% - 28px));max-height:92vh;padding:0;border:1px solid #ffffff27;border-radius:26px;background:#091221;color:#f8f5ff;box-shadow:0 35px 100px #0009;overflow:auto}.cosmic-preview-dialog::backdrop{background:#02050bd9;backdrop-filter:blur(5px)}.preview-shell{padding:26px;background:radial-gradient(circle at 15% 5%,#25366377,transparent 31%),radial-gradient(circle at 90% 10%,#19546b55,transparent 29%),linear-gradient(155deg,#0e192d,#09111f 70%);min-height:510px}.preview-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.preview-head h2{font-size:clamp(2rem,5vw,3.4rem);margin:5px 0 8px}.preview-kicker{font-size:.74rem;letter-spacing:.12em;text-transform:uppercase;font-weight:850;color:#9cecff}.preview-note{padding:8px 11px;border:1px solid #ffe0a830;background:#ffe0a80c;color:#f9e7bc;border-radius:12px;font-size:.84rem}.preview-close{width:42px;height:42px;border-radius:50%;border:1px solid #ffffff25;background:#ffffff09;color:#fff;font-size:1.2rem;cursor:pointer}.preview-center{text-align:center;max-width:650px;margin:24px auto}.preview-alien{width:min(230px,65vw);height:230px;margin:18px auto;display:grid;place-items:center}.preview-traits{display:flex;gap:7px;flex-wrap:wrap;justify-content:center;margin:12px 0}.preview-traits span{padding:6px 9px;border:1px solid #ffffff20;background:#ffffff08;border-radius:999px;font-size:.75rem}.preview-actions{display:flex;gap:9px;justify-content:center;flex-wrap:wrap;margin-top:20px}.preview-primary,.preview-secondary{border-radius:999px;padding:11px 16px;font:inherit;font-weight:850;cursor:pointer}.preview-primary{border:0;background:linear-gradient(90deg,#7de5ef,#b392ff,#f1d09b);color:#0b1120}.preview-secondary{border:1px solid #ffffff28;background:#ffffff08;color:#fff}.preview-ships{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin:20px 0}.preview-ship{padding:13px;border:1px solid #ffffff19;background:#ffffff07;border-radius:18px;color:#fff;text-align:left;cursor:pointer}.preview-ship.selected{border-color:#9eefff;background:#14334a;box-shadow:0 0 0 2px #9eefff20}.preview-ship-icon{height:105px;display:grid;place-items:center}.preview-ship-icon svg{max-width:100%;max-height:100%}.preview-ship strong{display:block;font-size:1.06rem}.preview-ship p{margin:4px 0;color:#aebbd4;font-size:.82rem}.preview-summary{display:grid;grid-template-columns:1fr 1.2fr;gap:18px;align-items:center;margin:22px auto;max-width:650px}.preview-summary-card{padding:15px;border:1px solid #ffffff18;background:#ffffff07;border-radius:20px;text-align:center}.preview-summary-card svg{height:160px;max-width:100%}.preview-xp{height:11px;border-radius:999px;background:#ffffff12;overflow:hidden;margin:9px 0}.preview-xp span{display:block;width:0;height:100%;background:linear-gradient(90deg,#7de5ef,#b392ff,#f1d09b)}
 @media(max-width:760px){.preview-ships{grid-template-columns:1fr 1fr}.preview-summary{grid-template-columns:1fr}.cosmic-preview-launch{margin:8px 0 0}}
 `;document.head.appendChild(s);
}

function palette(id){
 const p={lumi:['#fff0ca','#b89cff','#7897ff'],bpmi:['#e8f7ff','#56ddec','#1a385b'],nimi:['#b8efcd','#8bd6aa','#d7a8e6'],orbi:['#789cff','#b490ff','#24376b'],ziggy:['#ffd0a0','#ff9478','#e67569'],miso:['#f5d4e8','#b17cca','#8d68b0'],kiko:['#bfe3d0','#67bcae','#d4b57a'],sprout:['#dfffc9','#93d977','#6aa768']};return p[id]||p.lumi;
}
function mascotSVG(c){
 const [a,b,d]=palette(c.id),ears=['nimi','kiko'].includes(c.id),round=['orbi','miso','sprout'].includes(c.id),robot=c.id==='bpmi';
 return `<svg viewBox="0 0 220 220" role="img" aria-label="${esc(c.name)}"><defs><radialGradient id="pm-${esc(c.id)}"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs><ellipse cx="110" cy="194" rx="62" ry="8" fill="${b}" opacity=".25"/>${ears?`<path d="M72 91 45 34 98 70M148 91l27-57-53 36" fill="${b}" stroke="${a}" stroke-width="5"/>`:''}${robot?`<rect x="53" y="65" width="114" height="101" rx="49" fill="${a}"/><rect x="70" y="82" width="80" height="49" rx="24" fill="${d}"/>`:`<${round?'circle':'ellipse'} cx="110" cy="${round?112:108}" ${round?'r="58"':'rx="51" ry="61"'} fill="url(#pm-${esc(c.id)})"/>`}<circle cx="89" cy="106" r="11" fill="#182044"/><circle cx="131" cy="106" r="11" fill="#182044"/><circle cx="86" cy="102" r="3" fill="#fff"/><circle cx="128" cy="102" r="3" fill="#fff"/><path d="M101 129q9 8 18 0" fill="none" stroke="${robot?'#74efff':'#6c6687'}" stroke-width="4" stroke-linecap="round"/>${c.id==='lumi'?'<ellipse cx="110" cy="47" rx="52" ry="12" fill="none" stroke="#c9a4ff" stroke-width="6"/>':''}${c.id==='sprout'?'<path d="M110 55q-5-28 22-34-2 26-22 34" fill="#8dd877"/>':''}</svg>`;
}
function shipSVG(s){
 const p=s.id==='orbit'?['#8faeff','#ae8eff']:s.id==='zephyr'?['#ffd19a','#ff9478']:s.id==='verdant'?['#d7f6a6','#83ce78']:['#f6e3bd','#a58cff'];
 return `<svg viewBox="0 0 260 170" role="img" aria-label="${esc(s.name)}"><defs><linearGradient id="ps-${esc(s.id)}" x1="0" x2="1"><stop stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient></defs><ellipse cx="132" cy="150" rx="84" ry="7" fill="${p[1]}" opacity=".18"/>${s.id==='zephyr'?'<path d="M86 89 42 52l13 44-38 12 62 13M174 89l45-35-14 43 37 13-63 11" fill="#ff9c80" opacity=".6"/>':''}${s.id==='verdant'?'<path d="M96 73Q72 42 53 57q15 27 43 29M164 72q25-28 43-12-17 24-43 27" fill="#8cd67d"/>':''}<path d="M54 104Q78 58 135 58q58 1 75 42-25 40-78 44-53 1-78-40z" fill="url(#ps-${esc(s.id)})"/><ellipse cx="139" cy="87" rx="51" ry="29" fill="#101b3a"/><g fill="#fff" opacity=".8"><circle cx="121" cy="81" r="2"/><circle cx="152" cy="74" r="2"/></g>${s.id==='orbit'?'<ellipse cx="134" cy="101" rx="92" ry="29" fill="none" stroke="#9ba9ff" stroke-width="4" opacity=".65" transform="rotate(-9 134 101)"/>':''}</svg>`;
}

function ensureDialog(){if(previewDialog)return previewDialog;previewDialog=document.createElement('dialog');previewDialog.className='cosmic-preview-dialog';previewDialog.id='coach-cosmic-preview';document.body.appendChild(previewDialog);previewDialog.addEventListener('cancel',()=>{});return previewDialog;}
function randomCompanion(){return companions[Math.floor(Math.random()*companions.length)]||companions[0];}
function renderPreview(){
 const dlg=ensureDialog();
 if(!previewCompanion)previewCompanion=randomCompanion();
 const c=previewCompanion;
 let body='';
 if(previewStep===1)body=`<div class="preview-center"><div class="preview-kicker">STEP 1 · RANDOM COMPANION</div><h2>Your companion has chosen you.</h2><div class="preview-alien">${mascotSVG(c)}</div><h3>${esc(c.name)}</h3><p>${esc(c.tagline)} This is a coach preview: no account data will be changed.</p><div class="preview-traits">${(c.traits||[]).map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="preview-actions"><button class="preview-primary" data-preview-next>Meet my companion →</button><button class="preview-secondary" data-reroll>Preview another random result</button></div></div>`;
 if(previewStep===2)body=`<div><div class="preview-kicker">STEP 2 · CHOOSE YOUR SHIP</div><h2>Choose once. Keep it.</h2><p style="color:#aebbd4">Students choose one base ship permanently. This preview never saves the choice.</p><div class="preview-ships">${ships.map(s=>`<button class="preview-ship ${previewShip?.id===s.id?'selected':''}" data-preview-ship="${esc(s.id)}"> <div class="preview-ship-icon">${shipSVG(s)}</div><strong>${esc(s.name)}</strong><p>${esc(s.tagline)}</p></button>`).join('')}</div><div class="preview-actions"><button class="preview-primary" data-preview-next ${previewShip?'':'disabled'}>Choose this ship →</button><button class="preview-secondary" data-preview-back>← Back</button></div></div>`;
 if(previewStep===3){const s=previewShip||ships[0];body=`<div class="preview-center"><div class="preview-kicker">STEP 3 · CREW READY</div><h2>${esc(c.name)} + ${esc(s.name)}</h2><div class="preview-summary"><div class="preview-summary-card">${mascotSVG(c)}<strong>${esc(c.name)}</strong></div><div class="preview-summary-card">${shipSVG(s)}<strong>${esc(s.name)} · Level 1</strong><div class="preview-xp"><span></span></div><small>0 / 100 XP · practice unlocks cosmetics</small></div></div><p>This is what a new student sees before entering their first practice. Companion is random; ship choice becomes permanent; XP only changes aesthetics.</p><div class="preview-actions"><button class="preview-primary" data-preview-finish>Close preview</button><button class="preview-secondary" data-preview-restart>Run again</button></div></div>`;}
 dlg.innerHTML=`<div class="preview-shell"><div class="preview-head"><div><div class="preview-kicker">COACH PREVIEW · NOT SAVED</div><div class="preview-note">This sandbox never changes your companion, ship, XP, or student records.</div></div><button class="preview-close" aria-label="Close preview">×</button></div>${body}</div>`;
 dlg.querySelector('.preview-close').onclick=()=>dlg.close();
 dlg.querySelector('[data-reroll]')?.addEventListener('click',()=>{previewCompanion=randomCompanion();renderPreview();});
 dlg.querySelector('[data-preview-back]')?.addEventListener('click',()=>{previewStep=Math.max(1,previewStep-1);renderPreview();});
 dlg.querySelectorAll('[data-preview-ship]').forEach(b=>b.onclick=()=>{previewShip=ships.find(s=>s.id===b.dataset.previewShip)||null;renderPreview();});
 dlg.querySelector('[data-preview-next]')?.addEventListener('click',()=>{if(previewStep===2&&!previewShip)return;previewStep++;renderPreview();});
 dlg.querySelector('[data-preview-finish]')?.addEventListener('click',()=>dlg.close());
 dlg.querySelector('[data-preview-restart]')?.addEventListener('click',()=>{previewStep=1;previewShip=null;previewCompanion=randomCompanion();renderPreview();});
}
function openPreview(){previewStep=1;previewShip=null;previewCompanion=randomCompanion();renderPreview();const dlg=ensureDialog();if(!dlg.open)dlg.showModal();}

function mountButton(){
 if(profile?.role!=='coach'||buttonMounted)return;
 const target=document.querySelector('.topbar .account')||document.querySelector('.topbar');if(!target)return;
 const b=document.createElement('button');b.className='cosmic-preview-launch';b.type='button';b.innerHTML='✦ Preview student onboarding';b.onclick=openPreview;target.prepend(b);buttonMounted=true;
 const params=new URLSearchParams(location.search);if(params.get('preview')==='onboarding')setTimeout(openPreview,150);
}
async function load(){
 try{if(!window.supabase)return;db=db||window.supabase.createClient(URL,KEY);const auth=await db.auth.getUser();user=auth.data?.user;if(!user)return;const [p,c,s]=await Promise.all([db.from('profiles').select('role').eq('id',user.id).single(),db.from('zoukable_companions').select('*').order('sort_order'),db.from('zoukable_ships').select('*').order('sort_order')]);profile=p.data;companions=c.data||[];ships=s.data||[];mountButton();}catch(e){console.warn('Coach onboarding preview',e);}
}
function start(){style();load();new MutationObserver(mountButton).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
