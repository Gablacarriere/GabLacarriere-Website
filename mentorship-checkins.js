(() => {
  'use strict';
  if (!location.pathname.startsWith('/mentorship-hub')) return;

  const ROLLOUT_DATE = '2026-09-14';
  const FOCUS_AREAS = [
    'Zouk','Lambada','Solo','Partnering','Connection','Technique','Musicality',
    'Competition','Social dancing','Performance','Teaching','Body awareness'
  ];
  const TYPE_LABELS = {
    monthly:'Monthly pulse',
    month_3:'3-month alignment check',
    month_6:'6-month development review',
    month_12:'12-month annual review'
  };
  const STATUS_LABELS = {healthy:'Healthy',review:'Review',priority:'Priority'};

  let db = null;
  let user = null;
  let role = 'mentee';
  let ownStartedOn = null;
  let ownCheckins = [];
  let coachData = null;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = (v='') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const pad = n => String(n).padStart(2,'0');
  const todayLocal = () => {
    const d=new Date();
    return new Date(d.getFullYear(),d.getMonth(),d.getDate());
  };
  const parseDate = value => {
    if (!value) return null;
    const m=String(value).slice(0,10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
  };
  const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const monthKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
  const fmtDate = value => {
    const d=value instanceof Date?value:parseDate(value)||new Date(value);
    if (!d || Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString([], {month:'short',day:'numeric',year:d.getFullYear()!==todayLocal().getFullYear()?'numeric':undefined});
  };
  const addMonthsClamped = (date, months) => {
    const day=date.getDate();
    const target=new Date(date.getFullYear(),date.getMonth()+months,1);
    const last=new Date(target.getFullYear(),target.getMonth()+1,0).getDate();
    target.setDate(Math.min(day,last));
    return target;
  };
  const fullMonthsBetween = (start,end) => {
    let months=(end.getFullYear()-start.getFullYear())*12+(end.getMonth()-start.getMonth());
    if (end < addMonthsClamped(start,months)) months--;
    return Math.max(0,months);
  };
  const maxDate = (a,b) => a>b?a:b;
  const daysBetween = (a,b) => Math.floor((a-b)/86400000);

  async function getClient() {
    while (!window.supabase || !window.GAB_PORTAL?.supabaseUrl) await sleep(100);
    if (!db) db=window.__MENTORSHIP_CHECKIN_DB || (window.__MENTORSHIP_CHECKIN_DB=window.supabase.createClient(window.GAB_PORTAL.supabaseUrl,window.GAB_PORTAL.supabaseAnonKey));
    return db;
  }

  function hasType(checkins,type) {
    return checkins.some(x=>x.checkin_type===type);
  }

  function completedThisMonth(checkins,today) {
    const key=monthKey(today);
    return checkins.some(x=>String(x.completed_at||'').slice(0,7)===key);
  }

  function scheduleFor(startedOn, checkins, now=todayLocal()) {
    const start=parseDate(startedOn);
    if (!start) return {due:null,next:null};
    const rollout=parseDate(ROLLOUT_DATE);
    const elapsed=fullMonthsBetween(start,now);
    let milestone=null;

    if (elapsed>=12 && !hasType(checkins,'month_12')) milestone={type:'month_12',months:12,cycleKey:'milestone:12'};
    else if (elapsed>=6 && elapsed<12 && !hasType(checkins,'month_6')) milestone={type:'month_6',months:6,cycleKey:'milestone:6'};
    else if (elapsed>=3 && elapsed<6 && !hasType(checkins,'month_3')) milestone={type:'month_3',months:3,cycleKey:'milestone:3'};

    if (milestone) {
      milestone.dueOn=maxDate(addMonthsClamped(start,milestone.months),rollout);
      if (now>=milestone.dueOn) return {due:milestone,next:milestone};
      return {due:null,next:milestone};
    }

    const covered=completedThisMonth(checkins,now);
    if (!covered && elapsed>=1) {
      const dueRaw=addMonthsClamped(start,elapsed);
      const dueOn=maxDate(dueRaw,rollout);
      const cycleKey=`monthly:${monthKey(dueOn)}`;
      if (now>=dueOn && !checkins.some(x=>x.cycle_key===cycleKey)) {
        const monthly={type:'monthly',months:elapsed,cycleKey,dueOn};
        return {due:monthly,next:monthly};
      }
    }

    const nextMonthly=addMonthsClamped(start,Math.max(1,elapsed+1));
    const candidates=[{type:'monthly',cycleKey:`monthly:${monthKey(nextMonthly)}`,dueOn:nextMonthly}];
    if (elapsed<3 && !hasType(checkins,'month_3')) candidates.push({type:'month_3',cycleKey:'milestone:3',dueOn:maxDate(addMonthsClamped(start,3),rollout)});
    else if (elapsed<6 && !hasType(checkins,'month_6')) candidates.push({type:'month_6',cycleKey:'milestone:6',dueOn:maxDate(addMonthsClamped(start,6),rollout)});
    else if (elapsed<12 && !hasType(checkins,'month_12')) candidates.push({type:'month_12',cycleKey:'milestone:12',dueOn:maxDate(addMonthsClamped(start,12),rollout)});
    candidates.sort((a,b)=>a.dueOn-b.dueOn);
    return {due:null,next:candidates[0]||null};
  }

  function trendLabel(value) {
    return ({baseline:'Baseline',stable:'Stable',improving:'Improving ↑',slow_decline:'Slow decline ↓',sudden_decline:'Sudden decline ↓↓',volatile:'Volatile ↕'})[value] || '—';
  }

  function typeIntro(type) {
    if (type==='month_3') return 'Let’s check whether the direction we chose still fits you and shape the next phase.';
    if (type==='month_6') return 'You’ve built six months of experience. Let’s compare what changed and decide what deserves more attention next.';
    if (type==='month_12') return 'Let’s look at the year as a whole: where you started, what changed, and what you want the next year to become.';
    return 'A short pulse so the mentorship can stay aligned with what you need right now.';
  }

  function ensureStudentCard() {
    let root=document.getElementById('mentorshipCheckinCard');
    if (root) return root;
    const grid=document.querySelector('.studentArea .portalGrid');
    if (!grid) return null;
    root=document.createElement('article');
    root.id='mentorshipCheckinCard';
    root.className='dashCard mentorshipCheckinCard';
    grid.prepend(root);
    return root;
  }

  function studentCardMarkup(schedule) {
    const latest=ownCheckins[0]||null;
    const history=ownCheckins.slice(0,3);
    if (schedule.due) {
      return `<div class="checkinCardTop">
        <div><div class="kicker">MENTORSHIP CHECK-IN</div><span class="checkinDuePill">Due now</span>
          <h3>${esc(TYPE_LABELS[schedule.due.type])}</h3><p>${esc(typeIntro(schedule.due.type))}</p></div>
        <button class="btn" type="button" data-start-checkin>Start check-in</button>
      </div>
      ${history.length?`<div class="checkinMiniHistory">${history.map(x=>`<span>${fmtDate(x.completed_at)} · Progress ${x.progress_score}/10</span>`).join('')}</div>`:''}`;
    }
    const next=schedule.next;
    return `<div class="checkinCardTop">
      <div><div class="kicker">MENTORSHIP CHECK-IN</div><span class="checkinHealthyPill">Up to date</span>
        <h3>${latest?'Your mentorship pulse is current':'Your check-ins will live here'}</h3>
        <p>${next?`Next check-in: <strong>${esc(fmtDate(next.dueOn))}</strong> · ${esc(TYPE_LABELS[next.type])}.`:'No check-in is due right now.'}</p></div>
      ${ownCheckins.length?'<button class="smallBtn" type="button" data-checkin-history>View history</button>':''}
    </div>
    ${latest?`<div class="checkinLast"><span>Last progress <b>${latest.progress_score}/10</b></span><span>${esc(trendLabel(latest.progress_trend))}</span></div>`:''}`;
  }

  function bindStudentCard(schedule) {
    const root=document.getElementById('mentorshipCheckinCard');
    if (!root) return;
    root.querySelector('[data-start-checkin]')?.addEventListener('click',()=>openCheckinModal(schedule.due));
    root.querySelector('[data-checkin-history]')?.addEventListener('click',openHistoryModal);
  }

  function scaleQuestion(name,label,help='') {
    return `<fieldset class="checkinFieldset"><legend>${esc(label)}</legend>${help?`<p class="checkinHelp">${esc(help)}</p>`:''}<div class="scoreScale">
      ${Array.from({length:10},(_,i)=>i+1).map(n=>`<label><input type="radio" name="${esc(name)}" value="${n}" required><span>${n}</span></label>`).join('')}
    </div><div class="scaleEnds"><span>Low</span><span>High</span></div></fieldset>`;
  }

  function challengeQuestion() {
    const options=[[-2,'Much too easy'],[-1,'A little too easy'],[0,'Just right'],[1,'A little too difficult'],[2,'Much too difficult']];
    return `<fieldset class="checkinFieldset"><legend>How does the current level of challenge feel?</legend><div class="challengeChoices">
      ${options.map(([v,l])=>`<label><input type="radio" name="challenge_fit" value="${v}" required><span>${esc(l)}</span></label>`).join('')}
    </div></fieldset>`;
  }

  function focusAreasMarkup() {
    return `<fieldset class="checkinFieldset"><legend>What would you like more focus on?</legend><p class="checkinHelp">Choose any that matter for the next phase.</p><div class="focusChoices">
      ${FOCUS_AREAS.map(x=>`<label><input type="checkbox" name="focus_areas" value="${esc(x)}"><span>${esc(x)}</span></label>`).join('')}
    </div></fieldset>`;
  }

  function majorQuestions(type) {
    const common=`
      ${scaleQuestion('goal_alignment_score','How well does your current training match your goals?')}
      ${scaleQuestion('support_score','How supported and understood do you feel in the mentorship?')}
      ${scaleQuestion('experience_score','How would you rate your overall mentorship experience right now?')}
      <label class="checkinText"><span>What feels like your biggest current bottleneck?</span><textarea name="bottleneck" maxlength="2000" placeholder="What still feels unreliable, confusing, or stuck?"></textarea></label>
      <label class="checkinToggle"><input type="checkbox" name="goals_changed"><span>My goals have changed since my previous checkpoint.</span></label>
      ${focusAreasMarkup()}
      <label class="checkinText"><span>What would you like more of?</span><textarea name="what_more" maxlength="2000"></textarea></label>
      <label class="checkinText"><span>What would you like less of or differently?</span><textarea name="what_less" maxlength="2000"></textarea></label>`;
    if (type==='month_3') return `
      <label class="checkinText"><span>What has improved the most so far?</span><textarea name="biggest_improvement" maxlength="2000"></textarea></label>
      ${common}
      <label class="checkinText"><span>What would make the next 3 months feel successful?</span><textarea name="success_next" maxlength="2000"></textarea></label>
      <label class="checkinText"><span>Is anything currently frustrating or unclear?</span><textarea name="friction" maxlength="2000"></textarea></label>`;
    if (type==='month_6') return `
      <label class="checkinText"><span>What has improved the most over the last 6 months?</span><textarea name="biggest_improvement" maxlength="2000"></textarea></label>
      ${common}
      <label class="checkinText"><span>What can you do now that used to feel difficult?</span><textarea name="new_strengths" maxlength="2000"></textarea></label>
      <label class="checkinText"><span>What should we change for your next 6 months?</span><textarea name="success_next" maxlength="2000"></textarea></label>`;
    return `
      <label class="checkinText"><span>What accomplishment are you most proud of?</span><textarea name="proud_of" maxlength="2000"></textarea></label>
      <label class="checkinText"><span>Where have you changed most as a dancer?</span><textarea name="biggest_change" maxlength="2000"></textarea></label>
      ${common}
      <label class="checkinText"><span>What hasn’t improved as much as you hoped?</span><textarea name="lagging" maxlength="2000"></textarea></label>
      <label class="checkinText"><span>What do you want your dancing to look like one year from now?</span><textarea name="next_year" maxlength="2000"></textarea></label>
      <label class="checkinText"><span>If you could redesign one part of the mentorship, what would you change?</span><textarea name="redesign" maxlength="2000"></textarea></label>`;
  }

  function ensureModal() {
    let modal=document.getElementById('mentorshipCheckinModal');
    if (modal) return modal;
    modal=document.createElement('div');
    modal.id='mentorshipCheckinModal';
    modal.className='checkinModal hidden';
    modal.innerHTML='<div class="checkinBackdrop" data-close-checkin></div><div class="checkinDialog" role="dialog" aria-modal="true"><button class="checkinClose" type="button" aria-label="Close" data-close-checkin>×</button><div id="checkinModalBody"></div></div>';
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-close-checkin]').forEach(x=>x.addEventListener('click',closeModal));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.classList.contains('hidden'))closeModal();});
    return modal;
  }

  function openCheckinModal(meta) {
    if (!meta) return;
    const modal=ensureModal();
    const body=modal.querySelector('#checkinModalBody');
    const major=meta.type!=='monthly';
    body.innerHTML=`<div class="checkinIntro"><div class="kicker">${major?'MENTORSHIP REVIEW':'MONTHLY PULSE'}</div><h2>${esc(TYPE_LABELS[meta.type])}</h2><p>${esc(typeIntro(meta.type))}</p></div>
      <form id="mentorshipCheckinForm" class="checkinForm">
        ${scaleQuestion('progress_score','How do you feel about your progress right now?')}
        ${scaleQuestion('clarity_score','How clear are you about what you should focus on next?')}
        ${challengeQuestion()}
        ${major?majorQuestions(meta.type):`<label class="checkinText"><span>Is there anything you need from the mentorship right now?</span><textarea name="need" maxlength="2000" placeholder="Optional"></textarea></label>`}
        <div class="checkinSignals">
          <label class="checkinToggle"><input type="checkbox" name="wants_conversation"><span>I’d like to talk with Gab about something.</span></label>
          ${major?'<label class="checkinToggle"><input type="checkbox" name="considering_leaving"><span>I’m unsure whether the mentorship still fits what I need.</span></label>':''}
        </div>
        <div class="checkinSubmitRow"><button class="btn" type="submit">Submit check-in</button><span id="checkinSubmitStatus" class="checkinSubmitStatus"></span></div>
      </form>`;
    const form=body.querySelector('#mentorshipCheckinForm');
    form.dataset.type=meta.type;
    form.dataset.cycleKey=meta.cycleKey;
    form.dataset.dueOn=isoDate(meta.dueOn);
    form.addEventListener('submit',submitCheckin);
    modal.classList.remove('hidden');
    document.body.classList.add('checkinModalOpen');
    setTimeout(()=>body.querySelector('input')?.focus(),60);
  }

  function closeModal() {
    document.getElementById('mentorshipCheckinModal')?.classList.add('hidden');
    document.body.classList.remove('checkinModalOpen');
  }

  function formBool(fd,key) { return fd.get(key)==='on'; }
  function formText(fd,key) { return String(fd.get(key)||'').trim(); }

  async function submitCheckin(e) {
    e.preventDefault();
    const form=e.currentTarget;
    const status=form.querySelector('#checkinSubmitStatus');
    const button=form.querySelector('button[type="submit"]');
    const fd=new FormData(form);
    const type=form.dataset.type;
    const focus=fd.getAll('focus_areas').map(String);
    const responses={
      need:formText(fd,'need'),
      biggest_improvement:formText(fd,'biggest_improvement'),
      bottleneck:formText(fd,'bottleneck'),
      new_strengths:formText(fd,'new_strengths'),
      success_next:formText(fd,'success_next'),
      friction:formText(fd,'friction'),
      proud_of:formText(fd,'proud_of'),
      biggest_change:formText(fd,'biggest_change'),
      lagging:formText(fd,'lagging'),
      next_year:formText(fd,'next_year'),
      redesign:formText(fd,'redesign'),
      what_more:formText(fd,'what_more'),
      what_less:formText(fd,'what_less'),
      goals_changed:formBool(fd,'goals_changed'),
      wants_conversation:formBool(fd,'wants_conversation'),
      considering_leaving:formBool(fd,'considering_leaving'),
      focus_areas:focus
    };
    Object.keys(responses).forEach(k=>{if(responses[k]===''||(Array.isArray(responses[k])&&!responses[k].length))delete responses[k];});
    button.disabled=true;
    status.textContent='Saving…';
    try {
      const client=await getClient();
      const major=type!=='monthly';
      const {error}=await client.rpc('submit_mentorship_checkin',{
        p_checkin_type:type,
        p_cycle_key:form.dataset.cycleKey,
        p_due_on:form.dataset.dueOn,
        p_progress_score:Number(fd.get('progress_score')),
        p_clarity_score:Number(fd.get('clarity_score')),
        p_goal_alignment_score:major?Number(fd.get('goal_alignment_score')):null,
        p_support_score:major?Number(fd.get('support_score')):null,
        p_experience_score:major?Number(fd.get('experience_score')):null,
        p_challenge_fit:Number(fd.get('challenge_fit')),
        p_responses:responses
      });
      if (error) throw error;
      status.textContent='Saved. This will help shape your next phase.';
      await loadOwnCheckins();
      renderStudentModule();
      if (role==='coach') loadCoachPulse().catch(console.warn);
      setTimeout(closeModal,850);
    } catch(err) {
      status.textContent=err.message||'Could not save the check-in.';
      button.disabled=false;
    }
  }

  function openHistoryModal() {
    const modal=ensureModal();
    const body=modal.querySelector('#checkinModalBody');
    body.innerHTML=`<div class="checkinIntro"><div class="kicker">YOUR HISTORY</div><h2>Mentorship check-ins</h2><p>A record of how your experience and priorities have changed over time.</p></div>
      <div class="checkinHistoryList">${ownCheckins.length?ownCheckins.map(x=>`<article class="checkinHistoryItem"><div><span class="badge">${esc(TYPE_LABELS[x.checkin_type]||x.checkin_type)}</span><h3>${fmtDate(x.completed_at)}</h3></div><div class="checkinHistoryScores"><span>Progress <b>${x.progress_score}/10</b></span><span>Clarity <b>${x.clarity_score}/10</b></span>${x.goal_alignment_score?`<span>Alignment <b>${x.goal_alignment_score}/10</b></span>`:''}</div><p>${esc(trendLabel(x.progress_trend))}</p></article>`).join(''):'<p class="empty">No check-ins yet.</p>'}</div>`;
    modal.classList.remove('hidden');
    document.body.classList.add('checkinModalOpen');
  }

  async function loadOwnCheckins() {
    const client=await getClient();
    const [startRes,checkRes]=await Promise.all([
      client.rpc('my_mentorship_started_on'),
      client.from('mentorship_checkins').select('*').eq('student_id',user.id).order('completed_at',{ascending:false})
    ]);
    if (startRes.error) console.warn('Check-in start date',startRes.error);
    if (checkRes.error) throw checkRes.error;
    ownStartedOn=startRes.data||null;
    ownCheckins=checkRes.data||[];
  }

  function renderStudentModule() {
    const root=ensureStudentCard();
    if (!root) return;
    const schedule=scheduleFor(ownStartedOn,ownCheckins);
    root.innerHTML=studentCardMarkup(schedule);
    bindStudentCard(schedule);
  }

  function ensureCoachModule() {
    let root=document.getElementById('mentorshipPulseModule');
    if (root) return root;
    const admin=document.querySelector('section.adminOnly');
    if (!admin) return null;
    root=document.createElement('div');
    root.id='mentorshipPulseModule';
    root.className='mentorshipPulseModule';
    admin.prepend(root);
    return root;
  }

  function latestByStudent(checkins) {
    const map=new Map();
    checkins.forEach(x=>{if(!map.has(x.student_id))map.set(x.student_id,x);});
    return map;
  }

  function checkinsFor(checkins,studentId) {
    return checkins.filter(x=>x.student_id===studentId).sort((a,b)=>String(b.completed_at).localeCompare(String(a.completed_at)));
  }

  function effectiveStatus(student,rows) {
    const latest=rows[0]||null;
    const schedule=scheduleFor(student.started_on,rows);
    if (latest?.health_status==='priority') return {status:'priority',reason:(latest.health_reasons||[])[0]||'Priority check-in signal',schedule};
    if (latest?.health_status==='review') return {status:'review',reason:(latest.health_reasons||[])[0]||'Check-in needs review',schedule};
    if (schedule.due) {
      const overdue=daysBetween(todayLocal(),schedule.due.dueOn);
      if (overdue>=7) return {status:'review',reason:`Check-in is ${overdue} days overdue.`,schedule};
      return {status:'awaiting',reason:'Check-in is due.',schedule};
    }
    return {status:latest?'healthy':'awaiting',reason:latest?'No action needed.':'No check-in data yet.',schedule};
  }

  function focusCounts(checkins) {
    const cutoff=Date.now()-90*86400000;
    const counts=new Map();
    checkins.filter(x=>new Date(x.completed_at).getTime()>=cutoff).forEach(x=>{
      const areas=Array.isArray(x.responses?.focus_areas)?x.responses.focus_areas:[];
      areas.forEach(a=>counts.set(a,(counts.get(a)||0)+1));
    });
    return [...counts.entries()].sort((a,b)=>b[1]-a[1]);
  }

  function cohortInsight(students,latestMap,focus) {
    const high=students.filter(s=>(latestMap.get(s.student_id)?.challenge_fit||0)>0).length;
    const low=students.filter(s=>(latestMap.get(s.student_id)?.challenge_fit||0)<0).length;
    if (high>=3) return `${high} students currently report that the challenge feels high. Consider whether workload or sequencing needs a program-level adjustment.`;
    if (low>=3) return `${low} students currently want more challenge. Consider whether a cohort-level progression option would help.`;
    if (focus[0]?.[1]>=3) return `${focus[0][1]} students recently requested more ${focus[0][0]}. This may be a program-level signal rather than separate individual requests.`;
    return 'No strong cohort-level pattern is emerging yet.';
  }

  function statusPill(status) {
    const label=status==='awaiting'?'Awaiting':STATUS_LABELS[status]||status;
    return `<span class="pulseStatus pulse-${esc(status)}">${esc(label)}</span>`;
  }

  function renderCoachOverview() {
    const root=ensureCoachModule();
    if (!root || !coachData) return;
    const {students,checkins,suggestions}=coachData;
    const latestMap=latestByStudent(checkins);
    const records=students.map(s=>{
      const rows=checkinsFor(checkins,s.student_id);
      return {...s,rows,...effectiveStatus(s,rows)};
    });
    const counts={healthy:0,review:0,priority:0,awaiting:0};
    records.forEach(r=>counts[r.status]=(counts[r.status]||0)+1);
    const focus=focusCounts(checkins);
    const rank={priority:0,review:1,awaiting:2,healthy:3};
    records.sort((a,b)=>rank[a.status]-rank[b.status]||String(a.display_name).localeCompare(String(b.display_name)));
    const pending=suggestions.filter(x=>x.status==='pending').length;
    root.innerHTML=`<div class="kicker">MENTORSHIP PULSE</div>
      <div class="dashCard pulseOverviewCard">
        <div class="pulseHeader"><div><span class="badge">Check-in system</span><h2>Mentorship health</h2><p class="muted">Longitudinal progress, alignment and experience signals. Only decisions that may need you are surfaced.</p></div><div class="pulsePending"><b>${pending}</b><span>pending decisions</span></div></div>
        <div class="pulseMetrics"><button data-pulse-filter="healthy"><b>${counts.healthy}</b><span>Healthy</span></button><button data-pulse-filter="review"><b>${counts.review}</b><span>Review</span></button><button data-pulse-filter="priority"><b>${counts.priority}</b><span>Priority</span></button><button data-pulse-filter="awaiting"><b>${counts.awaiting}</b><span>Awaiting</span></button></div>
        <div class="pulseInsight"><strong>Cohort signal</strong><p>${esc(cohortInsight(students,latestMap,focus))}</p>${focus.length?`<div class="pulseFocus">${focus.slice(0,4).map(([k,v])=>`<span>${esc(k)} · ${v}</span>`).join('')}</div>`:''}</div>
        <div class="pulseRoster" id="pulseRoster">${records.map(r=>studentRow(r)).join('')}</div>
        <div id="pulseStudentDetail" class="pulseStudentDetail"><p class="empty">Choose a student to see what changed and review suggested adaptations.</p></div>
      </div>`;
    root.querySelectorAll('[data-pulse-student]').forEach(btn=>btn.addEventListener('click',()=>renderCoachStudent(btn.dataset.pulseStudent)));
    root.querySelectorAll('[data-pulse-filter]').forEach(btn=>btn.addEventListener('click',()=>filterCoachRows(btn.dataset.pulseFilter,btn)));
  }

  function studentRow(r) {
    const latest=r.rows[0];
    const next=r.schedule?.due?`Due ${fmtDate(r.schedule.due.dueOn)}`:r.schedule?.next?`Next ${fmtDate(r.schedule.next.dueOn)}`:'Up to date';
    return `<button class="pulseStudentRow" type="button" data-pulse-student="${esc(r.student_id)}" data-pulse-status="${esc(r.status)}"><div><strong>${esc(r.display_name)}</strong><small>${latest?`Progress ${latest.progress_score}/10 · ${esc(trendLabel(latest.progress_trend))}`:'No check-in yet'}</small></div><div class="pulseStudentRight">${statusPill(r.status)}<small>${esc(next)}</small></div></button>`;
  }

  function filterCoachRows(status,button) {
    const root=document.getElementById('mentorshipPulseModule');
    const active=button.classList.toggle('active');
    root.querySelectorAll('[data-pulse-filter]').forEach(b=>{if(b!==button)b.classList.remove('active');});
    root.querySelectorAll('.pulseStudentRow').forEach(row=>row.classList.toggle('hidden',active&&row.dataset.pulseStatus!==status));
  }

  function responseSummary(responses={}) {
    const keys=[
      ['biggest_improvement','Biggest improvement'],['proud_of','Proudest accomplishment'],['biggest_change','Biggest change'],
      ['bottleneck','Current bottleneck'],['new_strengths','New strengths'],['success_next','Next phase'],
      ['need','Needs right now'],['what_more','Wants more'],['what_less','Wants less / different'],['friction','Friction'],
      ['lagging','Lagging'],['next_year','Next-year vision'],['redesign','Would redesign']
    ];
    const rows=keys.filter(([k])=>responses[k]).map(([k,label])=>`<div class="pulseAnswer"><span>${esc(label)}</span><p>${esc(responses[k])}</p></div>`);
    if (Array.isArray(responses.focus_areas)&&responses.focus_areas.length) rows.push(`<div class="pulseAnswer"><span>Requested focus</span><div class="pulseFocus">${responses.focus_areas.map(x=>`<span>${esc(x)}</span>`).join('')}</div></div>`);
    if (responses.goals_changed) rows.push('<div class="pulseAnswer"><span>Goal change</span><p>Student says their goals changed.</p></div>');
    return rows.join('')||'<p class="empty">No written notes on this check-in.</p>';
  }

  function scoreGrid(x) {
    const cells=[['Progress',x.progress_score],['Clarity',x.clarity_score],['Goal alignment',x.goal_alignment_score],['Support',x.support_score],['Experience',x.experience_score]].filter(([,v])=>v!=null);
    return `<div class="pulseScores">${cells.map(([k,v])=>`<div><span>${esc(k)}</span><b>${v}/10</b></div>`).join('')}<div><span>Challenge</span><b>${x.challenge_fit===0?'Just right':x.challenge_fit<0?'Too low':'Too high'}</b></div></div>`;
  }

  function renderCoachStudent(studentId) {
    if (!coachData) return;
    const student=coachData.students.find(x=>x.student_id===studentId);
    const rows=checkinsFor(coachData.checkins,studentId);
    const latest=rows[0];
    const suggestions=coachData.suggestions.filter(x=>x.student_id===studentId);
    const target=document.getElementById('pulseStudentDetail');
    if (!target || !student) return;
    if (!latest) {
      const schedule=scheduleFor(student.started_on,rows);
      target.innerHTML=`<div class="pulseDetailHead"><div><span class="badge">${esc(student.display_name)}</span><h3>No check-in yet</h3><p>${schedule.due?`${esc(TYPE_LABELS[schedule.due.type])} is due now.`:schedule.next?`Next check-in is ${esc(fmtDate(schedule.next.dueOn))}.`:'No check-in is due.'}</p></div></div>`;
      return;
    }
    const prior=rows[1];
    const changes=prior?`<div class="pulseChangeLine"><span>Progress</span><b>${prior.progress_score} → ${latest.progress_score}</b></div><div class="pulseChangeLine"><span>Clarity</span><b>${prior.clarity_score} → ${latest.clarity_score}</b></div>${prior.goal_alignment_score&&latest.goal_alignment_score?`<div class="pulseChangeLine"><span>Goal alignment</span><b>${prior.goal_alignment_score} → ${latest.goal_alignment_score}</b></div>`:''}`:'<p class="empty">This is the baseline check-in.</p>';
    target.innerHTML=`<div class="pulseDetailHead"><div><span class="badge">${esc(student.display_name)}</span><h3>${esc(TYPE_LABELS[latest.checkin_type])} · ${fmtDate(latest.completed_at)}</h3><p>${statusPill(latest.health_status)} <span class="pulseTrend">${esc(trendLabel(latest.progress_trend))}</span></p></div><div class="editorActions"><button class="smallBtn" type="button" data-open-roadmap>Open roadmap</button><button class="smallBtn" type="button" data-mark-checkin-reviewed>Mark reviewed</button></div></div>
      ${scoreGrid(latest)}
      <div class="pulseDetailGrid"><section><h4>What changed?</h4>${changes}</section><section><h4>Why it was flagged</h4>${(latest.health_reasons||[]).length?`<ul>${latest.health_reasons.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="empty">No alert reason. This check-in is healthy.</p>'}</section></div>
      <section class="pulseAnswers"><h4>Student responses</h4>${responseSummary(latest.responses||{})}</section>
      <section class="pulseSuggestions"><h4>Suggested adaptations</h4>${suggestions.length?suggestions.map(s=>suggestionCard(s)).join(''):'<p class="empty">No adaptation suggested for this student right now.</p>'}</section>
      <section class="pulseTimeline"><h4>Check-in history</h4><div>${rows.slice(0,6).map(x=>`<span>${fmtDate(x.completed_at)} · ${x.progress_score}/10 · ${esc(trendLabel(x.progress_trend))}</span>`).join('')}</div></section>
      <div class="reviewStatus" id="pulseDecisionStatus"></div>`;
    target.querySelector('[data-open-roadmap]')?.addEventListener('click',()=>openStudentRoadmap(studentId));
    target.querySelector('[data-mark-checkin-reviewed]')?.addEventListener('click',()=>markCheckinReviewed(latest.id));
    target.querySelectorAll('[data-suggestion-action]').forEach(btn=>btn.addEventListener('click',()=>decideSuggestion(btn.dataset.suggestionId,btn.dataset.suggestionAction)));
  }

  function suggestionCard(s) {
    return `<article class="pulseSuggestion pulseSuggestion-${esc(s.status)}"><div><span class="pulseKind">${esc(s.kind.replaceAll('_',' '))}</span><h5>${esc(s.title)}</h5><p>${esc(s.detail)}</p>${s.coach_note?`<small>Coach note: ${esc(s.coach_note)}</small>`:''}</div><div class="editorActions">${s.status==='pending'?`<button class="smallBtn" type="button" data-suggestion-id="${esc(s.id)}" data-suggestion-action="approved">Approve</button><button class="smallBtn" type="button" data-suggestion-id="${esc(s.id)}" data-suggestion-action="modified">Modify</button><button class="smallBtn" type="button" data-suggestion-id="${esc(s.id)}" data-suggestion-action="dismissed">Dismiss</button>`:`<span class="pulseStatus pulse-${s.status==='dismissed'?'awaiting':'healthy'}">${esc(s.status)}</span>`}</div></article>`;
  }

  async function decideSuggestion(id,status) {
    let note=null;
    if (status==='modified') {
      note=window.prompt('What would you change about this suggestion?','');
      if (note===null) return;
    }
    const el=document.getElementById('pulseDecisionStatus');
    if (el) el.textContent='Saving decision…';
    try {
      const client=await getClient();
      const {error}=await client.rpc('decide_mentorship_checkin_suggestion',{p_suggestion_id:id,p_status:status,p_coach_note:note});
      if (error) throw error;
      if (el) el.textContent='Decision saved.';
      const selected=coachData.suggestions.find(x=>x.id===id)?.student_id;
      await loadCoachPulse();
      if (selected) renderCoachStudent(selected);
    } catch(err) { if(el)el.textContent=err.message||'Could not save decision.'; }
  }

  async function markCheckinReviewed(id) {
    const note=window.prompt('Optional teacher note for this check-in:','');
    if (note===null) return;
    const el=document.getElementById('pulseDecisionStatus');
    if (el) el.textContent='Saving review…';
    try {
      const client=await getClient();
      const {error}=await client.rpc('review_mentorship_checkin',{p_checkin_id:id,p_status:'approved',p_teacher_note:note||null});
      if (error) throw error;
      if (el) el.textContent='Check-in marked reviewed.';
      const selected=coachData.checkins.find(x=>x.id===id)?.student_id;
      await loadCoachPulse();
      if (selected) renderCoachStudent(selected);
    } catch(err) { if(el)el.textContent=err.message||'Could not save review.'; }
  }

  function openStudentRoadmap(studentId) {
    document.querySelector('[data-mode="coach"]')?.click();
    setTimeout(()=>{
      document.querySelector(`[data-student="${CSS.escape(studentId)}"]`)?.click();
      setTimeout(()=>document.getElementById('coachRoadmapPanel')?.scrollIntoView({behavior:'smooth',block:'start'}),220);
    },120);
  }

  async function loadCoachPulse() {
    if (role!=='coach') return;
    const client=await getClient();
    const [studentsRes,checkinsRes,suggestionsRes]=await Promise.all([
      client.rpc('get_mentorship_checkin_roster'),
      client.from('mentorship_checkins').select('*').order('completed_at',{ascending:false}).limit(1000),
      client.from('mentorship_checkin_suggestions').select('*').order('created_at',{ascending:false}).limit(1000)
    ]);
    if (studentsRes.error) throw studentsRes.error;
    if (checkinsRes.error) throw checkinsRes.error;
    if (suggestionsRes.error) throw suggestionsRes.error;
    coachData={students:studentsRes.data||[],checkins:checkinsRes.data||[],suggestions:suggestionsRes.data||[]};
    renderCoachOverview();
  }

  async function boot() {
    const client=await getClient();
    const {data:{session}}=await client.auth.getSession();
    if (!session) return;
    user=session.user;
    const {data:profile,error}=await client.from('profiles').select('role').eq('id',user.id).maybeSingle();
    if (error) throw error;
    role=profile?.role||'mentee';
    await loadOwnCheckins();
    renderStudentModule();
    if (role==='coach') await loadCoachPulse();

    let timer=null;
    const root=document.getElementById('dashboardView')||document.body;
    new MutationObserver(()=>{
      clearTimeout(timer);
      timer=setTimeout(()=>{
        if (!document.getElementById('mentorshipCheckinCard')) renderStudentModule();
        if (role==='coach'&&!document.getElementById('mentorshipPulseModule')) renderCoachOverview();
      },120);
    }).observe(root,{childList:true,subtree:true});

    window.addEventListener('focus',()=>{
      loadOwnCheckins().then(renderStudentModule).catch(()=>{});
      if(role==='coach')loadCoachPulse().catch(()=>{});
    });
  }

  setTimeout(()=>boot().catch(err=>console.warn('Mentorship check-ins',err)),950);
})();
