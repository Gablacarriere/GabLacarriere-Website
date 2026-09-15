(() => {
  'use strict';
  if (!location.pathname.startsWith('/mentorship-hub')) return;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let db=null,user=null,role='student',activeStudent=null,loading=false;

  async function client(){while(!window.supabase||!window.GAB_PORTAL?.supabaseUrl)await sleep(100);if(!db)db=window.__MENTORSHIP_TIMELINE_DB||(window.__MENTORSHIP_TIMELINE_DB=window.supabase.createClient(window.GAB_PORTAL.supabaseUrl,window.GAB_PORTAL.supabaseAnonKey));return db;}
  function styles(){if(document.getElementById('mentorshipTimelineStyles'))return;const s=document.createElement('style');s.id='mentorshipTimelineStyles';s.textContent=`
    .learningTimeline{margin-top:18px;padding-top:18px;border-top:1px solid #ffffff14}.learningTimelineHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.learningTimelineHead h3{margin:4px 0}.learningTimelineHead p{margin:0;color:#98a4b3;font-size:.86rem}.learningTimelineList{position:relative;display:grid;gap:10px;margin-top:14px;padding-left:20px}.learningTimelineList:before{content:"";position:absolute;left:6px;top:6px;bottom:6px;width:1px;background:#ffffff16}.timelineItem{position:relative;border:1px solid #ffffff13;border-radius:14px;padding:11px 12px;background:#0a1017}.timelineItem:before{content:"";position:absolute;left:-18px;top:16px;width:9px;height:9px;border-radius:50%;background:#7dd8ff;border:2px solid #0d131b}.timelineItem.practice:before{background:#9fe2c7}.timelineItem.review:before{background:#d5b6ff}.timelineItem.homework:before{background:#f2dfc5}.timelineItem.classoutcome:before{background:#ffcf8f}.timelineMeta{font-size:.7rem;text-transform:uppercase;letter-spacing:.07em;color:#8190a1;font-weight:850}.timelineItem h4{margin:3px 0 4px;font-size:.96rem}.timelineItem p{margin:3px 0;color:#b4bdc9;font-size:.82rem;line-height:1.43}.timelineTag{display:inline-flex;margin-top:6px;padding:4px 7px;border-radius:999px;background:#ffffff08;color:#9eaab8;font-size:.68rem;font-weight:800}.timelineEmpty{color:#84909e;font-style:italic;margin-top:12px}@media(max-width:650px){.learningTimelineHead{flex-direction:column}.learningTimelineList{padding-left:18px}}
  `;document.head.appendChild(s);}
  function fmtDate(v){try{return new Date(v).toLocaleDateString(undefined,{month:'short',day:'numeric',year:new Date(v).getFullYear()!==new Date().getFullYear()?'numeric':undefined});}catch{return'';}}
  function dayKey(v){return String(v||'').slice(0,10);}

  async function fetchTimeline(studentId){
    const c=await client();
    const [lessonsRes,assignRes,attemptRes,skillsRes,reviewsRes,outcomesRes,itemsRes]=await Promise.all([
      c.from('atlas_lessons').select('id,lesson_date,summary,practice,concepts').eq('student_id',studentId).eq('voided',false).order('lesson_date',{ascending:false}).limit(30),
      c.from('zoukable_drill_assignments').select('id,drill_id,note,status,assigned_at,completed_at').eq('student_id',studentId).order('assigned_at',{ascending:false}).limit(30),
      c.from('zoukable_attempts').select('id,primary_skill_id,completed_at,practice_seconds,result').eq('user_id',studentId).eq('status','completed').order('completed_at',{ascending:false}).limit(120),
      c.from('zoukable_skills').select('id,name,slug'),
      c.from('mentorship_roadmap_reviews').select('id,roadmap_item_id,decision,note,evidence_days,evidence_attempts,evidence_minutes,reviewed_at,student_visible').eq('student_id',studentId).order('reviewed_at',{ascending:false}).limit(30),
      c.from('mentorship_class_outcomes').select('id,roadmap_item_id,session_title,lesson_date,reflection,next_practice,outcome,recommended_title,atlas_status,student_visible,created_at').eq('student_id',studentId).order('lesson_date',{ascending:false}).limit(30),
      c.from('mentorship_roadmap_items').select('id,title').eq('student_id',studentId)
    ]);
    [lessonsRes,assignRes,attemptRes,skillsRes,reviewsRes,outcomesRes,itemsRes].forEach(r=>{if(r.error)console.warn('Timeline data',r.error);});
    const skills=new Map((skillsRes.data||[]).map(x=>[x.id,x.name||x.slug]));
    const itemNames=new Map((itemsRes.data||[]).map(x=>[x.id,x.title]));
    const events=[];
    (lessonsRes.data||[]).forEach(x=>events.push({type:'lesson',date:`${x.lesson_date}T12:00:00`,title:'Mentorship class',body:x.summary||'',extra:x.practice||'',tag:Object.entries(x.concepts||{}).map(([k,v])=>v).slice(0,1)[0]||'Class evidence'}));
    (assignRes.data||[]).forEach(x=>events.push({type:'homework',date:x.assigned_at,title:'Homework assigned',body:x.note||'A Zoukable practice task was assigned.',extra:x.status==='completed'?'Completed':'Active',tag:'Zoukable homework'}));
    const byDay=new Map();
    (attemptRes.data||[]).forEach(a=>{const key=dayKey(a.completed_at);if(!key)return;const cur=byDay.get(key)||{date:a.completed_at,count:0,seconds:0,skills:new Set()};cur.count++;cur.seconds+=Number(a.practice_seconds||0);if(a.primary_skill_id)cur.skills.add(skills.get(a.primary_skill_id)||'Practice');byDay.set(key,cur);});
    [...byDay.values()].forEach(x=>events.push({type:'practice',date:x.date,title:'Zoukable practice',body:[...x.skills].slice(0,3).join(' · '),extra:`${x.count} completed attempt${x.count===1?'':'s'}${x.seconds?` · ${Math.round(x.seconds/60)} min`:''}`,tag:'Practice evidence'}));
    (reviewsRes.data||[]).filter(x=>role==='coach'||x.student_visible!==false).forEach(x=>events.push({type:'review',date:x.reviewed_at,title:`Coach review · ${itemNames.get(x.roadmap_item_id)||'Roadmap checkpoint'}`,body:x.note||({'complete':'Ready to advance','continue':'Keep practicing','redirect':'Route redirected'})[x.decision]||x.decision,extra:x.evidence_days?`${x.evidence_days} practice days reviewed`:'' ,tag:'Coach decision'}));
    (outcomesRes.data||[]).filter(x=>role==='coach'||x.student_visible!==false).forEach(x=>events.push({type:'classoutcome',date:`${x.lesson_date}T18:00:00`,title:x.session_title||'Post-class reflection',body:x.reflection||'',extra:x.next_practice?`Next practice: ${x.next_practice}`:(x.recommended_title?`Next direction: ${x.recommended_title}`:''),tag:({'reinforce':'Reinforce','advance':'Advance','redirect':'Redirect'})[x.outcome]||x.atlas_status||'Class outcome'}));
    events.sort((a,b)=>new Date(b.date)-new Date(a.date));
    return events.slice(0,45);
  }

  function markup(events){if(!events.length)return'<p class="timelineEmpty">No learning history recorded yet.</p>';return `<div class="learningTimelineList">${events.map(e=>`<article class="timelineItem ${esc(e.type)}"><div class="timelineMeta">${esc(fmtDate(e.date))}</div><h4>${esc(e.title)}</h4>${e.body?`<p>${esc(e.body)}</p>`:''}${e.extra?`<p>${esc(e.extra)}</p>`:''}<span class="timelineTag">${esc(e.tag)}</span></article>`).join('')}</div>`;}

  async function renderStudent(studentId){
    if(loading)return;loading=true;activeStudent=studentId;
    try{const events=await fetchTimeline(studentId);if(activeStudent!==studentId)return;let root;
      if(role==='coach'){
        const host=document.getElementById('coachRoadmapPanel')||document.getElementById('coachEditor');if(!host)return;root=document.getElementById('coachLearningTimeline');if(!root){root=document.createElement('section');root.id='coachLearningTimeline';root.className='learningTimeline';host.appendChild(root);}
      } else {
        const host=document.getElementById('studentRoadmapModule')?.parentElement||document.getElementById('missionControl')?.closest('section');if(!host)return;root=document.getElementById('studentLearningTimeline');if(!root){root=document.createElement('section');root.id='studentLearningTimeline';root.className='learningTimeline';host.appendChild(root);}
      }
      root.innerHTML=`<div class="learningTimelineHead"><div><span class="badge">Learning history</span><h3>${role==='coach'?'Longitudinal student timeline':'Your learning timeline'}</h3><p>Classes, assigned practice, Zoukable activity, and coach decisions in one chronology.</p></div></div>${markup(events)}`;
    }catch(err){console.warn('Learning timeline',err);}finally{loading=false;}
  }

  function selectedCoachStudent(){const href=document.getElementById('coachStudentAtlas')?.getAttribute('href')||'';try{return new URL(href,location.origin).searchParams.get('student');}catch{return null;}}
  async function boot(){styles();const c=await client();const auth=await c.auth.getUser();user=auth.data?.user||null;if(!user)return;const me=await c.from('profiles').select('role').eq('id',user.id).maybeSingle();role=me.data?.role||'student';let tries=0;while(!document.getElementById('dashboardView')&&tries++<70)await sleep(100);if(role==='coach'){
      document.addEventListener('click',e=>{const b=e.target.closest('[data-student]');if(b?.dataset.student)setTimeout(()=>renderStudent(b.dataset.student),220);});const id=selectedCoachStudent();if(id)renderStudent(id);
    } else renderStudent(user.id);
    window.addEventListener('focus',()=>{const id=role==='coach'?(activeStudent||selectedCoachStudent()):user.id;if(id)renderStudent(id);});
  }
  setTimeout(()=>boot().catch(err=>console.warn('Mentorship timeline boot',err)),1600);
})();
