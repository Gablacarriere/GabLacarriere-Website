(() => {
  'use strict';
  if (!location.pathname.startsWith('/mentorship-hub')) return;

  const HORIZONS = [
    ['next','NEXT','Main quest · likely next classes'],
    ['coming','COMING UP','Near-term branches'],
    ['review','REINFORCE','Skills worth revisiting'],
    ['future','FUTURE TERRITORY','Longer-term destinations']
  ];
  const STATUS_SCORE = {
    introduced:1, learning:1,
    practicing:2, practice:2,
    integrating:3, integrated:3,
    confident:4, mastered:4, fluent:4
  };
  const FAMILY_KEYWORDS = {
    body:['body','posture','weight','ground','grounding','axis','balance','footwork','feet','mechanic','stability'],
    partnering:['connection','frame','partner','social','embrace','lead','leader','follow','follower','responsive','contact'],
    rhythm:['rhythm','timing','music','musical','musicality','phrase','beat','pulse'],
    space:['space','orientation','direction','position','navigation','blocking'],
    grammar:['pattern','patterns','turn','turns','vocabulary','movement','social','combination'],
    offaxis:['head','head movement','tilt','off axis','off-axis','counterbalance','counter balance'],
    pathways:['wave','body movement','spiral','torsion','dissociation','elasticity','flow','isolation','undulation'],
    learning:['practice','learning','memory','retention','study','consistency','confidence']
  };

  let client = null;
  let sessionUser = null;
  let sessionRole = null;
  let activeCoachStudentId = null;
  let curriculumReady = false;

  const esc = (v='') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const norm = v => String(v ?? '').trim().toLowerCase();

  function statusScore(value) {
    return STATUS_SCORE[norm(value)] || 0;
  }

  function fmtDate(value) {
    if (!value) return '';
    try { return new Date(value).toLocaleDateString(undefined,{month:'short',day:'numeric'}); }
    catch { return ''; }
  }

  function loadScript(src, test) {
    if (test()) return Promise.resolve();
    return new Promise((resolve,reject) => {
      const prior = [...document.scripts].find(s => s.src && s.src.includes(src.split('?')[0]));
      if (prior) {
        let n = 0;
        const timer = setInterval(() => {
          if (test()) { clearInterval(timer); resolve(); }
          else if (++n > 40) { clearInterval(timer); reject(new Error('Curriculum data did not initialize.')); }
        },100);
        return;
      }
      const s=document.createElement('script');
      s.src=src;
      s.onload=()=>test()?resolve():reject(new Error('Curriculum data unavailable.'));
      s.onerror=()=>reject(new Error('Could not load curriculum data.'));
      document.head.appendChild(s);
    });
  }

  async function ensureCurriculum() {
    if (curriculumReady && window.ATLAS_CURRICULUM_V2) return window.ATLAS_CURRICULUM_V2;
    await loadScript('/zouk-map-data.js?v=roadmap-1', () => Array.isArray(window.ZOUK_ATLAS) && !!window.ZOUK_DETAILS);
    await loadScript('/atlas-curriculum-v2.js?v=roadmap-1', () => !!window.ATLAS_CURRICULUM_V2);
    curriculumReady = true;
    return window.ATLAS_CURRICULUM_V2;
  }

  async function getClient() {
    while (!window.supabase || !window.GAB_PORTAL?.supabaseUrl) await sleep(120);
    if (!client) client = window.__HUB_ROADMAP_DB || (window.__HUB_ROADMAP_DB = window.supabase.createClient(window.GAB_PORTAL.supabaseUrl, window.GAB_PORTAL.supabaseAnonKey));
    return client;
  }

  async function getSessionContext() {
    const db=await getClient();
    const {data:{session}}=await db.auth.getSession();
    if (!session) return null;
    sessionUser=session.user;
    const {data:profile}=await db.from('profiles').select('role').eq('id',session.user.id).maybeSingle();
    sessionRole=profile?.role || 'student';
    return {user:session.user,role:sessionRole};
  }

  function aggregateConcepts(lessons=[]) {
    const latest = {};
    const recent = {};
    [...lessons]
      .sort((a,b)=>String(b.lesson_date||'').localeCompare(String(a.lesson_date||'')))
      .forEach(lesson => {
        const concepts = lesson?.concepts && typeof lesson.concepts === 'object' && !Array.isArray(lesson.concepts) ? lesson.concepts : {};
        Object.entries(concepts).forEach(([id,status]) => {
          if (latest[id] == null) {
            latest[id]=status;
            recent[id]=lesson.lesson_date || null;
          }
        });
      });
    return {latest,recent};
  }

  function preferenceText(profile, goals=[]) {
    return norm([
      profile?.main_goal, profile?.short_term_goal, profile?.motivations,
      profile?.preferences, profile?.life_context, profile?.constraints,
      profile?.interview_summary,
      ...goals.flatMap(g=>[g.title,g.notes])
    ].filter(Boolean).join(' '));
  }

  function interestBonus(familyId, nodeName, text, track) {
    if (!text) return 0;
    let bonus=0;
    const words=FAMILY_KEYWORDS[familyId] || [];
    if (words.some(w=>text.includes(w))) bonus += 20;
    const tokens=norm(nodeName).split(/[^a-z0-9]+/).filter(t=>t.length>3);
    if (tokens.some(t=>text.includes(t))) bonus += 12;
    if (track==='lambada' && text.includes('lambada')) bonus += 25;
    if (text.includes('competition') || text.includes('compete')) {
      if (['body','partnering','rhythm'].includes(familyId)) bonus += 8;
    }
    return bonus;
  }

  function buildSuggestions(data) {
    const cur=window.ATLAS_CURRICULUM_V2;
    if (!cur) return [];
    const {latest,recent}=aggregateConcepts(data.lessons);
    const pref=preferenceText(data.learningProfile,data.goals);
    const persistedNodeIds=new Set((data.items||[]).filter(x=>x.status!=='completed').map(x=>x.curriculum_node_id).filter(Boolean));

    const candidates=cur.rawNodes.map(node=>{
      const meta=cur.meta[node.id];
      const score=statusScore(latest[node.id]);
      const prereqs=(meta.supports||[]).filter(id=>cur.meta[id]);
      const prereqScores=prereqs.map(id=>statusScore(latest[id]));
      const covered=prereqs.length ? prereqScores.filter(x=>x>=1).length/prereqs.length : 1;
      const stable=prereqs.length ? prereqScores.filter(x=>x>=2).length/prereqs.length : 1;
      const family=cur.familyFor(node.id);
      let rank=(7-Number(meta.tier||4))*9 + covered*18 + stable*16 + interestBonus(meta.family,meta.name,pref,meta.track);
      if (score===0) rank+=14;
      if (score===1) rank+=22;
      if (score===2) rank+=18;
      if (score>=3) rank-=32;
      if (persistedNodeIds.has(node.id)) rank-=80;
      if (covered<0.5 && Number(meta.tier||3)>1) rank-=35;
      const readiness=Math.max(20,Math.min(98,Math.round(42+covered*28+stable*22+(score===1?5:0)+(score===2?8:0))));
      let reason='A structurally ready next step from your curriculum map.';
      const missing=prereqs.filter(id=>statusScore(latest[id])===0);
      const matched=interestBonus(meta.family,meta.name,pref,meta.track)>0;
      if (score===1 || score===2) reason=`You have already ${score===1?'met':'been practicing'} this concept; another class could consolidate it.`;
      else if (matched) reason='This branch matches themes in your goals, preferences, or onboarding interview.';
      else if (prereqs.length && !missing.length) reason='Its prerequisites are already represented in your Atlas history.';
      else if (missing.length) reason=`Longer-term branch; ${missing.slice(0,2).map(cur.displayName).join(' + ')} should come first.`;
      return {
        id:node.id,
        title:meta.name,
        family:family?.name || meta.family,
        tier:Number(meta.tier||3),
        score, rank, readiness, covered, reason,
        status:latest[node.id] || null,
        lastSeen:recent[node.id] || null,
        track:meta.track || 'shared'
      };
    }).filter(x=>x.rank>-30);

    candidates.sort((a,b)=>b.rank-a.rank || b.readiness-a.readiness || a.tier-b.tier || a.title.localeCompare(b.title));

    const readyNew=candidates.filter(x=>x.score<3 && x.covered>=0.5 && !persistedNodeIds.has(x.id));
    const reinforce=readyNew.filter(x=>x.score===1 || x.score===2).slice(0,3);
    const newStops=readyNew.filter(x=>x.score===0);
    const used=new Set(reinforce.map(x=>x.id));
    const next=(reinforce[0] || newStops[0]);
    if (next) used.add(next.id);
    const coming=[...reinforce.slice(next&&reinforce[0]?.id===next.id?1:0),...newStops]
      .filter(x=>!used.has(x.id)).slice(0,4);
    coming.forEach(x=>used.add(x.id));
    const future=candidates.filter(x=>!used.has(x.id) && x.score<3 && (x.tier>=3 || x.covered<0.75)).slice(0,5);

    const result=[];
    if(next) result.push({...next,horizon:'next'});
    reinforce.filter(x=>x.id!==next?.id).slice(0,2).forEach(x=>result.push({...x,horizon:'review'}));
    coming.forEach(x=>result.push({...x,horizon:'coming'}));
    future.forEach(x=>result.push({...x,horizon:'future'}));
    return result;
  }

  async function fetchStudentData(studentId) {
    const db=await getClient();
    const [profileRes,itemsRes,lessonsRes,goalsRes]=await Promise.all([
      db.from('mentorship_learning_profiles').select('*').eq('student_id',studentId).maybeSingle(),
      db.from('mentorship_roadmap_items').select('*').eq('student_id',studentId).order('priority').order('created_at'),
      db.from('atlas_lessons').select('lesson_date,concepts').eq('student_id',studentId).eq('voided',false).order('lesson_date',{ascending:false}).limit(80),
      db.from('goals').select('id,title,notes,priority,status').eq('student_id',studentId).eq('status','active').order('priority')
    ]);
    [profileRes,itemsRes,lessonsRes,goalsRes].forEach(r=>{if(r.error) console.warn('Roadmap data',r.error);});
    return {
      learningProfile:profileRes.data || null,
      items:itemsRes.data || [],
      lessons:lessonsRes.data || [],
      goals:goalsRes.data || []
    };
  }

  function readinessBar(n) {
    if (n == null) return '';
    const value=Math.max(0,Math.min(100,Number(n)||0));
    return `<div class="roadmapReadiness" title="Readiness estimate ${value}%"><span style="width:${value}%"></span></div>`;
  }

  function routeCard(item,{suggested=false,coach=false}={}) {
    const cur=window.ATLAS_CURRICULUM_V2;
    const family=item.curriculum_node_id && cur?.meta?.[item.curriculum_node_id] ? cur.familyFor(item.curriculum_node_id)?.name : item.family;
    const state=item.status && !['planned','in_progress','paused','completed'].includes(item.status) ? item.status : null;
    return `<article class="roadmapStop ${suggested?'suggested':''}" data-roadmap-id="${esc(item.id||'')}">
      <div class="roadmapStopTop">
        <div>
          <div class="roadmapMeta">${esc(family||'Personal route')}${state?` · ${esc(state)}`:''}${item.lastSeen?` · seen ${esc(fmtDate(item.lastSeen))}`:''}</div>
          <h4>${esc(item.title)}</h4>
        </div>
        <span class="roadmapSource">${suggested?'Suggested':item.pinned?'Pinned':'Planned'}</span>
      </div>
      ${item.reason?`<p>${esc(item.reason)}</p>`:''}
      ${readinessBar(item.readiness)}
      ${coach&&!suggested?`<div class="roadmapCoachActions">
        <button type="button" data-roadmap-move="next">Next</button>
        <button type="button" data-roadmap-move="coming">Coming</button>
        <button type="button" data-roadmap-move="review">Reinforce</button>
        <button type="button" data-roadmap-move="future">Future</button>
        <button type="button" data-roadmap-complete>Complete</button>
        <button type="button" class="danger" data-roadmap-delete>Delete</button>
      </div>`:''}
      ${coach&&suggested?`<button class="roadmapAddCandidate" type="button" data-roadmap-add-candidate="${esc(item.id)}" data-roadmap-horizon="${esc(item.horizon)}">Add to roadmap</button>`:''}
    </article>`;
  }

  function ensureStudentModule() {
    let root=document.getElementById('studentRoadmapModule');
    if(root) return root;
    const mc=document.getElementById('missionControl');
    const section=mc?.closest('section');
    if(!section) return null;
    root=document.createElement('div');
    root.id='studentRoadmapModule';
    root.className='studentRoadmapModule';
    root.innerHTML='<div class="roadmapLoading">Calculating your route through the curriculum…</div>';
    section.appendChild(root);
    return root;
  }

  function renderStudentRoadmap(data) {
    const root=ensureStudentModule();
    if(!root) return;
    const active=(data.items||[]).filter(x=>x.status!=='completed'&&x.status!=='paused'&&x.student_visible!==false);
    const suggestions=buildSuggestions(data);
    const profile=data.learningProfile;
    const mainGoal=profile?.short_term_goal || profile?.main_goal || data.goals?.[0]?.title || '';
    const horizonHtml=HORIZONS.map(([key,label,subtitle])=>{
      const saved=active.filter(x=>x.horizon===key);
      const auto=suggestions.filter(x=>x.horizon===key).slice(0,key==='future'?3:2);
      const cards=saved.length?saved.map(x=>routeCard(x)).join(''):auto.map(x=>routeCard(x,{suggested:true})).join('');
      if(!cards && key==='future') return '';
      return `<section class="roadmapLane roadmap-${key}">
        <div class="roadmapLaneHead"><div><span>${label}</span><small>${subtitle}</small></div><b>${saved.length?saved.length:auto.length}</b></div>
        <div class="roadmapStops">${cards||'<p class="roadmapEmpty">No stop placed here yet.</p>'}</div>
      </section>`;
    }).join('');
    const persistedCount=active.length;
    root.innerHTML=`
      <div class="roadmapHeader">
        <div><div class="kicker">YOUR FLIGHT PATH</div><h3>Your next classes, mapped to where you are now.</h3></div>
        <a class="smallBtn" href="/zouk-map/#map">Open full Atlas ↗</a>
      </div>
      ${mainGoal?`<div class="roadmapGoal"><span>Current direction</span><strong>${esc(mainGoal)}</strong></div>`:''}
      <p class="roadmapExplainer">Built from your curriculum map, lesson history, goals and Student Compass. ${persistedCount?'Pinned stops are part of your shared plan with Gab.':'Suggested stops are possibilities, not promises; Gab sees the same route on the coach side.'}</p>
      <div class="roadmapLanes">${horizonHtml}</div>`;
  }

  async function loadStudentRoadmap() {
    if(!sessionUser) return;
    const root=ensureStudentModule();
    if(root) root.innerHTML='<div class="roadmapLoading">Calculating your route through the curriculum…</div>';
    try{
      await ensureCurriculum();
      const data=await fetchStudentData(sessionUser.id);
      renderStudentRoadmap(data);
    }catch(err){
      console.error('Student roadmap',err);
      if(root) root.innerHTML='<p class="roadmapEmpty">Your roadmap could not load right now. Your saved plan is unchanged.</p>';
    }
  }

  function selectedStudentIdFromDOM() {
    const href=document.getElementById('coachStudentAtlas')?.getAttribute('href') || '';
    try { return new URL(href,location.origin).searchParams.get('student'); }
    catch { return null; }
  }

  function ensureCoachPanel() {
    const editor=document.getElementById('coachEditor');
    if(!editor) return null;
    let panel=document.getElementById('coachRoadmapPanel');
    if(panel) return panel;
    panel=document.createElement('section');
    panel.id='coachRoadmapPanel';
    panel.className='editorSection roadmapCoachPanel';
    panel.innerHTML='<div class="roadmapLoading">Select a student to open their roadmap.</div>';
    const header=editor.querySelector(':scope > .dashCard');
    if(header) header.after(panel); else editor.prepend(panel);
    return panel;
  }

  function compassForm(profile={}) {
    const field=(name,label,value='',placeholder='')=>`<label><span>${esc(label)}</span><textarea name="${esc(name)}" placeholder="${esc(placeholder)}">${esc(value||'')}</textarea></label>`;
    return `<form id="roadmapCompassForm" class="roadmapCompassForm">
      <div class="roadmapFormHead"><div><span class="badge">Student Compass</span><h3>Why this student is learning</h3><p>Use the onboarding interview here. These fields steer automatic route suggestions.</p></div><button class="smallBtn" type="submit">Save compass</button></div>
      <div class="roadmapCompassGrid">
        ${field('main_goal','Long-term direction',profile.main_goal,'What do they ultimately want from dance?')}
        ${field('short_term_goal','Current objective',profile.short_term_goal,'What matters over the next few classes?')}
        ${field('motivations','Motivations',profile.motivations,'Why do they dance and why do they want to improve?')}
        ${field('preferences','Taste & preferences',profile.preferences,'What kinds of movement, music, roles or topics excite them?')}
        ${field('life_context','Life & practice context',profile.life_context,'Schedule, social dancing, events, other training, competition context…')}
        ${field('constraints','Constraints',profile.constraints,'Time, physical limits, confidence, access to a partner…')}
        <label class="full"><span>Interview / onboarding summary</span><textarea name="interview_summary" placeholder="The useful story from your initial interview: desires, background, fears, priorities, context…">${esc(profile.interview_summary||'')}</textarea></label>
      </div>
      <div class="roadmapFormStatus" id="roadmapCompassStatus"></div>
    </form>`;
  }

  function persistentRoadmapEditor(data) {
    const active=(data.items||[]).filter(x=>x.status!=='completed');
    const groups=HORIZONS.map(([key,label])=>{
      const rows=active.filter(x=>x.horizon===key);
      return `<div class="coachRoadmapLane"><h4>${label}</h4>${rows.length?rows.map(x=>routeCard(x,{coach:true})).join(''):'<p class="roadmapEmpty">Empty</p>'}</div>`;
    }).join('');
    return `<div class="coachRoadmapSaved"><div class="roadmapFormHead"><div><span class="badge">Shared roadmap</span><h3>Planned class route</h3><p>These are the stops the student sees as their shared plan.</p></div></div><div class="coachRoadmapGrid">${groups}</div></div>`;
  }

  function addStopForm() {
    const cur=window.ATLAS_CURRICULUM_V2;
    const options=cur.rawNodes
      .slice().sort((a,b)=>cur.meta[a.id].tier-cur.meta[b.id].tier || cur.displayName(a.id).localeCompare(cur.displayName(b.id)))
      .map(n=>`<option value="${esc(n.id)}">T${esc(cur.meta[n.id].tier)} · ${esc(cur.familyFor(n.id)?.name||'')} · ${esc(cur.displayName(n.id))}</option>`).join('');
    return `<form id="roadmapAddForm" class="roadmapAddForm">
      <div class="roadmapFormHead"><div><span class="badge">Place a stop</span><h3>Add a possible class topic</h3></div><button class="smallBtn" type="submit">Add stop</button></div>
      <div class="roadmapAddGrid">
        <label class="full"><span>Curriculum concept</span><select name="curriculum_node_id"><option value="">Custom topic…</option>${options}</select></label>
        <label><span>Title</span><input name="title" required placeholder="Class topic"></label>
        <label><span>Horizon</span><select name="horizon"><option value="next">Next</option><option value="coming" selected>Coming up</option><option value="review">Reinforce</option><option value="future">Future territory</option></select></label>
        <label><span>Readiness %</span><input name="readiness" type="number" min="0" max="100" placeholder="Optional"></label>
        <label><span>Student visibility</span><select name="student_visible"><option value="true" selected>Visible</option><option value="false">Coach only</option></select></label>
        <label class="full"><span>Why this next?</span><textarea name="reason" placeholder="Why this topic makes sense in their route"></textarea></label>
      </div>
      <div class="roadmapFormStatus" id="roadmapAddStatus"></div>
    </form>`;
  }

  function suggestionsEditor(data) {
    const suggestions=buildSuggestions(data).slice(0,10);
    return `<div class="roadmapSuggestions"><div class="roadmapFormHead"><div><span class="badge">Route engine</span><h3>Candidate next classes</h3><p>Ranked from Atlas status, prerequisites, goals and the Student Compass. Nothing becomes part of the student’s shared plan until you add it.</p></div></div>
      <div class="roadmapSuggestionGrid">${suggestions.length?suggestions.map(x=>routeCard(x,{suggested:true,coach:true})).join(''):'<p class="roadmapEmpty">Add the Student Compass or lesson-map data to improve suggestions.</p>'}</div>
    </div>`;
  }

  async function saveCompass(form,studentId) {
    const status=form.querySelector('#roadmapCompassStatus');
    status.textContent='Saving…';
    const fd=new FormData(form);
    const payload={student_id:studentId,updated_at:new Date().toISOString(),updated_by:sessionUser?.id||null};
    ['main_goal','short_term_goal','motivations','preferences','life_context','constraints','interview_summary'].forEach(k=>payload[k]=String(fd.get(k)||'').trim()||null);
    const {error}=await client.from('mentorship_learning_profiles').upsert(payload,{onConflict:'student_id'});
    status.textContent=error?error.message:'Saved. Suggestions recalculated.';
    if(!error) await loadCoachRoadmap(studentId,true);
  }

  async function addRoadmapItem(payload) {
    const {error}=await client.from('mentorship_roadmap_items').insert(payload);
    if(error) throw error;
  }

  function candidateById(data,id) {
    return buildSuggestions(data).find(x=>x.id===id);
  }

  async function bindCoachPanel(panel,data,studentId) {
    const compass=panel.querySelector('#roadmapCompassForm');
    compass?.addEventListener('submit',e=>{e.preventDefault();saveCompass(compass,studentId);});

    const addForm=panel.querySelector('#roadmapAddForm');
    addForm?.querySelector('[name="curriculum_node_id"]')?.addEventListener('change',e=>{
      const id=e.target.value;
      if(id) addForm.elements.title.value=window.ATLAS_CURRICULUM_V2.displayName(id);
    });
    addForm?.addEventListener('submit',async e=>{
      e.preventDefault();
      const status=panel.querySelector('#roadmapAddStatus');status.textContent='Adding…';
      const fd=new FormData(addForm);const nodeId=String(fd.get('curriculum_node_id')||'')||null;
      try{
        await addRoadmapItem({
          student_id:studentId,curriculum_node_id:nodeId,title:String(fd.get('title')||'').trim(),
          horizon:String(fd.get('horizon')||'coming'),status:'planned',priority:10,
          reason:String(fd.get('reason')||'').trim()||null,
          readiness:fd.get('readiness')?Number(fd.get('readiness')):null,
          pinned:true,student_visible:String(fd.get('student_visible'))!=='false',source:'coach',created_by:sessionUser?.id||null
        });
        status.textContent='Added to the shared roadmap.';
        await loadCoachRoadmap(studentId,true);
      }catch(err){status.textContent=err.message||String(err);}
    });

    panel.querySelectorAll('[data-roadmap-add-candidate]').forEach(btn=>btn.addEventListener('click',async()=>{
      const c=candidateById(data,btn.dataset.roadmapAddCandidate); if(!c)return;
      btn.disabled=true;btn.textContent='Adding…';
      try{
        await addRoadmapItem({student_id:studentId,curriculum_node_id:c.id,title:c.title,horizon:btn.dataset.roadmapHorizon||c.horizon||'coming',status:'planned',priority:10,reason:c.reason,readiness:c.readiness,pinned:true,student_visible:true,source:'system',created_by:sessionUser?.id||null});
        await loadCoachRoadmap(studentId,true);
      }catch(err){btn.disabled=false;btn.textContent=err.message||'Could not add';}
    }));

    panel.querySelectorAll('[data-roadmap-id]').forEach(card=>{
      const id=card.dataset.roadmapId;if(!id)return;
      card.querySelectorAll('[data-roadmap-move]').forEach(btn=>btn.addEventListener('click',async()=>{
        const {error}=await client.from('mentorship_roadmap_items').update({horizon:btn.dataset.roadmapMove,updated_at:new Date().toISOString()}).eq('id',id);
        if(!error) await loadCoachRoadmap(studentId,true);
      }));
      card.querySelector('[data-roadmap-complete]')?.addEventListener('click',async()=>{
        const {error}=await client.from('mentorship_roadmap_items').update({status:'completed',completed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id);
        if(!error) await loadCoachRoadmap(studentId,true);
      });
      card.querySelector('[data-roadmap-delete]')?.addEventListener('click',async()=>{
        if(!confirm('Delete this roadmap stop?'))return;
        const {error}=await client.from('mentorship_roadmap_items').delete().eq('id',id);
        if(!error) await loadCoachRoadmap(studentId,true);
      });
    });
  }

  async function loadCoachRoadmap(studentId,refreshFleet=false) {
    if(!studentId || sessionRole!=='coach') return;
    activeCoachStudentId=studentId;
    const panel=ensureCoachPanel(); if(!panel)return;
    panel.innerHTML='<div class="roadmapLoading">Reading this student’s curriculum route…</div>';
    try{
      await ensureCurriculum();
      const data=await fetchStudentData(studentId);
      if(activeCoachStudentId!==studentId)return;
      panel.innerHTML=`${compassForm(data.learningProfile||{})}${persistentRoadmapEditor(data)}${suggestionsEditor(data)}${addStopForm()}`;
      await bindCoachPanel(panel,data,studentId);
      if(refreshFleet) loadFleetOverview().catch(console.warn);
    }catch(err){
      console.error('Coach roadmap',err);
      panel.innerHTML=`<p class="roadmapEmpty">Could not load roadmap: ${esc(err.message||String(err))}</p>`;
    }
  }

  function ensureFleetOverview() {
    const admin=document.querySelector('.adminOnly');
    if(!admin)return null;
    let root=document.getElementById('roadmapFleetOverview');
    if(root)return root;
    root=document.createElement('section');
    root.id='roadmapFleetOverview';
    root.className='dashCard roadmapFleetOverview';
    const grid=admin.querySelector('.coachOverviewGrid');
    if(grid) grid.after(root); else admin.prepend(root);
    return root;
  }

  async function loadFleetOverview() {
    if(sessionRole!=='coach')return;
    await ensureCurriculum();
    const root=ensureFleetOverview();if(!root)return;
    const studentButtons=[...document.querySelectorAll('[data-student]')];
    const students=[...new Map(studentButtons.map(b=>[b.dataset.student,{id:b.dataset.student,name:b.querySelector('strong')?.textContent?.trim()||b.textContent.trim()}])).values()].filter(x=>x.id);
    if(!students.length){root.innerHTML='<p class="roadmapEmpty">Student roadmaps will appear here when the roster loads.</p>';return;}
    const ids=students.map(s=>s.id);
    const [profilesRes,itemsRes,goalsRes,lessonsRes]=await Promise.all([
      client.from('mentorship_learning_profiles').select('*').in('student_id',ids),
      client.from('mentorship_roadmap_items').select('*').in('student_id',ids).neq('status','completed').order('priority'),
      client.from('goals').select('student_id,title,notes,priority,status').in('student_id',ids).eq('status','active'),
      client.from('atlas_lessons').select('student_id,lesson_date,concepts').in('student_id',ids).eq('voided',false).order('lesson_date',{ascending:false}).limit(500)
    ]);
    const profiles=new Map((profilesRes.data||[]).map(x=>[x.student_id,x]));
    const items=itemsRes.data||[],goals=goalsRes.data||[],lessons=lessonsRes.data||[];
    const cards=students.map(s=>{
      const d={learningProfile:profiles.get(s.id)||null,items:items.filter(x=>x.student_id===s.id),goals:goals.filter(x=>x.student_id===s.id),lessons:lessons.filter(x=>x.student_id===s.id)};
      const saved=d.items.filter(x=>x.status!=='paused').sort((a,b)=>(a.horizon==='next'?-10:0)-(b.horizon==='next'?-10:0)||a.priority-b.priority);
      const suggestions=buildSuggestions(d);
      const route=saved.length?saved.slice(0,3):suggestions.slice(0,3);
      return `<button class="roadmapFleetCard" type="button" data-open-roadmap-student="${esc(s.id)}"><strong>${esc(s.name)}</strong><span>${route.length?route.map(x=>esc(x.title)).join(' → '):'Compass / lesson history needed'}</span><small>${saved.length?'Shared route':'Auto-suggested route'}</small></button>`;
    }).join('');
    root.innerHTML=`<div class="roadmapFormHead"><div><span class="badge">Roadmap fleet</span><h3>Every student’s next direction</h3><p>Open any student to inspect the full route, interview context and candidate classes.</p></div></div><div class="roadmapFleetGrid">${cards}</div>`;
    root.querySelectorAll('[data-open-roadmap-student]').forEach(btn=>btn.addEventListener('click',()=>{
      document.querySelector(`[data-student="${CSS.escape(btn.dataset.openRoadmapStudent)}"]`)?.click();
      setTimeout(()=>document.getElementById('coachRoadmapPanel')?.scrollIntoView({behavior:'smooth',block:'start'}),180);
    }));
  }

  function bindCoachSelectionWatcher() {
    ensureCoachPanel();
    document.addEventListener('click',e=>{
      const btn=e.target.closest('[data-student]');
      if(!btn)return;
      const id=btn.dataset.student;
      if(id) setTimeout(()=>loadCoachRoadmap(id),100);
    });
    const link=document.getElementById('coachStudentAtlas');
    if(link){
      const obs=new MutationObserver(()=>{
        const id=selectedStudentIdFromDOM();
        if(id && id!==activeCoachStudentId) loadCoachRoadmap(id);
      });
      obs.observe(link,{attributes:true,attributeFilter:['href']});
    }
  }

  async function boot() {
    const ctx=await getSessionContext();
    if(!ctx)return;
    await ensureCurriculum();
    let tries=0;
    while(!document.getElementById('dashboardView') && tries++<60) await sleep(100);
    if(ctx.role==='coach'){
      bindCoachSelectionWatcher();
      setTimeout(()=>loadFleetOverview().catch(console.warn),700);
    }
    await loadStudentRoadmap();
    window.addEventListener('focus',()=>{ if(sessionRole!=='coach') loadStudentRoadmap(); });
    document.addEventListener('visibilitychange',()=>{if(!document.hidden && sessionRole!=='coach')loadStudentRoadmap();});
  }

  setTimeout(()=>boot().catch(err=>console.error('Mentorship roadmap',err)),650);
})();
