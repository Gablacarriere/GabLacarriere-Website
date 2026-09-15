(() => {
  'use strict';
  if (!location.pathname.startsWith('/mentorship-hub')) return;

  const state={client:null,user:null,profile:null,assignments:[],drills:[],ready:false,queued:false};
  const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const due=v=>{if(!v)return '';const d=new Date(v+'T00:00:00');return Number.isNaN(d.getTime())?'':d.toLocaleDateString(undefined,{month:'short',day:'numeric'});};
  const source=v=>v==='granola'?'Private-class notes':v==='class'?'Class':'Teacher assignment';
  const drill=id=>state.drills.find(d=>d.id===id);
  const activeFor=id=>state.assignments.filter(a=>a.student_id===id&&a.status==='active').sort((a,b)=>new Date(b.assigned_at)-new Date(a.assigned_at));

  function addStyles(){
    if(document.getElementById('mentorshipHomeworkStyles'))return;
    const s=document.createElement('style');s.id='mentorshipHomeworkStyles';s.textContent=`
      .zHomeworkBlock{margin:0 0 14px;padding:14px;border:1px solid #7dd8ff33;border-radius:16px;background:#0d1822}
      .zHomeworkBlock h3{margin:4px 0 6px;font-size:1.05rem}.zHomeworkBlock p{margin:0;color:#aeb6c2}
      .zHomeworkMeta{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.zHomeworkMeta span{font-size:.75rem;padding:5px 8px;border:1px solid #ffffff1b;border-radius:999px;color:#cbd4df}
      .zHomeworkActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.zHomeworkActions a,.zHomeworkActions button{padding:8px 11px;border-radius:999px;border:1px solid #ffffff24;background:#10151d;color:#fff;font:inherit;font-weight:800;cursor:pointer;text-decoration:none}
      .zHomeworkOverdue{color:#ffb5b5!important}.zHomeworkCoachList{margin-top:12px}.zHomeworkCoachSummary{margin:12px 0 0;padding:12px 14px;border-radius:14px;background:#101b25;border:1px solid #7dd8ff2c}
    `;document.head.appendChild(s);
  }

  async function load(){
    const [a,d]=await Promise.all([
      state.client.from('zoukable_drill_assignments').select('*').order('assigned_at',{ascending:false}),
      state.client.from('zoukable_drills').select('id,title,objective,status,assigned_to,target_seconds').order('title')
    ]);
    if(a.error)throw a.error;if(d.error)throw d.error;
    state.assignments=a.data||[];state.drills=d.data||[];state.ready=true;
  }

  function homeworkHTML(a){
    const d=drill(a.drill_id);if(!d)return '';
    const dueDate=due(a.due_date);const overdue=!!(a.due_date&&a.status==='active'&&a.due_date<new Date().toISOString().slice(0,10));
    return `<div class="zHomeworkBlock" data-hub-homework="${safe(a.id)}">
      <span class="badge">Zoukable homework</span>
      <h3>${safe(d.title)}</h3>
      <p>${safe(a.note||d.objective||'Practice this drill before your next class.')}</p>
      <div class="zHomeworkMeta"><span>${safe(source(a.source))}</span>${dueDate?`<span class="${overdue?'zHomeworkOverdue':''}">${overdue?'Overdue · ':'Due '}${safe(dueDate)}</span>`:''}<span>${Math.max(1,Math.ceil((d.target_seconds||60)/60))} min drill</span></div>
      <div class="zHomeworkActions"><a href="/zoukable/?page=practice">Open in Zoukable →</a><button type="button" data-hub-homework-complete="${safe(a.id)}">Mark complete</button></div>
    </div>`;
  }

  function renderStudent(){
    if(!state.ready||state.profile?.role==='coach'&&document.body.classList.contains('coachView'))return;
    const orders=document.getElementById('assignmentsList');if(!orders)return;
    let wrap=document.getElementById('zoukableHubHomework');
    const rows=activeFor(state.user.id).map(homeworkHTML).filter(Boolean);
    if(!rows.length){wrap?.remove();return;}
    if(!wrap){wrap=document.createElement('div');wrap.id='zoukableHubHomework';orders.insertAdjacentElement('beforebegin',wrap);}
    const signature=activeFor(state.user.id).map(a=>a.id+':'+a.updated_at).join('|');if(wrap.dataset.signature===signature)return;
    wrap.dataset.signature=signature;
    wrap.innerHTML=`<div style="margin-bottom:12px"><strong>Drill homework</strong><p class="muted" style="margin:3px 0 0">Assigned practice from class or private lessons.</p></div>${rows.join('')}`;
    wrap.querySelectorAll('[data-hub-homework-complete]').forEach(btn=>btn.onclick=async()=>{
      btn.disabled=true;
      const {error}=await state.client.rpc('complete_zoukable_homework',{p_assignment_id:btn.dataset.hubHomeworkComplete});
      if(error){btn.disabled=false;btn.textContent=error.message;return;}
      await load();renderStudent();renderCoach();decorateOverview();
    });
  }

  function selectedStudentId(){return document.querySelector('.studentBtn.active')?.dataset.student||null;}
  function renderCoach(){
    if(!state.ready||state.profile?.role!=='coach')return;
    const editor=document.getElementById('coachEditor');if(!editor||editor.classList.contains('hidden'))return;
    const studentId=selectedStudentId();if(!studentId)return;
    let section=document.getElementById('coachZoukableHomework');
    const rows=activeFor(studentId);const signature=studentId+'|'+rows.map(a=>a.id+':'+a.updated_at).join('|');
    if(section&&section.dataset.signature===signature)return;
    section?.remove();section=document.createElement('section');section.id='coachZoukableHomework';section.className='editorSection';section.dataset.signature=signature;
    section.innerHTML=`<div class="kicker">Zoukable Homework</div><h3>Assigned drills</h3><p class="muted">Drill-specific homework lives in Zoukable. General Mission Orders remain separate.</p><div class="zHomeworkCoachSummary"><strong>${rows.length} active drill${rows.length===1?'':'s'}</strong><p class="muted">Practice history and homework status stay connected to the student's Zoukable account.</p></div><div class="zHomeworkCoachList">${rows.length?rows.map(a=>{const d=drill(a.drill_id);if(!d)return '';const dueDate=due(a.due_date);return `<div class="manageItem"><div class="manageItemTop"><div><strong>${safe(d.title)}</strong><p>${safe(source(a.source))}${dueDate?' · due '+safe(dueDate):''}${a.note?' · '+safe(a.note):''}</p></div><a class="smallBtn" href="/zoukable/?page=coach">Open in Zoukable</a></div></div>`;}).join(''):'<p class="empty">No active drill homework.</p>'}</div>`;
    const legacy=[...editor.querySelectorAll('.editorSection')].find(x=>x.querySelector('h3')?.textContent.trim()==='Assignments');
    if(legacy)legacy.insertAdjacentElement('afterend',section);else editor.appendChild(section);
  }

  function decorateOverview(){
    if(!state.ready||state.profile?.role!=='coach')return;
    document.querySelectorAll('[data-overview-student]').forEach(card=>{
      const id=card.dataset.overviewStudent;const count=activeFor(id).length;const counts=card.querySelector('.counts');if(!counts)return;
      let badge=counts.querySelector('[data-zoukable-homework-count]');
      if(!badge){badge=document.createElement('span');badge.dataset.zoukableHomeworkCount='1';counts.appendChild(badge);}
      badge.textContent=`📚 ${count} drill homework`;
    });
  }

  function schedule(){if(state.queued)return;state.queued=true;requestAnimationFrame(()=>{state.queued=false;renderStudent();renderCoach();decorateOverview();});}

  async function boot(){
    addStyles();
    while(!window.supabase||!window.GAB_PORTAL?.supabaseUrl)await new Promise(r=>setTimeout(r,200));
    state.client=window.supabase.createClient(window.GAB_PORTAL.supabaseUrl,window.GAB_PORTAL.supabaseAnonKey);
    const auth=await state.client.auth.getUser();if(auth.error||!auth.data.user)return;state.user=auth.data.user;
    const p=await state.client.from('profiles').select('id,role').eq('id',state.user.id).single();if(p.error)return;state.profile=p.data;
    await load();
    new MutationObserver(schedule).observe(document.getElementById('dashboardView')||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    schedule();
    document.addEventListener('visibilitychange',async()=>{if(document.hidden)return;try{await load();schedule();}catch(_){}});
  }
  setTimeout(()=>boot().catch(err=>console.error('Mentorship homework bridge',err)),650);
})();
