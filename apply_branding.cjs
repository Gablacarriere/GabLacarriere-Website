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

function walk(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", ".vercel", "node_modules", "public"].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) files = files.concat(walk(full));
    else files.push(full);
  }
  return files;
}

function patchHtml(file) {
  let html = fs.readFileSync(file, "utf8");
  const fileName = path.basename(file);
  const publicPage = !["mentorship-hub.html", "practice-planner.html", "zouk-map.html"].includes(fileName);

  html = html.replace(
    /<a\s+class=["']brand["']\s+href=["']([^"']+)["']\s*>([\s\S]*?)<\/a>/i,
    (match, href, label) => {
      const clean = label.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const isMentorship = /MENTORSHIP/i.test(clean);
      const context = isMentorship ? '<span class="brand-context">MENTORSHIP</span>' : "";
      return `<a class="brand brand-logo" href="${href}" aria-label="Gab Lacarriere${isMentorship ? " Mentorship" : ""}"><img src="/gab-logo-header.png" alt="Gab Lacarriere">${context}</a>`;
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
      ["/mentorship/", "Mentorship"], ["/method/", "Method"],
      ["/work-with-gab/", "Work with Gab"], ["/about/", "About"],
    ];
    const links = items.map(([href, label]) => `<a href="${href}"${currentPath === href ? ' aria-current="page"' : ''}>${label}</a>`).join("");
    const member = '<a class="memberLink" href="/mentorship-hub/">Member login</a>';
    const nav = `<nav aria-label="Main navigation"><div class="w n"><a class="brand publicBrand" href="/" aria-label="Gab Lacarriere home"><img src="/gab-logo-header.png" alt="Gab Lacarriere" width="1200" height="190"></a><div class="primary">${links}${member}</div><details class="mobileMenu"><summary>Menu</summary><div class="mobilePanel">${links}${member}</div></details></div></nav>`;
    html = html.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/i, nav);
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
    html = html.replace('</head>', '<link rel="stylesheet" href="/public-experience.css?v=photos-1">\n</head>');
    html = html.replace('</footer>', '<div class="w footerLinks"><a href="/learn/">Learning library</a><a href="/classes/">Class details</a><a href="mailto:riseadance@gmail.com">Email Gab</a></div></footer>');
  }

  html = html.replace(/<body([^>]*)>/i, (match, attrs) => {
    const theme = publicPage ? 'bhSite' : 'bhSite bhMember';
    if (/\bclass=/.test(attrs)) return match.replace(/class="([^"]*)"/, 'class="$1 ' + theme + '"');
    return `<body${attrs} class="${theme}">`;
  });
  html = html.replace('</head>', '<link rel="stylesheet" href="/bauhaus.css?v=1">\n<script defer src="/bauhaus.js?v=1"></script>\n</head>');
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
