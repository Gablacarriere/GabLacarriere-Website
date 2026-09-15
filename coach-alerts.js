(() => {
  'use strict';
  if (!location.pathname.startsWith('/mentorship-hub')) return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean=p=>String(p||'').replace(/COACH FLAG:\s*student requested Gab input\.?/ig,'').replace(/COACH FLAG/ig,'').replace(/\s{2,}/g,' ').trim();

  function styles(){
    if(document.getElementById('coachAlertStyles'))return;
    const s=document.createElement('style');s.id='coachAlertStyles';s.textContent=`
      #coachSignalDock{position:fixed;right:18px;top:84px;z-index:90;display:none;align-items:center;gap:9px;padding:10px 14px;border-radius:999px;border:1px solid #ff9e9e55;background:#24141bcc;color:#fff;backdrop-filter:blur(12px);box-shadow:0 12px 32px #0008;font:800 14px/1.2 system-ui;cursor:pointer}
      #coachSignalDock.visible{display:flex}#coachSignalDock.hasSignals{background:#38151f;border-color:#ff9e9e99}#coachSignalDock .dot{width:9px;height:9px;border-radius:50%;background:#6b7280}#coachSignalDock.hasSignals .dot{background:#ff8e8e;animation:coachPulse 1.8s infinite}#coachSignalDock .count{display:grid;place-items:center;min-width:24px;height:24px;padding:0 7px;border-radius:999px;background:#ffffff14}.coachSignalUnread{border-left:3px solid #ff8e8e;padding-left:14px!important}.coachSignalNew{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;font-weight:900;color:#ffb0b0;margin-left:8px}@keyframes coachPulse{0%{box-shadow:0 0 0 0 #ff8e8e66}70%{box-shadow:0 0 0 8px #ff8e8e00}100%{box-shadow:0 0 0 0 #ff8e8e00}}@media(max-width:820px){#coachSignalDock{right:12px;top:auto;bottom:72px;max-width:calc(100vw - 24px)}}`;
    document.head.appendChild(s);
  }
  function dock(){
    let d=document.getElementById('coachSignalDock');if(d)return d;
    d=document.createElement('button');d.id='coachSignalDock';d.type='button';d.innerHTML='<span class="dot"></span><span>Priority Signals</span><span class="count">0</span>';
    d.onclick=()=>{document.querySelector('[data-mode="coach"]')?.click();setTimeout(()=>document.getElementById('coachAttentionList')?.closest('.dashCard')?.scrollIntoView({behavior:'smooth',block:'start'}),120);};
    document.body.appendChild(d);return d;
  }
  async function refresh(client){
    const session=await client.auth.getSession();if(!session.data.session)return;
    const prof=await client.from('profiles').select('role').eq('id',session.data.session.user.id).maybeSingle();if(prof.data?.role!=='coach')return;
    const d=dock();d.classList.add('visible');
    const result=await client.from('reviews').select('id,student_id,title,prompt,next_review').ilike('prompt','%COACH FLAG%').order('id',{ascending:false});if(result.error)return;
    const rows=result.data||[];d.querySelector('.count').textContent=rows.length;d.classList.toggle('hasSignals',rows.length>0);
    const mode=document.querySelector('[data-mode="coach"]');if(mode)mode.textContent=rows.length?`Students I Coach · ${rows.length}`:'Students I Coach';
    const count=document.getElementById('coachAttentionCount');if(count)count.textContent=rows.length;
    const list=document.getElementById('coachAttentionList');if(!list)return;if(!rows.length){list.innerHTML='<p class="empty">No students need attention right now.</p>';return;}
    const profiles=await client.from('profiles').select('id,display_name,email');const names=new Map((profiles.data||[]).map(x=>[x.id,x.display_name||x.email||'Student']));
    list.innerHTML=rows.map((x,i)=>`<div class="manageItem coachSignalUnread"><div class="manageItemTop"><div><span class="badge">${esc(names.get(x.student_id)||'Student')}</span>${i===0?'<span class="coachSignalNew">Newest</span>':''}<h3 style="margin-top:10px">${esc(x.title||'Training issue')}</h3><p>${esc(clean(x.prompt)||'Student requested coach input.')}</p></div><div class="editorActions"><button class="smallBtn" type="button" data-open-signal="${esc(x.student_id)}">Open student</button><button class="smallBtn" type="button" data-resolve-signal="${esc(x.id)}">Mark resolved</button></div></div><div class="reviewStatus" data-signal-status="${esc(x.id)}"></div></div>`).join('');
    list.querySelectorAll('[data-open-signal]').forEach(b=>b.onclick=()=>{document.querySelector('[data-mode="coach"]')?.click();document.querySelector(`[data-student="${CSS.escape(b.dataset.openSignal)}"]`)?.click();setTimeout(()=>document.getElementById('coachEditor')?.scrollIntoView({behavior:'smooth',block:'start'}),180);});
    list.querySelectorAll('[data-resolve-signal]').forEach(b=>b.onclick=async()=>{const id=Number(b.dataset.resolveSignal),row=rows.find(r=>Number(r.id)===id),status=list.querySelector(`[data-signal-status="${id}"]`);b.disabled=true;if(status)status.textContent='Resolving…';const r=await client.from('reviews').update({prompt:clean(row?.prompt)||null}).eq('id',id);if(r.error){b.disabled=false;if(status)status.textContent=r.error.message;return;}await refresh(client);});
  }
  async function boot(){
    styles();while(!window.supabase||!window.GAB_PORTAL?.supabaseUrl)await new Promise(r=>setTimeout(r,250));
    const client=window.supabase.createClient(window.GAB_PORTAL.supabaseUrl,window.GAB_PORTAL.supabaseAnonKey);await refresh(client);setInterval(()=>refresh(client),60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh(client);});
  }
  setTimeout(()=>boot().catch(err=>console.error('Coach alerts',err)),500);
})();

(() => {
  if (!location.pathname.startsWith('/mentorship-hub')) return;
  const assets=[
    ['link','mentorshipRoadmap','/mentorship-roadmap.css?v=1'],
    ['script','mentorshipRoadmap','/mentorship-roadmap.js?v=1'],
    ['script','mentorshipHomework','/mentorship-homework.js?v=1']
  ];
  assets.forEach(([kind,key,url])=>{
    if(document.querySelector(`${kind}[data-${key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}]`))return;
    const el=document.createElement(kind);if(kind==='link'){el.rel='stylesheet';el.href=url;}else{el.src=url;el.defer=true;}el.dataset[key]='1';document.head.appendChild(el);
  });
})();
