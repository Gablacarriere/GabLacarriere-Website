(() => {
'use strict';
if(!/^\/teaching-lab\/?$/.test(location.pathname)||!window.supabase||!window.GAB_PORTAL)return;
const db=window.supabase.createClient(window.GAB_PORTAL.supabaseUrl,window.GAB_PORTAL.supabaseAnonKey);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
let rows=[],busy=false;
async function load(){if(busy)return;busy=true;try{const user=(await db.auth.getUser()).data.user;if(!user)return;const q=await db.from('teaching_evidence').select('id,planner_session_id,source,class_date,title,intended_learning,observed_evidence,transferred,breakdown,next_change,confidence,created_at').eq('owner_id',user.id).order('class_date',{ascending:false}).order('created_at',{ascending:false}).limit(200);if(q.error)return;rows=q.data||[];render()}finally{busy=false}}
function render(){const root=document.getElementById('reflectionList');if(!root)return;root.innerHTML=rows.length?rows.map(r=>`<div class="reflection" data-synced-evidence="${esc(r.id)}"><small>${esc(r.class_date)} · ${esc(r.title||'Teaching reflection')} · ${esc(r.confidence||'—')}/5</small><p><b>Intended:</b> ${esc(r.intended_learning||'Not recorded')}</p><p><b>Observed:</b> ${esc(r.observed_evidence||'Not recorded')}</p><p><b>Transferred:</b> ${esc(r.transferred||'Not recorded')}</p><p><b>Still broke down:</b> ${esc(r.breakdown||'Not recorded')}</p><p><b>Next change:</b> ${esc(r.next_change||'Not recorded')}</p>${r.planner_session_id?`<p><a href="/session-planner/?session=${encodeURIComponent(r.planner_session_id)}">Open session ↗</a></p>`:''}</div>`).join(''):'<div class="empty">No synced teaching evidence yet.</div>'}
window.GAB_TEACHING_EVIDENCE={reload:load};
setTimeout(load,1400);setTimeout(load,4000);
})();
