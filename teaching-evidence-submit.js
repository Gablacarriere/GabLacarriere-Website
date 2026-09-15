(() => {
'use strict';
if(!/^\/teaching-lab\/?$/.test(location.pathname)||!window.supabase||!window.GAB_PORTAL)return;
const db=window.supabase.createClient(window.GAB_PORTAL.supabaseUrl,window.GAB_PORTAL.supabaseAnonKey);
function text(id){return document.getElementById(id)?.value?.trim()||''}
const form=document.getElementById('reflectionForm');if(!form)return;
let status=document.getElementById('teachingEvidenceCloudStatus');if(!status){status=document.createElement('p');status.id='teachingEvidenceCloudStatus';status.className='note';status.setAttribute('role','status');form.append(status)}
form.addEventListener('submit',async()=>{const concept=document.getElementById('reflectionConcept'),selected=concept?.selectedOptions?.[0];const snapshot={source:'teaching-lab',class_date:new Date().toISOString().slice(0,10),title:String(selected?.textContent||'Teaching Lab reflection').slice(0,500),concept_id:concept?.value||null,intended_learning:text('intendedLearning'),observed_evidence:text('worked'),transferred:text('transferred'),breakdown:text('struggled'),next_change:text('nextChange'),confidence:Number(document.getElementById('confidence')?.value)||null,metadata:{source_view:'teaching-lab'}};const user=(await db.auth.getUser()).data.user;if(!user){status.textContent='Sign in to save synced evidence.';return}status.textContent='Saving synced evidence…';const q=await db.from('teaching_evidence').insert({owner_id:user.id,...snapshot});if(q.error){status.textContent=q.error.message||'Could not save synced evidence.';return}status.textContent='Saved to your private teaching evidence ledger.';setTimeout(()=>window.GAB_TEACHING_EVIDENCE?.reload?.(),150)})
})();
