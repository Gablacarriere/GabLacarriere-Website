const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public");

const BRAND_CSS = `
/* Official Gab Lacarriere brand lockup */
.brand.brand-logo{
  display:flex;
  align-items:center;
  gap:10px;
  flex:0 0 auto;
  line-height:0;
  letter-spacing:0;
  font-size:inherit;
}
.brand.brand-logo img{
  display:block;
  width:auto;
  height:56px;
  max-width:min(360px,44vw);
  object-fit:contain;
}
.brand-context{
  font-size:.68rem;
  line-height:1;
  letter-spacing:.12em;
  font-weight:850;
  color:#c9ced8;
  white-space:nowrap;
}
@media(max-width:920px){
  .brand.brand-logo img{height:50px;max-width:245px}
  .brand-context{font-size:.62rem}
}
@media(max-width:520px){
  .brand.brand-logo img{height:44px;max-width:205px}
  .brand-context{display:none}
}
`;

const HEAD_TAGS = `
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180.png">
<meta name="theme-color" content="#0a0d12">
`;

// Explicit publication boundary: development files are never website assets.
const ASSET_DIRS = new Set(['assets', 'vendor', 'zoukable']);
const PUBLIC_EXTENSIONS = new Set(['.html','.css','.js','.png','.jpg','.jpeg','.webp','.svg','.ico','.gif','.avif','.woff','.woff2','.ttf','.mp3','.mp4','.webm','.pdf']);
function walk(dir) {
  const files=[];
  for(const item of fs.readdirSync(dir,{withFileTypes:true})){
    if(item.name.startsWith('.'))continue;
    const full=path.join(dir,item.name);
    if(item.isDirectory()){
      if(dir===ROOT&&!ASSET_DIRS.has(item.name))continue;
      if(['node_modules','tests','work','design','database','scripts'].includes(item.name))continue;
      files.push(...walk(full));
    }else if(item.isFile()&&(PUBLIC_EXTENSIONS.has(path.extname(item.name).toLowerCase())||['robots.txt','sitemap.xml'].includes(item.name))){
      if(item.name==='NAVBAR_PREVIEW.png')continue;
      files.push(full);
    }
  }
  return files;
}

