(() => {
  'use strict';
  if (!location.pathname.startsWith('/mentorship-hub')) return;

  const state={client:null,user:null,role:null,cache:new Map(),queued:false,lastCoachStudent:null};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const horizonOrder={next:0,coming:1,review:2,future:3};

  function fmtDate(value){
    if(!value)return '';
    const d=new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime())?value:d.toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'});
  }

  function addStyles(){
    if(document.getElementById('latestSessionStyles'))return;
    const s=document.createElement('style');
    s.id='latestSessionStyles';
    s.textContent=`
      .latestSessionCard{margin-bottom:18px;background:linear-gradient(145deg,#101923,#10151d);border-color:#7dd8ff3d!important}
      .latestSessionHead{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}
      .latestSessionDate{font-size:.8rem;color:#9edfff;font-weight:850;letter-spacing:.05em;text-transform:uppercase}
      .latestSessionBody{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr);gap:14px;margin-top:14px}
      .latestSessionPane{padding:15px;border:1px solid #ffffff16;border-radius:16px;background:#ffffff05}
      .latestSessionPane h4{margin:0 0 7px}.latestSessionPane p{margin:0;color:#bcc4cf;white-space:pre-line}
      .latestNextFocus{border-color:#7dd8ff35;background:#0e1b25}
      .latestSessionActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
      .latestSessionActions a{padding:8px 11px;border:1px solid #ffffff24;border-radius:999px;font-weight:800;background:#0d1219}
      @media(max-width:820px){.latestSessionBody{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  async function fetchRecap(studentId,force=false){
    if(!force&&state.cache.has(studentId))return state.cache.get(studentId);
    const [lessonRes,roadmapRes]=await Promise.all([
      state.client.from('atlas_lessons')
        .select('id,lesson_date,summary,practice,concepts')
        .eq('student_id',studentId).eq('voided',false)
        .order('lesson_date',{ascending:false}).order('created_at',{ascending:false}).limit(1),
      state.client.from('mentorship_roadmap_items')
        .select('id,title,horizon,status,priority,reason,student_visible,pinned')
        .eq('student_id',studentId)
    ]);
    if(lessonRes.error)throw lessonRes.error;
    if(roadmapRes.error)throw roadmapRes.error;
    const active=(roadmapRes.data||[])
      .filter(x=>!['completed','paused'].includes(x.status)&&x.student_visible!==false)
      .sort((a,b)=>(horizonOrder[a.horizon]??9)-(horizonOrder[b.horizon]??9)||(a.priority??99)-(b.priority??99));
    const value={lesson:(lessonRes.data||[])[0]||null,next:active[0]||null};
    state.cache.set(studentId,value);
    return value;
  }

  function cardHTML(data,{coach=false}={}){
    const lesson=data?.lesson;
    const next=data?.next;
    if(!lesson)return `<div class="kicker">LATEST SESSION</div><p class="empty">No mentorship lesson has been saved yet.</p>`;
    return `
      <div class="latestSessionHead">
        <div><div class="kicker">LATEST SESSION</div><h3>${esc(fmtDate(lesson.lesson_date))}</h3></div>
        <span class="badge">Post-class recap</span>
      </div>
      <div class="latestSessionBody">
        <div class="latestSessionPane">
          <h4>What we worked on</h4>
          <p>${esc(lesson.summary||'Session summary not available.')}</p>
        </div>
        <div class="latestSessionPane latestNextFocus">
          <h4>${next?'Next focus':'Practice'}</h4>
          ${next?`<strong>${esc(next.title)}</strong><p style="margin-top:6px">${esc(next.reason||'This is the next active stop on your roadmap.')}</p>`:`<p>${esc(lesson.practice||'No explicit homework was recorded for this session.')}</p>`}
        </div>
      </div>
      ${lesson.practice?`<div class="latestSessionPane" style="margin-top:14px"><h4>Practice / reminders</h4><p>${esc(lesson.practice)}</p></div>`:''}
      <div class="latestSessionActions">
        <a href="${coach?'#coachZoukableHomework':'/zoukable/?page=practice'}">${coach?'View assigned drills':'Open homework →'}</a>
        <a href="${coach?'#studentRoadmapModule':'#studentRoadmapModule'}">View roadmap →</a>
      </div>`;
  }

  async function renderStudent(force=false){
    if(!state.user)return;
    const area=document.querySelector('.studentArea');
    const grid=area?.querySelector('.portalGrid');
    if(!area||!grid)return;
    const data=await fetchRecap(state.user.id,force);
    if(!data.lesson){document.getElementById('latestSessionStudent')?.remove();return;}
    let card=document.getElementById('latestSessionStudent');
    if(!card){card=document.createElement('section');card.id='latestSessionStudent';card.className='dashCard latestSessionCard';grid.insertAdjacentElement('beforebegin',card);}
    const sig=[data.lesson.id,data.lesson.lesson_date,data.next?.id,data.next?.title].join('|');
    if(card.dataset.signature===sig)return;
    card.dataset.signature=sig;
    card.innerHTML=cardHTML(data);
  }

  function selectedStudentId(){return document.querySelector('.studentBtn.active')?.dataset.student||null;}

  async function renderCoach(force=false){
    if(state.role!=='coach')return;
    const editor=document.getElementById('coachEditor');
    const studentId=selectedStudentId();
    if(!editor||editor.classList.contains('hidden')||!studentId)return;
    if(force)state.cache.delete(studentId);
    const data=await fetchRecap(studentId,force);
    let card=document.getElementById('latestSessionCoach');
    if(!card){card=document.createElement('section');card.id='latestSessionCoach';card.className='editorSection latestSessionCard';const first=editor.querySelector('.dashCard');if(first)first.insertAdjacentElement('afterend',card);else editor.prepend(card);}
    const sig=[studentId,data.lesson?.id,data.lesson?.lesson_date,data.next?.id,data.next?.title].join('|');
    if(card.dataset.signature===sig)return;
    card.dataset.signature=sig;
    card.innerHTML=cardHTML(data,{coach:true});
  }

  function schedule(){
    if(state.queued)return;
    state.queued=true;
    requestAnimationFrame(async()=>{
      state.queued=false;
      try{
        await renderStudent(false);
        const sid=selectedStudentId();
        if(sid!==state.lastCoachStudent){state.lastCoachStudent=sid;await renderCoach(false);}else await renderCoach(false);
      }catch(err){console.warn('Latest session recap',err);}
    });
  }

  async function boot(){
    addStyles();
    while(!window.supabase||!window.GAB_PORTAL?.supabaseUrl)await new Promise(r=>setTimeout(r,180));
    state.client=window.__HUB_ROADMAP_DB||window.supabase.createClient(window.GAB_PORTAL.supabaseUrl,window.GAB_PORTAL.supabaseAnonKey);
    const auth=await state.client.auth.getUser();
    if(auth.error||!auth.data.user)return;
    state.user=auth.data.user;
    const p=await state.client.from('profiles').select('role').eq('id',state.user.id).maybeSingle();
    state.role=p.data?.role||'mentee';
    schedule();
    new MutationObserver(schedule).observe(document.getElementById('dashboardView')||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    document.addEventListener('visibilitychange',async()=>{
      if(document.hidden)return;
      state.cache.clear();
      try{await renderStudent(true);await renderCoach(true);}catch(err){console.warn('Latest session refresh',err);}
    });
  }

  setTimeout(()=>boot().catch(err=>console.error('Latest session recap',err)),800);
})();
