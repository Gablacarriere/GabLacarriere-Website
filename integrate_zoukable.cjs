/* Runs after the existing website build; preserves its branding and source pages. */
const fs=require('node:fs');
const path=require('node:path');
const root=process.cwd(),out=path.join(root,'public');
if(!fs.existsSync(out))throw new Error('Run the existing website build first.');
// Restore the isolated app shell so public-site branding never alters app controls.
fs.mkdirSync(path.join(out,'zoukable'),{recursive:true});
for(const file of ['index.html','app.js','core.js','learning-core.js','style.css','world.js','world.css','rhythm-visual.css']){
 fs.copyFileSync(path.join(root,'zoukable',file),path.join(out,'zoukable',file));
}
let linked=0;
for(const file of fs.readdirSync(out)){
 if(!file.endsWith('.html'))continue;
 const target=path.join(out,file);let html=fs.readFileSync(target,'utf8');
 if(!html.includes('data-zoukable-link')){
  const link='<a href="/zoukable/" data-zoukable-link="1">Zoukable</a>';
  html=html.replace('<div class="primary">','<div class="primary">'+link);
  html=html.replace('<div class="mobilePanel">','<div class="mobilePanel">'+link);
  if(file==='mentorship-hub.html'){
   html=html.replace('<div class="crewLinkRow">','<div class="crewLinkRow"><a class="crewQuickLink" href="/zoukable/" data-zoukable-link="1">Zoukable · Practice studio →</a>');
   // A sign-in screen must also expose the app entry, not only the dashboard.
   html=html.replace('<div class="links">','<div class="links">'+link);
  }
 }
 if(html.includes('data-zoukable-link'))linked++;
 fs.writeFileSync(target,html);
}
// Keep build and schema/test source out of the static website output.
fs.rmSync(path.join(out,'.zoukable'),{recursive:true,force:true});
fs.rmSync(path.join(out,'integrate_zoukable.cjs'),{force:true});
console.log(`Zoukable installed at /zoukable/; linked from ${linked} existing pages.`);

