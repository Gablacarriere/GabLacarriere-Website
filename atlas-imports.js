(() => {
 let selectedId=null;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const selected=s=>location.hash==='#imports'&&s.viewer.role==='coach'?(s.imports||[]).find(d=>d.id===selectedId):null;
 function markup(s){
  if(s.viewer.role!=='coach')return '<div class="box"><h1>Coach access required</h1><p>Your saved lessons are in Sessions.</p><a class="primaryButton" href="#sessions">Open my sessions</a></div>';
  if(s.importsError)return '<div class="box"><h1>Review inbox unavailable</h1><p>Your saved map is still available. Refresh the saved map to try loading the inbox again.</p></div>';
  const draft=selected(s);
  if(draft){
   const student=s.students.find(p=>p.id===draft.student_id);
   if(!student)return '<div class="box"><h1>Student profile unavailable</h1><p>Refresh the saved map before reviewing this draft.</p></div>';
   return '<p><button id="backToImports" class="secondaryButton">← Review inbox</button></p><h1>Review before discovery</h1><p>Check the student, date, wording and concepts. Nothing reaches their map until you approve.</p><section class="box importSource"><p class="eyebrow">GRANOLA SOURCE · COACH ONLY</p><h2>'+esc(draft.source_title)+'</h2><p>'+esc(draft.lesson_date)+'</p><details><summary>Read the selected source excerpts</summary><p class="lessonText">'+esc(draft.source_excerpt)+'</p></details><h3>Why these concepts were suggested</h3><p class="lessonText">'+esc(draft.mapping_notes)+'</p><p>These excerpts stay in the coach inbox. Only your reviewed lesson summary, practice notes and concepts are shared with the selected student.</p></section>'+window.ATLAS_LIVE.form({...s,student}).replace('Record a lesson for','Review the lesson for');
  }
  const drafts=s.imports||[];
  return '<h1>Granola review inbox</h1><p>'+drafts.length+' drafts awaiting coach review. Imported notes do not change student maps until approved.</p><div class="box"><h2>From lesson notes to discoveries</h2><p>These drafts were imported through your connected Granola account. Ask in this conversation to bring in newer lessons; automatic background syncing is not enabled.</p></div>'+drafts.map(d=>'<article class="box liveLesson"><p class="eyebrow">'+esc(d.lesson_date)+' · PENDING REVIEW</p><h2>'+esc(d.source_title)+'</h2><p>Suggested student: '+esc(s.students.find(p=>p.id===d.student_id)?.display_name||'Profile unavailable')+'</p><p>'+Object.keys(d.concepts).length+' suggested concepts · no discoveries published</p><button class="primaryButton" data-review-import="'+esc(d.id)+'">Review draft →</button> <button class="secondaryButton" data-dismiss-import="'+esc(d.id)+'">Dismiss</button></article>').join('')+(!drafts.length?'<div class="box"><h2>You’re all caught up.</h2><p>New imported drafts will appear here for review.</p></div>':'')+'<p id="importActionStatus" role="status"></p>';
 }
 function bind(s){
  if(s.viewer.role!=='coach')return;
  document.querySelectorAll('[data-review-import]').forEach(b=>b.addEventListener('click',()=>{selectedId=b.dataset.reviewImport;window.dispatchEvent(new HashChangeEvent('hashchange'));}));
  document.getElementById('backToImports')?.addEventListener('click',()=>{selectedId=null;window.dispatchEvent(new HashChangeEvent('hashchange'));});
  document.querySelectorAll('[data-dismiss-import]').forEach(b=>b.addEventListener('click',async()=>{
   b.disabled=true;try{await window.ATLAS_API.dismissImport(b.dataset.dismissImport);}catch(error){document.getElementById('importActionStatus').textContent=error.message;b.disabled=false;}
  }));
  const draft=selected(s),form=document.getElementById('atlasLessonForm');
  if(!draft||!form)return;
  const label=document.createElement('label');label.innerHTML='Student who took this lesson<select name="review_student_id" required>'+s.students.map(p=>'<option value="'+esc(p.id)+'" '+(p.id===draft.student_id?'selected':'')+'>'+esc(p.display_name)+'</option>').join('')+'</select>';
  form.prepend(label);
  form.elements.lesson_date.value=draft.lesson_date;
  form.elements.summary.value=draft.summary;
  form.elements.practice.value=draft.practice;
  form.querySelectorAll('[data-concept]').forEach(el=>{el.value=draft.concepts[el.dataset.concept]||'';if(el.value)el.closest('details').open=true;});
  const confirmation=document.createElement('label');confirmation.className='importConfirmation';confirmation.innerHTML='<input type="checkbox" required name="review_confirmed"> I checked the student, date, lesson wording and concept statuses.';
  const button=form.querySelector('button[type=submit]');button.before(confirmation);button.textContent='Approve lesson & update student map';
  window.ATLAS_LIVE.bind(s);
 }
 window.ATLAS_IMPORTS={markup,bind,selected};
})();
