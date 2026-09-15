const fs=require('fs'),vm=require('vm'),assert=require('assert');
const els=new Map();const element=id=>{if(!els.has(id))els.set(id,{innerHTML:'',textContent:'',style:{},clientWidth:800,clientHeight:660,scrollLeft:0,scrollTop:0,listeners:{},classList:{add(){},remove(){}},addEventListener(e,fn){this.listeners[e]=fn},appendChild(){},focus(){},setAttribute(){},removeAttribute(){},scrollBy(x,y){this.scrollLeft+=x;this.scrollTop+=y},setPointerCapture(){}});return els.get(id)};
const context={URLSearchParams,window:{addEventListener(e,fn){this[e]=fn}},document:{createElement:()=>element('newlink'),getElementById:id=>id==='atlasLessonForm'?null:element(id),querySelectorAll:()=>[]},location:{hash:'#map',search:''},requestAnimationFrame:fn=>fn(),setTimeout:fn=>fn()};vm.createContext(context);
for(const file of ['mentorship-crew.js','zouk-map-data.js','atlas-foundation-extension.js','atlas-curriculum-v2.js','atlas-universe.js','atlas-live.js','zouk-map.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
const curriculum=context.window.ATLAS_CURRICULUM_V2,total=curriculum.total;
assert.equal(total,88);assert.equal(curriculum.families.length,9);assert.equal(curriculum.familyFor('connection-3').id,'rhythm');assert.equal(curriculum.familyFor('architecture-0').id,'space');assert.equal(curriculum.familyFor('perception-4').id,'perception');assert.equal(curriculum.displayName('connection-2'),'Full Weight Transfer & Commitment');assert.equal(curriculum.displayName('architecture-0'),'Chest Direction & Relative Position');
assert(curriculum.related('connection-6').some(r=>r.id==='connection-0'));assert(curriculum.related('pathways-0').some(r=>r.id==='spirals-0'));assert(curriculum.related('perception-4').some(r=>r.id==='perception-1'));

context.window['atlas-state']({detail:{mode:'guest'}});assert(element('content').innerHTML.includes(`0 / ${total}`));assert(element('galaxy').innerHTML.includes('fogLayer'));assert(element('galaxy').innerHTML.includes('MENTORSHIP MOTHERSHIP'));assert(!element('galaxy').innerHTML.includes('data-node='));assert(element('detail').innerHTML.includes('A curriculum to explore'));
assert.equal(element('flightViewport').scrollLeft,1300*.72-400);
element('zoomIn').onclick();assert.equal(element('zoomLevel').textContent,'90%');element('homeShip').onclick();assert(Math.abs(element('flightViewport').scrollLeft-(1300*.9-400))<.001);
element('previewToggle').onclick();assert.equal((element('galaxy').innerHTML.match(/data-node=/g)||[]).length,total);assert(!element('galaxy').innerHTML.includes('fogLayer'));assert(element('content').innerHTML.includes(`0 / ${total}`));
context.location.hash='#sessions';context.window.hashchange();element('content').listeners.click({target:{closest:s=>s==='#approve'?{}:null}});
context.location.hash='#map';context.window.hashchange();element('previewToggle').onclick();assert.equal((element('galaxy').innerHTML.match(/data-node=/g)||[]).length,3);assert(element('content').innerHTML.includes(`3 / ${total}`));
context.location.hash='#practice';context.window.hashchange();assert(element('content').innerHTML.includes('Availability in the lateral'));
element('reset').listeners.click();context.location.hash='#map';context.window.hashchange();assert(element('content').innerHTML.includes(`0 / ${total}`));
console.log('PASS: curriculum v2 guest journey, preview, discovery isolation, zoom, lesson reveal and reset.');

const student={id:'student',role:'mentee',display_name:'Test student'};
const lesson={id:'lesson',lesson_date:'2026-09-10',created_at:'2026-09-10T12:00:00Z',concepts:{'organization-0':'Introduced'},voided:false,summary:'Real saved lesson',practice:'Practice focus'};
const state={mode:'ready',viewer:student,student,students:[student],lessons:[lesson],fullAccess:false};
context.window['atlas-state']({detail:state});assert(element('content').innerHTML.includes(`1 / ${total}`));assert.equal((element('galaxy').innerHTML.match(/data-node=/g)||[]).length,1);
element('previewToggle').onclick();assert.equal((element('galaxy').innerHTML.match(/data-node=/g)||[]).length,1);element('reset').listeners.click();assert(element('content').innerHTML.includes(`1 / ${total}`));
context.location.hash='#sessions';context.window.hashchange();assert(element('content').innerHTML.includes('Real saved lesson'));assert(!element('content').innerHTML.includes('Approve sample'));
context.window['atlas-state']({detail:{mode:'error',message:'Unavailable'}});assert(!element('content').innerHTML.includes('Real saved lesson'));
context.location.hash='#map';const coach={id:'coach',role:'coach',display_name:'Gab'};context.window['atlas-state']({detail:{...state,viewer:coach,student:coach,students:[coach,student],fullAccess:true}});assert.equal((element('galaxy').innerHTML.match(/data-node=/g)||[]).length,total);
context.window['atlas-state']({detail:{mode:'guest'}});assert(!element('galaxy').innerHTML.includes('data-node='));
console.log('PASS: legacy saved IDs remain valid; student privacy and coach full curriculum access preserved.');

const u=context.window.ATLAS_UNIVERSE,coords=[...u.positions.values()];assert.equal(coords.length,total);
for(const [i,p] of coords.entries()){assert(p.x>=110&&p.x<=2490&&p.y>=110&&p.y<=2490);for(const q of coords.slice(i+1))assert(Math.hypot(p.x-q.x,p.y-q.y)>140);}
assert.equal(Object.keys(context.window.ZOUK_DETAILS).length,total);for(const d of Object.values(context.window.ZOUK_DETAILS))assert(d.understand.length>70&&d.notice.length>25);
element('content').listeners.click({target:{closest:s=>s==='[data-landmark]'?{dataset:{landmark:'horizon'}}:null}});assert(element('detail').innerHTML.includes('Make room for the unknown'));assert(!element('galaxy').innerHTML.includes('data-node='));element('homeShip').onclick();assert(element('detail').innerHTML.includes('A curriculum to explore'));
for(const landmark of u.landmarks)for(const p of u.positions.values())assert(Math.hypot(p.x-landmark.x,p.y-landmark.y)>230);
console.log('PASS: all study guides, semantic depth geometry and landmarks remain bounded and non-overlapping.');

const search=q=>{element('conceptSearch').value=q;element('conceptSearch').listeners.input();return element('conceptSearchResults').innerHTML;};
assert(!search('Breathing').includes('data-node='));element('previewToggle').onclick();assert(search('piao').includes('patterns-2'));assert(search('PIÃO').includes('patterns-2'));assert(search('frame').includes('connection-6'));assert(search('saltinho').includes('grammar-0'));assert(search('lambada question').includes('rhythm-3'));assert(search('torsion').includes('pathways-0'));assert(search('Rhythm & Timing').includes('rhythm-0'));assert(search('pattern recognition').includes('perception-0'));assert(search('visualization').includes('perception-2'));assert(search('calculation').includes('perception-4'));
context.window['atlas-state']({detail:state});assert(!search('Piao').includes('data-node='));assert(search('Breathing').includes('organization-0'));assert.equal((search('Breathing').match(/data-node=/g)||[]).length,1);
element('fitGalaxy').onclick();element('content').listeners.click({target:{closest:s=>s==='[data-node]'?{dataset:{node:'organization-0'}}:null}});assert.equal(element('zoomLevel').textContent,'90%');assert.equal(element('discoverySelect').value,'organization-0');assert(element('content').innerHTML.includes(`1 / ${total}`));assert.equal(JSON.stringify(lesson.concepts),'{"organization-0":"Introduced"}');
element('content').listeners.click({target:{closest:s=>s==='[data-node]'?{dataset:{node:'pathways-0'}}:null}});assert.equal(element('discoverySelect').value,'organization-0');assert.equal(search(''),'');
console.log('PASS: aliases/domains/new concepts are searchable while undiscovered concepts remain private.');