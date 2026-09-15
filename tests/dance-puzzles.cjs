const fs=require('fs'),vm=require('vm'),assert=require('assert');
const context={window:{}};vm.createContext(context);
for(const file of ['zouk-map-data.js','atlas-foundation-extension.js','atlas-curriculum-v2.js','curriculum-registry.js','dance-puzzles.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const C=context.window.GAB_CURRICULUM,P=context.window.GAB_DANCE_PUZZLES;
assert(C&&P,'curriculum and puzzle library should load');
assert.equal(P.puzzles.length,30,'prototype library should contain 30 puzzles');
assert.equal(new Set(P.puzzles.map(x=>x.id)).size,30,'puzzle IDs must be unique');
const cognitive=Object.values(P.skills);
assert.equal(cognitive.length,8,'all eight Perception & Projection skills should be mapped');
for(const id of cognitive)assert(C.concept(id),`missing Atlas cognitive concept ${id}`);
for(const puzzle of P.puzzles){
  assert(C.concept(puzzle.primarySkill),`${puzzle.id} has invalid primary skill`);
  for(const id of puzzle.secondarySkills)assert(C.concept(id),`${puzzle.id} has invalid secondary skill ${id}`);
  for(const id of puzzle.atlasLinks)assert(C.concept(id),`${puzzle.id} has invalid Atlas link ${id}`);
  for(const field of ['title','type','setup','constraint','prompt','reasoning','test','reflection'])assert(String(puzzle[field]||'').trim().length>10,`${puzzle.id} missing usable ${field}`);
}
for(const id of cognitive)assert(P.puzzles.some(x=>x.primarySkill===id),`${id} needs at least one primary puzzle`);
assert(P.puzzles.some(x=>x.roles.includes('follower')),'library should include follower-specific puzzles');
assert(P.puzzles.some(x=>x.roles.includes('leader')),'library should include leader-specific puzzles');
assert(P.puzzles.some(x=>x.roles.includes('both')),'library should include role-neutral/both-role puzzles');

const page=fs.readFileSync('dance-puzzles.html','utf8');
const planner=fs.readFileSync('session-planner.html','utf8');
const bridge=fs.readFileSync('planner-dance-puzzles.js','utf8');
assert(page.includes('/session-planner/?puzzle=${encodeURIComponent(p.id)}'),'each rendered puzzle should link into the Session Planner');
assert(planner.includes('/dance-puzzles.js')&&planner.includes('/planner-dance-puzzles.js'),'Session Planner should load puzzle data and bridge');
for(const marker of ['dancePuzzlePlannerPanel','Add puzzle to this session','puzzleConcepts','data-action="addActivity"','data-concept-set="conceptIds"'])assert(bridge.includes(marker),`planner bridge missing ${marker}`);
assert(bridge.includes('Expected reasoning:')&&bridge.includes('Physical test:')&&bridge.includes('Reflection:'),'planner activity should preserve teaching logic');
console.log('PASS: 30 Dance Puzzles map onto all eight cognitive skills and are bridged into the Session Planner with curriculum links.');
