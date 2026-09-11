const fs=require('fs'),vm=require('vm'),assert=require('assert');
(async()=>{
let submit,valid=false,record,approvalCount=0;
const button={disabled:false};
const form={elements:{review_student_id:{value:'confirmed-student'},lesson_date:{value:'2026-08-26'},summary:{value:' Edited summary '},practice:{value:' Reviewed practice '}},reportValidity:()=>valid,addEventListener:(t,fn)=>submit=fn,querySelector:()=>button,querySelectorAll:()=>[{dataset:{concept:'organization-1'},value:'Introduced'},{dataset:{concept:'patterns-4'},value:''}]};
const ctx={crypto:{randomUUID:()=> 'request'},window:{ATLAS_IMPORTS:{selected:()=>({id:'draft'})},ATLAS_API:{approveImport:async(id,r)=>{approvalCount++;assert.equal(id,'draft');record=r;},saveLesson:()=>{throw Error('Imported form used manual save');}}},document:{getElementById:id=>id==='atlasLessonForm'?form:id==='atlasStudentSelect'?null:{textContent:''},querySelectorAll:()=>[]}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('zouk-map-data.js','utf8'),ctx);vm.runInContext(fs.readFileSync('atlas-live.js','utf8'),ctx);
ctx.window.ATLAS_LIVE.bind({student:{id:'initial-student'}});
await submit({preventDefault(){}});assert.equal(approvalCount,0);
valid=true;const pending=submit({preventDefault(){}});await submit({preventDefault(){}});await pending;
assert.equal(approvalCount,1);assert.equal(record.student_id,'confirmed-student');assert.equal(record.lesson_date,'2026-08-26');assert.equal(record.summary,'Edited summary');
assert.equal(record.concepts['organization-1'],'Introduced');assert(!Object.hasOwn(record.concepts,'patterns-4'));assert(!Object.hasOwn(record,'source_excerpt'));assert(!button.disabled);
console.log('PASS: review confirmation blocks premature save, corrected student/date/text/concepts reach approval, double-click guard, no source excerpts copied.');
})();
