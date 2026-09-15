/* Runs after the existing website build; preserves source pages while installing Zoukable and the shared public shell. */
const fs=require('node:fs');
const path=require('node:path');
const root=process.cwd(),out=path.join(root,'public');
if(!fs.existsSync(out))throw new Error('Run the existing website build first.');

const memberPages=new Set(['mentorship-hub.html','practice-planner.html','zouk-map.html','comms-deck.html']);

// Restore the isolated app shell so public-site branding never alters app controls.
fs.mkdirSync(path.join(out,'zoukable'),{recursive:true});
for(const file of ['index.html','app.js','core.js','learning-core.js','style.css','world.js','world.css','rhythm-visual.css']){
  fs.copyFileSync(path.join(root,'zoukable',file),path.join(out,'zoukable',file));
}

// Private no-index workspaces keep their purpose-built UI. The member-facing learning tools remain in the shared member world.
let restoredPrivate=0;
for(const file of fs.readdirSync(root)){
  if(!file.endsWith('.html')||memberPages.has(file))continue;
  const source=path.join(root,file);
  if(!fs.statSync(source).isFile())continue;
  const raw=fs.readFileSync(source,'utf8');
  if(/<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(raw)){
    fs.copyFileSync(source,path.join(out,file));
    restoredPrivate++;
  }
}

