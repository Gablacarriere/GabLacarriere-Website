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
async function read(){
 const id=new URLSearchParams(location.search).get('article');if(!id)return;
 if(!/^[0-9a-f-]{36}$/i.test(id))return;
 const r=await client.from('journal_articles').select(fields).eq('id',id).maybeSingle();
 const box=$('articleReader');box.hidden=false;
 if(r.error||!r.data){box.innerHTML='<h2>Article unavailable</h2><p>This article may be a private draft or no longer published.</p><a href="/journal/">Return to the Journal →</a>';return;}
 const a=r.data;box.innerHTML=`<a href="/journal/#articles">← All articles</a><p class="kicker">${esc(a.category)}${a.status==='draft'?' · PRIVATE DRAFT':''}</p><h2>${esc(a.title)}</h2><p class="articleMeta">By ${esc(a.author_name)} · Updated ${esc(date(a.updated_at))}</p><p class="lede">${esc(a.excerpt)}</p><div class="articleBody">${esc(a.body)}</div><aside class="authorNote"><strong>${esc(a.author_name)}</strong><p>${esc(a.author_bio)}</p></aside>`;
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
(async()=>{try{if(!window.supabase||!window.GAB_PORTAL)throw Error();client=supabase.createClient(GAB_PORTAL.supabaseUrl,GAB_PORTAL.supabaseAnonKey);await list();await read();const u=await client.auth.getUser();if(u.data.user){const p=await client.from('profiles').select('role').eq('id',u.data.user.id).single();coach=p.data?.role==='coach';await studio();}client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){coach=false;drafts=[];$('journalStudio').hidden=true;$('articleForm').reset();$('draftList').replaceChildren();$('articleReader').hidden=true;}});}catch(_){$('journalStatus').textContent='The Journal connection is unavailable. Explore the teaching guides below or reload to try again.';}})();
})();
