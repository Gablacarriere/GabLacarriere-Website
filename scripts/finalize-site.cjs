// Dependency-free finalization. Run after branding and the isolated app copy.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=process.cwd(),out=path.join(root,'public');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const digest=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,12);
const htmlFiles=walk(out).filter(f=>f.endsWith('.html'));
const repeated=new Map();
for(const file of htmlFiles)for(const [,css]of fs.readFileSync(file,'utf8').matchAll(/<style>([\s\S]*?)<\/style>/g)){if(css.trim())repeated.set(css,(repeated.get(css)||0)+1);}
let sharedBytes=0,versioned=0;const errors=[];
for(const file of htmlFiles){let html=fs.readFileSync(file,'utf8');
 html=html.replace(/<style>([\s\S]*?)<\/style>/g,(tag,css)=>{if((repeated.get(css)||0)<2||css.length<500)return tag;const rel='/generated/shared-'+digest(css)+'.css';fs.mkdirSync(path.join(out,'generated'),{recursive:true});fs.writeFileSync(path.join(out,rel),css);sharedBytes+=Buffer.byteLength(css);return '<link rel="stylesheet" href="'+rel+'">';});
 html=html.replace(/\b(src|href)="([^"#]+)"/g,(tag,attr,url)=>{
  if(!/\.(css|js)(\?|$)/i.test(url)||/^(https?:|\/\/|data:)/.test(url))return tag;
  const [pathname]=url.split('?');const local=pathname.startsWith('/')?path.join(out,pathname):path.resolve(path.dirname(file),pathname);
  if(!local.startsWith(out+path.sep)||!fs.existsSync(local)){errors.push(path.relative(out,file)+': missing '+url);return tag;}
  versioned++;return attr+'="'+pathname+'?v='+digest(fs.readFileSync(local))+'"';
 });
 fs.writeFileSync(file,html);
}
for(const file of walk(out)){
 const rel=path.relative(out,file);
 if(/(^|\/)(database|design|tests|work|scripts|\.git)(\/|$)|\.(sql|cjs|md|py)$/.test(rel))errors.push('Non-public file: '+rel);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`Finalized ${htmlFiles.length} pages; ${versioned} asset references versioned from content; ${sharedBytes} inline CSS bytes moved to reusable files.`);
