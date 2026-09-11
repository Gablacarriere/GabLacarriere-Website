const fs=require('fs'),vm=require('vm'),assert=require('assert');
(async()=>{
const coach={id:'coach',display_name:'Gab',role:'coach'},student={id:'student',display_name:'Student',role:'mentee'};
let user=coach,rows=[],listener,mode='ok',state;const events=[];
const client={auth:{getUser:async()=>({data:{user},error:null}),onAuthStateChange:fn=>listener=fn},from:table=>{
let filters=[],verb='read',record;
const query={select(){return this},eq(k,v){filters.push([k,v]);return this},order(){return this},insert(r){verb='insert';record=r;return this},update(r){verb='update';record=r;return this},
range:async()=>({data:rows.filter(r=>filters.every(([k,v])=>r[k]===v)),error:mode==='error'?{message:'failure'}:null}),
single:async()=>{
if(table==='profiles')return{data:filters.find(x=>x[0]==='id')?.[1]==='coach'?coach:student,error:null};
if(verb==='insert'){if(rows.some(x=>x.id===record.id))return{error:{code:'23505'}};rows.push({...record,created_at:'2026-09-10T12:00:00Z',voided:false});return{data:{id:record.id}};}
const row=rows.find(r=>filters.every(([k,v])=>r[k]===v));if(row&&verb==='update')Object.assign(row,record);return row?{data:{id:row.id}}:{error:{}};
},
then(resolve){resolve({data:[coach,student],error:null});}
};return query;}};
const ctx={URL,URLSearchParams,location:{search:'?student=student',href:'https://example.test/zouk-map/?student=student'},history:{replaceState(){}},setTimeout,CustomEvent:class{constructor(t,o){this.detail=o.detail}},window:{GAB_PORTAL:{},supabase:{createClient:()=>client},dispatchEvent(e){state=e.detail;events.push(state);}}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('zouk-map-auth.js','utf8'),ctx);
const settle=()=>new Promise(r=>setTimeout(r,5));await settle();assert.equal(state.student.id,'student');assert.equal(state.viewer.role,'coach');
await ctx.window.ATLAS_API.saveLesson({id:'one',student_id:'student',lesson_date:'2026-09-10',summary:'Saved',practice:'Focus',concepts:{'organization-0':'Introduced'}});
assert.equal(state.lessons.length,1);assert.equal(rows.length,1);
await ctx.window.ATLAS_API.saveLesson({id:'one',student_id:'student'});assert.equal(rows.length,1);
await ctx.window.ATLAS_API.setVoided('one',true);assert.equal(state.lessons[0].voided,true);
await ctx.window.ATLAS_API.setVoided('one',false);assert.equal(state.lessons[0].voided,false);
user=student;await ctx.window.ATLAS_API.refresh();assert.equal(state.student.id,'student');assert.equal(state.fullAccess,false);
await assert.rejects(ctx.window.ATLAS_API.saveLesson({student_id:'student'}));
mode='error';await ctx.window.ATLAS_API.refresh();assert.equal(state.mode,'error');assert(!state.lessons);
listener('SIGNED_OUT',null);assert.equal(state.mode,'guest');
console.log('PASS: coach student targeting, save/read-back, idempotent retry, remove/restore, student write guard, connection error and logout clear records.');
})();
