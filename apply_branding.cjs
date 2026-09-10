const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

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
    if ([".git", ".vercel", "node_modules"].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) files = files.concat(walk(full));
    else files.push(full);
  }
  return files;
}

function patchHtml(file) {
  let html = fs.readFileSync(file, "utf8");
  const before = html;

  // Replace any existing text-only brand anchor while preserving its destination.
  html = html.replace(
    /<a\s+class=["']brand["']\s+href=["']([^"']+)["']\s*>([\s\S]*?)<\/a>/i,
    (match, href, label) => {
      const clean = label.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const isMentorship = /MENTORSHIP/i.test(clean);
      const context = isMentorship ? '<span class="brand-context">MENTORSHIP</span>' : "";
      return `<a class="brand brand-logo" href="${href}" aria-label="Gab Lacarriere${isMentorship ? " Mentorship" : ""}"><img src="/gab-logo-header.png" alt="Gab Lacarriere">${context}</a>`;
    }
  );

  // If this has already been branded, do not duplicate anything.
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

  if (html !== before) {
    fs.writeFileSync(file, html, "utf8");
    return true;
  }
  return false;
}

const htmlFiles = walk(ROOT).filter(f => f.toLowerCase().endsWith(".html"));
let changed = 0;

for (const file of htmlFiles) {
  if (patchHtml(file)) {
    changed++;
    console.log("Branded:", path.relative(ROOT, file));
  }
}

console.log(`Gab Lacarriere branding applied to ${changed} HTML file(s).`);
