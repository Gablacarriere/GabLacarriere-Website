const assert=require('node:assert/strict'),W=require('../zoukable/world.js');
const d={id:'d',status:'published'},ready={teacher:{status:'ready'}};
assert.equal(W.state({},[],()=>({accessible:true}),()=>true).access,'unmapped');
assert.equal(W.state({},[{...d,status:'draft'}],()=>({accessible:true}),()=>true).access,'unmapped');
assert.equal(W.state({},[d],()=>({accessible:true}),()=>true).access,'unlocked');
assert.equal(W.state({},[d],()=>({accessible:true}),()=>false).access,'setup');
const locked=W.state(ready,[d],()=>({accessible:false}),()=>false);assert(locked.mastered);assert.equal(locked.access,'locked');assert.equal(locked.drill,undefined);
assert.equal(W.state({teacher:{status:'reliable'}},[d],()=>({accessible:true}),()=>true).mastered,false);
console.log('PASS: draft/empty library states, eligibility, setup restrictions, teacher mastery never overrides drill access.');
