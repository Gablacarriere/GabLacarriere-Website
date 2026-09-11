const fs=require('fs'),vm=require('vm'),assert=require('assert');
const els=new Map();const element=id=>{if(!els.has(id))els.set(id,{innerHTML:'',textContent:'',style:{},clientWidth:800,clientHeight:660,scrollLeft:0,scrollTop:0,listeners:{},classList:{add(){},remove(){}},addEventListener(e,fn){this.listeners[e]=fn},appendChild(){},focus(){},setAttribute(){},removeAttribute(){},scrollBy(x,y){this.scrollLeft+=x;this.scrollTop+=y},setPointerCapture(){}});return els.get(id)};
const context={window:{addEventListener(e,fn){this[e]=fn}},document:{createElement:()=>element('newlink'),getElementById:id=>id==='atlasLessonForm'?null:element(id),querySelectorAll:()=>[]},location:{hash:'#map'},requestAnimationFrame:fn=>fn(),setTimeout:fn=>fn()};vm.createContext(context);vm.runInContext(fs.readFileSync('mentorship-crew.js','utf8'),context);vm.runInContext(fs.readFileSync('zouk-map-data.js','utf8'),context);vm.runInContext(fs.readFileSync('atlas-universe.js','utf8'),context);vm.runInContext(fs.readFileSync('atlas-live.js','utf8'),context);vm.runInContext(fs.readFileSync('zouk-map.js','utf8'),context);
context.window['atlas-state']({detail:{mode:'guest'}});assert(element('content').innerHTML.includes('0 / 56'));assert(element('galaxy').innerHTML.includes('fogLayer'));assert(element('galaxy').innerHTML.includes('YOUR SHIP'));assert(!element('galaxy').innerHTML.includes('data-node='));assert(element('detail').innerHTML.includes('A universe to discover'));
assert.equal(element('flightViewport').scrollLeft,1300*.72-400);
element('zoomIn').onclick();assert.equal(element('zoomLevel').textContent,'90%');element('homeShip').onclick();assert(Math.abs(element('flightViewport').scrollLeft-(1300*.9-400))<.001);
element('previewToggle').onclick();assert.equal((element('galaxy').innerHTML.match(/data-node=/g)||[]).length,56);assert(!element('galaxy').innerHTML.includes('fogLayer'));assert(element('content').innerHTML.includes('0 / 56'));
context.location.hash='#sessions';context.window.hashchange();element('content').listeners.click({target:{closest:s=>s==='#approve'?{}:null}});
context.location.hash='#map';context.window.hashchange();element('previewToggle').onclick();assert.equal((element('galaxy').innerHTML.match(/data-node=/g)||[]).length,3);assert(element('content').innerHTML.includes('3 / 56'));
context.location.hash='#practice';context.window.hashchange();assert(element('content').innerHTML.includes('Availability in the lateral'));
element('reset').listeners.click();context.location.hash='#map';context.window.hashchange();assert(element('content').innerHTML.includes('0 / 56'));
console.log('PASS: starts at ship with zero discoveries; fog; 56-node curriculum preview; preview leaves progress unchanged; zoom; recenter; lesson reveals three nodes; practice; reset.');


const student={id:'student',role:'mentee',display_name:'Test student'};
const lesson={id:'lesson',lesson_date:'2026-09-10',created_at:'2026-09-10T12:00:00Z',concepts:{'organization-0':'Introduced'},voided:false,summary:'Real saved lesson',practice:'Practice focus'};
const state={mode:'ready',viewer:student,student,students:[student],lessons:[lesson],fullAccess:false};
context.window['atlas-state']({detail:state});
assert(element('content').innerHTML.includes('1 / 56'));
assert.equal((element('galaxy').innerHTML.match(/data-node=/g)||[]).length,1);
element('previewToggle').onclick();
assert.equal((element('galaxy').innerHTML.match(/data-node=/g)||[]).length,1);
element('reset').listeners.click();assert(element('content').innerHTML.includes('1 / 56'));
context.location.hash='#sessions';context.window.hashchange();
assert(element('content').innerHTML.includes('Real saved lesson'));assert(!element('content').innerHTML.includes('Approve sample'));
context.window['atlas-state']({detail:{mode:'error',message:'Unavailable'}});
assert(!element('content').innerHTML.includes('Real saved lesson'));
context.location.hash='#map';
const coach={id:'coach',role:'coach',display_name:'Gab'};
context.window['atlas-state']({detail:{...state,viewer:coach,student:coach,students:[coach,student],fullAccess:true}});
assert.equal((element('galaxy').innerHTML.match(/data-node=/g)||[]).length,56);
context.window['atlas-state']({detail:{mode:'guest'}});
assert(!element('galaxy').innerHTML.includes('data-node='));
console.log('PASS: saved student map, demo isolation, student cannot reset/preview saved progress, saved sessions, error clears private content, full coach access, sign-out clears map.');

const u=context.window.ATLAS_UNIVERSE, coords=[...u.positions.values()];
assert.equal(coords.length,56);
for(const [i,p] of coords.entries()){assert(p.x>=110&&p.x<=2490&&p.y>=110&&p.y<=2490);for(const q of coords.slice(i+1))assert(Math.hypot(p.x-q.x,p.y-q.y)>140);}
assert.equal(Object.keys(context.window.ZOUK_DETAILS).length,56);
for(const d of Object.values(context.window.ZOUK_DETAILS))assert(d.understand.length>70&&d.notice.length>25);
element('content').listeners.click({target:{closest:s=>s==='[data-landmark]'?{dataset:{landmark:'horizon'}}:null}});
assert(element('detail').innerHTML.includes('Make room for the unknown'));
assert(!element('galaxy').innerHTML.includes('data-node='));
element('homeShip').onclick();assert(element('detail').innerHTML.includes('A universe to discover'));
console.log('PASS: all 56 study guides, bounded non-overlapping geometry, landmark navigation does not award progress.');

for(const landmark of context.window.ATLAS_UNIVERSE.landmarks)for(const p of context.window.ATLAS_UNIVERSE.positions.values())assert(Math.hypot(p.x-landmark.x,p.y-landmark.y)>230);
