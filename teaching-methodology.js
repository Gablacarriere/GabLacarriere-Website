(() => {
  'use strict';
  const root = document.getElementById('teachingWorkbench');
  const METHOD = window.GAB_METHODOLOGY;
  if (!root || !METHOD) return;

  const CURR = window.GAB_CURRICULUM;
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const val = key => root.querySelector(`[data-field="${key}"]`)?.value?.trim() || '';
  const checkedConcepts = () => [...root.querySelectorAll('[data-concept-set="conceptIds"]:checked')].map(el => el.dataset.concept);
  const field = key => root.querySelector(`[data-field="${key}"]`);
  const hasDomain = (text, domain) => new RegExp(`(^|\\n)\\s*${domain}\\s*:`, 'im').test(text || '');

  function item(label, ok, prompt) {
    return `<li class="methodologyCheck ${ok ? 'methodologyOk' : 'methodologyPrompt'}"><span aria-hidden="true">${ok ? '✓' : '○'}</span><div><strong>${esc(label)}</strong>${prompt ? `<small>${esc(prompt)}</small>` : ''}</div></li>`;
  }

  function selectedAdvancedConcept() {
    if (!CURR?.concept) return false;
    return checkedConcepts().some(id => METHOD.safety.advancedFamilies.includes(CURR.concept(id)?.family));
  }

  function movementClassSelected() {
    if (!CURR?.concept) return true;
    const selected = checkedConcepts().map(id => CURR.concept(id)).filter(Boolean);
    if (!selected.length) return true;
    return selected.some(c => c.kind === 'pattern' || !['learning','projection'].includes(c.family));
  }

  function setField(key, value) {
    const el = field(key);
    if (!el) return false;
    el.value = value;
    el.dispatchEvent(new Event('input', {bubbles:true}));
    return true;
  }

  function applyOutcomeTemplate() {
    const isCourse = root.dataset.tool === 'curriculum-planner';
    const key = isCourse ? 'goals' : 'goal';
    const current = val(key);
    const missing = METHOD.outcomeDomains.filter(d => !hasDomain(current, d.name));
    if (!missing.length) return;
    let next = current;
    if (current && !METHOD.outcomeDomains.some(d => hasDomain(current, d.name))) next = `${isCourse ? 'Overall direction' : 'Primary learning focus'}: ${current}`;
    const additions = missing.map(d => `${d.name}: `).join('\n');
    next = `${next ? next.trim() + '\n\n' : ''}${additions}`;
    setField(key, next);
    field(key)?.focus();
  }

  function applyReflectionTemplate() {
    const current = val('reflection');
    const missing = METHOD.reflectionLoop.fields.filter(label => !new RegExp(`(^|\\n)\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`, 'im').test(current));
    if (!missing.length) return;
    const additions = missing.map(label => `${label}: `).join('\n');
    setField('reflection', `${current ? current.trim() + '\n\n' : ''}${additions}`);
    field('reflection')?.focus();
  }

  function activityInputs() {
    return [...root.querySelectorAll('[data-activity][data-field="title"]')].map(title => {
      const id = title.dataset.activity;
      return {id,title,minutes:root.querySelector(`[data-activity="${CSS.escape(id)}"][data-field="minutes"]`),instructions:root.querySelector(`[data-activity="${CSS.escape(id)}"][data-field="instructions"]`)};
    });
  }

  function setActivity(row, template) {
    if (!row) return;
    row.title.value = template.title;
    row.title.dispatchEvent(new Event('input',{bubbles:true}));
    if (row.minutes) { row.minutes.value=String(template.minutes); row.minutes.dispatchEvent(new Event('input',{bubbles:true})); }
    if (row.instructions) { row.instructions.value=template.instructions; row.instructions.dispatchEvent(new Event('input',{bubbles:true})); }
  }

  function buildArchitecture() {
    if (root.dataset.tool !== 'session-planner' || activityInputs().length) return;
    const add = () => root.querySelector('[data-action="addActivity"]')?.click();
    for (let i=0;i<8;i++) add();
    const templates = [
      {title:'General warm-up',minutes:6,instructions:'Raise overall readiness first. Move the whole body through comfortable, progressive ranges with continuous movement, weight shifts and broad joint preparation. Do not turn the general warm-up into the technical class.'},
      {title:'Specific warm-up · targeted drills',minutes:8,instructions:'Prepare the exact ranges, tissues, timing, coordination, connection states and movement mechanisms required later. Include one or more specific drills that rehearse prerequisites or simplified pieces of today’s movements.'},
      {title:'Show the class movements · destination',minutes:4,instructions:'Demonstrate the movement sequence or the small set of movements students will learn. Let them see the destination, then explain that the sequence will be cut into smaller movement units and rebuilt.'},
      {title:'Movement 1 · problem → exercise → supported practice',minutes:12,instructions:'Show and isolate Movement 1. Let students attempt it. Identify the primary problem that actually appears. Choose at least one exercise because it targets that problem. Then practice: no music + Gab’s voice/counting/cues → music + Gab’s voice/counting/cues → music without Gab’s voice.'},
      {title:'Movement 2 · problem → exercise → supported practice',minutes:12,instructions:'Repeat the same teaching loop for Movement 2: show → attempt → diagnose the problem → choose a targeted exercise → no music with teacher voice → music with teacher voice → music without teacher voice. Cut the movement into smaller parts when useful.'},
      {title:'Movement 3 · problem → exercise → supported practice',minutes:10,instructions:'Repeat the same loop for Movement 3. If the class does not have enough time for a third movement, delete this block and give those minutes back to the earlier movements instead of rushing.'},
      {title:'Connect the movements · rebuild the sequence',minutes:6,instructions:'Reconnect the trained movement units progressively. Work on the transitions if they create a new problem. When useful, fade support again: without music/with voice → music/with voice → music/without voice. Do not introduce extra movements here.'},
      {title:'Cool-down & close',minutes:2,instructions:'Lower intensity briefly, return to comfortable movement and ask for one concrete takeaway or remaining practice point.'}
    ];
    const rows = activityInputs();
    templates.forEach((template,i)=>setActivity(rows[i],template));
    setField('duration','60');
    const status=document.getElementById('toolStatus');
    if (status) status.textContent='Gab’s 60-minute movement-class structure added. Replace Movement 1–3 with the actual movements and adapt the number of movements to the available time.';
  }

  function maxMovementsFor(duration) {
    if (duration <= 35) return 1;
    if (duration <= 55) return 2;
    if (duration <= 80) return 3;
    if (duration <= 110) return 4;
    return 5;
  }

  function sessionAudit() {
    const activities=activityInputs().map(row=>({title:row.title.value||'',instructions:row.instructions?.value||''}));
    const roles=new Set(activities.flatMap(a=>METHOD.activityRole(a.title,a.instructions)));
    const activityText=activities.map(a=>`${a.title} ${a.instructions}`).join(' ').toLowerCase();
    const goalText=val('goal');
    const goal=!!goalText,assessment=!!val('assessment'),adaptations=!!val('adaptations'),readiness=!!val('readiness'),reflection=val('reflection');
    const advanced=selectedAdvancedConcept();
    const feedbackClosed=/(feedback|correction|concrete cue|next action).{0,100}(reattempt|re-attempt|next attempt|try again|follow[- ]?up|check what changed)/i.test(activityText)||/(reattempt|re-attempt|next attempt|try again).{0,100}(follow[- ]?up|check what changed)/i.test(activityText);
    const movementClass=movementClassSelected();
    const movementNumbers=[...activityText.matchAll(/movement\s+(\d+)/g)].map(m=>Number(m[1]));
    const movementCount=movementNumbers.length?Math.max(...movementNumbers):checkedConcepts().map(id=>CURR?.concept?.(id)).filter(c=>c&&(c.kind==='pattern'||c.family==='grammar')).length;
    const duration=Math.max(1,Number(val('duration'))||60);
    const realisticScope=!movementCount||movementCount<=maxMovementsFor(duration);
    const diagnoseIndex=activities.findIndex(a=>METHOD.activityRole(a.title,a.instructions).includes('diagnose'));
    const exerciseIndex=activities.findIndex(a=>METHOD.activityRole(a.title,a.instructions).includes('exercise'));
    const problemBeforeExercise=diagnoseIndex>=0&&exerciseIndex>=0&&diagnoseIndex<=exerciseIndex;

    const checks=[
      ['Clear primary learning target',goal,'Name what learners should understand or be able to do, not only the pattern being taught.'],
      ['Technical outcome',hasDomain(goalText,'Technical'),METHOD.outcomeDomains.find(d=>d.id==='technical')?.prompt],
      ['Social outcome',hasDomain(goalText,'Social'),METHOD.outcomeDomains.find(d=>d.id==='social')?.prompt],
      ['Personal outcome',hasDomain(goalText,'Personal'),METHOD.outcomeDomains.find(d=>d.id==='personal')?.prompt],
      ['General warm-up',roles.has('general-warmup'),METHOD.warmup.general],
      ['Specific warm-up',roles.has('specific-warmup'),METHOD.warmup.specific]
    ];
    if (movementClass) checks.push(
      ['Show the destination',roles.has('movement-preview'),METHOD.section('movement-preview')?.purpose],
      ['Decompose the sequence',roles.has('decompose')||movementCount>1,METHOD.section('decompose')?.purpose],
      ['Problem before exercise',problemBeforeExercise,METHOD.principles.find(p=>p.id==='problem-before-exercise')?.prompt],
      ['Problem-specific exercise',roles.has('exercise'),METHOD.section('exercise')?.purpose],
      ['Fade teacher voice/support',roles.has('support-fading'),METHOD.section('support-fading')?.purpose],
      ['Reconnect the movements',roles.has('integrate'),METHOD.section('integrate')?.purpose],
      ['Realistic movement scope',realisticScope,METHOD.movementClass.scopeRule]
    );
    checks.push(
      ['Focused practice',roles.has('practice')||roles.has('support-fading'),'Protect enough repetitions around each movement and its primary problem.'],
      ['Closed feedback loop',feedbackClosed||roles.has('diagnose'),METHOD.feedbackLoop.prompt],
      ['Adaptations & alternatives',adaptations,'Plan a regression, challenge, alternative or neutral option for different needs.'],
      ['Evidence of learning',assessment,'Define what you will observe to distinguish learning from temporary imitation.'],
      ['Cool-down / recovery',roles.has('cooldown'),METHOD.section('cooldown')?.purpose||'Close the physical session deliberately.'],
      ['Post-class comparison',!!reflection,METHOD.reflectionLoop.prompt]
    );
    if (advanced) checks.push(['Readiness / consent for advanced material',readiness,'For head movement or off-axis work, record observed readiness, consent and an on-axis or neutral alternative.']);
    return checks;
  }

  function courseAudit() {
    const sessionLinks=new Set([...root.querySelectorAll('a[href*="/session-planner/?session="]')].map(a=>a.href));
    const stageText=[...root.querySelectorAll('.toolRowTop span')].map(el=>el.textContent.toLowerCase()).join(' ');
    const goals=val('goals'),targets=checkedConcepts().length;
    return [
      ['End-state learning goals',!!goals,'Describe what learners should be able to perceive, organize or do by the end of the curriculum.'],
      ['Technical outcome',hasDomain(goals,'Technical'),METHOD.outcomeDomains.find(d=>d.id==='technical')?.prompt],
      ['Social outcome',hasDomain(goals,'Social'),METHOD.outcomeDomains.find(d=>d.id==='social')?.prompt],
      ['Personal outcome',hasDomain(goals,'Personal'),METHOD.outcomeDomains.find(d=>d.id==='personal')?.prompt],
      ['Starting point / prerequisites',!!val('prerequisites'),'Define what should be available or checked before the progression begins.'],
      ['Evidence of progress',!!val('assessment'),'Use observable evidence and transfer, not attendance or pattern count alone.'],
      ['Canonical curriculum targets',targets>0,'Choose the reusable concepts this curriculum is actually designed to develop.'],
      ['Progressive session sequence',sessionLinks.size>1,'Build enough sessions for introduction, practice, revisiting and transfer rather than a single exposure.'],
      ['Revisit / retrieval opportunity',stageText.includes('revisit'),'Include later retrieval or revisiting so earlier material must be reconstructed after delay.'],
      ['Transfer opportunity',stageText.includes('transfer'),'Include a session where skills are tested under meaningful variation or closer-to-social conditions.']
    ];
  }

  function renderAudit() {
    if (!root.querySelector('#planSelect')||root.querySelector('.toolEmpty')) { root.querySelector('#methodologyAudit')?.remove(); return; }
    const isCourse=root.dataset.tool==='curriculum-planner';
    const starter=!isCourse?root.querySelector('button[data-action="starter"]'):null;
    if (starter) {
      starter.textContent='Use Gab’s 60-minute movement-class structure';
      starter.title='General warm-up → specific warm-up → show destination → movement-by-movement problem/exercise loops → connect sequence → close';
    }
    const checks=isCourse?courseAudit():sessionAudit();
    const covered=checks.filter(x=>x[1]).length,pct=Math.round((covered/checks.length)*100),signature=JSON.stringify(checks.map(x=>[x[0],x[1]]));
    let panel=root.querySelector('#methodologyAudit');
    if (!panel) { panel=document.createElement('section');panel.id='methodologyAudit';panel.className='toolPanel methodologyAudit';root.append(panel); }
    if (panel.dataset.signature===signature) return;
    panel.dataset.signature=signature;
    panel.innerHTML=`<p class="kicker">GAB LACARRIERE METHODOLOGY · ${esc(METHOD.version)}</p><div class="methodologyHeading"><div><h2>Methodology audit</h2><p class="toolHint">A planning lens, not a score for teacher quality. Missing items are prompts to consider, not automatic errors.</p></div><strong>${covered}/${checks.length} · ${pct}%</strong></div><div class="methodologyActions"><button type="button" data-method-action="outcomes">Add technical / social / personal outcome template</button>${isCourse?'':'<button type="button" data-method-action="reflection">Add post-class reflection template</button>'}</div><ul class="methodologyChecks">${checks.map(c=>item(...c)).join('')}</ul><details class="methodologyQuestions"><summary>Teacher-design questions</summary><ol>${METHOD.teacherQuestions.map(q=>`<li>${esc(q)}</li>`).join('')}</ol><p><a class="toolLink" href="/method/">Open the public Method overview ↗</a></p></details>`;
  }

  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;renderAudit();});};
  root.addEventListener('input',schedule);
  root.addEventListener('change',schedule);
  root.addEventListener('click',event=>{
    const starter=event.target.closest('button[data-action="starter"]');
    if(starter&&root.dataset.tool==='session-planner'){event.preventDefault();event.stopPropagation();buildArchitecture();setTimeout(schedule,0);return;}
    const action=event.target.closest('[data-method-action]')?.dataset.methodAction;
    if(action==='outcomes'){event.preventDefault();applyOutcomeTemplate();}
    if(action==='reflection'){event.preventDefault();applyReflectionTemplate();}
    setTimeout(schedule,0);
  });
  new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  window.addEventListener('pageshow',schedule);
  schedule();
})();
