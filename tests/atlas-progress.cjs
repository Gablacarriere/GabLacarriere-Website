const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={window:{},document:{}};vm.createContext(ctx);
for(const file of ['zouk-map-data.js','atlas-live.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
const api=ctx.window.ATLAS_LIVE;
const lesson=(id,date,concepts,voided=false)=>({id,lesson_date:date,created_at:date+'T12:00:00Z',concepts,voided,summary:'<script>bad</script>',practice:'Practice <safely>'});
const s={viewer:{role:'mentee'},student:{display_name:'<Student>'},lessons:[
lesson('old','2026-09-01',{'organization-0':'Introduced','patterns-5':'Practicing'}),
lesson('new','2026-09-10',{'organization-0':'Integrating'}),
lesson('void','2026-09-11',{'connection-0':'Introduced'},true)]};
assert.equal(api.progress(s)['organization-0'],'Integrating');
assert.equal(api.progress(s)['patterns-5'],'Practicing');
assert.equal(api.progress(s)['connection-0'],undefined);
s.lessons[1].voided=true;assert.equal(api.progress(s)['organization-0'],'Introduced');
s.lessons[1].voided=false;
const html=api.markup('sessions',s);assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));assert(!html.includes('Record a lesson'));assert(!html.includes('REMOVED FROM MAP'));
s.viewer.role='coach';const coach=api.markup('sessions',s);assert(coach.includes('Record a lesson'));assert(coach.includes('Restore lesson'));assert.equal((coach.match(/data-concept=/g)||[]).length,56);
assert(api.markup('journey',s).includes('2 concepts explored'));
assert(api.detail('organization-0',s).includes('2026-09-10'));
console.log('PASS: persisted concept keys, latest-lesson precedence, removal/restore, escaped notes, student read-only UI, 56-concept coach form.');
