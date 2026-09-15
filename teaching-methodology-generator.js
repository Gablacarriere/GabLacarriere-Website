(() => {
  'use strict';
  const root = document.getElementById('teachingWorkbench');
  const METHOD = window.GAB_METHODOLOGY;
  const CURR = window.GAB_CURRICULUM;
  const DETAILS = window.ZOUK_DETAILS || {};
  if (!root || root.dataset.tool !== 'session-planner' || !METHOD) return;

  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const field = key => root.querySelector(`[data-field="${key}"]:not([data-activity])`);
  const value = key => field(key)?.value?.trim() || '';
  const selectedConceptIds = () => [...root.querySelectorAll('[data-concept-set="conceptIds"]:checked')].map(el => el.dataset.concept);
  const tick = () => new Promise(resolve => setTimeout(resolve, 0));
  const announce = text => { const el = document.getElementById('toolStatus'); if (el) el.textContent = text; };

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
    if (families.has('grammar')) parts.push('the smallest movement units inside the target pattern before recombining them');
    if (families.has('pathways')) parts.push('dissociation, segmental pathways, comfortable spirals and controlled range');
    if (families.has('offaxis') || advanced) parts.push('on-axis support, small-range torso pathways, lateral organization and a neutral-head alternative before any off-axis demand');
    if (families.has('learning')) parts.push('retrieval of the idea before demonstration and one clear observation question');
    if (!parts.length) parts.push(`${dance === 'lambada' ? 'Lambada' : 'Brazilian Zouk'} pulse, weight transfer, joint readiness and the simplest version of today’s movement demand`);
    return parts.join('; ');
  }

  function variablesFor(items) {
    const map = {
      body:['Body organization','Direction'],
      partnering:['Connection','Decision'],
      rhythm:['Timing'],
      space:['Direction','Pathway'],
      grammar:['Pathway','Decision'],
      pathways:['Body organization','Pathway'],
      offaxis:['Body organization','Connection','Pathway'],
      learning:['Decision','Update']
    };
    const result = [];
    for (const c of items) for (const v of (map[c.family] || [])) if (!result.includes(v)) result.push(v);
    return result.length ? result : METHOD.movementVariables.slice(0, 3);
  }

  function allocate(total, weights) {
    const raw = weights.map(w => total * w);
    const out = raw.map(x => Math.max(1, Math.floor(x)));
    let diff = total - out.reduce((a,b) => a + b, 0);
    const order = raw.map((x,i) => [x - Math.floor(x), i]).sort((a,b) => b[0] - a[0]).map(x => x[1]);
    let i = 0;
    while (diff > 0) { out[order[i % order.length]]++; diff--; i++; }
    while (diff < 0) {
      const idx = [...out.keys()].sort((a,b) => out[b] - out[a]).find(j => out[j] > 1);
      if (idx == null) break;
      out[idx]--; diff++;
    }
    return out;
  }

  function classPlan() {
    const items = concepts();
    const names = items.map(c => c.name);
    const families = new Set(items.map(c => c.family));
    const dance = value('dance') || 'zouk';
    const stage = value('stage') || 'introduce';
    const partnerMode = value('partnerMode') || 'rotating';
    const roleFocus = value('roleFocus') || 'both';
    const duration = Math.max(20, Math.min(180, Number(value('duration')) || 60));
    const advanced = items.some(c => METHOD.safety.advancedFamilies.includes(c.family));
    const supports = supportConcepts(items);
    const understand = items.map(c => DETAILS[c.id]?.understand).filter(Boolean).join(' ');
    const notice = items.map(c => DETAILS[c.id]?.notice).filter(Boolean).join(' ');
    const variables = variablesFor(items);
    const prep = familyPreparation(families, dance, advanced);
    const focus = names.length ? names.join(' + ') : 'today’s selected movement concept';
    const partnerInstruction = partnerMode === 'solo' ? 'Keep the task solo and self-observed.' : partnerMode === 'fixed' ? 'Keep fixed partners long enough to compare repetitions clearly.' : 'Rotate partners after a short block so the skill must survive different bodies and information.';
    const roleInstruction = roleFocus === 'leading' ? 'Prioritize the leader’s organization while still checking the partner response.' : roleFocus === 'following' ? 'Prioritize follower perception and active interpretation rather than anticipation.' : 'Give both roles a specific observation question rather than treating one role as passive.';
    const supportsText = supports.length ? supports.map(c => c.name).join(', ') : 'the simplest familiar foundation related to the target';
    const transferChange = stage === 'transfer' ? 'Move quickly toward social-dance conditions: change entry, exit, partner and musical context while keeping only one main variable constrained at a time.' : stage === 'revisit' ? 'Begin from memory, then change side, entry or partner setup before showing the reference version again.' : stage === 'practice' ? 'Change one condition—side, tempo, entry, exit or partner—while preserving the target mechanism.' : 'Change only one small condition after the basic version becomes recognizable.';

    if (duration < 45) {
      const mins = allocate(duration, [.10,.15,.12,.20,.20,.15,.08]);
      return [
        {title:'General warm-up',minutes:mins[0],instructions:'Raise overall readiness without teaching the final pattern yet. Use continuous locomotion or pulse, comfortable weight shifts, ankle/knee/hip mobility, spinal motion and shoulders. Gradually increase range and temperature while keeping breathing easy.'},
        {title:'Specific warm-up',minutes:mins[1],instructions:`Prepare exactly what the class will demand: ${prep}. Use one or two simplified prerequisite tasks. ${advanced ? 'Confirm consent, comfortable range and the neutral/on-axis option before progressing.' : ''}`},
        {title:`Understand & feel · ${focus}`,minutes:mins[2],instructions:`Give the shortest useful model, then move immediately into sensation. ${understand || 'Identify what organizes the target movement.'} Ask learners to feel or contrast the relevant ${variables.join(', ').toLowerCase()} rather than memorizing only the outer shape.`},
        {title:'Drill A · isolate the mechanism',minutes:mins[3],instructions:`Use ${supportsText} to isolate one bottleneck. Work in short rounds with one observation question. ${notice || 'Ask what changed between successful and unsuccessful repetitions.'} Keep correction to one high-leverage variable at a time.`},
        {title:'Drill B · progression & integration',minutes:mins[4],instructions:`Rebuild ${focus} with more of the real partner/musical context. ${partnerInstruction} ${roleInstruction} Protect repetition density; explanation should not consume this block.`},
        {title:'Variation, retrieval & transfer',minutes:mins[5],instructions:`${transferChange} Before demonstrating again, ask dancers to reconstruct the idea from memory and state one cue or organizing principle. Test whether the movement still works outside the original setup.`},
        {title:'Cool-down & close',minutes:mins[6],instructions:'Lower intensity deliberately. Use comfortable movement or mobility for the areas that carried the highest demand, then ask for one concrete takeaway and one thing to revisit next time.'}
      ];
    }

    const mins = allocate(duration, [.08,.12,.08,.13,.13,.18,.14,.09,.05]);
    return [
      {title:'General warm-up',minutes:mins[0],instructions:'Raise global readiness without prematurely teaching the final movement. Use continuous locomotion or pulse, comfortable weight shifts, ankles/knees/hips, spinal movement and shoulders. Increase range gradually; keep the whole body involved.'},
      {title:'Specific warm-up',minutes:mins[1],instructions:`Prepare the exact class demands: ${prep}. Include at least two targeted mini-tasks: one prerequisite coordination task and one simplified version of the target pathway. ${advanced ? 'Confirm consent, comfortable range, teacher-observed readiness and a neutral/on-axis alternative before any advanced head or off-axis demand.' : ''}`},
      {title:`Understand + feel · ${focus}`,minutes:mins[2],instructions:`Use a brief demonstration and a simple mental model, then switch to doing. ${understand || 'Identify the organizing mechanism and what must remain stable.'} Ask learners to notice a relevant sensation or contrast in ${variables.join(', ').toLowerCase()}. Avoid a long lecture.`},
      {title:'Drill A · isolate the bottleneck',minutes:mins[3],instructions:`Start from ${supportsText}. Remove unnecessary complexity so the target mechanism is unmistakable. Use 2–3 short rounds. ${notice || 'Ask one observable question after each round.'} Correct the causal bottleneck rather than the most visible symptom.`},
      {title:'Drill B · contrast & progression',minutes:mins[4],instructions:`Create a useful contrast: less/more tone, smaller/larger range, slower/normal timing, or isolated/integrated pathway as appropriate. Learners should identify what changes the result. Progress only while the foundation remains reliable.`},
      {title:'Practice density · build reliable repetitions',minutes:mins[5],instructions:`Accumulate quality repetitions of ${focus} with minimal teacher interruption. Use short sets, reset, repeat. ${partnerInstruction} ${roleInstruction} Let dancers test one correction for several repetitions before adding another.`},
      {title:'Variation & transfer',minutes:mins[6],instructions:`${transferChange} Preserve the target mechanism while changing one meaningful condition. Return to the simpler version if the base organization disappears. End this block closer to the intended environment—music, improvisation or social partnership.`},
      {title:'Retrieve, diagnose & choose',minutes:mins[7],instructions:`Stop the demonstration. Ask learners to reconstruct ${focus} from memory, identify the main organizing variable, and diagnose one failed repetition before receiving teacher input. Then run one final transfer attempt and compare expected vs actual result.`},
      {title:'Cool-down & close',minutes:mins[8],instructions:'Deliberately lower intensity. Use comfortable movement or mobility for the most-loaded areas, restore easy breathing and range, then close with one takeaway, one unresolved question and the next practice focus.'}
    ];
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
    if (!selectedConceptIds().length) { announce('Choose at least one canonical curriculum concept before generating the class.'); return; }
    const plan = classPlan();
    if (!(await clearActivities())) return;

    const items = concepts();
    const focus = items.map(c => c.name).join(' + ');
    const advanced = items.some(c => METHOD.safety.advancedFamilies.includes(c.family));
    const understand = items.map(c => DETAILS[c.id]?.understand).filter(Boolean).join(' ');
    const notice = items.map(c => DETAILS[c.id]?.notice).filter(Boolean).join(' ');
    const supports = supportConcepts(items);

    setField('goal', understand || `Develop a usable, transferable understanding of ${focus}.`, true);
    setField('assessment', `${notice || `Observe whether learners can use ${focus} without relying on the original demonstration.`} Test again after one meaningful change of context.`, true);
    if (supports.length) setField('prerequisites', `Revisit/check: ${supports.map(c => c.name).join(', ')}.`, true);
    setField('adaptations', `Regression: reduce range, speed, partner complexity or number of variables. Challenge: add one meaningful variation only after the base remains reliable.${advanced ? ' Keep a neutral-head / on-axis option available throughout.' : ''}`, true);
    if (advanced) setField('readiness', 'Confirm teacher-observed prerequisites, consent, comfortable range and a neutral-head / on-axis alternative before progressing.', true);

    for (const activity of plan) await addActivity(activity);
    announce(`Generated a ${plan.reduce((n,a) => n + a.minutes,0)}-minute methodology-based class with ${plan.length} practice phases. Review the draft against the dancers in front of you.`);
  }

  function installButton() {
    if (!root.querySelector('#planSelect')?.value || root.querySelector('#methodologyGenerate')) return;
    const panels = [...root.querySelectorAll('.toolPanel')];
    const curriculumPanel = panels.find(panel => panel.textContent.includes('Curriculum focus'));
    if (!curriculumPanel) return;
    const box = document.createElement('div');
    box.className = 'methodologyActions';
    box.innerHTML = '<button type="button" id="methodologyGenerate" class="toolPrimary">Generate class from methodology</button><span class="toolHint">Uses duration, selected concepts, learning stage, partner format and the canonical methodology.</span>';
    const actions = curriculumPanel.querySelector('.toolRowActions');
    (actions || curriculumPanel).append(box);
    box.querySelector('#methodologyGenerate').addEventListener('click', generate);
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; installButton(); });
  };
  new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  window.addEventListener('pageshow',schedule);
  schedule();
})();
