(() => {
  'use strict';
  const root = document.getElementById('teachingWorkbench');
  const METHOD = window.GAB_METHODOLOGY;
  const CURR = window.GAB_CURRICULUM;
  const DETAILS = window.ZOUK_DETAILS || {};
  const LIB = window.DANCE_PLANNER_LIBRARY;
  if (!root || root.dataset.tool !== 'session-planner' || !METHOD) return;

  const field = key => root.querySelector(`[data-field="${key}"]:not([data-activity])`);
  const value = key => field(key)?.value?.trim() || '';
  const selectedConceptIds = () => [...root.querySelectorAll('[data-concept-set="conceptIds"]:checked')].map(el => el.dataset.concept);
  const selectedSkillIds = () => [...root.querySelectorAll('[data-skill]:checked')].map(el => el.dataset.skill);
  const tick = () => new Promise(resolve => setTimeout(resolve, 0));
  const announce = text => { const el = document.getElementById('toolStatus'); if (el) el.textContent = text; };
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));

  function setField(key, next, onlyIfEmpty = false) {
    const el = field(key);
    if (!el || (onlyIfEmpty && el.value.trim())) return;
    el.value = next;
    el.dispatchEvent(new Event('input', {bubbles:true}));
  }

  function concepts() {
    return selectedConceptIds().map(id => CURR?.concept?.(id)).filter(Boolean);
  }

  function supportConcepts(items) {
    const ids = new Set(items.flatMap(c => c.supports || []));
    return [...ids].map(id => CURR?.concept?.(id)).filter(Boolean);
  }

  function familyPreparation(families, dance, advanced) {
    const parts = [];
    if (families.has('body')) parts.push('complete weight transfer, soft available joints, grounding and axis control');
    if (families.has('partnering')) parts.push('light contact, frame adaptability, tone changes and clear information without gripping');
    if (families.has('rhythm')) parts.push('stable pulse, continuous counting and weight transfer before timing variation');
    if (families.has('space')) parts.push('chest direction, relative position, orientation changes and available pathways');
    if (families.has('grammar')) parts.push('the smallest movement units inside the target sequence before recombining them');
    if (families.has('pathways')) parts.push('dissociation, segmental pathways, comfortable spirals and controlled range');
    if (families.has('offaxis') || advanced) parts.push('on-axis support, small-range torso pathways, lateral organization and a neutral-head alternative before any off-axis demand');
    if (families.has('learning') || families.has('projection')) parts.push('recognition of the current state and one clear observation or prediction question');
    if (!parts.length) parts.push(`${dance === 'lambada' ? 'Lambada' : 'Brazilian Zouk'} pulse, weight transfer, joint readiness and the simplest version of today’s movement demand`);
    return parts.join('; ');
  }

  function variablesFor(items) {
    const map = {
      body:['body organization','direction'],
      partnering:['connection','decision'],
      rhythm:['timing'],
      space:['direction','pathway'],
      grammar:['pathway','decision'],
      pathways:['body organization','pathway'],
      offaxis:['body organization','connection','pathway'],
      learning:['decision','update'],
      projection:['timing','decision','pathway']
    };
    const result = [];
    for (const c of items) for (const v of (map[c.family] || [])) if (!result.includes(v)) result.push(v);
    return result.length ? result : METHOD.movementVariables.slice(0,3).map(x => x.toLowerCase());
  }

  function maxMovementsFor(duration) {
    if (duration <= 35) return 1;
    if (duration <= 55) return 2;
    if (duration <= 80) return 3;
    if (duration <= 110) return 4;
    return 5;
  }

  function orderedPatternConcepts(items) {
    const patternIds = items.filter(c => c.kind === 'pattern' || c.family === 'grammar').map(c => c.id);
    if (!patternIds.length) return [];
    const ordered = CURR?.sequence ? CURR.sequence(patternIds).filter(c => patternIds.includes(c.id)) : items.filter(c => patternIds.includes(c.id));
    return ordered.length ? ordered : items.filter(c => patternIds.includes(c.id));
  }

  function movementUnits(items, duration) {
    const max = maxMovementsFor(duration);
    const patterns = orderedPatternConcepts(items);
    if (patterns.length) return {units:patterns.slice(0,max).map(c => ({name:c.name,concept:c})),omitted:patterns.slice(max).map(c => c.name)};

    const skillUnits = selectedSkillIds().map(id => LIB?.skills?.find(s => s.id === id)).filter(Boolean).filter(s => !s.review);
    if (skillUnits.length) return {units:skillUnits.slice(0,max).map(s => ({name:s.name,skill:s})),omitted:skillUnits.slice(max).map(s => s.name)};

    const focus = items.map(c => c.name).join(' + ') || 'Selected movement';
    return {units:[{name:focus,concept:items[0] || null}],omitted:[]};
  }

  function budget(duration, movementCount) {
    const general = clamp(Math.round(duration * .09),4,8);
    const specific = clamp(Math.round(duration * .12),5,10);
    const preview = clamp(Math.round(duration * .05),2,5);
    const integrate = clamp(Math.round(duration * .15),5,12);
    const close = clamp(Math.round(duration * .05),2,5);
    let remainder = duration - general - specific - preview - integrate - close;
    const minimumLoop = 7;
    if (remainder < movementCount * minimumLoop) {
      const need = movementCount * minimumLoop - remainder;
      const reducible = [specific,general,integrate,preview,close];
      const floors = [4,3,4,2,1];
      let left = need;
      for (let i=0;i<reducible.length && left>0;i++) {
        const cut = Math.min(left,reducible[i]-floors[i]);
        reducible[i]-=cut; left-=cut;
      }
      [remainder] = [duration - reducible.reduce((a,b)=>a+b,0)];
      return {general:reducible[1],specific:reducible[0],preview:reducible[3],integrate:reducible[2],close:reducible[4],movementMinutes:splitEven(remainder,movementCount)};
    }
    return {general,specific,preview,integrate,close,movementMinutes:splitEven(remainder,movementCount)};
  }

  function splitEven(total,count) {
    const base = Math.floor(total/count), extra = total % count;
    return Array.from({length:count},(_,i)=>base+(i<extra?1:0));
  }

  function movementObservation(unit, allItems) {
    if (unit.concept && DETAILS[unit.concept.id]?.notice) return DETAILS[unit.concept.id].notice;
    if (unit.skill?.check) return unit.skill.check;
    return `Observe which part of ${unit.name} breaks first: timing, weight transfer, direction, connection, pathway, coordination or decision.`;
  }

  function movementModel(unit) {
    if (unit.concept && DETAILS[unit.concept.id]?.understand) return DETAILS[unit.concept.id].understand;
    if (unit.skill?.goal) return unit.skill.goal;
    return `Show the smallest useful version of ${unit.name} and identify what must remain stable for it to work.`;
  }

  function classPlan() {
    const items = concepts();
    const families = new Set(items.map(c => c.family));
    const dance = value('dance') || 'zouk';
    const partnerMode = value('partnerMode') || 'rotating';
    const roleFocus = value('roleFocus') || 'both';
    const duration = clamp(Number(value('duration')) || 60,20,180);
    const advanced = items.some(c => METHOD.safety.advancedFamilies.includes(c.family));
    const prep = familyPreparation(families,dance,advanced);
    const variables = variablesFor(items);
    const {units,omitted} = movementUnits(items,duration);
    const times = budget(duration,units.length);
    const partnerInstruction = partnerMode === 'solo' ? 'Keep the task solo and self-observed.' : partnerMode === 'fixed' ? 'Keep fixed partners long enough to compare repetitions clearly.' : 'Rotate only when useful; first keep partners long enough for the exercise and support-fading sequence to become clear.';
    const roleInstruction = roleFocus === 'leading' ? 'Prioritize the leader’s organization while still checking the partner response.' : roleFocus === 'following' ? 'Prioritize follower perception and active interpretation rather than anticipation.' : 'Give both roles a concrete observation question rather than treating one role as passive.';
    const sequenceNames = units.map(u=>u.name).join(' → ');
    const activities = [
      {title:'General warm-up',minutes:times.general,instructions:'Raise global readiness first. Move the whole body through comfortable, progressive ranges with continuous locomotion or pulse, weight shifts, ankles/knees/hips, spine and shoulders. This is broad preparation, not yet the technical class.'},
      {title:'Specific warm-up · targeted class preparation',minutes:times.specific,instructions:`Prepare the exact demands of today’s movements: ${prep}. Include specific drills inside the warm-up when useful. These drills should rehearse prerequisites or simplified pieces of what students will need later, without yet asking for the whole sequence.${advanced ? ' Confirm consent, comfortable range and a neutral/on-axis alternative before progressing.' : ''}`},
      {title:'Show the class movements · establish the destination',minutes:times.preview,instructions:`Demonstrate the movement sequence or the movements students will work on today: ${sequenceNames}. Give them the destination before teaching every detail. Then make clear that the sequence will be cut into smaller movement units and rebuilt. Keep explanation short.`}
    ];

    units.forEach((unit,index) => {
      const total = times.movementMinutes[index];
      const diagnoseMinutes = Math.max(3,Math.round(total*.38));
      const practiceMinutes = Math.max(4,total-diagnoseMinutes);
      const observation = movementObservation(unit,items);
      const model = movementModel(unit);
      activities.push({
        title:`Movement ${index+1} · show → attempt → find the problem · ${unit.name}`,
        minutes:diagnoseMinutes,
        instructions:`Isolate ${unit.name} from the larger sequence. ${model} Show it, then let students attempt it before over-correcting. Observe the actual problem that appears. Diagnostic question: ${observation} Identify one primary bottleneck. The problem determines the exercise: choose or create at least one exercise that specifically isolates that bottleneck; add another exercise only if a distinct problem still prevents the movement. Cut the movement into smaller parts when that makes the problem easier to see. Relevant variables today include ${variables.join(', ')}.`
      });
      activities.push({
        title:`Movement ${index+1} · exercise → fade teacher support · ${unit.name}`,
        minutes:practiceMinutes,
        instructions:`Run the problem-specific exercise, then rebuild ${unit.name}. Use the default support-fading progression: (1) no music + Gab’s voice/counting/cues; (2) music + Gab’s voice/counting/cues; (3) music without Gab’s voice. Do not rush to the next stage because one repetition worked. Keep the movement recognizable and repeat enough for students to organize it themselves. ${partnerInstruction} ${roleInstruction}`
      });
    });

    activities.push({
      title:units.length > 1 ? 'Connect the movements · rebuild the sequence' : 'Integrate the movement · return to the whole task',
      minutes:times.integrate,
      instructions:units.length > 1
        ? `Connect the movement units in order: ${sequenceNames}. First connect only the neighboring pieces that need work, then run the complete sequence. Use the same support-fading logic when needed: without music/with teacher voice → music/with teacher voice → music/without teacher voice. Diagnose the transition if the connection between movements fails; do not simply repeat the whole sequence faster.`
        : `Return ${units[0].name} to its real partner and musical context. If it breaks, identify whether the problem is inside the movement or in the entry/exit, and use a short targeted exercise before trying the whole task again.`
    });
    activities.push({title:'Cool-down & close',minutes:times.close,instructions:'Lower intensity deliberately and return to comfortable movement. Keep this concise. Ask students for one thing they can now do or notice more clearly and one point that still needs practice.'});

    return {activities,units,omitted,duration};
  }

  async function clearActivities() {
    const count = root.querySelectorAll('[data-action="removeActivity"]').length;
    if (!count) return true;
    if (!confirm(`Replace the ${count} existing ${count === 1 ? 'activity' : 'activities'} with a methodology-generated class structure?`)) return false;
    const originalConfirm = window.confirm;
    try {
      window.confirm = () => true;
      let guard = 0;
      while (root.querySelector('[data-action="removeActivity"]') && guard++ < 120) {
        root.querySelector('[data-action="removeActivity"]').click();
        await tick();
      }
    } finally {
      window.confirm = originalConfirm;
    }
    return true;
  }

  async function addActivity(activity) {
    const button = root.querySelector('[data-action="addActivity"]');
    if (!button) throw new Error('Activity editor unavailable');
    button.click();
    await tick();
    const titles = [...root.querySelectorAll('[data-activity][data-field="title"]')];
    const title = titles[titles.length - 1];
    if (!title) throw new Error('Could not add activity');
    const activityId = title.dataset.activity;
    const minutes = root.querySelector(`[data-activity="${CSS.escape(activityId)}"][data-field="minutes"]`);
    const instructions = root.querySelector(`[data-activity="${CSS.escape(activityId)}"][data-field="instructions"]`);
    for (const [el,next] of [[title,activity.title],[minutes,String(activity.minutes)],[instructions,activity.instructions]]) {
      if (!el) continue;
      el.value = next;
      el.dispatchEvent(new Event('input',{bubbles:true}));
    }
  }

  async function generate() {
    if (!root.querySelector('#planSelect')?.value) { announce('Choose or create a session first.'); return; }
    if (!selectedConceptIds().length && !selectedSkillIds().length) { announce('Choose at least one curriculum concept or practice skill before generating the class.'); return; }
    const plan = classPlan();
    if (!(await clearActivities())) return;

    const items = concepts();
    const focus = plan.units.map(u=>u.name).join(' → ');
    const advanced = items.some(c => METHOD.safety.advancedFamilies.includes(c.family));
    const supports = supportConcepts(items);

    setField('goal', `Students can perform and progressively connect ${focus}, using targeted exercises to solve the main problem inside each movement rather than only copying the full sequence.`, true);
    setField('assessment', `For each movement, observe whether students can move from teacher-supported practice to music without teacher voice while keeping the target organization. Then check whether the movements can be connected without the earlier problem returning.`, true);
    if (supports.length) setField('prerequisites', `Revisit/check: ${supports.map(c => c.name).join(', ')}.`, true);
    setField('adaptations', `Reduce the class scope before reducing practice quality: fewer movements, smaller range, slower timing, simpler partner demand or a shorter sequence. Add complexity only after each movement remains reliable through the support-fading progression.${advanced ? ' Keep a neutral-head / on-axis option available throughout.' : ''}`, true);
    if (advanced) setField('readiness','Confirm teacher-observed prerequisites, consent, comfortable range and a neutral-head / on-axis alternative before progressing.',true);

    for (const activity of plan.activities) await addActivity(activity);
    const omitted = plan.omitted.length ? ` To protect practice time, the generator left out: ${plan.omitted.join(', ')}.` : '';
    announce(`Generated a ${plan.duration}-minute movement-based class with ${plan.units.length} movement ${plan.units.length===1?'unit':'units'}. Each movement has its own problem → exercise → support-fading loop before the sequence is recombined.${omitted}`);
  }

  function installButton() {
    if (!root.querySelector('#planSelect')?.value || root.querySelector('#methodologyGenerate')) return;
    const panels = [...root.querySelectorAll('.toolPanel')];
    const curriculumPanel = panels.find(panel => panel.textContent.includes('Curriculum focus'));
    if (!curriculumPanel) return;
    const box = document.createElement('div');
    box.className = 'methodologyActions';
    box.innerHTML = '<button type="button" id="methodologyGenerate" class="toolPrimary">Generate movement-based class</button><span class="toolHint">General warm-up → specific warm-up → show the destination → movement-by-movement problem/exercise loops → reconnect the sequence.</span>';
    const actions = curriculumPanel.querySelector('.toolRowActions');
    (actions || curriculumPanel).append(box);
    box.querySelector('#methodologyGenerate').addEventListener('click',generate);
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued=false; installButton(); });
  };
  new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  window.addEventListener('pageshow',schedule);
  schedule();
})();
