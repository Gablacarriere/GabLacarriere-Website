// Normalize site-wide public-facing copy after the shared shell is applied.
const fs=require('node:fs');
const path=require('node:path');
const out=path.join(process.cwd(),'public');
if(!fs.existsSync(out))throw new Error('Run the website build first.');

let pages=0,replacements=0;
for(const file of fs.readdirSync(out)){
  if(!file.endsWith('.html'))continue;
  const target=path.join(out,file);
  let html=fs.readFileSync(target,'utf8');
  if(!/<body[^>]*class="[^"]*\bpublicSite\b/i.test(html))continue;
  const before=html;
  const matches=html.match(/riseadance@gmail\.com/gi)||[];
  if(matches.length){
    html=html.replace(/riseadance@gmail\.com/gi,'hello@gablacarriere.com');
    fs.writeFileSync(target,html);
    pages++;
    replacements+=matches.length;
  }
}
console.log(`Public contact identity normalized: ${replacements} replacement(s) across ${pages} page(s).`);
