const fs=require('node:fs');
const path=require('node:path');

const root=process.cwd();
const out=path.join(root,'public');
if(!fs.existsSync(out))throw new Error('Missing public output. Run the site build first.');

const internalPages=new Set([
  'business-hq.html',
  'business-finance.html',
  'lead-crm.html',
  'teaching-lab.html',
  'mentorship-hub.html',
  'practice-planner.html',
  'comms-deck.html',
  'zouk-map.html'
]);

function walk(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(dir,entry.name);
    return entry.isDirectory()?walk(full):[full];
  });
}

// Internal tools are useful to authorized users but are not search landing pages.
for(const fileName of internalPages){
  const file=path.join(out,fileName);
  if(!fs.existsSync(file))continue;
  let html=fs.readFileSync(file,'utf8');
  if(!/<meta\s+name=["']robots["']/i.test(html)){
    html=html.replace('</head>','<meta name="robots" content="noindex,nofollow">\n</head>');
    fs.writeFileSync(file,html);
  }
}
const zoukableIndex=path.join(out,'zoukable','index.html');
if(fs.existsSync(zoukableIndex)){
  let html=fs.readFileSync(zoukableIndex,'utf8');
  if(!/<meta\s+name=["']robots["']/i.test(html)){
    html=html.replace('</head>','<meta name="robots" content="noindex,nofollow">\n</head>');
    fs.writeFileSync(zoukableIndex,html);
  }
}

const htmlFiles=walk(out).filter(file=>file.endsWith('.html'));
const errors=[];

function resolveLocalPage(url,currentFile){
  const clean=url.split('?')[0].split('#')[0];
  if(!clean)return currentFile;
  if(clean.startsWith('/')){
    if(clean==='/')return path.join(out,'index.html');
    if(clean==='/zoukable'||clean==='/zoukable/')return path.join(out,'zoukable','index.html');
    const trimmed=clean.replace(/^\/+|\/+$/g,'');
    if(!trimmed)return path.join(out,'index.html');
    if(path.extname(trimmed))return path.join(out,trimmed);
    return path.join(out,trimmed+'.html');
  }
  const withoutSlash=clean.replace(/\/$/,'');
  if(!withoutSlash)return currentFile;
  if(path.extname(withoutSlash))return path.resolve(path.dirname(currentFile),withoutSlash);
  return path.resolve(path.dirname(currentFile),withoutSlash+'.html');
}

function hasFragment(file,fragment){
  if(!fragment)return true;
  if(!fs.existsSync(file)||!file.endsWith('.html'))return false;
  const decoded=decodeURIComponent(fragment);
  const html=fs.readFileSync(file,'utf8');
  const escaped=decoded.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp('(?:id|name)=["\']'+escaped+'["\']','i').test(html);
}

for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  for(const match of html.matchAll(/\bhref=["']([^"']+)["']/gi)){
    const href=match[1].trim();
    if(!href||/^(?:https?:|mailto:|tel:|sms:|data:|javascript:)/i.test(href))continue;
    const target=resolveLocalPage(href,file);
    if(!target.startsWith(out+path.sep)&&target!==path.join(out,'index.html'))continue;
    if(!fs.existsSync(target)){
      errors.push(`${path.relative(out,file)}: broken local link ${href}`);
      continue;
    }
    const hashIndex=href.indexOf('#');
    if(hashIndex>=0){
      const fragment=href.slice(hashIndex+1);
      if(fragment&&!hasFragment(target,fragment))errors.push(`${path.relative(out,file)}: missing fragment ${href}`);
    }
  }
}

if(errors.length){
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Publication audit passed for ${htmlFiles.length} HTML files; internal tools marked noindex and local links/fragments resolve.`);
