const {execFileSync}=require('node:child_process');

const base=process.env.VERCEL_GIT_PREVIOUS_SHA;
if(!base){
  console.log('No previous successful deployment SHA is available; run the build.');
  process.exit(1);
}

let changed=[];
try{
  changed=execFileSync('git',['diff','--name-only',base,'HEAD'],{encoding:'utf8'})
    .split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
}catch(err){
  console.log('Could not determine the Git diff; run the build.');
  process.exit(1);
}

const nonSite=[
  /^\.github\//,
  /^\.zoukable\//,
  /^(?:database|design|tests|work)\//,
  /(?:^|\/)README(?:\.[^/]+)?$/i,
  /\.md$/i,
  /^NAVBAR_PREVIEW\.png$/
];
const affectsSite=changed.filter(file=>!nonSite.some(rule=>rule.test(file)));

if(affectsSite.length){
  console.log('Site-affecting changes detected: '+affectsSite.join(', '));
  process.exit(1); // Vercel: continue with deployment.
}

console.log(changed.length
  ? 'Only non-site files changed; skip this Vercel build: '+changed.join(', ')
  : 'No deployable changes detected; skip this Vercel build.');
process.exit(0); // Vercel: ignore deployment.
