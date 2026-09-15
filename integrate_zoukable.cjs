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

// Zoukable is a member practice product, not a primary public-site destination.
// Keep the public marketing navigation focused. Surface Zoukable from the
// mentorship hub, where its context is clear and useful to signed-in members.
const hub=path.join(out,'mentorship-hub.html');
if(fs.existsSync(hub)){
  let html=fs.readFileSync(hub,'utf8');
  if(!html.includes('data-zoukable-link')){
    const link='<a href="/zoukable/" data-zoukable-link="1">Zoukable</a>';
    html=html.replace('<div class="crewLinkRow">','<div class="crewLinkRow"><a class="crewQuickLink" href="/zoukable/" data-zoukable-link="1">Zoukable · Practice studio →</a>');
    // The signed-out member screen should still expose the practice app entry.
    html=html.replace('<div class="links">','<div class="links">'+link);
  }
  fs.writeFileSync(hub,html);
}

// Keep build and schema/test source out of the static website output.
fs.rmSync(path.join(out,'.zoukable'),{recursive:true,force:true});
fs.rmSync(path.join(out,'integrate_zoukable.cjs'),{force:true});
console.log('Zoukable installed at /zoukable/ and kept inside the member journey.');
