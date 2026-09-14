const fs=require('fs'),vm=require('vm'),assert=require('assert');
const context={window:{}};vm.createContext(context);
for(const file of ['zouk-map-data.js','atlas-foundation-extension.js','atlas-curriculum-v2.js','curriculum-registry.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const C=context.window.GAB_CURRICULUM;
assert(C,'canonical curriculum registry should load');
assert.equal(C.version,'2.2');
assert.equal(C.concepts.length,80);
assert.equal(C.families.length,8);
assert.equal(C.displayName('connection-2'),'Full Weight Transfer & Commitment');
assert(C.search('saltinho').some(x=>x.id==='grammar-0'||x.id==='patterns-7'));
const tiltSupports=C.prerequisites(['offaxis-3'],{track:'zouk'}).map(x=>x.id);
for(const id of ['offaxis-2','pathways-0','connection-2'])assert(tiltSupports.includes(id),`tilt preparation should surface ${id}`);
const recursive=C.prerequisites(['offaxis-3'],{recursive:true,track:'zouk'}).map(x=>x.id);
assert(recursive.includes('organization-1'),'recursive supports should reach body organization');
const next=C.next(['organization-1'],{track:'zouk',limit:30}).map(x=>x.id);
assert(next.includes('connection-2'),'posture should open full weight transfer as a next branch');
const ordered=C.sequence(['patterns-9','patterns-8']);
assert(ordered.findIndex(x=>x.id==='patterns-8')<ordered.findIndex(x=>x.id==='patterns-9'),'simple turn should precede double turn when both are selected');
assert(!C.prerequisites(['rhythm-3'],{track:'zouk'}).some(x=>x.track==='lambada'),'Zouk planning should not surface Lambada-only supports');
for(const file of ['curriculum-planner.html','session-planner.html']){
 const html=fs.readFileSync(file,'utf8');
 for(const script of ['zouk-map-data.js','atlas-curriculum-v2.js','curriculum-registry.js','curriculum-links.js','teaching-tools.js'])assert(html.includes(script),`${file} should load ${script}`);
}
const planner=fs.readFileSync('teaching-tools.js','utf8');
for(const marker of ['conceptIds','knownConceptIds','conceptActivities','conceptDraft','courseGuidance','sessionGuidance','GAB_CURRICULUM'])assert(planner.includes(marker),`teaching planner missing ${marker}`);
assert(planner.includes('Do not use this planner as a substitute for in-person technique or safety assessment.'),'off-axis generated planning must keep teacher-led safety boundary');
console.log('PASS: planners use canonical curriculum, preserve concept IDs, surface dependencies/next branches, filter dance tracks, and keep off-axis safety boundaries.');
