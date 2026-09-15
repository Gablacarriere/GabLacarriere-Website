(() => {
  const contrastFix=document.createElement('style');
  contrastFix.textContent=`
    #library{background:#0b1119!important;color:#f7f4ee!important}
    #library h2,#library h3,#library .concept h3{color:#ffffff!important}
    #library .lede,#library .resultCount{color:#c8cfda!important}
    #library .concept{background:#0e141d!important;border-color:#ffffff24!important}
    #library .conceptHead{background:#0e141d!important}
    #library .quickBox{background:#111a24!important}
    #library .quickBox p{color:#f3f5f7!important}
    #library .details p{color:#d7dde5!important}
    #library .tag{background:#f2dfc5!important;color:#10141a!important;border-color:#f2dfc5!important}
    #library .chev{color:#d7dde5!important}
    #library .ghost,#expandAll{background:#18212c!important;color:#ffffff!important;border:1px solid #ffffff35!important}
    #library .search{background:#0a0f16!important;color:#ffffff!important;border:1px solid #ffffff35!important}
    #library .filterBtn{background:#f2dfc5!important;color:#10141a!important}
    #library .filterBtn.active{background:#7dd8ff!important;color:#071018!important}
    #library .label{color:#7dd8ff!important}
    .labMethod{padding:34px 0;background:#0d151f;border-top:1px solid #ffffff12;border-bottom:1px solid #ffffff12}
    .labMethodGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}
    .labMethodCard{background:#111a24;border:1px solid #ffffff18;border-radius:15px;padding:15px}
    .labMethodCard strong{display:block;margin-bottom:5px;color:#fff}
    .labMethodCard p{margin:0;color:#b9c2cd}
    .feedbackLoop{margin-top:12px;padding:15px;border:1px solid #7dd8ff40;border-radius:15px;background:#102031;color:#d8e5ee}
    .feedbackLoop strong{color:#fff}
    .outcomeFields{margin-top:14px;padding-top:14px;border-top:1px solid #ffffff18}
    .outcomeFields>p{margin:0 0 10px;color:#aeb6c2}
    .outcomeGrid{display:grid;grid-template-columns:1fr;gap:0}
    .planOutcomes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:0 0 12px}
    .planOutcome{padding:11px;border-radius:12px;border:1px solid #ffffff18;background:#101820}
    .planOutcome small{display:block;color:#7dd8ff;font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
    .planOutcome p{margin:0;color:#d7dde5}
    @media(max-width:760px){.labMethodGrid,.planOutcomes{grid-template-columns:1fr}}
    @media(max-width:520px){
      #library .concept h3{font-size:1.08rem!important;line-height:1.25!important}
      #library .quickBox p{font-size:1rem!important;line-height:1.5!important}
      #library .conceptHead{gap:10px!important}
      #library .tag{font-size:.76rem!important}
      #expandAll{width:100%!important}
    }
  `;
  document.head.appendChild(contrastFix);

  const METHOD=window.GAB_METHODOLOGY||{
    outcomeDomains:[
      {id:'technical',name:'Technical',prompt:'Movement, timing, connection, coordination or decision-making skill.'},
      {id:'social',name:'Social',prompt:'Partnership, consent, floorcraft, communication or social-dance behavior.'},
      {id:'personal',name:'Personal',prompt:'Confidence, autonomy, trust, creativity, expression or self-regulation.'}
    ],
    feedbackLoop:{steps:['Observe something specific','Give one concrete next action','Let the learner reattempt','Return and check what changed']},
    reflectionLoop:{fields:['Intended learning','Observed evidence','What transferred','What still broke down','What I will change next time']}
  };

  const config=window.GAB_PORTAL;
  if(!config || !window.supabase){
    document.body.innerHTML='<main class="gate"><div class="card"><h1>Teaching Lab unavailable</h1><p>Authentication could not start.</p></div></main>';
    return;
  }
  const sb=window.supabase.createClient(config.supabaseUrl,config.supabaseAnonKey);
  window.GAB_SESSION?.watch(sb);

  const AUTHORIZED_EMAIL='riseadance@gmail.com';
  const gate=document.getElementById('gate');
  const app=document.getElementById('app');
  const loginForm=document.getElementById('loginForm');
  const loginEmail=document.getElementById('loginEmail');
  const loginPassword=document.getElementById('loginPassword');
  const gateStatus=document.getElementById('gateStatus');
  const logoutBtn=document.getElementById('logoutBtn');
  const magicLinkBtn=document.getElementById('magicLinkBtn');
  let concepts=[];
  let activeCategory='All';
  let searchTerm='';
  let allExpanded=false;

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const el=id=>document.getElementById(id);

  function ensureMethodUI(){
    if(!document.getElementById('labMethod')){
      const section=document.createElement('section');
      section.id='labMethod';
      section.className='labMethod';
      section.innerHTML=`<div class="w"><div class="kicker">Methodology compass</div><h2>Design the learning, then test what survives.</h2><p class="lede">Use three outcome domains for the destination, then close the loop through observation, feedback, transfer and redesign.</p><div class="labMethodGrid">${METHOD.outcomeDomains.map(d=>`<article class="labMethodCard"><strong>${esc(d.name)} outcome</strong><p>${esc(d.prompt)}</p></article>`).join('')}</div><div class="feedbackLoop"><strong>Feedback loop:</strong> ${METHOD.feedbackLoop.steps.map((x,i)=>`${i+1}. ${esc(x)}`).join(' → ')}</div></div>`;
      const library=document.getElementById('library');
      library?.insertAdjacentElement('beforebegin',section);
    }

    const objective=el('objective');
    const card=objective?.closest('.card');
    if(card&&!el('technicalOutcome')){
      const wrapper=document.createElement('div');
      wrapper.className='outcomeFields';
      wrapper.innerHTML=`<p><strong>Learning outcomes</strong><br><span class="note">The main concept is not the whole goal. Define what should change technically, socially and personally.</span></p><div class="outcomeGrid"><div class="field"><label for="technicalOutcome">Technical outcome</label><textarea id="technicalOutcome" placeholder="What should become more reliable in movement, timing, connection or decision-making?"></textarea></div><div class="field"><label for="socialOutcome">Social outcome</label><textarea id="socialOutcome" placeholder="What should improve in partnership, communication, consent, floorcraft or adaptability?"></textarea></div><div class="field"><label for="personalOutcome">Personal outcome</label><textarea id="personalOutcome" placeholder="What should change in confidence, autonomy, trust, creativity or self-regulation?"></textarea></div><button type="button" class="ghost" id="suggestOutcomes">Suggest outcomes from this concept</button></div>`;
      objective.closest('.field')?.insertAdjacentElement('afterend',wrapper);
      el('suggestOutcomes')?.addEventListener('click',()=>suggestOutcomes(true));
      objective.addEventListener('change',()=>suggestOutcomes(false));
    }

    const form=el('reflectionForm');
    if(form&&!el('intendedLearning')){
      const conceptField=el('reflectionConcept')?.closest('.field');
      const intended=document.createElement('div');
      intended.className='field';
      intended.innerHTML='<label for="intendedLearning">Intended learning</label><textarea id="intendedLearning" required placeholder="What did I intend students to understand, feel or do?"></textarea>';
      conceptField?.insertAdjacentElement('afterend',intended);
      const worked=el('worked');
      worked?.closest('.field')?.querySelector('label')?.replaceChildren(document.createTextNode('Observed evidence'));
      if(worked) worked.placeholder='What did students actually show? What became clearer or more reliable?';
      const transferred=document.createElement('div');
      transferred.className='field';
      transferred.innerHTML='<label for="transferred">What transferred?</label><textarea id="transferred" required placeholder="What survived a new partner, condition, tempo, constraint or more dance-like context?"></textarea>';
      worked?.closest('.field')?.insertAdjacentElement('afterend',transferred);
      const struggled=el('struggled');
      struggled?.closest('.field')?.querySelector('label')?.replaceChildren(document.createTextNode('What still broke down?'));
      if(struggled) struggled.placeholder='Where did the learning disappear, become inconsistent or require too much teacher support?';
      const next=el('nextChange');
      next?.closest('.field')?.querySelector('label')?.replaceChildren(document.createTextNode('What will I change next time?'));
      if(next) next.placeholder='Change the cue, task, sequence, dosage, constraint, grouping or prerequisite.';
    }
  }

  function showGate(message='Sign in with your Gab account to open Teaching Lab.'){
    gate.hidden=false; app.hidden=true; gateStatus.textContent=message;
  }
  function showApp(){ gate.hidden=true; app.hidden=false; }

  async function getSession(){
    const {data,error}=await sb.auth.getSession();
    if(error) return null;
    return data.session||null;
  }

  async function loadPrivateData(){
    const session=await getSession();
    if(!session){
      loginForm.hidden=false;
      magicLinkBtn.hidden=false;
      logoutBtn.hidden=true;
      showGate('Use the secure email link if you do not know the portal password.');
      return;
    }
    gateStatus.textContent='Checking private access…';
    try{
      const response=await fetch('/api/teaching-lab-data',{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(response.status===403){
        showGate('You are signed in with a different account. Sign out, then use the secure Gab sign-in link.');
        loginForm.hidden=true;
        magicLinkBtn.hidden=true;
        logoutBtn.hidden=false;
        return;
      }
      if(!response.ok) throw new Error(data.error||'Could not load Teaching Lab');
      concepts=data.concepts||[];
      document.getElementById('sourceWindow').textContent=data.source?.window||'Recent Granola notes';
      document.getElementById('conceptCount').textContent=concepts.length;
      document.getElementById('drillCount').textContent=concepts.filter(x=>x.drill).length;
      document.getElementById('ownerName').textContent=data.owner?.display_name||'Gab';
      ensureMethodUI(); renderFilters(); fillObjectives(); renderConcepts(); renderReflections(); showApp();
      suggestOutcomes(false);
      logoutBtn.hidden=false;
    }catch(error){
      showGate(error.message||'Could not open Teaching Lab.');
      logoutBtn.hidden=false;
    }
  }

  magicLinkBtn.addEventListener('click',async()=>{
    gateStatus.textContent='Sending secure sign-in link…';
    magicLinkBtn.disabled=true;
    try{
      const {error}=await sb.auth.signInWithOtp({
        email:AUTHORIZED_EMAIL,
        options:{emailRedirectTo:`${location.origin}/teaching-lab/`,shouldCreateUser:false}
      });
      if(error) throw error;
      gateStatus.textContent='Check riseadance@gmail.com and tap the Teaching Lab sign-in link. You can close this page after opening the email.';
    }catch(error){
      gateStatus.textContent=error.message||'Could not send the sign-in link.';
    }finally{
      magicLinkBtn.disabled=false;
    }
  });

  loginForm.addEventListener('submit',async e=>{
    e.preventDefault();
    gateStatus.textContent='Signing in…';
    const {error}=await sb.auth.signInWithPassword({email:loginEmail.value.trim(),password:loginPassword.value});
    if(error){ gateStatus.textContent=error.message; return; }
    loginPassword.value='';
    await loadPrivateData();
  });

  logoutBtn.addEventListener('click',async()=>{
    await sb.auth.signOut();
    loginForm.hidden=false; magicLinkBtn.hidden=false; logoutBtn.hidden=true;
    showGate('Signed out. Use the secure email link to sign in as Gab.');
  });

  function renderFilters(){
    const cats=['All',...new Set(concepts.map(c=>c.category))];
    const root=document.getElementById('filters');
    root.innerHTML=cats.map(cat=>`<button type="button" class="filterBtn ${cat===activeCategory?'active':''}" data-cat="${esc(cat)}">${esc(cat)}</button>`).join('');
    root.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{activeCategory=btn.dataset.cat;renderFilters();renderConcepts();}));
  }

  function fillObjectives(){
    const options=concepts.map(c=>`<option value="${esc(c.id)}">${esc(c.title)}</option>`).join('');
    document.getElementById('objective').innerHTML=options;
    document.getElementById('reflectionConcept').innerHTML=options;
  }

  function renderConcepts(){
    let list=activeCategory==='All'?concepts:concepts.filter(c=>c.category===activeCategory);
    if(searchTerm){
      const q=searchTerm.toLowerCase();
      list=list.filter(c=>[c.title,c.category,c.problem,c.cue,c.drill,c.evidence,c.group].some(v=>String(v||'').toLowerCase().includes(q)));
    }
    const count=document.getElementById('resultCount');
    if(count) count.textContent=`${list.length} ${list.length===1?'concept':'concepts'}`;
    const root=document.getElementById('conceptGrid');
    if(!list.length){root.innerHTML='<div class="empty">No matching concepts.</div>';return;}
    root.innerHTML=list.map(c=>`<article class="concept ${allExpanded?'open':''}" data-concept="${esc(c.id)}"><div class="conceptHead" role="button" tabindex="0" aria-expanded="${allExpanded?'true':'false'}"><div class="conceptTop"><div><span class="tag">${esc(c.category)}</span><h3>${esc(c.title)}</h3></div><span class="chev">⌄</span></div><div class="quick"><div class="quickBox"><div class="label">Cue</div><p>${esc(c.cue)}</p></div><div class="quickBox"><div class="label">Drill</div><p>${esc(c.drill)}</p></div></div></div><div class="details"><div class="label">Recurring problem</div><p>${esc(c.problem)}</p><div class="label">Evidence from teaching</div><p>${esc(c.evidence)}</p><div class="label">Group adaptation</div><p>${esc(c.group)}</p><div class="actions"><button type="button" data-add="${esc(c.id)}">Build class from this</button></div></div></article>`).join('');
    root.querySelectorAll('.conceptHead').forEach(head=>{
      const toggle=()=>{const card=head.closest('.concept');card.classList.toggle('open');head.setAttribute('aria-expanded',card.classList.contains('open')?'true':'false');};
      head.addEventListener('click',toggle);
      head.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
    });
    root.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();document.getElementById('objective').value=b.dataset.add;suggestOutcomes(false);generatePlan();document.getElementById('builder').scrollIntoView({behavior:'smooth'});}));
  }

  const search=document.getElementById('conceptSearch');
  if(search) search.addEventListener('input',e=>{searchTerm=e.target.value.trim();renderConcepts();});
  const expand=document.getElementById('expandAll');
  if(expand) expand.addEventListener('click',()=>{allExpanded=!allExpanded;expand.textContent=allExpanded?'Collapse all':'Expand all';renderConcepts();});

  function outcomeSuggestions(c){
    const type=el('classType')?.value||'class';
    return {
      technical:`By the end, dancers can use ${c.title} with clearer organization and reproduce the cue “${c.cue}” in more than one practice condition.`,
      social:`Partners can practice ${c.title} with clear information, appropriate intensity and adaptation to different partners while preserving consent and floorcraft.`,
      personal:`Dancers can recognize one successful attempt, name what made it work and make one useful adjustment without waiting for the teacher to supply every answer in the ${type.toLowerCase()} context.`
    };
  }

  function suggestOutcomes(force){
    const c=concepts.find(x=>x.id===el('objective')?.value); if(!c||!el('technicalOutcome')) return;
    const suggestions=outcomeSuggestions(c);
    for(const [id,key] of [['technicalOutcome','technical'],['socialOutcome','social'],['personalOutcome','personal']]){
      const field=el(id); if(field&&(force||!field.value.trim())) field.value=suggestions[key];
    }
  }

  function generatePlan(){
    const c=concepts.find(x=>x.id===document.getElementById('objective').value); if(!c) return;
    suggestOutcomes(false);
    const duration=Number(document.getElementById('duration').value||60), type=document.getElementById('classType').value, level=document.getElementById('level').value;
    const technical=el('technicalOutcome')?.value.trim()||outcomeSuggestions(c).technical;
    const social=el('socialOutcome')?.value.trim()||outcomeSuggestions(c).social;
    const personal=el('personalOutcome')?.value.trim()||outcomeSuggestions(c).personal;
    const blocks=duration<=60?[[3,'Mental arrival'],[7,'General warm-up'],[8,'Specific warm-up'],[10,'Understand & feel'],[15,'Focused practice + feedback'],[12,'Integration & transfer'],[5,'Cool-down + retrieval']]:duration<=90?[[4,'Mental arrival'],[10,'General warm-up'],[12,'Specific warm-up'],[15,'Understand & feel'],[22,'Focused practice + feedback'],[20,'Integration & transfer'],[7,'Cool-down + retrieval']]:[[5,'Mental arrival'],[12,'General warm-up'],[15,'Specific warm-up'],[20,'Understand & feel'],[30,'Focused practice + feedback'],[28,'Integration & transfer'],[10,'Cool-down + retrieval']];
    const descriptions=[
      `Bring the group together, focus attention and state the learning intention without over-explaining. Technical: ${technical} Social: ${social} Personal: ${personal}`,
      'Raise body temperature progressively with continuous movement, then move feet/ankles, knees, hips/pelvis, spine, shoulders/scapulae, arms/wrists and neck through comfortable active ranges. Finish ready, not tired.',
      `Prepare the exact demands of ${c.title.toLowerCase()}. Start with a simpler, smaller and slower version of the relevant movement or coordination. Use the drill idea as preparation where appropriate: ${c.drill} Watch for: ${c.problem}`,
      `Give one clear model and one contrast the dancers can notice or feel. Main cue: “${c.cue}” Keep explanation short, let them try, then ask what changed in timing, weight, direction, connection or organization.`,
      `${c.drill} Protect enough repetitions around one primary variable. Feedback loop: observe something specific → give one concrete next action → let the dancer reattempt → return and check what changed. If the cue does not change the result, update the cue rather than repeating it louder.`,
      `Convert the principle to more dance-like work: ${c.group} Change one meaningful condition at a time—partner, entry, side, timing, direction, range or speed. Keep the main principle recognizable and observe what transfers without teacher interruption.`,
      'Lower physical and cognitive intensity with easy movement and comfortable mobility in the most-used regions. Before explaining again, ask each dancer to retrieve one cue, sensation or decision from memory. Close with one thing that transferred and one thing to revisit next.'
    ];
    document.getElementById('plan').innerHTML=`<div class="planHeader"><strong>${esc(c.title)}</strong><span>${esc(type)} · ${esc(level)} · ${duration} min</span></div><div class="planOutcomes"><div class="planOutcome"><small>Technical</small><p>${esc(technical)}</p></div><div class="planOutcome"><small>Social</small><p>${esc(social)}</p></div><div class="planOutcome"><small>Personal</small><p>${esc(personal)}</p></div></div>`+blocks.map((b,i)=>`<div class="planItem"><small>${b[0]} min · ${esc(b[1])}</small><b>${esc(b[1])}</b><p>${esc(descriptions[i]||descriptions[descriptions.length-1])}</p></div>`).join('');
  }

  document.getElementById('generatePlan').addEventListener('click',generatePlan);
  document.getElementById('clearPlan').addEventListener('click',()=>document.getElementById('plan').innerHTML='<div class="empty">Choose an objective and generate a class.</div>');
  const storageKey='gabTeachingLabReflectionsV1';
  function getReflections(){try{return JSON.parse(localStorage.getItem(storageKey)||'[]')}catch{return[]}}
  function renderReflections(){
    const rows=getReflections();
    document.getElementById('reflectionList').innerHTML=rows.length?rows.slice().reverse().map(r=>`<div class="reflection"><small>${esc(r.date)} · ${esc(r.concept)} · ${esc(r.score)}/5</small><p><b>Intended:</b> ${esc(r.intended||'Not recorded')}</p><p><b>Observed:</b> ${esc(r.observed||r.worked||'')}</p><p><b>Transferred:</b> ${esc(r.transferred||'Not recorded')}</p><p><b>Still broke down:</b> ${esc(r.breakdown||r.struggled||'')}</p><p><b>Next change:</b> ${esc(r.nextChange||'')}</p></div>`).join(''):'<div class="empty">No reflections saved yet.</div>';
  }
  document.getElementById('reflectionForm').addEventListener('submit',e=>{
    e.preventDefault();
    const c=concepts.find(x=>x.id===document.getElementById('reflectionConcept').value),rows=getReflections();
    const intended=el('intendedLearning')?.value.trim()||'';
    const observed=el('worked').value.trim();
    const transferred=el('transferred')?.value.trim()||'';
    const breakdown=el('struggled').value.trim();
    const nextChange=el('nextChange').value.trim();
    rows.push({date:new Date().toISOString().slice(0,10),concept:c?.title||'',intended,observed,transferred,breakdown,nextChange,worked:observed,struggled:breakdown,score:document.getElementById('confidence').value});
    localStorage.setItem(storageKey,JSON.stringify(rows.slice(-100)));
    e.target.reset(); fillObjectives(); renderReflections();
  });
  document.getElementById('copyRefresh').addEventListener('click',async()=>{const text='Refresh my private Teaching Lab from Granola. Compare new dance classes and private lessons with the existing concept bank. Add or refine recurring problems, cues, drills, evidence and group-class adaptations. Also flag repeated teaching bottlenecks, cues that reliably change the next attempt, and skills that transfer across partners or contexts. Keep student-specific details private.';try{await navigator.clipboard.writeText(text);document.getElementById('copyStatus').textContent='Refresh request copied.';}catch{document.getElementById('copyStatus').textContent=text;}});

  ensureMethodUI();
  sb.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED')setTimeout(loadPrivateData,0);});
  loadPrivateData();
})();