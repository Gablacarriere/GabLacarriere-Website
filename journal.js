(() => {
'use strict';
const $=id=>document.getElementById(id), esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
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
function ctaFor(a){
 const t=(a.title||'').toLowerCase();
 if(t.includes('practice brazilian zouk')) return {eyebrow:'Put this into practice',title:'Turn the ideas into a training plan.',text:'Use the Practice Planner for a concrete session, explore Zoukable for guided practice, or talk to Gab about ongoing mentorship.',links:[['practice_planner','/practice-planner/','Build a practice plan'],['zoukable','/zoukable/','Open Zoukable'],['mentorship','/mentorship/','Explore mentorship']]};
 if(t.includes('head movements')) return {eyebrow:'Continue the conversation',title:'Bring safer progression into your training or teaching.',text:'Explore Gab’s teaching approach, mentorship, or workshop work if you want to apply these ideas in practice.',links:[['method','/method/','Teaching method'],['mentorship','/mentorship/','Mentorship'],['workshops','/workshops/','Workshops & organizers']]};
 if(a.category==='Practice') return {eyebrow:'Next step',title:'Apply the idea instead of only reading it.',text:'Build a practice session or explore ongoing coaching.',links:[['practice_planner','/practice-planner/','Practice Planner'],['mentorship','/mentorship/','Mentorship']]};
 return {eyebrow:'Keep exploring',title:'Take the idea into your dancing.',text:'Explore Gab’s method, classes and mentorship.',links:[['method','/method/','Method'],['classes','/classes/','Classes'],['mentorship','/mentorship/','Mentorship']]};
}
async function track(articleId,eventType,ctaKey=null,destination=null){
 try{await client.from('journal_conversion_events').insert({article_id:articleId,event_type:eventType,cta_key:ctaKey,destination});}catch(_){ }
 try{window.gtag?.('event',eventType==='cta_click'?'journal_cta_click':'journal_article_view',{article_id:articleId,cta_key:ctaKey||'',destination:destination||''});}catch(_){ }
}
function conversionMarkup(a){
 const c=ctaFor(a);
 return `<aside class="conversionPath"><p class="conversionEyebrow">${esc(c.eyebrow)}</p><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p><div class="conversionActions">${c.links.map((l,i)=>`<a ${i?'class="secondary"':''} data-cta-key="${esc(l[0])}" href="${esc(l[1])}">${esc(l[2])}</a>`).join('')}</div></aside>`;
}
function ensureConversionStyles(){if(document.getElementById('conversionStyles'))return;const s=document.createElement('style');s.id='conversionStyles';s.textContent='.conversionPath{margin:46px 0 10px;padding:28px;background:linear-gradient(140deg,#eee9f3,#edf3f0);border:1px solid #d1c8d8;border-radius:4px 28px 4px 4px;font:15px/1.6 system-ui,sans-serif;color:#293744}.conversionEyebrow{margin:0 0 8px;font-size:11px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;color:#695182}.conversionPath h3{border:0!important;padding:0!important;margin:0 0 10px!important;font:700 clamp(1.45rem,3vw,2rem)/1.2 Georgia,serif!important}.conversionPath p{margin:0;color:#52616b}.conversionActions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.conversionActions a{display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;border-radius:999px;background:#594278;color:#fff!important;text-decoration:none!important;font-weight:800}.conversionActions a.secondary{background:transparent;color:#594278!important;border:1px solid #b8aac7}@media(max-width:600px){.conversionActions a{width:100%}}';document.head.appendChild(s);}
function articleMarkup(a){
 const featured=a.id==='2dfc59b4-ae70-4f92-931a-57c15cac1e84';
 const blocks=String(a.body||'').split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
 const isHeading=s=>s.length<100&&/[A-Z]/.test(s)&&s===s.toUpperCase()&&!s.includes('\n')&&!s.startsWith('•');
 const titleCase=s=>s.toLowerCase().replace(/^./,c=>c.toUpperCase()).replace(/\bcte\b/g,'CTE');
 const headings=blocks.filter(isHeading), hasSources=blocks.includes('SOURCES AND SCOPE');
 function inline(s){return s.split(/(https?:\/\/[^\s<>]+)/g).map((part,i)=>{if(i%2)return '<a href="'+esc(part)+'" target="_blank" rel="noopener noreferrer">'+esc(part)+'</a>';let safe=esc(part);if(hasSources)safe=safe.replace(/\[(\d+)\]/g,'<a class="citation" href="#article-source-$1">[$1]</a>');return safe.replace(/\n/g,'<br>');}).join('');}
 let h=0,inSources=false;const content=blocks.map(s=>{if(isHeading(s)){inSources=s==='SOURCES AND SCOPE';return '<h3 id="article-section-'+(++h)+'"><span class="sectionNumber">'+String(h).padStart(2,'0')+'</span>'+esc(titleCase(s))+'</h3>';}if(inSources&&/^\[\d+\]/.test(s)){const n=s.match(/^\[(\d+)\]/)[1];return '<p class="sourceEntry" id="article-source-'+n+'"><span class="sourceNumber">'+n+'</span>'+inline(s.replace(/^\[\d+\]\s*/,''))+'</p>';}return s.startsWith('• ')?'<ul class="teachingPoint"><li>'+inline(s.slice(2))+'</li></ul>':'<p>'+inline(s)+'</p>';}).join('');
 return (headings.length?'<details class="articleContents"><summary>Inside this article <span>'+headings.length+' sections</span></summary><ol>'+headings.map((s,i)=>'<li><a href="#article-section-'+(i+1)+'">'+esc(titleCase(s))+'</a></li>').join('')+'</ol></details>':'')+'<div class="articleBody formattedArticle">'+content+'</div>';
}
async function read(){
 const id=new URLSearchParams(location.search).get('article');if(!id||!/^[0-9a-f-]{36}$/i.test(id))return;
 const r=await client.from('journal_articles').select(fields).eq('id',id).maybeSingle();const box=$('articleReader');box.hidden=false;
 if(r.error||!r.data){box.innerHTML='<h2>Article unavailable</h2><p>This article may be a private draft or no longer published.</p><a href="/journal/">Return to the Journal →</a>';return;}
 const a=r.data;if(!document.getElementById('journalReaderStyles')){const css=document.createElement('link');css.id='journalReaderStyles';css.rel='stylesheet';css.href='/journal-reader.css?v=figures-1';document.head.appendChild(css);}ensureConversionStyles();document.body.classList.add('journalReading');
 box.innerHTML=`<a href="/journal/#articles">← All articles</a><p class="kicker">${esc(a.category)}${a.status==='draft'?' · PRIVATE DRAFT':''}</p><h2>${esc(a.title)}</h2><p class="articleMeta">By ${esc(a.author_name)} <span>· ${Math.ceil(a.body.split(/\s+/).length/220)} min read · Updated ${esc(date(a.updated_at))}</span></p><p class="lede">${esc(a.excerpt)}</p>${articleMarkup(a)}${conversionMarkup(a)}<aside class="authorNote"><strong>${esc(a.author_name)}</strong><p>${esc(a.author_bio)}</p></aside>`;
 box.querySelectorAll('[data-cta-key]').forEach(link=>link.addEventListener('click',()=>track(a.id,'cta_click',link.dataset.ctaKey,link.getAttribute('href'))));track(a.id,'article_view');
 document.title=a.title+' | The Journal';box.focus({preventScroll:true});box.scrollIntoView({block:'start'});
}
async function studio(){if(!coach)return;const r=await client.from('journal_articles').select(fields).order('updated_at',{ascending:false}).limit(100);if(r.error){$('editorStatus').textContent='The editorial list could not load. Reload before editing.';return;}drafts=r.data;$('journalStudio').hidden=false;$('draftList').innerHTML=drafts.map(a=>`<button type="button" data-edit="${a.id}">${esc(a.title)} · ${esc(a.status)}</button>`).join('');}
$('draftList').addEventListener('click',e=>{const b=e.target.closest('[data-edit]');if(!b)return;const a=drafts.find(x=>x.id===b.dataset.edit);if(!a)return;editing=a.id;pending=null;for(const k of ['title','author_name','author_bio','category','excerpt','body'])$('articleForm').elements[k].value=a[k];$('editorStatus').textContent='Editing '+a.title+'. Save as private draft removes it from public view.';});
$('newArticle').onclick=()=>{editing=null;pending=null;$('articleForm').reset();$('editorStatus').textContent='New article. Add the writer’s byline before publishing.';};
$('articleForm').addEventListener('submit',async e=>{e.preventDefault();if(!coach||!e.target.reportValidity())return;const status=e.submitter?.value==='published'?'published':'draft';if(status==='published'&&!confirm('Publish this article publicly with the byline shown?'))return;const payload=Object.fromEntries(new FormData(e.target));delete payload.action;payload.status=status;for(const k of Object.keys(payload))payload[k]=payload[k].trim();const buttons=[...e.target.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);$('editorStatus').textContent='Saving…';try{let r;if(editing)r=await client.from('journal_articles').update(payload).eq('id',editing).select('id').single();else{pending=pending||crypto.randomUUID();r=await client.from('journal_articles').insert({id:pending,...payload}).select('id').single();if(r.error?.code==='23505')r=await client.from('journal_articles').update(payload).eq('id',pending).select('id').single();}if(r.error)throw r.error;editing=r.data.id;pending=null;$('editorStatus').textContent=status==='published'?'Published. Your article is now in the Journal.':'Saved privately. Only coaches can read this draft.';await list();await studio();}catch(_){$('editorStatus').textContent='Save could not be confirmed. Your text is still here. Retry to save the same article.';}finally{buttons.forEach(b=>b.disabled=false);}});
$('moreArticles').onclick=()=>list(false);
(async()=>{try{if(!window.supabase||!window.GAB_PORTAL)throw Error();client=supabase.createClient(GAB_PORTAL.supabaseUrl,GAB_PORTAL.supabaseAnonKey);window.GAB_SESSION?.watch(client);await list();await read();const u=await client.auth.getUser();if(u.data.user){const p=await client.from('profiles').select('role').eq('id',u.data.user.id).single();coach=p.data?.role==='coach';await studio();}}catch(_){$('journalStatus').textContent='The Journal connection is unavailable. Explore the teaching guides below or reload to try again.';}})();
})();
