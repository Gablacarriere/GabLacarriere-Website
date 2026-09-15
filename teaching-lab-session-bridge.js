(() => {
  'use strict';

  const KEY='gab-teaching-lab-session-handoff-v1';
  const MAX_AGE=1000*60*60;
  const text=(selector,root=document)=>root.querySelector(selector)?.textContent?.trim()||'';
  const value=id=>document.getElementById(id)?.value?.trim()||'';

  function readHandoff(){
    try{
      const data=JSON.parse(localStorage.getItem(KEY)||'null');
      if(!data||data.version!==1||data.source!=='teaching-lab'||!data.createdAt||Date.now()-data.createdAt>MAX_AGE){
        localStorage.removeItem(KEY);
        return null;
      }
      if(typeof data.title!=='string'||data.title.length>300||!['zouk','lambada'].includes(data.dance)||!Number.isInteger(data.duration)||data.duration<1||data.duration>240)return null;
      if(!Array.isArray(data.activities)||!data.activities.length||data.activities.length>30)return null;
      if(data.activities.some(a=>!a||typeof a.title!=='string'||a.title.length>300||typeof a.instructions!=='string'||a.instructions.length>10000||!Number.isInteger(a.minutes)||a.minutes<0||a.minutes>240))return null;
      return data;
    }catch{
      localStorage.removeItem(KEY);
      return null;
    }
  }

  function writeHandoff(data){
    localStorage.setItem(KEY,JSON.stringify(data));
  }

  function labPayload(){
    const plan=document.getElementById('plan');
    const items=[...plan?.querySelectorAll('.planItem')||[]];
    if(!items.length)return null;
    const objective=document.getElementById('objective');
    const concept=objective?.selectedOptions?.[0]?.textContent?.trim()||'Teaching Lab session';
    const classType=value('classType')||'Brazilian Zouk';
    const level=value('level')||'Mixed';
    const technical=value('technicalOutcome');
    const social=value('socialOutcome');
    const personal=value('personalOutcome');
    const duration=Number(value('duration')||items.reduce((sum,row)=>sum+(Number(text('small',row).match(/(\d+)\s*min/i)?.[1])||0),0)||60);
    const activities=items.map(row=>({
      title:text('b',row)||text('small',row).replace(/^\s*\d+\s*min\s*·?\s*/i,'')||'Activity',
      minutes:Number(text('small',row).match(/(\d+)\s*min/i)?.[1]||0),
      instructions:text('p',row)
    }));
    const dance=/lambada/i.test(classType)?'lambada':'zouk';
    const goal=[['Technical',technical],['Social',social],['Personal',personal]].filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join('\n');
    return {
      version:1,
      source:'teaching-lab',
      token:crypto.randomUUID(),
      createdAt:Date.now(),
      title:concept,
      dance,
      stage:'practice',
      duration,
      goal,
      learners:`${classType} · ${level}`,
      prerequisites:`Teaching Lab concept: ${concept}. Check the supporting foundations needed for this objective and reduce complexity if the target organization is not yet available.`,
      assessment:technical?`Observe whether this remains available after a meaningful change of partner, timing, direction, range or context: ${technical}`:'Observe whether the target skill survives a meaningful change of context with less teacher support.',
      adaptations:'Prepare a simpler option, a neutral-range option when relevant, and one added challenge. Change one variable at a time so the learning target stays visible.',
      reflection:['Intended learning: '+(goal||concept),'Observed evidence: ','What transferred: ','What still broke down: ','What I will change next time: '].join('\n'),
      readiness:'Confirm consent, comfortable range and an appropriate regression or neutral alternative before increasing complexity.',
      rhythm:'',music:'',bpm:'',roleFocus:'both',partnerMode:'rotating',
      activities
    };
  }

  function installLabBridge(){
    const plan=document.getElementById('plan');
    if(!plan)return;
    if(!document.getElementById('teachingLabBridgeStyles')){
      const style=document.createElement('style');
      style.id='teachingLabBridgeStyles';
      style.textContent='.sessionHandoffActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.sessionHandoffNote{margin:0;color:#aeb6c2;font-size:.82rem}.sessionHandoffActions button{background:#7dd8ff;color:#071018}';
      document.head.appendChild(style);
    }
    const sync=()=>{
      const hasPlan=!!plan.querySelector('.planItem');
      let actions=document.getElementById('sessionHandoffActions');
      if(!hasPlan){actions?.remove();return;}
      if(actions)return;
      actions=document.createElement('div');
      actions.id='sessionHandoffActions';
      actions.className='sessionHandoffActions';
      actions.innerHTML='<button type="button" id="saveToSessionPlanner">Save to Session Planner →</button><p class="sessionHandoffNote">Creates a standalone editable session in your teaching account. You can attach it to a curriculum there.</p>';
      plan.appendChild(actions);
      document.getElementById('saveToSessionPlanner')?.addEventListener('click',()=>{
        const payload=labPayload();
        if(!payload)return;
        writeHandoff(payload);
        location.href='/session-planner/?import=teaching-lab';
      });
    };
    new MutationObserver(sync).observe(plan,{childList:true,subtree:true});
    sync();
  }

  function fire(el,type){el.dispatchEvent(new Event(type,{bubbles:true}));}
  function setControl(selector,next,type='input'){
    const control=document.querySelector(selector);
    if(!control)return false;
    control.value=next??'';
    fire(control,type);
    return true;
  }
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  async function waitForPlanner(){
    for(let i=0;i<300;i++){
      const select=document.getElementById('planSelect');
      const newButton=document.querySelector('[data-action="new"]');
      if(select&&newButton)return {select,newButton};
      await delay(100);
    }
    return null;
  }

  function selectedSessionId(){return document.getElementById('planSelect')?.value||null;}

  async function importIntoPlanner(){
    if(new URLSearchParams(location.search).get('import')!=='teaching-lab')return;
    const payload=readHandoff();
    if(!payload)return;
    const ready=await waitForPlanner();
    if(!ready)return;

    let sessionId=payload.importedSessionId;
    const option=sessionId&&[...ready.select.options].find(o=>o.value===sessionId);
    if(option){
      ready.select.value=sessionId;
      fire(ready.select,'change');
      await delay(0);
    }else{
      ready.newButton.click();
      await delay(0);
      sessionId=selectedSessionId();
      if(!sessionId)return;
      payload.importedSessionId=sessionId;
      writeHandoff(payload);
    }

    setControl('select[data-field="dance"]',payload.dance,'change');
    await delay(0);
    setControl('select[data-field="stage"]',payload.stage,'change');
    await delay(0);

    for(const [key,next] of Object.entries({
      title:payload.title,duration:String(payload.duration),goal:payload.goal,learners:payload.learners,
      prerequisites:payload.prerequisites,assessment:payload.assessment,adaptations:payload.adaptations,
      reflection:payload.reflection,readiness:payload.readiness,rhythm:payload.rhythm,music:payload.music,bpm:payload.bpm
    })) setControl(`[data-field="${key}"]`,next,'input');
    setControl('select[data-field="roleFocus"]',payload.roleFocus,'change');
    await delay(0);
    setControl('select[data-field="partnerMode"]',payload.partnerMode,'change');
    await delay(0);

    let current=[...document.querySelectorAll('[data-activity][data-field="title"]')];
    while(current.length<payload.activities.length){
      const add=document.querySelector('[data-action="addActivity"]');
      if(!add)break;
      add.click();
      await delay(0);
      current=[...document.querySelectorAll('[data-activity][data-field="title"]')];
    }
    current=[...document.querySelectorAll('[data-activity][data-field="title"]')];
    payload.activities.forEach((activity,index)=>{
      const title=current[index];
      if(!title)return;
      const activityId=title.dataset.activity;
      setControl(`[data-activity="${CSS.escape(activityId)}"][data-field="title"]`,activity.title,'input');
      setControl(`[data-activity="${CSS.escape(activityId)}"][data-field="minutes"]`,String(activity.minutes),'input');
      setControl(`[data-activity="${CSS.escape(activityId)}"][data-field="instructions"]`,activity.instructions,'input');
    });

    let saved=true;
    if(typeof window.TeacherPlannerFlush==='function')saved=await window.TeacherPlannerFlush();
    if(!saved)return;
    localStorage.removeItem(KEY);
    const url=new URL(location.href);
    url.searchParams.delete('import');
    if(sessionId)url.searchParams.set('session',sessionId);
    history.replaceState(null,'',url);
    const status=document.getElementById('toolStatus');
    if(status)status.textContent='Imported from Teaching Lab and saved to your account. You can edit it here or attach it to a curriculum.';
  }

  function boot(){
    if(/^\/teaching-lab\/?$/.test(location.pathname))installLabBridge();
    if(/^\/session-planner\/?$/.test(location.pathname))importIntoPlanner();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
