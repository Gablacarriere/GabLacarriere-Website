(() => {
  'use strict';
  const root=document.getElementById('teachingWorkbench');
  if(!root || root.dataset.tool!=='session-planner') return;

  const CURR=window.GAB_CURRICULUM;
  const LINKS=window.GAB_CURRICULUM_LINKS;
  const STYLE_ID='prep-recovery-styles';
  if(!document.getElementById(STYLE_ID)){
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .prepRecoveryPanel{border-color:#7dd8ff4a;background:linear-gradient(145deg,#101a24,#0e141d)}
      .prepIntro{max-width:850px}.prepGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:18px 0}
      .prepCard{border:1px solid #ffffff1c;border-radius:18px;padding:18px;background:#0b1118}.prepCard h3{margin-bottom:8px}.prepCard p{margin:7px 0;color:#c8cfda}
      .prepWhy{font-size:.9rem;color:#91ddff!important}.prepCoverage{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0 0}.prepCoverage span,.prepGraphChip{font-size:.78rem;border:1px solid #ffffff22;border-radius:999px;padding:5px 8px;color:#dce4ed}
      .prepSequence{margin:12px 0 0;padding-left:20px;color:#dce4ed}.prepSequence li{margin:5px 0}.prepStatus{margin-top:10px;color:#91ddff;font-weight:700}
      .prepGraph{margin-top:18px;padding:15px;border:1px solid #ffffff18;border-radius:16px;background:#0a1017}.prepGraph h3{font-size:1rem;margin:0 0 8px}.prepGraph p{margin:6px 0;color:#c8cfda}.prepGraphChips{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.prepGraph a{text-decoration:underline;text-underline-offset:3px}
      .prepLiveBridge{margin-top:16px}
      .prepAudit{margin-top:18px;padding:18px;border:1px solid #ffffff1c;border-radius:18px;background:#0b1118}.prepAuditTop{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.prepAuditTop h3{margin:0 0 5px}.prepScore{min-width:86px;text-align:center;border:1px solid #ffffff22;border-radius:16px;padding:10px}.prepScore strong{display:block;font-size:1.5rem;line-height:1}.prepScore span{font-size:.76rem;color:#b9c4cf}.prepAuditList{display:grid;gap:8px;margin-top:14px}.prepAuditItem{padding:10px 12px;border-radius:12px;border:1px solid #ffffff16;background:#101923}.prepAuditItem strong{display:block;margin-bottom:2px}.prepAuditItem.good{border-color:#87d6ad55}.prepAuditItem.check{border-color:#f2dfc555}.prepAuditItem.issue{border-color:#ff9c9c66}.prepAuditItem small{color:#bcc6d0}.prepAuditActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
      @media(max-width:820px){.prepGrid{grid-template-columns:1fr}.prepAuditTop{align-items:stretch}.prepScore{min-width:76px}}
    `;
    document.head.appendChild(style);
  }

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const fieldValue=name=>root.querySelector(`[data-field="${name}"]:not([data-activity])`)?.value?.trim()||'';
  const duration=()=>Math.max(1,Number(fieldValue('duration')||60));
  const selectedConceptIds=()=>[...root.querySelectorAll('[data-concept-set="conceptIds"]:checked')].map(x=>x.dataset.concept);
  const selectedDance=()=>fieldValue('dance')||'zouk';
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
  function graphPreparation(){
    const targets=selectedConceptIds();
    if(!CURR||!targets.length)return {targets:[],supports:[],practice:[]};
    const supports=CURR.prerequisites(targets,{recursive:false,track:selectedDance()});
    const seen=new Set(),practice=[];
    const sourceIds=[...supports.map(x=>x.id),...targets];
    if(LINKS)for(const cid of sourceIds)for(const link of LINKS.forConcept(cid)||[]){
      if(seen.has(link.skill))continue;seen.add(link.skill);practice.push(link);
    }
    return {targets:targets.map(id=>CURR.concept(id)).filter(Boolean),supports,practice};
  }
  function minutes(){const d=duration();return d<=60?{general:4,specific:6,cool:3}:d<=90?{general:5,specific:7,cool:4}:{general:6,specific:8,cool:5};}
  function generalActivity(){
    const m=minutes().general;
    return {title:'General Warm-up — whole-body readiness',minutes:m,instructions:'Raise temperature progressively with continuous stepping/travel, then move the major regions through comfortable active ranges: feet/ankles, knees, hips/pelvis, spine, scapulae/shoulders, arms/wrists and neck. Finish with slightly quicker whole-body coordination. Keep it dynamic and scalable rather than fatiguing.\nWhy: prepare the whole organism before asking for class-specific range, speed or coordination.'};
  }
  function specificActivity(){
    const text=chosenText(),focus=focusLabel(),steps=[],graph=graphPreparation();
    if(/head|neck|cervical|chicote|boneca|tilt/.test(text)) steps.push('thoracic and scapular organization → active neck control in a small comfortable range → small head pathways → gradually approach the class amplitude/speed; keep a neutral-head option');
    if(/cambre|backbend|extension/.test(text)) steps.push('hip and thoracic mobility → trunk/glute support → small active extension → controlled return → only then approach the class range');
    if(/turn|axis|counterbalance|balance|pivot|rotation/.test(text)) steps.push('foot/ankle articulation → single-leg balance and weight transfer → place-transfer-rotate → partial turns → class-speed turning');
    if(/connection|frame|elastic|lead|follow|distance/.test(text)) steps.push('scapular organization and arm freedom → light tone calibration → small partner signals → same communication inside the class pathway');
    if(/timing|rhythm|musical|count|tempo|pulse/.test(text)) steps.push('find pulse → step the timing → preserve complete weight transfer → vary tempo/subdivision → add the class movement without losing timing');
    if(/torsion|dissociation|spiral|chest|rib|pelvis/.test(text)) steps.push('separate pelvis/ribcage motion → small thoracic rotation → add weight transfer → increase spiral only as control survives');
    if(/lambada|saltinho/.test(text)) steps.push('compact continuous steps → ankle/hip elasticity → count and directional completion → small diagonal/rotational pathways at Lambada scale');
    if(!steps.length) steps.push('identify the movement demands → rehearse the easiest component → use smaller/slower range → add coordination → approach the class version progressively');
    const lines=[`Prepare exactly what the lesson will demand. ${steps.slice(0,2).join(' Then: ')}. Use simple → complex, small → required range, slow → class speed, predictable → variable, and solo → partner when relevant.`];
    if(graph.supports.length)lines.push('Atlas supports to prepare first: '+graph.supports.map(x=>x.name).join(', ')+'.');
    if(graph.practice.length)lines.push('Related Zoukable practice areas: '+graph.practice.slice(0,5).map(x=>x.name).join(', ')+'.');
    lines.push('Why: the warm-up becomes the first learning progression instead of unrelated exercise.');
    return {title:`Specific Warm-up — ${focus}`,minutes:minutes().specific,instructions:lines.join('\n')};
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
  function graphHTML(){
    const graph=graphPreparation();
    if(!graph.targets.length)return '<div class="prepGraph"><h3>Atlas-informed preparation</h3><p>Select curriculum concepts above and this section will trace their direct supports and linked Zoukable practice areas.</p></div>';
    const supportText=graph.supports.length?graph.supports.map(x=>`<a class="prepGraphChip" href="/zouk-map/?concept=${encodeURIComponent(x.id)}#map">${esc(x.name)} ↗</a>`).join(''):'<span class="prepGraphChip">No direct prerequisite specified</span>';
    const practiceText=graph.practice.length?graph.practice.slice(0,6).map(x=>`<span class="prepGraphChip">${esc(x.name)}</span>`).join(''):'<span class="prepGraphChip">No linked practice area yet</span>';
    return `<div class="prepGraph"><h3>Atlas-informed preparation</h3><p><strong>Target:</strong> ${esc(graph.targets.map(x=>x.name).join(' + '))}</p><p>Prepare the closest supporting concepts before increasing the target movement’s range, speed or partner complexity.</p><div class="prepGraphChips">${supportText}</div><p><strong>Linked practice areas</strong></p><div class="prepGraphChips">${practiceText}</div></div>`;
  }

  function activityRows(){
    return [...root.querySelectorAll('[data-activity][data-field="title"]')].map((title,index)=>{
      const aid=title.dataset.activity;
      const mins=Number(root.querySelector(`[data-activity="${aid}"][data-field="minutes"]`)?.value||0);
      const instructions=root.querySelector(`[data-activity="${aid}"][data-field="instructions"]`)?.value||'';
      return {id:aid,index,title:title.value||'',minutes:mins,instructions,text:(title.value+' '+instructions).toLowerCase()};
    });
  }
  function termTokens(value){return String(value||'').toLowerCase().replace(/[^a-z0-9à-ÿ]+/g,' ').split(/\s+/).filter(x=>x.length>=4&&!['warm','up','specific','general','movement','practice','class','prepare','preparation','support'].includes(x));}
  function qualityAudit(){
    const rows=activityRows(),d=duration(),graph=graphPreparation(),items=[];
    const general=rows.find(r=>/^general warm-up/i.test(r.title));
    const specifics=rows.filter(r=>/^specific warm-up/i.test(r.title));
    const specific=specifics[0];
    const cool=rows.find(r=>/^cool-down/i.test(r.title));
    const issue=(title,detail)=>items.push({level:'issue',title,detail});
    const check=(title,detail)=>items.push({level:'check',title,detail});
    const good=(title,detail)=>items.push({level:'good',title,detail});

    if(!general) issue('General warm-up missing','Add a whole-body preparation before lesson-specific work.');
    else{
      const regions=[['feet / ankles',/foot|feet|ankle/],['knees',/knee/],['hips / pelvis',/hip|pelvis/],['spine',/spine|spinal|thoracic|rib/],['shoulders / scapulae',/shoulder|scapula/],['arms / wrists',/arm|wrist|hand/],['neck',/neck|cervical/],['whole-body / temperature',/temperature|continuous|whole-body|travel|locomotion|pulse|raise/]];
      const covered=regions.filter(([,rx])=>rx.test(general.text)).map(([name])=>name);
      if(covered.length>=6) good('General body coverage',`${covered.length}/8 regions/readiness signals are explicit in the plan.`);
      else check('General body coverage looks incomplete',`${covered.length}/8 regions/readiness signals are explicit. This is a text-based check, so a well-designed integrated movement may cover more than the wording shows.`);
    }

    if(!specific) issue('Specific warm-up missing','Add preparation that works backward from the exact movement, coordination, timing or partner demands of this lesson.');
    else{
      const expected=[...graph.targets.map(x=>x.name),...graph.supports.map(x=>x.name),...graph.practice.map(x=>x.name)];
      const tokens=[...new Set(expected.flatMap(termTokens))];
      const linked=!tokens.length||tokens.some(t=>specifics.some(r=>r.text.includes(t)));
      if(linked) good('Specific warm-up matches the lesson','The written preparation overlaps with the selected target, an Atlas support, or a linked practice area.');
      else check('Specific warm-up may be disconnected','The written warm-up does not clearly reference the selected target or its nearest curriculum supports. Check whether the exercises actually prepare today’s lesson.');
      const progressionWords=['simple','small','slow','range','progress','gradual','control','solo','partner'];
      const progressionHits=progressionWords.filter(w=>specifics.some(r=>r.text.includes(w))).length;
      if(progressionHits>=3) good('Progressive demand','The plan explicitly scales range, complexity, speed or partnering.');
      else check('Progression is not explicit','Consider writing how the preparation moves from easier/lower-demand work toward the class version.');
    }

    if(general&&specific&&general.index<specific.index) good('Preparation order','General preparation comes before specific preparation.');
    else if(general&&specific) issue('Preparation order is reversed','Move the general warm-up before the specific warm-up.');

    const warmupRows=rows.filter(r=>/^general warm-up|^specific warm-up/i.test(r.title));
    const warmMinutes=warmupRows.reduce((n,r)=>n+r.minutes,0);
    const share=warmMinutes/d;
    if(warmMinutes&&share<=0.30) good('Warm-up time allocation',`${warmMinutes} of ${d} minutes (${Math.round(share*100)}%) is allocated to preparation.`);
    else if(warmMinutes) check('Warm-up is taking a large share of class',`${warmMinutes} of ${d} minutes (${Math.round(share*100)}%) is allocated to preparation. Keep it if those minutes are also doing real pedagogical work; otherwise compress it.`);

    const intensityRx=/to failure|max(?:imum|imal)? effort|all[- ]out|sprint|exhaust|burnout|as fast as possible|until failure/;
    if(warmupRows.some(r=>intensityRx.test(r.text))) check('Check warm-up intensity','The written warm-up contains high-intensity language. Preparation should normally increase readiness without creating fatigue.');
    else if(warmupRows.length) good('Intensity language','No obvious fatigue-seeking language appears in the written warm-up.');

    const highDemandRx=/head movement|boneca|chicote|cambre|cambré|backbend|tilted|off[- ]axis|counterbalance|deep extension|double turn|full speed|high speed/;
    const firstHigh=rows.find(r=>highDemandRx.test(r.text)&&!/^general warm-up|^specific warm-up/i.test(r.title));
    if(firstHigh&&specific&&firstHigh.index<specific.index) issue('High-demand material appears before specific preparation',`“${firstHigh.title}” appears before the specific warm-up. Reorder the progression or lower the demand.`);
    else if(firstHigh&&specific) good('High-demand sequencing','The first clearly high-demand activity appears after specific preparation.');

    if(!cool) issue('Cool-down / integration missing','End with a short transition out of class demands plus a retrieval or reflection cue.');
    else if(cool.index>=Math.max(0,rows.length-2)) good('Cool-down placement','The cool-down is at the end of the lesson sequence.');
    else check('Cool-down appears early','It is not one of the final two activities. Check whether later blocks raise intensity again.');

    const hard=items.filter(x=>x.level==='issue').length,soft=items.filter(x=>x.level==='check').length;
    const score=Math.max(0,100-hard*18-soft*7);
    return {items,score,hard,soft,warmMinutes};
  }
  function qualityHTML(){
    const audit=qualityAudit();
    const label=audit.hard?'Structure needs attention':audit.soft?'Good structure · review a few details':'Preparation structure looks coherent';
    const rows=audit.items.map(item=>`<div class="prepAuditItem ${item.level}"><strong>${item.level==='good'?'✓':item.level==='check'?'△':'!'} ${esc(item.title)}</strong><small>${esc(item.detail)}</small></div>`).join('');
    const missing=!hasPrefix('General Warm-up')||!hasPrefix('Specific Warm-up')||!hasPrefix('Cool-down');
    return `<div class="prepAudit"><div class="prepAuditTop"><div><p class="kicker">QUALITY CHECK</p><h3>${esc(label)}</h3><p class="toolHint">This is a planning audit, not a medical safety certification. It checks the written lesson structure and cannot infer what is happening physically if it is not described.</p></div><div class="prepScore"><strong>${audit.score}</strong><span>planning check</span></div></div><div class="prepAuditList">${rows||'<div class="prepAuditItem check"><strong>△ Add activities to audit</strong><small>The checker will update as the lesson takes shape.</small></div>'}</div><div class="prepAuditActions">${missing?'<button type="button" data-prep="missing">Add missing preparation sections</button>':''}<button type="button" data-prep="audit">Recheck plan</button></div></div>`;
  }
  function updateQuality(){const old=root.querySelector('.prepAudit');if(old)old.outerHTML=qualityHTML();}

  function ensurePanel(){
    if(root.querySelector('.prepRecoveryPanel'))return;
    const activityPanel=[...root.querySelectorAll('.toolPanel')].find(p=>p.querySelector('h2')?.textContent.trim()==='Activities & timing');
    if(!activityPanel)return;
    const g=generalActivity(),s=specificActivity(),c=cooldownActivity();
    const panel=document.createElement('section');panel.className='toolPanel prepRecoveryPanel';
    panel.innerHTML=`<p class="kicker">PREPARATION &amp; RECOVERY</p><h2>Warm up the body. Prepare the lesson. Close the loop.</h2><p class="toolHint prepIntro">General warm-up prepares the whole body. Specific warm-up works backward from today’s movement, coordination and partner demands. Cool-down lowers intensity and consolidates what students should retain.</p><div class="prepGrid">${card('1 · General warm-up',g.minutes,'Whole-body temperature, active mobility and coordination.','Coverage: whole body, not today’s topic yet.','general',hasPrefix('General Warm-up'))}${card('2 · Specific warm-up',s.minutes,`Prepare: ${focusLabel()}.`,'Uses Atlas prerequisites + linked practice areas, and can double as the first pedagogical drill.','specific',hasPrefix('Specific Warm-up'))}${card('3 · Cool-down',c.minutes,'Easy movement, comfortable mobility, down-regulation and one retrieval cue.','Recovery transition + learning integration.','cool',hasPrefix('Cool-down'))}</div><div><strong>General body coverage</strong><div class="prepCoverage"><span>Feet / ankles</span><span>Knees</span><span>Hips / pelvis</span><span>Spine</span><span>Scapulae / shoulders</span><span>Arms / wrists</span><span>Neck</span><span>Whole-body / temperature</span></div></div>${graphHTML()}<div id="warmupZoukableBridge" class="prepLiveBridge"></div>${qualityHTML()}<ol class="prepSequence"><li>General: raise → mobilize → activate → coordinate.</li><li>Specific: prerequisite → target; simple → complex; small → required range; slow → class speed; solo → partner when relevant.</li><li>Cool-down: reduce intensity → comfortable mobility → breathing → retrieval/reflection.</li></ol><div class="toolRowActions"><button class="toolPrimary" type="button" data-prep="all">Build full preparation + recovery</button></div><p class="prepStatus" aria-live="polite"></p>`;
    activityPanel.before(panel);
    panel.addEventListener('click',e=>{
      const btn=e.target.closest('[data-prep]');if(!btn)return;
      const action=btn.dataset.prep;let changed=false;
      if(action==='general')changed=addGeneral();
      if(action==='specific')changed=addSpecific();
      if(action==='cool')changed=addCool();
      if(action==='all'){changed=addGeneral()||changed;changed=addSpecific()||changed;changed=addCool()||changed;}
      if(action==='missing'){changed=addGeneral()||changed;changed=addSpecific()||changed;changed=addCool()||changed;}
      if(action==='audit'){updateQuality();return;}
      setTimeout(()=>{rebuildPanel();const status=root.querySelector('.prepStatus');if(status)status.textContent=changed?'Preparation & recovery added. Adjust timing and exercises to the dancers in front of you.':'Those sections are already in this session.';},0);
    });
  }
  function rebuildPanel(){root.querySelector('.prepRecoveryPanel')?.remove();ensurePanel();}
  let qualityTimer=null;
  function scheduleQuality(){clearTimeout(qualityTimer);qualityTimer=setTimeout(updateQuality,80);}
  const observer=new MutationObserver(()=>queueMicrotask(ensurePanel));
  observer.observe(root,{childList:true,subtree:false});
  root.addEventListener('input',event=>{if(event.target.dataset.activity||['goal','duration','prerequisites','rhythm'].includes(event.target.dataset.field))scheduleQuality();});
  root.addEventListener('change',event=>{
    if(event.target.dataset.concept||event.target.dataset.skill||event.target.matches('select[data-field="dance"]'))setTimeout(rebuildPanel,0);
  });
  root.addEventListener('click',event=>{if(event.target.closest('[data-action="activityUp"],[data-action="activityDown"],[data-action="removeActivity"],[data-action="addActivity"]'))setTimeout(scheduleQuality,0);});
  ensurePanel();
})();