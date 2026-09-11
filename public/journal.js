(() => {
'use strict';
const $=id=>document.getElementById(id), esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let client,coach=false,editing=null,pending=null,offset=0,articles=[],drafts=[];
const fields='id,title,author_name,author_bio,category,excerpt,body,status,created_at,updated_at';
const date=v=>new Date(v).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
async function list(reset=true){
 if(reset){offset=0;articles=[];}
 const r=await client.from('journal_articles').select(fields).eq('status','published').order('created_at',{ascending:false}).order('id').range(offset,offset+11);
 if(r.error){$('journalStatus').textContent='Articles could not load. Reload to try again. The teaching guides below are still available.';return;}
 articles.push(...r.data);offset+=r.data.length;$('moreArticles').hidden=r.data.length<12;
 $('articleList').innerHTML=articles.map(a=>`<article class="card"><p class="kicker">${esc(a.category)}</p><h3>${esc(a.title)}</h3><p>${esc(a.excerpt)}</p><p class="articleMeta">${esc(a.author_name)}</p><a class="journalReadLink" href="?article=${a.id}#articleReader">Read article →</a></article>`).join('');
 $('journalStatus').textContent=articles.length?'':'The first Journal contributions are on their way. Explore the teaching guides below, or propose a piece of your own.';
}

function articleMarkup(a){
 const featured=a.id==='2dfc59b4-ae70-4f92-931a-57c15cac1e84';
 const blocks=String(a.body||'').split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
 const isHeading=s=>s.length<100&&/[A-Z]/.test(s)&&s===s.toUpperCase()&&!s.includes('\n')&&!s.startsWith('•');
 const titleCase=s=>s.toLowerCase().replace(/^./,c=>c.toUpperCase()).replace(/\bcte\b/g,'CTE');
 const headings=blocks.filter(isHeading);
 const hasSources=blocks.includes('SOURCES AND SCOPE');
 function inline(s){
  return s.split(/(https?:\/\/[^\s<>]+)/g).map((part,i)=>{
   if(i%2)return '<a href="'+esc(part)+'" target="_blank" rel="noopener noreferrer">'+esc(part)+'</a>';
   let safe=esc(part);
   if(hasSources)safe=safe.replace(/\[(\d+)\]/g,'<a class="citation" href="#article-source-$1" aria-label="Reference $1">[$1]</a>');
   return safe.replace(/\n/g,'<br>');
  }).join('');
 }
 const figures={
 cases:'<figure class="researchFigure" id="figure-cases"><p class="figureLabel">Figure 01 · Published evidence</p><h4>A warning signal, not a risk estimate.</h4><a href="/journal-headbanging-cases.svg" target="_blank" rel="noopener" aria-label="Open injury chart full size"><img src="/journal-headbanging-cases.svg" width="900" height="580" loading="lazy" alt="Published headbanging cases: subdural hematoma 8; internal carotid artery dissection 2; basilar artery thrombosis 2; vertebral artery aneurysm 1; intracerebral hemorrhage 1. Thirteen patients, with overlapping diagnoses."></a><figcaption>Diagnoses overlap: the counts total 14 across 13 patients. These published cases cannot tell us how often injury occurs, and they are not measurements of Zouk or Lambada dancers. <a href="https://pubmed.ncbi.nlm.nih.gov/36123989/" target="_blank" rel="noopener">Meiling et al., 2022 ↗</a></figcaption></figure>',
 timing:'<figure class="researchFigure timingFigure" id="figure-timing"><p class="figureLabel">Figure 02 · A timing illustration</p><h4>The shape stays. The demand changes.</h4><a href="/journal-movement-timing.svg" target="_blank" rel="noopener" aria-label="Open movement timing chart full size"><img src="/journal-movement-timing.svg" width="800" height="560" loading="lazy" alt="For an identical pathway completed in half the time, peak angular speed doubles and peak angular acceleration quadruples compared with the original duration."></a><figcaption>Original mathematical illustration, not dance measurements. For the same angular pathway with time scaled by r, speed scales by 1/r and acceleration by 1/r². At r = 0.5, the multipliers are 2 and 4. This does not calculate injury risk.</figcaption></figure>'
 };
 let h=0,inSources=false;
 const content=blocks.map(s=>{
  if(isHeading(s)){inSources=s==='SOURCES AND SCOPE';return '<h3 id="article-section-'+(++h)+'"><span class="sectionNumber">'+String(h).padStart(2,'0')+'</span>'+esc(titleCase(s))+'</h3>';}
  if(inSources&&/^\[\d+\]/.test(s)){const n=s.match(/^\[(\d+)\]/)[1];return '<p class="sourceEntry" id="article-source-'+n+'"><span class="sourceNumber">'+n+'</span>'+inline(s.replace(/^\[\d+\]\s*/,''))+'</p>';}
  let out=s.startsWith('• ')?'<ul class="teachingPoint"><li>'+inline(s.slice(2))+'</li></ul>':'<p>'+inline(s)+'</p>';
  if(featured&&s.startsWith('We can take the question seriously'))out='<blockquote>'+inline(s)+'</blockquote>';
  if(featured&&s.startsWith('If concussion is suspected'))out='<aside class="clinicalNote"><strong>Pause and get assessed</strong><p>'+inline(s)+'</p></aside>';
  if(featured&&s.startsWith('Those are published cases, not an injury rate.'))out+=figures.cases;
  if(featured&&s.startsWith('This is a timing illustration, not a measurement'))out+=figures.timing;
  return out;
 }).join('');
 return (headings.length?'<details class="articleContents"><summary>Inside this article <span>'+headings.length+' sections</span></summary><ol>'+headings.map((s,i)=>'<li><a href="#article-section-'+(i+1)+'">'+esc(titleCase(s))+'</a></li>').join('')+'</ol></details>':'')+
 (featured?'<div class="articleQuickLinks"><a href="#figure-cases">View the case-report chart ↓</a><a href="#figure-timing">View the timing chart ↓</a></div>':'')+
 '<div class="articleBody formattedArticle">'+content+'</div>';
}

async function read(){
 const id=new URLSearchParams(location.search).get('article');if(!id)return;
 if(!/^[0-9a-f-]{36}$/i.test(id))return;
 const r=await client.from('journal_articles').select(fields).eq('id',id).maybeSingle();
 const box=$('articleReader');box.hidden=false;
 if(r.error||!r.data){box.innerHTML='<h2>Article unavailable</h2><p>This article may be a private draft or no longer published.</p><a href="/journal/">Return to the Journal →</a>';return;}
 const a=r.data;
 if(!document.getElementById('journalReaderStyles')){const css=document.createElement('link');css.id='journalReaderStyles';css.rel='stylesheet';css.href='/journal-reader.css?v=figures-1';document.head.appendChild(css);}
 document.body.classList.add('journalReading');
 box.innerHTML=`<a href="/journal/#articles">← All articles</a><p class="kicker">${esc(a.category)}${a.status==='draft'?' · PRIVATE DRAFT':''}</p><h2>${esc(a.title)}</h2><p class="articleMeta">By ${esc(a.author_name)} <span>· ${Math.ceil(a.body.split(/\s+/).length/220)} min read · Updated ${esc(date(a.updated_at))}</span></p><p class="lede">${esc(a.excerpt)}</p>${articleMarkup(a)}<aside class="authorNote"><strong>${esc(a.author_name)}</strong><p>${esc(a.author_bio)}</p></aside>`;
 document.title=a.title+' | The Journal';box.focus({preventScroll:true});box.scrollIntoView({block:'start'});
}
async function studio(){
 if(!coach)return;
 const r=await client.from('journal_articles').select(fields).order('updated_at',{ascending:false}).limit(100);
 if(r.error){$('editorStatus').textContent='The editorial list could not load. Reload before editing.';return;}
 if(!coach)return;drafts=r.data;$('journalStudio').hidden=false;
 $('draftList').innerHTML=drafts.map(a=>`<button type="button" data-edit="${a.id}">${esc(a.title)} · ${esc(a.status)}</button>`).join('');
}
$('draftList').addEventListener('click',e=>{const b=e.target.closest('[data-edit]');if(!b)return;const a=drafts.find(x=>x.id===b.dataset.edit);if(!a)return;editing=a.id;pending=null;for(const k of ['title','author_name','author_bio','category','excerpt','body'])$('articleForm').elements[k].value=a[k];$('editorStatus').textContent='Editing '+a.title+'. Save as private draft removes it from public view.';});
$('newArticle').onclick=()=>{editing=null;pending=null;$('articleForm').reset();$('editorStatus').textContent='New article. Add the writer’s byline before publishing.';};
$('articleForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!coach||!e.target.reportValidity())return;
 const status=e.submitter?.value==='published'?'published':'draft';
 if(status==='published'&&!confirm('Publish this article publicly with the byline shown?'))return;
 const payload=Object.fromEntries(new FormData(e.target));delete payload.action;payload.status=status;for(const k of Object.keys(payload))payload[k]=payload[k].trim();
 const buttons=[...e.target.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);$('editorStatus').textContent='Saving…';
 try{
 let r;if(editing)r=await client.from('journal_articles').update(payload).eq('id',editing).select('id').single();
 else{pending=pending||crypto.randomUUID();r=await client.from('journal_articles').insert({id:pending,...payload}).select('id').single();if(r.error?.code==='23505')r=await client.from('journal_articles').update(payload).eq('id',pending).select('id').single();}
 if(r.error)throw r.error;editing=r.data.id;pending=null;$('editorStatus').textContent=status==='published'?'Published. Your article is now in the Journal.':'Saved privately. Only coaches can read this draft.';await list();await studio();
 }catch(_){$('editorStatus').textContent='Save could not be confirmed. Your text is still here. Retry to save the same article.';}finally{buttons.forEach(b=>b.disabled=false);}
});
$('moreArticles').onclick=()=>list(false);
(async()=>{try{if(!window.supabase||!window.GAB_PORTAL)throw Error();client=supabase.createClient(GAB_PORTAL.supabaseUrl,GAB_PORTAL.supabaseAnonKey);window.GAB_SESSION?.watch(client);await list();await read();const u=await client.auth.getUser();if(u.data.user){const p=await client.from('profiles').select('role').eq('id',u.data.user.id).single();coach=p.data?.role==='coach';await studio();}client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){coach=false;drafts=[];$('journalStudio').hidden=true;$('articleForm').reset();$('draftList').replaceChildren();$('articleReader').hidden=true;}});}catch(_){$('journalStatus').textContent='The Journal connection is unavailable. Explore the teaching guides below or reload to try again.';}})();
})();