function patchHtml(file) {
  let html = fs.readFileSync(file, "utf8");
  const fileName = path.basename(file);
  const publicPage = !["mentorship-hub.html", "practice-planner.html", "zouk-map.html", "comms-deck.html"].includes(fileName);

  html = html.replace(
    /<a\s+class=["']brand["']\s+href=["']([^"']+)["']\s*>([\s\S]*?)<\/a>/i,
    (match, href, label) => {
      const clean = label.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const isMentorship = /MENTORSHIP/i.test(clean);
      const context = isMentorship ? '<span class="brand-context">MENTORSHIP</span>' : "";
      return `<a class="brand brand-logo" href="${href}" aria-label="Gab Lacarriere${isMentorship ? " Mentorship" : ""}"><img src="/assets/editorial/logo-746.webp" srcset="/assets/editorial/logo-240.webp 240w, /assets/editorial/logo-480.webp 480w, /assets/editorial/logo-746.webp 746w, /gab-logo-header.png 1200w" sizes="(max-width: 520px) 304px, (max-width: 920px) 354px, 430px" alt="Gab Lacarriere">${context}</a>`;
    }
  );

  if (!html.includes("Official Gab Lacarriere brand lockup")) {
    if (html.includes("</style>")) {
      html = html.replace("</style>", `${BRAND_CSS}\n</style>`);
    } else {
      html = html.replace("</head>", `<style>${BRAND_CSS}</style>\n</head>`);
    }
  }

  if (!html.includes('href="/favicon.ico"')) {
    html = html.replace("</head>", `${HEAD_TAGS}\n</head>`);
  }

  if (publicPage) {
    const currentPath = fileName === "index.html" ? "/" : "/" + fileName.replace(/\.html$/, "") + "/";
    const items = [
      ["/classes/", "Classes"], ["/zouk-bnb/", "Zouk BNB"], ["/privates/", "Private training"],
      ["/mentorship/", "Mentorship"], ["/for-teachers/", "For teachers"],
      ["/work-with-gab/", "Work with Gab"], ["/journal/", "Journal"], ["/about/", "About"],
    ];
    const links = items.map(([href, label]) => `<a href="${href}"${currentPath === href ? ' aria-current="page"' : ''}>${label}</a>`).join("");
    const member = '<a class="memberLink" href="/mentorship-hub/">Member login</a>';
    const nav = `<nav aria-label="Main navigation"><div class="w n"><a class="brand publicBrand" href="/" aria-label="Gab Lacarriere home"><img src="/assets/editorial/logo-746.webp" srcset="/assets/editorial/logo-240.webp 240w, /assets/editorial/logo-480.webp 480w, /assets/editorial/logo-746.webp 746w, /gab-logo-header.png 1200w" sizes="(max-width: 520px) 304px, (max-width: 920px) 354px, 430px" alt="Gab Lacarriere" width="1200" height="190"></a><div class="primary">${links}${member}</div><details class="mobileMenu"><summary>Menu</summary><div class="mobilePanel">${links}${member}</div></details></div></nav>`;
    html = html.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/i, nav);
    html = html.replace('</nav>', '</nav><div class="studentVoiceBar" aria-label="Student feedback and reviews"><div class="w"><a href="/reviews/">Student Reviews &amp; Stories</a><a href="/feedback/">Give Feedback →</a></div></div>');
    html = html.replace(/<body([^>]*)>/i, (match, attrs) => {
      if (/\bclass=/.test(attrs)) return match.replace(/class="([^"]*)"/, 'class="$1 publicSite"');
      return `<body${attrs} class="publicSite">`;
    });
    if (!/<main\b/i.test(html)) {
      html = html.replace('</nav>', '</nav>\n<main id="main" tabindex="-1">');
      html = html.replace(/<footer\b/i, '</main>\n<footer');
    } else {
      html = html.replace('<main id="main">', '<main id="main" tabindex="-1">');
    }
    if (!/class="skipLink"/.test(html)) html = html.replace(/(<body[^>]*>)/i, '$1\n<a class="skipLink" href="#main">Skip to content</a>');
    html = html.replace('</head>', '<link rel="stylesheet" href="/public-experience.css?v=voices-1"><script defer src="/public-clicks.js"></script>\n</head>');
    const footerGroups = [
      ['Train in NYC', [['/classes/', 'Weekly classes'], ['/privates/', 'Private training'], ['/mentorship/', 'Monthly mentorship'], ['/zouk-bnb/', 'Zouk BNB · stay & train']]],
      ['Explore', [['/reviews/', 'Student reviews'], ['/feedback/', 'Give feedback'], ['/journal/', 'The Journal'], ['/learn/', 'Learning library'], ['/for-teachers/', 'Teacher development'], ['/method/', 'Teaching method'], ['/about/', 'About Gab'], ['/work-with-gab/', 'Events & collaborations']]],
      ['Your next step', [['/mentorship-hub/', 'Member sign in'], ['/classes/#schedule', 'Class schedule'], ['mailto:hello@gablacarriere.com', 'hello@gablacarriere.com']]],
    ];
    const footerDirectory = footerGroups.map(([heading, entries]) => `<div class="footerGroup"><h2>${heading}</h2>${entries.map(([href, label]) => `<a href="${href}"${currentPath === href ? ' aria-current="page"' : ''}>${label.replace(/&/g, '&amp;')}</a>`).join('')}</div>`).join('');
    html = html.replace('</footer>', `<div class="w footerDirectory" role="navigation" aria-label="Footer navigation">${footerDirectory}</div></footer>`);
  }

  html = html.replace(/<body([^>]*)>/i, (match, attrs) => {
    const theme = publicPage ? 'bhSite' : 'bhSite bhMember';
    if (/\bclass=/.test(attrs)) return match.replace(/class="([^"]*)"/, 'class="$1 ' + theme + '"');
    return `<body${attrs} class="${theme}">`;
  });
  html = html.replace('</head>', '<link rel="stylesheet" href="/bauhaus.css?v=art-2">\n<script defer src="/art-discoveries.js?v=1"></script>\n<script defer src="/bauhaus.js?v=art-2"></script>\n</head>');
  // Deliberate variation by page: stable on every visit, with a shared navigation system.
  const artDirections = {
    'journal':'pop', 'comms-deck':'orbit', 'index':'cutout', 'classes':'rhythm', 'brazilian-zouk-classes-nyc':'cutout',
    'lambada-classes-nyc':'rhythm', 'alex-de-carvalho':'atelier', 'about':'atelier', 'method':'planes',
    'for-teachers':'planes', 'movement-architecture':'planes', 'privates':'intimate', 'wedding':'intimate',
    'mentorship':'garden', 'how-to-practice-zouk':'garden', 'kinesthetic-practice':'garden',
    'zouk-bnb':'terrace', 'zouk-nyc-guide':'terrace', 'experience':'atelier',
    'learn':'planes', 'workshops':'rhythm', 'work-with-gab':'pop', 'creative':'pop',
    'mentorship-hub':'orbit', 'practice-planner':'orbit', 'zouk-map':'cosmos'
  };
  const pageKey = fileName.replace(/\.html$/, '');
  html = html.replace(/<body([^>]*)>/i, `<body$1 data-art="${artDirections[pageKey] || 'cutout'}" data-page="${pageKey}">`);
  html = html.replace('</head>', '<link rel="stylesheet" href="/art-directions.css?v=2">\n</head>');
  if(['mentorship-hub','zouk-map','comms-deck','practice-planner'].includes(pageKey)){
    html=html.replace('</head>','<link rel="stylesheet" href="/member-world.css?v=mothership-2"><script defer src="/zoukable/world.js?v=gardens-1"></script><script defer src="/member-world.js?v=mothership-2"></script></head>');
    html=html.replace(/<body([^>]*)class="([^"]*)"/, '<body$1class="$2 dreamMember"');
  }
  return html;
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);

  // API folders remain source-managed by Vercel, not copied into static output.
  if (
    rel === "vercel.json" ||
    rel === "apply_branding.cjs" ||
    rel.startsWith("api" + path.sep) ||
    rel.startsWith("API" + path.sep)
  ) continue;

  const dest = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  if (file.toLowerCase().endsWith(".html")) {
    fs.writeFileSync(dest, patchHtml(file), "utf8");
  } else {
    fs.copyFileSync(file, dest);
  }
}

console.log("Built branded static site into public/.");

