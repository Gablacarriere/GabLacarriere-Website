/* Coach-only live audit: canonical curriculum concepts ↔ published general Zoukable practice coverage. */
(() => {
'use strict';
const LAB=document.getElementById('app');
if(!LAB||!window.supabase||!window.GAB_PORTAL)return;
const cfg=window.GAB_PORTAL;
const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
let installed=false,loading=false,lastSignature='';

function loadScript(src){return new Promise((resolve,reject)=>{const existing=[...document.scripts].find(s=>s.src&&new URL(s.src,location.href).pathname===src);if(existing){if(existing.dataset.coverageReady==='1'||src==='/zouk-map-data.js'&&window.ZOUK_ATLAS||src==='/atlas-curriculum-v2.js'&&window.ATLAS_CURRICULUM_V2||src==='/curriculum-registry.js'&&window.GAB_CURRICULUM||src==='/curriculum-links.js'&&window.GAB_CURRICULUM_LINKS)return resolve();existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}const s=document.createElement('script');s.src=src;s.defer=true;s.onload=()=>{s.dataset.coverageReady='1';resolve();};s.onerror=reject;document.head.appendChild(s);});}
async function ensureCurriculum(){
 if(window.GAB_CURRICULUM&&window.GAB_CURRICULUM_LINKS)return;
 await loadScript('/zouk-map-data.js');
 await loadScript('/atlas-foundation-extension.js');
 await loadScript('/atlas-curriculum-v2.js');
 await loadScript('/curriculum-registry.js');
 await loadScript('/curriculum-links.js');
}
function installStyle(){if(document.getElementById('coverage-audit-style'))return;const s=document.createElement('style');s.id='coverage-audit-style';s.textContent=`
#coverageAudit{background:#0b1119}.coverageSummary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}.coverageStat{padding:14px;border:1px solid #ffffff1d;border-radius:14px;background:#101721}.coverageStat strong{font-size:1.55rem;display:block}.coverageStat span{color:#aeb6c2;font-size:.8rem}.coverageFamilies{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.coverageFamily{border:1px solid #ffffff1d;border-radius:16px;background:#0e141d;overflow:hidden}.coverageFamily summary{cursor:pointer;padding:15px;font-weight:850;display:flex;justify-content:space-between;gap:10px}.coverageFamilyBody{padding:0 15px 15px}.coverageRow{display:grid;grid-template-columns:minmax(170px,1.5fr) minmax(90px,.65fr) minmax(90px,.65fr);gap:10px;align-items:center;border-top:1px solid #ffffff12;padding:10px 0}.coverageRow small{color:#aeb6c2}.coverageBadge{display:inline-flex;width:max-content;padding:4px 7px;border-radius:999px;font-size:.7rem;font-weight:850;border:1px solid #ffffff24}.coverageBadge.strong{background:#183525;color:#c7f8d2}.coverageBadge.usable{background:#182b3d;color:#bfe5ff}.coverageBadge.thin{background:#3a311c;color:#ffe39a}.coverageBadge.gap{background:#3c2020;color:#ffc1b8}.coverageBadge.protocol{background:#2c2340;color:#ddc8ff}.coverageBadge.lens{background:#252a31;color:#d1d8e1}.coveragePriority{margin-top:18px}.coveragePriority ol{padding-left:20px}.coveragePriority li{margin:7px 0}.coverageLegend{color:#aeb6c2;font-size:.83rem}.coverageActions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.coverageActions button{background:#f2dfc5;color:#10141a}.coverageBar{height:7px;background:#ffffff12;border-radius:999px;overflow:hidden;margin-top:7px}.coverageBar>span{display:block;height:100%;background:#7dd8ff}.coverageFamilyName small{display:block;color:#aeb6c2;font-weight:500;margin-top:3px}@media(max-width:780px){.coverageSummary{grid-template-columns:repeat(2,1fr)}.coverageFamilies{grid-template-columns:1fr}.coverageRow{grid-template-columns:1fr auto}.coverageRow .drillCount{grid-column:1/-1}}
`;document.head.appendChild(s);}
function insertShell(){
 if(document.getElementById('coverageAudit'))return;
 const library=document.getElementById('library');if(!library)return;
 const sec=document.createElement('section');sec.className='sec';sec.id='coverageAudit';sec.innerHTML=`<div class="w"><div class="sectionIntro"><div><div class="kicker">Curriculum health</div><h2>Live drill coverage audit</h2><p class="lede">Checks all canonical curriculum concepts against the published general Zoukable library. A linked skill means relevant practice exists; it does not claim that a named pattern has a dedicated pattern-specific drill.</p></div><div class="resultCount" id="coverageUpdated">Loading…</div></div><div id="coverageContent" class="empty">Reading the curriculum and drill library…</div></div>`;
 library.parentNode.insertBefore(sec,library);
}
function drillIdsForSkill(skill,drills){return new Set(drills.filter(d=>d.primary_skill_id===skill.id||(Array.isArray(d.secondary_skills)&&d.secondary_skills.includes(skill.id))).map(d=>d.id));}
function statusFor(concept,count,hasBridge){
 if(concept.kind==='learning'&&!hasBridge)return {key:'protocol',label:'Practice protocol'};
 if(concept.kind==='lens'&&!hasBridge)return {key:'lens',label:'Concept lens'};
 if(!hasBridge)return {key:'gap',label:'No drill bridge'};
 if(count>=4)return {key:'strong',label:'Strong'};
 if(count>=2)return {key:'usable',label:'Usable'};
 if(count===1)return {key:'thin',label:'Thin'};
 return {key:'gap',label:'Empty bridge'};
}
function conceptCoverage(CURR,LINKS,skills,drills){
 const skillBySlug=Object.fromEntries(skills.map(s=>[s.slug,s]));
 return CURR.concepts.map(concept=>{
  const links=LINKS.forConcept(concept.id)||[],skillSlugs=[...new Set(links.map(x=>x.skill))],ids=new Set();
  for(const slug of skillSlugs){const skill=skillBySlug[slug];if(!skill)continue;for(const id of drillIdsForSkill(skill,drills))ids.add(id);}
  const status=statusFor(concept,ids.size,skillSlugs.length>0);
  return {...concept,skillSlugs,drillCount:ids.size,status};
 });
}
function priorityRows(rows){
 const candidates=rows.filter(r=>r.status.key==='gap'||r.status.key==='thin').map(r=>{
  let score=(6-r.tier)*3;
  if(r.status.key==='gap')score+=8;else score+=4;
  if(r.kind==='concept')score+=3;
  if(r.kind==='pattern')score+=2;
  if(r.family==='space')score+=4;
  if(r.family==='body'||r.family==='partnering'||r.family==='rhythm')score+=2;
  return {...r,score};
 }).sort((a,b)=>b.score-a.score||a.tier-b.tier||a.name.localeCompare(b.name));
 return candidates.slice(0,12);
}
function renderAudit(CURR,LINKS,skills,drills){
 const rows=conceptCoverage(CURR,LINKS,skills,drills),strong=rows.filter(r=>r.status.key==='strong').length,usable=rows.filter(r=>['usable','thin'].includes(r.status.key)).length,gaps=rows.filter(r=>r.status.key==='gap').length,routed=rows.filter(r=>['protocol','lens'].includes(r.status.key)).length;
 const families=CURR.families.map(f=>{const items=rows.filter(r=>r.family===f.id),covered=items.filter(r=>['strong','usable','thin'].includes(r.status.key)).length;return {...f,items,covered};});
 const priorities=priorityRows(rows),mapped=rows.filter(r=>r.skillSlugs.length).length;
 const content=document.getElementById('coverageContent');if(!content)return;
 content.className='';
 content.innerHTML=`<div class="coverageSummary"><div class="coverageStat"><strong>${rows.length}</strong><span>canonical concepts</span></div><div class="coverageStat"><strong>${mapped}</strong><span>with explicit drill bridges</span></div><div class="coverageStat"><strong>${strong+usable}</strong><span>with published linked practice</span></div><div class="coverageStat"><strong>${gaps}</strong><span>unbridged / empty gaps</span></div></div><p class="coverageLegend"><strong>Strong</strong> = 4+ published related drills · <strong>Usable</strong> = 2–3 · <strong>Thin</strong> = 1 · <strong>No drill bridge</strong> = no explicit curriculum→practice mapping. Learning protocols and analytical lenses are routed separately instead of being treated automatically as missing movement drills.</p><div class="coverageActions"><button type="button" id="copyCoveragePriorities">Copy top gap list</button><a class="btn ghost" href="/session-planner/">Open Session Planner ↗</a></div><div class="coverageFamilies">${families.map(f=>`<details class="coverageFamily" ${f.items.some(x=>x.status.key==='gap')?'open':''}><summary><span class="coverageFamilyName">${esc(f.name)}<small>${f.covered}/${f.items.length} concepts have linked published practice</small></span><span>${Math.round(100*f.covered/Math.max(1,f.items.length))}%</span></summary><div class="coverageFamilyBody"><div class="coverageBar"><span style="width:${100*f.covered/Math.max(1,f.items.length)}%"></span></div>${f.items.map(r=>`<div class="coverageRow"><div><strong>${esc(r.name)}</strong><small>Depth ${r.tier} · ${esc(r.kind)}${r.skillSlugs.length?` · ${r.skillSlugs.map(esc).join(', ')}`:''}</small></div><span class="coverageBadge ${r.status.key}">${esc(r.status.label)}</span><small class="drillCount">${r.drillCount} published related drill${r.drillCount===1?'':'s'}</small></div>`).join('')}</div></details>`).join('')}</div><div class="card coveragePriority"><h3>Highest-priority practice gaps</h3><p class="note">Prioritized by curriculum depth, missing/thin coverage and foundational leverage. This is a build queue, not a claim that every concept needs its own drill.</p><ol>${priorities.map(r=>`<li><strong>${esc(r.name)}</strong> · ${esc(CURR.familyFor(r.id)?.name||r.family)} · depth ${r.tier} · ${esc(r.status.label)}</li>`).join('')}</ol><p class="note">${routed} concepts are learning protocols or analytical lenses and are intentionally not counted as ordinary movement-drill gaps.</p></div>`;
 document.getElementById('coverageUpdated').textContent=`${drills.length} published general drills · live`;
 const copy=document.getElementById('copyCoveragePriorities');if(copy)copy.onclick=async()=>{const text='Zoukable curriculum coverage priorities:\n'+priorities.map((r,i)=>`${i+1}. ${r.name} — ${CURR.familyFor(r.id)?.name||r.family} — ${r.status.label}`).join('\n');try{await navigator.clipboard.writeText(text);copy.textContent='Copied';setTimeout(()=>copy.textContent='Copy top gap list',1200);}catch{}};
 lastSignature=`${rows.length}:${mapped}:${drills.length}:${gaps}`;
}
async function refresh(){
 if(loading)return;loading=true;
 try{
  installStyle();insertShell();await ensureCurriculum();
  const session=(await sb.auth.getSession()).data.session;if(!session){document.getElementById('coverageContent')?.replaceChildren(document.createTextNode('Sign in to run the coverage audit.'));return;}
  const profile=await sb.from('profiles').select('role,email').eq('id',session.user.id).maybeSingle();if(profile.error||profile.data?.role!=='coach'){document.getElementById('coverageContent')?.replaceChildren(document.createTextNode('Coach access is required for the coverage audit.'));return;}
  const [skillResult,drillResult]=await Promise.all([
   sb.from('zoukable_skills').select('id,slug,name'),
   sb.from('zoukable_drills').select('id,primary_skill_id,secondary_skills,status,assigned_to').eq('status','published').is('assigned_to',null)
  ]);
  if(skillResult.error)throw skillResult.error;if(drillResult.error)throw drillResult.error;
  renderAudit(window.GAB_CURRICULUM,window.GAB_CURRICULUM_LINKS,skillResult.data||[],drillResult.data||[]);
 }catch(error){const out=document.getElementById('coverageContent');if(out){out.className='empty';out.textContent='Coverage audit could not load. The curriculum and drill library were not changed.';}console.warn('Coverage audit',error);}finally{loading=false;}
}
function boot(){if(installed)return;installed=true;refresh();sb.auth.onAuthStateChange(event=>{if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED')setTimeout(refresh,0);});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
