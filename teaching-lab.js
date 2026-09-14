(() => {
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
  const conceptSearch=document.getElementById('conceptSearch');
  const expandAllBtn=document.getElementById('expandAll');
  let concepts=[];
  let activeCategory='All';
  let searchTerm='';
  let expandAll=false;

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

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
      loginForm.hidden=false; magicLinkBtn.hidden=false; logoutBtn.hidden=true;
      showGate('Use the secure email link if you do not know the portal password.');
      return;
    }
    gateStatus.textContent='Checking private access…';
    try{
      const response=await fetch('/api/teaching-lab-data',{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(response.status===403){
        showGate('You are signed in with a different account. Sign out, then use the secure Gab sign-in link.');
        loginForm.hidden=true; magicLinkBtn.hidden=true; logoutBtn.hidden=false;
        return;
      }
      if(!response.ok) throw new Error(data.error||'Could not load Teaching Lab');
      concepts=data.concepts||[];
      document.getElementById('sourceWindow').textContent=data.source?.window||'Recent';
      document.getElementById('conceptCount').textContent=concepts.length;
      document.getElementById('drillCount').textContent=concepts.filter(x=>x.drill).length;
      document.getElementById('ownerName').textContent=data.owner?.display_name||'Gab';
      renderFilters(); fillObjectives(); renderConcepts(); renderReflections(); showApp();
      logoutBtn.hidden=false;
    }catch(error){
      showGate(error.message||'Could not open Teaching Lab.');
      logoutBtn.hidden=false;
    }
  }

  magicLinkBtn.addEventListener('click',async()=>{
    gateStatus.textContent='Sending secure sign-in link…'; magicLinkBtn.disabled=true;
    try{
      const {error}=await sb.auth.signInWithOtp({email:AUTHORIZED_EMAIL,options:{emailRedirectTo:`${location.origin}/teaching-lab/`,shouldCreateUser:false}});
      if(error) throw error;
      gateStatus.textContent='Check riseadance@gmail.com and tap the Teaching Lab sign-in link.';
    }catch(error){ gateStatus.textContent=error.message||'Could not send the sign-in link.'; }
    finally{ magicLinkBtn.disabled=false; }
  });

  loginForm.addEventListener('submit',async e=>{
    e.preventDefault(); gateStatus.textContent='Signing in…';
    const {error}=await sb.auth.signInWithPassword({email:loginEmail.value.trim(),password:loginPassword.value});
    if(error){ gateStatus.textContent=error.message; return; }
    loginPassword.value=''; await loadPrivateData();
  });

  logoutBtn.addEventListener('click',async()=>{
    await sb.auth.signOut(); loginForm.hidden=false; magicLinkBtn.hidden=false; logoutBtn.hidden=true;
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

  function filteredConcepts(){
    return concepts.filter(c=>{
      const catOk=activeCategory==='All'||c.category===activeCategory;
      if(!catOk) return false;
      if(!searchTerm) return true;
      const hay=[c.title,c.category,c.problem,c.cue,c.drill,c.evidence,c.group].join(' ').toLowerCase();
      return hay.includes(searchTerm);
    });
  }

  function renderConcepts(){
    const list=filteredConcepts();
    const count=document.getElementById('resultCount');
    if(count) count.textContent=`${list.length} of ${concepts.length} concepts`;
    document.getElementById('conceptGrid').innerHTML=list.length?list.map(c=>`<article class="concept ${expandAll?'open':''}" data-concept="${esc(c.id)}">
      <div class="conceptHead" role="button" tabindex="0" aria-expanded="${expandAll?'true':'false'}">
        <div class="conceptTop"><div><span class="tag">${esc(c.category)}</span><h3>${esc(c.title)}</h3></div><span class="chev">⌄</span></div>
        <div class="quick"><div class="quickBox"><div class="label">Cue</div><p>${esc(c.cue)}</p></div><div class="quickBox"><div class="label">Drill</div><p>${esc(c.drill)}</p></div></div>
      </div>
      <div class="details">
        <div class="label">Recurring problem</div><p>${esc(c.problem)}</p>
        <div class="label">Evidence from teaching</div><p>${esc(c.evidence)}</p>
        <div class="label">Group adaptation</div><p>${esc(c.group)}</p>
        <div class="actions"><button type="button" data-add="${esc(c.id)}">Build class from this</button></div>
      </div>
    </article>`).join(''):'<div class="empty">No concepts match this search.</div>';

    document.querySelectorAll('.conceptHead').forEach(head=>{
      const toggle=()=>{const card=head.closest('.concept');card.classList.toggle('open');head.setAttribute('aria-expanded',card.classList.contains('open')?'true':'false');};
      head.addEventListener('click',toggle);
      head.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
    });
    document.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();document.getElementById('objective').value=b.dataset.add;generatePlan();document.getElementById('builder').scrollIntoView({behavior:'smooth'});}));
  }

  if(conceptSearch) conceptSearch.addEventListener('input',()=>{searchTerm=conceptSearch.value.trim().toLowerCase();renderConcepts();});
  if(expandAllBtn) expandAllBtn.addEventListener('click',()=>{expandAll=!expandAll;expandAllBtn.textContent=expandAll?'Collapse all':'Expand all';renderConcepts();});

  function generatePlan(){
    const c=concepts.find(x=>x.id===document.getElementById('objective').value); if(!c) return;
    const duration=Number(document.getElementById('duration').value||60), type=document.getElementById('classType').value, level=document.getElementById('level').value;
    const blocks=duration<=60?[[6,'Diagnostic warm-up'],[10,'Isolate the mechanic'],[12,'Private-derived drill'],[12,'Partner constraint'],[12,'Variable practice'],[8,'Social transfer + recap']]:duration<=90?[[8,'Diagnostic warm-up'],[12,'Isolate the mechanic'],[15,'Private-derived drill'],[15,'Partner constraint'],[15,'Variation / error detection'],[15,'Pattern or movement integration'],[10,'Social transfer + recap']]:[[10,'Diagnostic warm-up'],[15,'Isolate the mechanic'],[20,'Private-derived drill'],[20,'Partner constraint'],[20,'Variation / error detection'],[20,'Pattern integration'],[10,'Social transfer'],[5,'Reflection + retrieval cue']];
    const descriptions=[`Test ${c.title.toLowerCase()} with a simple task before explaining it. Watch for: ${c.problem}`,`Teach one clear model. Main cue: “${c.cue}” Keep explanation short, then immediately test it.`,c.drill,`Convert the private drill to partner work: ${c.group}`,'Change partner, entry, timing or direction. Ask dancers to identify the same principle under a new constraint.',`Integrate the principle into ${type}. Keep the technical objective constant while changing movement vocabulary.`,'Dance with fewer stops. Observe whether the skill survives attention, music and partner variation.',`Students state one cue they will retrieve next time. Teacher records what worked and what needs redesign.`];
    document.getElementById('plan').innerHTML=`<div class="planHeader"><strong>${esc(c.title)}</strong><span>${esc(type)} · ${esc(level)} · ${duration} min</span></div>`+blocks.map((b,i)=>`<div class="planItem"><small>${b[0]} min · ${esc(b[1])}</small><b>${esc(b[1])}</b><p>${esc(descriptions[i]||descriptions[descriptions.length-1])}</p></div>`).join('');
  }

  document.getElementById('generatePlan').addEventListener('click',generatePlan);
  document.getElementById('clearPlan').addEventListener('click',()=>document.getElementById('plan').innerHTML='<div class="empty">Choose an objective and generate a class.</div>');
  const storageKey='gabTeachingLabReflectionsV1';
  function getReflections(){try{return JSON.parse(localStorage.getItem(storageKey)||'[]')}catch{return[]}}
  function renderReflections(){const rows=getReflections();document.getElementById('reflectionList').innerHTML=rows.length?rows.slice().reverse().map(r=>`<div class="reflection"><small>${esc(r.date)} · ${esc(r.concept)} · ${esc(r.score)}/5</small><p><b>Worked:</b> ${esc(r.worked)}</p><p><b>Still difficult:</b> ${esc(r.struggled)}</p><p><b>Next change:</b> ${esc(r.nextChange)}</p></div>`).join(''):'<div class="empty">No reflections saved yet.</div>';}
  document.getElementById('reflectionForm').addEventListener('submit',e=>{e.preventDefault();const c=concepts.find(x=>x.id===document.getElementById('reflectionConcept').value);const rows=getReflections();rows.push({date:new Date().toISOString().slice(0,10),concept:c?.title||'',worked:document.getElementById('worked').value.trim(),struggled:document.getElementById('struggled').value.trim(),nextChange:document.getElementById('nextChange').value.trim(),score:document.getElementById('confidence').value});localStorage.setItem(storageKey,JSON.stringify(rows.slice(-100)));e.target.reset();fillObjectives();renderReflections();});
  document.getElementById('copyRefresh').addEventListener('click',async()=>{const text='Refresh my private Teaching Lab from Granola. Compare new dance classes and private lessons with the existing concept bank, add or refine recurring problems, cues, drills, evidence and group-class adaptations, and keep student-specific details private.';try{await navigator.clipboard.writeText(text);document.getElementById('copyStatus').textContent='Refresh request copied.';}catch{document.getElementById('copyStatus').textContent=text;}});

  sb.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED')setTimeout(loadPrivateData,0);});
  loadPrivateData();
})();
