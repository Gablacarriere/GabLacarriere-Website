(() => {
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nodes=window.ZOUK_ATLAS.flatMap(g=>g.topics.map((name,i)=>({id:g.id+'-'+i,name,group:g.name})));
  const names=Object.fromEntries(nodes.map(n=>[n.id,n.name]));
  const active=s=>s.lessons.filter(l=>!l.voided).slice().sort((a,b)=>b.lesson_date.localeCompare(a.lesson_date)||b.created_at.localeCompare(a.created_at)||a.id.localeCompare(b.id));
  const progress=s=>{const result={};for(const lesson of active(s))for(const [id,status] of Object.entries(lesson.concepts))if(names[id]&&!result[id])result[id]=status;return result;};
  const card=l=>'<article class="box liveLesson"><p class="eyebrow">'+esc(l.lesson_date)+(l.voided?' · REMOVED FROM MAP':' · SAVED LESSON')+'</p><h2>'+esc(l.summary)+'</h2><div class="topicList">'+Object.entries(l.concepts).map(([id,status])=>'<button class="topic" data-node="'+esc(id)+'">'+esc(names[id]||id)+' · '+esc(status)+'</button>').join('')+'</div>'+(l.practice?'<h3>Practice focus</h3><p class="lessonText">'+esc(l.practice)+'</p>':'')+'</article>';
  function form(s){
    const date=new Date();date.setMinutes(date.getMinutes()-date.getTimezoneOffset());
    return '<form id="atlasLessonForm" class="box atlasLessonForm"><h2>Record a lesson for '+esc(s.student.display_name)+'</h2><p>Everything you write here is visible to this student. Select only concepts you actually covered. The most recent lesson date sets each concept’s current status.</p><label>Lesson date<input name="lesson_date" type="date" required max="'+date.toISOString().slice(0,10)+'" value="'+date.toISOString().slice(0,10)+'"></label><label>What did you explore?<textarea name="summary" required maxlength="3000" rows="3" placeholder="A short summary of the lesson"></textarea></label><fieldset><legend>Concepts covered</legend><p>Leave untouched concepts as “Not covered”.</p>'+window.ZOUK_ATLAS.map(g=>'<details><summary>'+esc(g.name)+'</summary>'+g.topics.map((name,i)=>'<label class="conceptChoice"><span>'+esc(name)+'</span><select data-concept="'+g.id+'-'+i+'"><option value="">Not covered</option><option>Introduced</option><option>Practicing</option><option>Integrating</option></select></label>').join('')+'</details>').join('')+'</fieldset><label>Practice focus (optional)<textarea name="practice" maxlength="2000" rows="3" placeholder="What should the student explore before the next lesson?"></textarea></label><p>Discovery is not a claim of mastery. Saving this lesson updates the student’s map immediately.</p><button class="primaryButton" type="submit">Save lesson & update map</button><p id="lessonSaveStatus" role="status"></p></form>';
  }
  function markup(view,s){
    const list=active(s),coach=s.viewer.role==='coach',p=progress(s);
    const focus=list.find(l=>l.practice?.trim());
    const earlier=focus&&focus.id!==list[0]?.id;
    if(view==='journey')return '<div class="topline"><div><p class="eyebrow">SAVED JOURNEY</p><h1>'+esc(s.student.display_name)+'’s voyage</h1><p>'+Object.keys(p).length+' concepts explored across '+list.length+' recorded lessons.</p></div></div><div class="box focusBox wide"><p class="eyebrow">YOUR NEXT STEP</p><h2>'+(focus?'Bring your lesson into practice.':list.length?'Revisit your latest discoveries.':'Your map is ready for its first lesson.')+'</h2>'+(focus?'<p class="lessonText">'+esc(focus.practice)+'</p><p>Coach’s practice note · '+esc(focus.lesson_date)+(earlier?' · From an earlier lesson; your latest lesson has no new practice note.':'')+'</p>':'<p>'+ (list.length?esc(list[0].summary):'Your Captain or Co-Captain will record the concepts you cover together. They will appear here and on your map.')+'</p>')+'<a class="primaryButton" href="'+(focus?'#practice':'#map')+'">'+(focus?'Open my practice':'Explore the map')+' →</a> <a class="secondaryButton" href="#sessions">Open lessons →</a></div>';
    if(view==='practice')return '<h1>Practice between lessons</h1><p>One focus to return to before your next lesson.</p>'+(focus?'<div class="box focusBox wide"><p class="eyebrow">01 / YOUR COACH’S FOCUS · '+esc(focus.lesson_date)+'</p><h2>Start here</h2><p class="lessonText">'+esc(focus.practice)+'</p>'+(earlier?'<p>This note comes from an earlier lesson. Your latest lesson has no new practice note; check with your coach if your focus has changed.</p>':'')+'<h3>Explore these concepts</h3><div class="topicList">'+Object.entries(focus.concepts).map(([id,status])=>'<button class="topic" data-node="'+esc(id)+'">'+esc(names[id]||id)+' · '+esc(status)+'</button>').join('')+'</div><details><summary>Read the lesson behind this focus</summary><p class="lessonText">'+esc(focus.summary)+'</p></details></div><div class="cards wide"><section class="box"><p class="eyebrow">02 / NOTICE</p><h2>What changes as you practice?</h2><p>Notice what feels clearer, what still needs attention, and one question you want to bring to your next lesson.</p></section><section class="box"><p class="eyebrow">03 / CONTINUE</p><h2>Keep your practice connected.</h2><p>Your assignments and training tools are in the member hub. Practicing does not automatically change a concept’s status; your coach records that after reviewing your progress.</p><a class="primaryButton" href="/mentorship-hub/#hub-practice">Open my training tools →</a></section></div>':'<div class="box"><h2>No practice note yet.</h2><p>Your coach can add a focus with your next recorded lesson. Until then, revisit your saved discoveries or open your existing assignments.</p><a class="primaryButton" href="#map">Explore my discoveries →</a> <a class="secondaryButton" href="/mentorship-hub/#hub-practice">Open assignments →</a></div>')+'<p><a class="secondaryButton" href="#sessions">See all lesson notes →</a></p>';
    return '<h1>'+esc(s.student.display_name)+'’s sessions</h1><p>Coach-reviewed lessons and discoveries.</p>'+(coach?form(s):'')+((coach?s.lessons:list).length?s.lessons.filter(l=>coach||!l.voided).map(l=>card(l)+(coach?'<p><button class="secondaryButton" data-void-lesson="'+esc(l.id)+'" data-voided="'+String(!l.voided)+'">'+(l.voided?'Restore lesson':'Remove lesson from map')+'</button></p>':'')).join(''):'<div class="box"><h2>No recorded lessons yet.</h2><p>New discoveries will appear after a coach saves your first lesson.</p></div>')+'<p id="lessonActionStatus" role="status"></p>';
  }
  function detail(id,s){
    const list=active(s).filter(l=>Object.hasOwn(l.concepts,id)),latest=list[0];
    return '<section><h4>Recorded in your lessons</h4><p>'+(latest?esc(latest.lesson_date)+' · '+esc(latest.summary):'No saved lesson covers this concept yet.')+'</p>'+(latest?.practice?'<h4>Practice focus</h4><p>'+esc(latest.practice)+'</p>':'')+'<a class="secondaryButton" href="#sessions">See saved lessons →</a></section>';
  }
  function bind(s){
    const form=document.getElementById('atlasLessonForm');
    if(form){
      const requestId=crypto.randomUUID(),draft=window.ATLAS_IMPORTS?.selected(s);let busy=false;
      form.addEventListener('submit',async event=>{
        event.preventDefault();if(busy||!form.reportValidity())return;
        const concepts={};form.querySelectorAll('[data-concept]').forEach(el=>{if(el.value)concepts[el.dataset.concept]=el.value;});
        const status=document.getElementById('lessonSaveStatus');
        if(!Object.keys(concepts).length){status.textContent='Choose at least one concept covered in this lesson.';return;}
        const record={id:requestId,student_id:draft?form.elements.review_student_id.value:s.student.id,lesson_date:form.elements.lesson_date.value,summary:form.elements.summary.value.trim(),practice:form.elements.practice.value.trim(),concepts};
        if(!record.summary){status.textContent='Add a short lesson summary.';return;}
        busy=true;form.querySelector('button[type=submit]').disabled=true;document.getElementById('atlasStudentSelect')?.setAttribute('disabled','');
        status.textContent='Saving lesson…';
        try{if(draft)await window.ATLAS_API.approveImport(draft.id,record);else await window.ATLAS_API.saveLesson(record);document.getElementById('announcement').textContent='Lesson saved. The student’s map has been updated.';if(draft&&document.getElementById('importActionStatus'))document.getElementById('importActionStatus').textContent='Lesson approved. The student’s map has been updated.';}
        catch(error){status.textContent=error.message;}
        finally{busy=false;form.querySelector('button[type=submit]').disabled=false;document.getElementById('atlasStudentSelect')?.removeAttribute('disabled');}
      });
    }
    document.querySelectorAll('[data-void-lesson]').forEach(button=>button.addEventListener('click',async()=>{
      button.disabled=true;
      try{await window.ATLAS_API.setVoided(button.dataset.voidLesson,button.dataset.voided==='true');document.getElementById('announcement').textContent='Lesson updated. The map now reflects the saved records.';}
      catch(error){document.getElementById('lessonActionStatus').textContent=error.message;button.disabled=false;}
    }));
  }
  window.ATLAS_LIVE={progress,markup,detail,bind,active,form};
})();
