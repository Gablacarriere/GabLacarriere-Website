const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const script=path.resolve('scripts/finalize-site.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'gab-build-'));
const out=path.join(root,'public');fs.mkdirSync(out);
const run=()=>spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});
try {
 const css='/* shared */'+'.example{color:red}'.repeat(40);
 const html='<style>'+css+'</style><script src="/app.js?v=old"></script>';
 fs.writeFileSync(path.join(out,'app.js'),'window.example=1;');
 for(const file of ['index.html','about.html'])fs.writeFileSync(path.join(out,file),html);
 assert.equal(run().status,0);
 const first=fs.readFileSync(path.join(out,'index.html'),'utf8');
 assert(!first.includes('<style>'));assert.match(first,/app.js\?v=[a-f0-9]{12}/);
 assert.equal(fs.readdirSync(path.join(out,'generated')).length,1);
 assert.equal(run().status,0);assert.equal(fs.readFileSync(path.join(out,'index.html'),'utf8'),first);
 fs.writeFileSync(path.join(out,'app.js'),'window.example=2;');assert.equal(run().status,0);
 assert.notEqual(fs.readFileSync(path.join(out,'index.html'),'utf8'),first);
 fs.unlinkSync(path.join(out,'app.js'));assert.notEqual(run().status,0);
 fs.writeFileSync(path.join(out,'app.js'),'');fs.mkdirSync(path.join(out,'database'));
 fs.writeFileSync(path.join(out,'database','schema.sql'),'-- private build fixture');assert.notEqual(run().status,0);
 console.log('PASS: shared CSS, stable repeat runs, changed asset versions, missing assets and development files rejected.');
} finally {fs.rmSync(root,{recursive:true,force:true});}
