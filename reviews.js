(() => {
 'use strict';
 const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let client,offset=0,generation=0,loading=false;
 async function load(reset=true){
  if(!client||(!reset&&loading))return;
  const run=++generation;loading=true;$('reviewMore').disabled=true;$('reviewRetry').hidden=true;
  if(reset){offset=0;$('reviewList').replaceChildren();$('reviewMore').hidden=true;}
  $('reviewStatus').textContent='Loading student stories…';
  try{
   let q=client.from('student_testimonials').select('quote,credit,experience,published_at').order('published_at',{ascending:false}).order('id');
   if($('reviewExperience').value!=='all')q=q.eq('experience',$('reviewExperience').value);
   const r=await q.range(offset,offset+11);if(run!==generation)return;if(r.error)throw Error();
   $('reviewList').insertAdjacentHTML('beforeend',r.data.map(x=>`<article><p class="reviewLabel">${esc(x.experience)}</p><blockquote>“${esc(x.quote)}”</blockquote><p>— ${esc(x.credit)}</p></article>`).join(''));
   offset+=r.data.length;$('reviewMore').hidden=r.data.length<12;
   $('reviewStatus').textContent=offset?offset+' student stories loaded.':$('reviewExperience').value==='all'?'Our first student stories are on their way. Yours could help someone take their first step.':'No published stories for this experience yet. Choose another experience or share your own.';
  }catch(_){if(run===generation){$('reviewStatus').textContent='Stories could not load. Please try again.';$('reviewRetry').hidden=false;}}
  finally{if(run===generation){loading=false;$('reviewMore').disabled=false;}}
 }
 $('reviewExperience').onchange=()=>load();$('reviewMore').onclick=()=>load(false);$('reviewRetry').onclick=()=>load();
 try{client=supabase.createClient(GAB_PORTAL.supabaseUrl,GAB_PORTAL.supabaseAnonKey);load();}catch(_){$('reviewStatus').textContent='Stories are temporarily unavailable. You can still explore the classes or share feedback below.';}
})();