// Three top-level visitor decisions. Detailed destinations stay one level deeper.
const navGroups=[
  ['Train',[
    ['/classes/','Classes'],
    ['/privates/','Private training'],
    ['/mentorship/','Mentorship'],
    ['/zouk-bnb/','Zouk BNB']
  ]],
  ['Teaching',[
    ['/for-teachers/','For teachers'],
    ['/method/','Teaching method'],
    ['/curriculum-planner/','Curriculum planner'],
    ['/session-planner/','Session planner']
  ]],
  ['Explore',[
    ['/learn/','Learning library'],
    ['/journal/','Journal'],
    ['/work-with-gab/','Work with Gab'],
    ['/about/','About Gab']
  ]]
];
const footerGroups=[
  ['Train',[
    ['/classes/','Weekly classes'],
    ['/privates/','Private training'],
    ['/mentorship/','Monthly mentorship'],
    ['/zouk-bnb/','Zouk BNB · stay & train']
  ]],
  ['Explore',[
    ['/method/','Teaching method'],
    ['/learn/','Learning library'],
    ['/journal/','Journal'],
    ['/for-teachers/','For teachers'],
    ['/work-with-gab/','Events & collaborations'],
    ['/about/','About Gab']
  ]],
  ['Connect',[
    ['/reviews/','Student reviews'],
    ['/feedback/','Give feedback'],
    ['/mentorship-hub/','Member login'],
    ['https://wa.me/19295864994','WhatsApp'],
    ['mailto:hello@gablacarriere.com','hello@gablacarriere.com']
  ]]
];
const currentPathFor=file=>file==='index.html'?'/':'/'+file.replace(/\.html$/,'')+'/';
const navLink=(href,label,currentPath)=>`<a href="${href}"${currentPath===href?' aria-current="page"':''}>${label}</a>`;
const navGroup=(label,items,currentPath,scope)=>{
  const current=items.some(([href])=>href===currentPath);
  const links=items.map(([href,itemLabel])=>navLink(href,itemLabel,currentPath)).join('');
  if(scope==='mobile')return `<details class="mobileTree" name="mobile-navigation"><summary${current?' aria-current="page"':''}>${label}</summary><div class="mobileTreePanel">${links}</div></details>`;
  return `<details class="navExplore" name="public-navigation"><summary${current?' aria-current="page"':''}>${label}</summary><div class="navExplorePanel">${links}</div></details>`;
};
const genericReview=/\s*<section class="sec"><div class="w"><h2>Hear from students\.<\/h2><p>Explore student experiences, shared in their own words and with their permission\.<\/p><p><a href="\/reviews\/">Read student reviews →<\/a><\/p><\/div><\/section>/g;
const genericFeedback=/\s*<section class="sec"><div class="w"><h2>Help shape what comes next\.<\/h2><p>Share private feedback on your experience, suggest improvements, or choose to contribute a testimonial\.<\/p><p><a href="\/feedback\/">Share feedback &amp; your story →<\/a><\/p><\/div><\/section>/g;
const floatingWhatsapp=/\s*<a\b[^>]*class="[^"]*\bwaFloat\b[^"]*"[^>]*>[\s\S]*?<\/a>/gi;
const twoActionHeroes=new Set(['classes.html','privates.html','mentorship.html','zouk-bnb.html']);
function limitHeroActions(html,file){
  if(!twoActionHeroes.has(file))return html;
  const heroClass=file==='zouk-bnb.html'?'bnbHero':'hero';
  const heroRe=new RegExp(`(<section\\b[^>]*class="[^"]*\\b${heroClass}\\b[^"]*"[^>]*>[\\s\\S]*?<div class="actions">)([\\s\\S]*?)(<\\/div>)`,'i');
  return html.replace(heroRe,(all,start,actions,end)=>{
    const links=[...actions.matchAll(/<a\b[\s\S]*?<\/a>/gi)].map(m=>m[0]);
    if(links.length<=2)return all;
    return start+links.slice(0,2).join('')+end;
  });
}
function removeContainingSection(html,marker){
  const at=html.indexOf(marker);
  if(at<0)return {html,removed:false};
  const start=html.lastIndexOf('<section',at);
  if(start<0)return {html,removed:false};
  const token=/<\/?section\b[^>]*>/gi;
  token.lastIndex=start;
  let depth=0,match;
  while((match=token.exec(html))){
    if(/^<section\b/i.test(match[0]))depth++;
    else depth--;
    if(depth===0){
      return {html:html.slice(0,start)+html.slice(token.lastIndex),removed:true};
    }
  }
  return {html,removed:false};
}
const pruneMarkers={
  'classes.html':[
    '<div class="kicker">Choose your next step</div>',
    '<div class="kicker">Learn between classes</div>',
    '<div class="kicker">Visiting New York?</div>'
  ],
  'privates.html':[
    '<div class="kicker">Keep developing</div>'
  ],
  'mentorship.html':[
    '<div class="kicker">The learning loop</div>',
    '<div class="kicker">Teaching approach</div>',
    '<div class="kicker">Who it is for</div>',
    '<div class="kicker">Explore the approach</div>',
    '<div class="kicker">Current members</div>'
  ]
};
function pruneOfferPage(html,file){
  let removed=0;
  for(const marker of pruneMarkers[file]||[]){
    const result=removeContainingSection(html,marker);
    html=result.html;
    if(result.removed)removed++;
  }
  return {html,removed};
}
function normalizeOfferLanguage(html,file){
  let next=html;
  // Kinesthetic Practice is a named training format, so keep the same label everywhere.
  next=next
    .replace(/Kinesthetic sessions:/g,'Kinesthetic Practice sessions:')
    .replace(/<dt>Kinesthetic session<\/dt>/g,'<dt>Kinesthetic Practice</dt>')
    .replace(/30-minute kinesthetic session/g,'30-minute Kinesthetic Practice Session')
    .replace(/30-minute kinesthetic practice/g,'30-minute Kinesthetic Practice')
    .replace(/monthly private coaching, kinesthetic practice, Sunday group training/g,'monthly private coaching, Kinesthetic Practice, Sunday group training')
    .replace(/1-hour private · 30-minute kinesthetic session · 4 group classes · member space/g,'1-hour private · 30-minute Kinesthetic Practice · group training + practica · member space');
  if(file==='privates.html'){
    next=next.replace('<h3>Guided dance practice</h3>','<h3>Kinesthetic Practice</h3>');
    next=next.replace(
      '<p>Kinesthetic Practice Sessions give you more time moving with a partner, repeating and adjusting with immediate physical feedback.</p>',
      '<p>Kinesthetic Practice Sessions give you more time moving with a partner, repeating and adjusting with immediate physical feedback.</p><p><a class="textLink" href="/kinesthetic-practice/">Learn more about Kinesthetic Practice →</a></p>'
    );
  }
  return next;
}

let linked=0,publicShells=0,removedGeneric=0,trimmedHeroes=0,prunedSections=0,normalizedOffers=0;
const structuralErrors=[];
for(const file of fs.readdirSync(out)){
  if(!file.endsWith('.html'))continue;
  const target=path.join(out,file);
  let html=fs.readFileSync(target,'utf8');

  // Public navigation presents three branches instead of a long row of unrelated destinations.
  if(/<body[^>]*class="[^"]*publicSite/.test(html)){
    const currentPath=currentPathFor(file);
    const desktopTree=navGroups.map(([label,items])=>navGroup(label,items,currentPath,'desktop')).join('');
    const mobileTree=navGroups.map(([label,items])=>navGroup(label,items,currentPath,'mobile')).join('');
    const member='<a class="memberLink" href="/mentorship-hub/">Member login</a>';
    const nav=`<nav aria-label="Main navigation"><div class="w n"><a class="brand publicBrand" href="/" aria-label="Gab Lacarriere home"><img src="/assets/editorial/logo-746.webp" srcset="/assets/editorial/logo-240.webp 240w, /assets/editorial/logo-480.webp 480w, /assets/editorial/logo-746.webp 746w, /gab-logo-header.png 1200w" sizes="(max-width: 520px) 210px, 240px" alt="Gab Lacarriere" width="1200" height="400"></a><div class="primary">${desktopTree}${member}</div><details class="mobileMenu"><summary>Menu</summary><div class="mobilePanel">${mobileTree}${member}</div></details></div></nav>`;
    html=html.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/i,nav);
    html=html.replace(/<div class="studentVoiceBar"[\s\S]*?<\/div><\/div>/i,'');

    // Repeated generic promos and the old floating WhatsApp duplicate the navigation/footer destinations.
    const beforeCleanup=html;
    html=html.replace(genericReview,'').replace(genericFeedback,'').replace(floatingWhatsapp,'');
    if(html!==beforeCleanup)removedGeneric++;

    // High-intent offer pages share one decision rule: one primary action and one secondary action in the hero.
    const beforeHero=html;
    html=limitHeroActions(html,file);
    if(html!==beforeHero)trimmedHeroes++;

    const beforeLanguage=html;
    html=normalizeOfferLanguage(html,file);
    if(html!==beforeLanguage)normalizedOffers++;

    // Offer pages should end once the visitor has enough information to decide or contact Gab.
    // Site-wide exploration belongs in the shared navigation and footer rather than repeated cross-sell sections.
    const pruned=pruneOfferPage(html,file);
    html=pruned.html;
    prunedSections+=pruned.removed;

    // Homepage: promise -> three training choices -> interactive teaching idea -> concise method split.
    if(file==='index.html'){
      const training=html.match(/<section class="sec soft" id="find-your-training"[\s\S]*?<\/section>/i)?.[0];
      const hero=html.match(/<section class="hero"[\s\S]*?<\/section>/i)?.[0];
      if(training&&hero){
        html=html.replace(training,'');
        html=html.replace(hero,hero+'\n'+training);
      }

      // Stay & train remains available in the Train menu/footer, but is not a primary homepage decision.
      html=html.replace(/\s*<a class="card trainingChoice" href="\/zouk-bnb\/">[\s\S]*?<\/a>/i,'');
      html=html.replace(/\s*<section class="bnbPromo">[\s\S]*?<\/section>/i,'');

      // Remove homepage sections whose main purpose is duplicated navigation or background context.
      html=html.replace(/\s*<section class="sec soft" id="teaching-teachers"[\s\S]*?<\/section>/i,'');
      html=html.replace(/\s*<section class="photoBand">[\s\S]*?<\/section>/i,'');
      html=html.replace(/\s*<section class="sec"><div class="w"><div class="kicker">The teaching approach<\/div>[\s\S]*?<\/section>/i,'');
      html=html.replace(/\s*<section class="sec soft" aria-labelledby="roots-title">[\s\S]*?<\/section>/i,'');
      html=html.replace(/\s*<section class="sec soft"><div class="w"><div class="grid two">[\s\S]*?<\/section>/i,'');

      const approach=`<section class="sec homeApproach" aria-labelledby="home-approach-title"><div class="w"><p class="kicker">The approach</p><h2 id="home-approach-title">Learn the movement.<br>Learn how learning works.</h2><p class="lede">The same idea runs through Gab’s work with dancers and teachers: understand what matters, practice it deliberately, and build enough awareness to adapt rather than simply repeat.</p><div class="grid two"><a class="card" href="/method/"><p class="kicker">For dancers</p><h3>Understand. Feel. Practice. Adapt.</h3><p>Explore how timing, direction, connection and decision-making become usable skills on the dance floor.</p><span class="cardLink">Explore the teaching method →</span></a><a class="card" href="/for-teachers/"><p class="kicker">For teachers</p><h3>Design learning, not just classes.</h3><p>Work on observation, explanation, feedback, lesson design and curriculum structure.</p><span class="cardLink">Explore teacher development →</span></a></div><div class="actions"><a class="btn" href="#find-your-training">Compare ways to train</a></div></div></section>`;
      const curiosity=html.match(/<section id="curiosity"[\s\S]*?<\/section>/i)?.[0];
      if(curiosity)html=html.replace(curiosity,curiosity+'\n'+approach);
      else html=html.replace('</main>',approach+'\n</main>');
    }

    // One visitor-facing footer on every public page. Internal teaching tools stay on teacher pages instead of the global footer.
    const footerDirectory=footerGroups.map(([heading,entries])=>`<div class="footerGroup"><h2>${heading}</h2>${entries.map(([href,label])=>navLink(href,label,currentPath)).join('')}</div>`).join('');
    const footer=`<footer><div class="w footerIdentity">Gab Lacarriere · Brazilian Zouk · Lambada · Movement Education · New York City</div><div class="w footerDirectory" role="navigation" aria-label="Footer navigation">${footerDirectory}</div></footer>`;
    if(/<footer\b/i.test(html))html=html.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/i,footer);
    else if(/<\/main>/i.test(html))html=html.replace(/<\/main>/i,`</main>${footer}`);
    else structuralErrors.push(`${file}: public page has no place to attach footer`);

    // Mobile browser chrome should match the light editorial public shell.
    if(/<meta\s+name="theme-color"/i.test(html))html=html.replace(/<meta\s+name="theme-color"\s+content="[^"]*"\s*\/?>/i,'<meta name="theme-color" content="#f4f0e6">');
    else html=html.replace('</head>','<meta name="theme-color" content="#f4f0e6">\n</head>');
    if(!html.includes('/site-system.css'))html=html.replace('</head>','<link rel="stylesheet" href="/site-system.css?v=coherence-3">\n</head>');
    publicShells++;

    // Build-time structure checks: visitor content should be inside main, and footer should be the last visible landmark.
    const mainOpen=(html.match(/<main\b/gi)||[]).length;
    const mainClose=(html.match(/<\/main>/gi)||[]).length;
    const footerOpen=(html.match(/<footer\b/gi)||[]).length;
    const footerClose=(html.match(/<\/footer>/gi)||[]).length;
    if(mainOpen!==1||mainClose!==1)structuralErrors.push(`${file}: expected one <main>, found ${mainOpen}/${mainClose}`);
    if(footerOpen!==1||footerClose!==1)structuralErrors.push(`${file}: expected one <footer>, found ${footerOpen}/${footerClose}`);
    const footerEnd=html.lastIndexOf('</footer>');
    const bodyEnd=html.lastIndexOf('</body>');
    const afterFooter=footerEnd>=0?html.slice(footerEnd+9,bodyEnd>=0?bodyEnd:undefined):'';
    const visibleAfterFooter=afterFooter.replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<!--([\s\S]*?)-->/g,'').trim();
    if(/<(?:section|main|article|nav|form|a)\b/i.test(visibleAfterFooter))structuralErrors.push(`${file}: visible content appears after </footer>`);
    const navHtml=html.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/i)?.[0]||'';
    if(/data-zoukable-link/i.test(navHtml))structuralErrors.push(`${file}: public navigation exposes Zoukable`);
  }

  // Member tools can expose Zoukable directly; public pages do not need it in their global navigation.
  if(memberPages.has(file)&&!html.includes('data-zoukable-link')){
    const link='<a href="/zoukable/" data-zoukable-link="1">Zoukable</a>';
    html=html.replace('<div class="primary">','<div class="primary">'+link);
    html=html.replace('<div class="mobilePanel">','<div class="mobilePanel">'+link);
    if(file==='mentorship-hub.html'){
      html=html.replace('<div class="crewLinkRow">','<div class="crewLinkRow"><a class="crewQuickLink" href="/zoukable/" data-zoukable-link="1">Zoukable · Practice studio →</a>');
      // A sign-in screen should expose the practice app too, not only the authenticated dashboard.
      html=html.replace('<div class="links">','<div class="links">'+link);
    }
  }
  if(html.includes('data-zoukable-link'))linked++;
  fs.writeFileSync(target,html);
}

if(structuralErrors.length){
  console.error('Public shell structure audit failed:\n'+structuralErrors.join('\n'));
  process.exit(1);
}

// Keep build and schema/test source out of the static website output.
fs.rmSync(path.join(out,'.zoukable'),{recursive:true,force:true});
fs.rmSync(path.join(out,'integrate_zoukable.cjs'),{force:true});
console.log(`Zoukable installed at /zoukable/; linked from ${linked} member/tool pages. Public shell normalized on ${publicShells} pages; private workspaces restored: ${restoredPrivate}; duplicate CTAs cleaned on ${removedGeneric} pages; hero choices simplified on ${trimmedHeroes} pages; offer sections pruned: ${prunedSections}; training language normalized on ${normalizedOffers} pages.`);