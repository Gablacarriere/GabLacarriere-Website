(() => {
  const cfg=window.GAB_PORTAL;
  let state={mode:'loading'},generation=0,targetId=null;
  const emit=next=>{state=next;window.dispatchEvent(new CustomEvent('atlas-state',{detail:next}));};
  if(!cfg||!window.supabase){emit({mode:'error',message:'The member connection did not load. Reload this page to try again.'});return;}
  const client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
  window.GAB_SESSION?.watch(client);
  async function refresh(){
    const run=++generation;
    emit({mode:'loading'});
    try{
      const {data:{user},error}=await client.auth.getUser();
      if(run!==generation)return;
      if(!user){if(error&&error.name!=='AuthSessionMissingError')throw error;targetId=null;emit({mode:'guest'});return;}
      if(error)throw error;
      const profileResult=await client.from('profiles').select('id,display_name,role').eq('id',user.id).single();
      if(profileResult.error)throw profileResult.error;
      const viewer=profileResult.data;
      let students=[viewer];
      if(viewer.role==='coach'){
        const result=await client.from('profiles').select('id,display_name,role').order('display_name');
        if(result.error)throw result.error;students=result.data;
      }
      const requested=targetId||new URLSearchParams(location.search).get('student');
      const student=viewer.role==='coach'?students.find(p=>p.id===requested)||viewer:viewer;
      const lessons=[];
      for(let offset=0;;offset+=500){
        const result=await client.from('atlas_lessons').select('id,student_id,coach_id,lesson_date,summary,practice,concepts,voided,created_at').eq('student_id',student.id).order('lesson_date',{ascending:false}).order('created_at',{ascending:false}).order('id').range(offset,offset+499);
        if(result.error)throw result.error;
        lessons.push(...result.data);if(result.data.length<500)break;
      }
      let imports=[],importsError=false;
      if(viewer.role==='coach'){
        const result=await client.from('atlas_imports').select('id,source_title,source_excerpt,student_id,lesson_date,summary,practice,concepts,mapping_notes,status').eq('status','pending').order('lesson_date',{ascending:false});
        if(result.error)importsError=true;else imports=result.data;
      }
      let craft=null;
      try{
        const attempts=[];
        for(let offset=0;;offset+=500){const result=await client.from('zoukable_attempts').select('status,completed_at,drill_id,practice_seconds').eq('user_id',student.id).eq('status','completed').order('id').range(offset,offset+499);if(result.error)throw result.error;attempts.push(...result.data);if(result.data.length<500)break;}
        const pref=await client.from('zoukable_learning_profiles').select('avatar_coat').eq('user_id',student.id).maybeSingle();if(pref.error)throw pref.error;
        craft=window.GAB_CRAFT.model(attempts,pref.data);
      }catch(_){/* Craft availability must never prevent access to saved lessons. */}
      if(run!==generation)return;
      targetId=student.id;
      emit({mode:'ready',viewer,student,students,lessons,imports,importsError,craft,fullAccess:viewer.role==='coach'&&student.id===viewer.id});
    }catch(_){if(run===generation)emit({mode:'error',message:'Your saved map could not be loaded. Please retry or sign in again. No progress has been changed.'});}
  }
  window.ATLAS_API={
    refresh,
    selectStudent(id){if(state.mode!=='ready'||state.viewer.role!=='coach')return;targetId=id;const url=new URL(location.href);url.searchParams.set('student',id);history.replaceState(null,'',url);return refresh();},
    async approveImport(id,record){
      if(state.mode!=='ready'||state.viewer.role!=='coach'||!state.imports.some(d=>d.id===id))throw Error('This draft is not available for review.');
      const result=await client.rpc('approve_atlas_import',{p_import_id:id,p_student_id:record.student_id,p_lesson_date:record.lesson_date,p_summary:record.summary,p_practice:record.practice,p_concepts:record.concepts});
      if(result.error)throw Error('Approval could not be confirmed. Your review is still here. Retry or refresh the inbox; retrying will not duplicate the lesson.');
      targetId=record.student_id;await refresh();
    },
    async dismissImport(id){
      if(state.mode!=='ready'||state.viewer.role!=='coach')throw Error('Coach access required.');
      const result=await client.from('atlas_imports').update({status:'dismissed'}).eq('id',id).eq('status','pending').select('id').single();
      if(result.error)throw Error('Could not dismiss this draft. Refresh the inbox and retry.');
      await refresh();
    },
    async saveLesson(record){
      if(state.mode!=='ready'||state.viewer.role!=='coach'||record.student_id!==state.student.id)throw Error('Choose a student while signed in as a coach.');
      const result=await client.from('atlas_lessons').insert(record).select('id').single();
      if(result.error){
        // Retrying an uncertain response uses the same ID rather than duplicating a lesson.
        if(result.error.code!=='23505')throw Error('Could not save. Your notes are still here. Check your connection and retry.');
        const check=await client.from('atlas_lessons').select('id').eq('id',record.id).eq('student_id',record.student_id).single();
        if(check.error)throw Error('Could not verify the save. Reload your sessions before trying again.');
      }
      await refresh();
    },
    async setVoided(id,voided){
      if(state.mode!=='ready'||state.viewer.role!=='coach'||!state.lessons.some(l=>l.id===id))throw Error('This lesson is not available.');
      const result=await client.from('atlas_lessons').update({voided}).eq('id',id).eq('student_id',state.student.id).select('id').single();
      if(result.error)throw Error('The lesson could not be updated. Please retry.');
      await refresh();
    }
  };
  client.auth.onAuthStateChange((event,session)=>{
    if(event==='SIGNED_OUT'){generation++;targetId=null;emit({mode:'guest'});}
    else if(event==='SIGNED_IN'&&state.mode==='ready'&&session?.user.id!==state.viewer.id){targetId=null;setTimeout(refresh,0);}
  });
  refresh();
})();
