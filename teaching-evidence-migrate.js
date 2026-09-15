(() => {
'use strict';
if(!/^\/teaching-lab\/?$/.test(location.pathname)||!window.supabase||!window.GAB_PORTAL)return;
const db=window.supabase.createClient(window.GAB_PORTAL.supabaseUrl,window.GAB_PORTAL.supabaseAnonKey),key='gabTeachingLabReflectionsV1',marker='gabTeachingLabReflectionsCloudMigratedV1';
async function migrate(){
 if(localStorage.getItem(marker)==='1')return;
 let old=[];try{old=JSON.parse(localStorage.getItem(key)||'[]')}catch{}
 const user=(await db.auth.getUser()).data.user;if(!user)return;
 if(!Array.isArray(old)||!old.length){localStorage.setItem(marker,'1');return;}
 const rows=old.slice(-100).map(r=>({owner_id:user.id,source:'teaching-lab-legacy',class_date:r.date||new Date().toISOString().slice(0,10),title:String(r.concept||'Legacy Teaching Lab reflection').slice(0,500),intended_learning:String(r.intended||''),observed_evidence:String(r.observed||r.worked||''),transferred:String(r.transferred||''),breakdown:String(r.breakdown||r.struggled||''),next_change:String(r.nextChange||''),confidence:Number(r.score)||null,metadata:{migrated_from:key}}));
 const q=await db.from('teaching_evidence').insert(rows);
 if(!q.error){localStorage.removeItem(key);localStorage.setItem(marker,'1');setTimeout(()=>window.GAB_TEACHING_EVIDENCE?.reload?.(),150)}
}
setTimeout(migrate,1800);
})();
