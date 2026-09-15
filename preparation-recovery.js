(() => {
  'use strict';
  const root=document.getElementById('teachingWorkbench');
  if(!root || root.dataset.tool!=='session-planner') return;

  const STYLE_ID='prep-recovery-styles';
  if(!document.getElementById(STYLE_ID)){
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .prepRecoveryPanel{border-color:#7dd8ff4a;background:linear-gradient(145deg,#101a24,#0e141d)}
      .prepIntro{max-width:850px}.prepGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:18px 0}
      .prepCard{border:1px solid #ffffff1c;border-radius:18px;padding:18px;background:#0b1118}.prepCard h3{margin-bottom:8px}.prepCard p{margin:7px 0;color:#c8cfda}
      .prepWhy{font-size:.9rem;color:#91ddff!important}.prepCoverage{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0 0}.prepCoverage span{font-size:.78rem;border:1px solid #ffffff22;border-radius:999px;padding:5px 8px;color:#dce4ed}
      .prepSequence{margin:12px 0 0;padding-left:20px;color:#dce4ed}.prepSequence li{margin:5px 0}.prepStatus{margin-top:10px;color:#91ddff;font-weight:700}
      @media(max-width:820px){.prepGrid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const fieldValue=name=>root.querySelector(`[data-field="${name}"]:not([data-activity])`)?.value?.trim()||'';
  const duration=()=>Math.max(1,Number(fieldValue('duration')||60));
  const chosenText=()=>{
    const concepts=[...root.querySelectorAll('[data-concept-set="conceptIds"]:checked')].map(x=>x.closest('label')?.innerText||x.dataset.concept||'');
    const skills=[...root.querySelectorAll('[data-skill]:checked')].map(x=>x.closest('label')?.innerText||x.dataset.skill||'');
    return [fieldValue('title'),fieldValue('goal'),fieldValue('prerequisites'),fieldValue('rhythm'),...concepts,...skills].join(' ').toLowerCase();
  };
  const focusLabel=()=>{
    const picked=[...root.querySelectorAll('[data-concept-set="conceptIds"]:checked')].map(x=>x.closest('label')?.querySelector('span')?.childNodes?.[0]?.textContent?.trim()).filter(Boolean);
    if(picked.length) return picked.slice(0,2).join(' + ');
    const goal=fieldValue('goal');
    return goal?goal.slice(0,70):'today’s main movement';
  };
  function minutes(){const d=duration();return d<=60?{general:4,specific:6,cool:3}:d<=90?{general:5,specific:7,cool:4}:{general:6,specific:8,cool:5};}
  function generalActivity(){
    const m=minutes().general;
    return {title:'General Warm-up — whole-body readiness',minutes:m,instructions:'Raise temperature progressively with continuous stepping/travel, then move the major regions through comfortable active ranges: feet/ankles, knees, hips/pelvis, spine, scapulae/shoulders, arms/wrists and neck. Finish with slightly quicker whole-body coordination. Keep it dynamic and scalable rather than fatiguing.\nWhy: prepare the whole organism before asking for class-specific range, speed or coordination.'};
  }
  function specificActivity(){
    const text=chosenText(),focus=focusLabel(),steps=[];
    if(/head|neck|cervical|chicote|boneca|tilt/.test(text)) steps.push('thoracic and scapular organization → active neck control in a small comfortable range → small head pathways → gradually approach the class amplitude/speed; keep a neutral-head option');
    if(/cambre|backbend|extension/.test(text)) steps.push('hip and thoracic mobility → trunk/glute support → small active extension → controlled return → only then approach the class range');
    if(/turn|axis|counterbalance|balance|pivot|rotation/.test(text)) steps.push('foot/ankle articulation → single-leg balance and weight transfer → place-transfer-rotate → partial turns → class-speed turning');
    if(/connection|frame|elastic|lead|follow|distance/.test(text)) steps.push('scapular organization and arm freedom → light tone calibration → small partner signals → same communication inside the class pathway');
    if(/timing|rhythm|musical|count|tempo|pulse/.test(text)) steps.push('find pulse → step the timing → preserve complete weight transfer → vary tempo/subdivision → add the class movement without losing timing');
    if(/torsion|dissociation|spiral|chest|rib|pelvis/.test(text)) steps.push('separate pelvis/ribcage motion → small thoracic rotation → add weight transfer → increase spiral only as control survives');
    if(/lambada|saltinho/.test(text)) steps.push('compact continuous steps → ankle/hip elasticity → count and directional completion → small diagonal/rotational pathways at Lambada scale');
    if(!steps.length) steps.push('identify the movement demands → rehearse the easiest component → use smaller/slower range → add coordination → approach the class version progressively');
    return {title:`Specific Warm-up — ${focus}`,minutes:minutes().specific,instructions:`Prepare exactly what the lesson will demand. ${steps.slice(0,2).join(' Then: ')}. Use simple → complex, small → required range, slow → class speed, predictable → variable, and solo → partner when relevant.\nWhy: the warm-up becomes the first learning progression instead of unrelated exercise.`};
  }
  function cooldownActivity(){
    return {title:'Cool-down — transition & consolidate',minutes:minutes().cool,instructions:'Reduce intensity with easy continuous movement. Restore comfortable motion in the regions most used today, then use relaxed breathing/down-regulation. Finish with one retrieval prompt: “What should you feel, notice or reproduce next time?” Stretch only when it serves comfort or a deliberate mobility goal.\nWhy: transition out of class demands and consolidate learning without promising that stretching prevents soreness.'};
  }
  const existingTitles=()=>[...root.querySelectorAll('[data-activity][data-field="title"]')].map(x=>x.value);
  const hasPrefix=prefix=>existingTitles().some(t=>t.startsWith(prefix));
  function setInput(el,value){if(!el)return;el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));}
  function addActivity(activity,desiredIndex=null){
    const add=root.querySelector('[data-action="addActivity"]');if(!add)return false;
    add.click();
    const titleInputs=[...root.querySelectorAll('[data-activity][data-field="title"]')];
    const title=titleInputs[titleInputs.length-1];if(!title)return false;
    const aid=title.dataset.activity;
    setInput(title,activity.title);
    setInput(root.querySelector(`[data-activity="${aid}"][data-field="minutes"]`),activity.minutes);
    setInput(root.querySelector(`[data-activity="${aid}"][data-field="instructions"]`),activity.instructions);
    if(Number.isInteger(desiredIndex)){
      let inputs=[...root.querySelectorAll('[data-activity][data-field="title"]')];
      let index=inputs.findIndex(x=>x.dataset.activity===aid);
      while(index>desiredIndex){
        const up=root.querySelector(`[data-action="activityUp"][data-id="${aid}"]`);if(!up)break;up.click();
        inputs=[...root.querySelectorAll('[data-activity][data-field="title"]')];index=inputs.findIndex(x=>x.dataset.activity===aid);
      }
    }
    return true;
  }
  function addGeneral(){if(hasPrefix('General Warm-up'))return false;return addActivity(generalActivity(),0);}
  function addSpecific(){if(hasPrefix('Specific Warm-up'))return false;const index=hasPrefix('General Warm-up')?1:0;return addActivity(specificActivity(),index);}
  function addCool(){if(hasPrefix('Cool-down'))return false;return addActivity(cooldownActivity(),null);}
  function card(title,time,body,why,button,disabled){return `<article class="prepCard"><p class="kicker">${time} MIN</p><h3>${esc(title)}</h3><p>${esc(body)}</p><p class="prepWhy">${esc(why)}</p><button type="button" data-prep="${button}" ${disabled?'disabled':''}>${disabled?'Already added':'Add to session'}</button></article>`;}
  function ensurePanel(){
    if(root.querySelector('.prepRecoveryPanel'))return;
    const activityPanel=[...root.querySelectorAll('.toolPanel')].find(p=>p.querySelector('h2')?.textContent.trim()==='Activities & timing');
    if(!activityPanel)return;
    const g=generalActivity(),s=specificActivity(),c=cooldownActivity();
    const panel=document.createElement('section');panel.className='toolPanel prepRecoveryPanel';
    panel.innerHTML=`<p class="kicker">PREPARATION &amp; RECOVERY</p><h2>Warm up the body. Prepare the lesson. Close the loop.</h2><p class="toolHint prepIntro">General warm-up prepares the whole body. Specific warm-up works backward from today’s movement, coordination and partner demands. Cool-down lowers intensity and consolidates what students should retain.</p><div class="prepGrid">${card('1 · General warm-up',g.minutes,'Whole-body temperature, active mobility and coordination.','Coverage: whole body, not today’s topic yet.','general',hasPrefix('General Warm-up'))}${card('2 · Specific warm-up',s.minutes,`Prepare: ${focusLabel()}.`,'This can double as the first pedagogical drill of the class.','specific',hasPrefix('Specific Warm-up'))}${card('3 · Cool-down',c.minutes,'Easy movement, comfortable mobility, down-regulation and one retrieval cue.','Recovery transition + learning integration.','cool',hasPrefix('Cool-down'))}</div><div><strong>General body coverage</strong><div class="prepCoverage"><span>Feet / ankles</span><span>Knees</span><span>Hips / pelvis</span><span>Spine</span><span>Scapulae / shoulders</span><span>Arms / wrists</span><span>Neck</span><span>Whole-body / temperature</span></div></div><ol class="prepSequence"><li>General: raise → mobilize → activate → coordinate.</li><li>Specific: simple → complex; small → required range; slow → class speed; solo → partner when relevant.</li><li>Cool-down: reduce intensity → comfortable mobility → breathing → retrieval/reflection.</li></ol><div class="toolRowActions"><button class="toolPrimary" type="button" data-prep="all">Build full preparation + recovery</button></div><p class="prepStatus" aria-live="polite"></p>`;
    activityPanel.before(panel);
    panel.addEventListener('click',e=>{
      const btn=e.target.closest('[data-prep]');if(!btn)return;
      const action=btn.dataset.prep;let changed=false;
      if(action==='general')changed=addGeneral();
      if(action==='specific')changed=addSpecific();
      if(action==='cool')changed=addCool();
      if(action==='all'){changed=addGeneral()||changed;changed=addSpecific()||changed;changed=addCool()||changed;}
      setTimeout(()=>{ensurePanel();const status=root.querySelector('.prepStatus');if(status)status.textContent=changed?'Preparation & recovery added. Adjust timing and exercises to the dancers in front of you.':'Those sections are already in this session.';},0);
    });
  }
  const observer=new MutationObserver(()=>queueMicrotask(ensurePanel));
  observer.observe(root,{childList:true,subtree:false});
  ensurePanel();
})();
