/* Runs after the existing website build; preserves the source pages while installing Zoukable and the shared public shell. */
const fs=require('node:fs');
const path=require('node:path');
const root=process.cwd(),out=path.join(root,'public');
if(!fs.existsSync(out))throw new Error('Run the existing website build first.');

// Restore the isolated app shell so public-site branding never alters app controls.
fs.mkdirSync(path.join(out,'zoukable'),{recursive:true});
for(const file of ['index.html','app.js','core.js','learning-core.js','style.css','world.js','world.css','rhythm-visual.css']){
  fs.copyFileSync(path.join(root,'zoukable',file),path.join(out,'zoukable',file));
}

const primaryItems=[
  ['/classes/','Classes'],
  ['/privates/','Private training'],
  ['/mentorship/','Mentorship'],
  ['/for-teachers/','For teachers'],
  ['/about/','About']
];
const exploreItems=[
  ['/zouk-bnb/','Zouk BNB'],
  ['/learn/','Learning library'],
  ['/method/','Method'],
  ['/journal/','Journal'],
  ['/work-with-gab/','Work with Gab'],
  ['/reviews/','Student reviews']
];
const memberPages=new Set(['mentorship-hub.html','practice-planner.html','zouk-map.html','comms-deck.html']);
const currentPathFor=file=>file==='index.html'?'/':'/'+file.replace(/\.html$/,'')+'/';
const navLink=(href,label,currentPath)=>`<a href="${href}"${currentPath===href?' aria-current="page"':''}>${label}</a>`;

let linked=0,publicShells=0;
for(const file of fs.readdirSync(out)){
  if(!file.endsWith('.html'))continue;
  const target=path.join(out,file);
  let html=fs.readFileSync(target,'utf8');

  // Public navigation stays focused on choosing how to work with Gab. Zoukable remains a member/practice destination.
  if(/<body[^>]*class="[^"]*publicSite/.test(html)){
    const currentPath=currentPathFor(file);
    const primary=primaryItems.map(([href,label])=>navLink(href,label,currentPath)).join('');
    const explore=exploreItems.map(([href,label])=>navLink(href,label,currentPath)).join('');
    const exploreCurrent=exploreItems.some(([href])=>href===currentPath);
    const member='<a class="memberLink" href="/mentorship-hub/">Member login</a>';
    const nav=`<nav aria-label="Main navigation"><div class="w n"><a class="brand publicBrand" href="/" aria-label="Gab Lacarriere home"><img src="/assets/editorial/logo-746.webp" srcset="/assets/editorial/logo-240.webp 240w, /assets/editorial/logo-480.webp 480w, /assets/editorial/logo-746.webp 746w, /gab-logo-header.png 1200w" sizes="(max-width: 520px) 210px, 240px" alt="Gab Lacarriere" width="1200" height="400"></a><div class="primary">${primary}<details class="navExplore"><summary${exploreCurrent?' aria-current="page"':''}>Explore</summary><div class="navExplorePanel">${explore}</div></details>${member}</div><details class="mobileMenu"><summary>Menu</summary><div class="mobilePanel">${primary}${explore}${member}</div></details></div></nav>`;
    html=html.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/i,nav);
    html=html.replace(/<div class="studentVoiceBar"[\s\S]*?<\/div><\/div>/i,'');
    if(!html.includes('/site-system.css'))html=html.replace('</head>','<link rel="stylesheet" href="/site-system.css?v=coherence-1">\n</head>');
    publicShells++;
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

// Keep build and schema/test source out of the static website output.
fs.rmSync(path.join(out,'.zoukable'),{recursive:true,force:true});
fs.rmSync(path.join(out,'integrate_zoukable.cjs'),{force:true});
console.log(`Zoukable installed at /zoukable/; linked from ${linked} member/tool pages. Public shell normalized on ${publicShells} pages.`);
