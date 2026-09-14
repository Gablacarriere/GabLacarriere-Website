(() => {
  const W=2600,C=1300;
  let seed=84721;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const groups=window.ZOUK_ATLAS;
  const radii={1:360,2:580,3:800,4:1010,5:1170};
  // Curriculum geometry is intentional:
  // radius = pedagogical depth; angle = conceptual neighborhood; parent = strongest semantic bridge.
  const layout={
    'organization-0':{tier:1,angle:250,parent:null},
    'organization-1':{tier:1,angle:280,parent:null},
    'organization-2':{tier:2,angle:275,parent:'organization-0'},
    'connection-0':{tier:1,angle:340,parent:'connection-6'},
    'connection-1':{tier:2,angle:308,parent:'connection-0'},
    'connection-2':{tier:2,angle:335,parent:'connection-0'},
    'connection-3':{tier:2,angle:355,parent:'steps-0'},
    'connection-4':{tier:3,angle:338,parent:'connection-3'},
    'connection-5':{tier:3,angle:320,parent:'connection-0'},
    'connection-6':{tier:1,angle:310,parent:'organization-1'},
    'steps-0':{tier:1,angle:20,parent:null},
    'steps-1':{tier:2,angle:32,parent:'steps-0'},
    'steps-2':{tier:2,angle:49,parent:'steps-1'},
    'steps-3':{tier:2,angle:66,parent:'steps-2'},
    'steps-4':{tier:2,angle:83,parent:'steps-3'},
    'steps-5':{tier:3,angle:72,parent:'steps-4'},
    'spirals-0':{tier:2,angle:152,parent:'organization-1'},
    'spirals-1':{tier:2,angle:174,parent:'organization-1'},
    'spirals-2':{tier:2,angle:196,parent:'organization-1'},
    'spirals-3':{tier:3,angle:182,parent:'spirals-1'},
    'spirals-4':{tier:4,angle:158,parent:'spirals-3'},
    'spirals-5':{tier:3,angle:145,parent:'spirals-0'},
    'awareness-0':{tier:1,angle:220,parent:null},
    'bridge-0':{tier:3,angle:258,parent:'organization-1'},
    'bridge-1':{tier:3,angle:275,parent:'organization-1'},
    'bridge-2':{tier:3,angle:205,parent:'spirals-1'},
    'bridge-3':{tier:3,angle:305,parent:'connection-0'},
    'bridge-4':{tier:3,angle:225,parent:'awareness-0'},
    'bridge-5':{tier:3,angle:238,parent:'bridge-4'},
    'architecture-0':{tier:4,angle:266,parent:'bridge-0'},
    'architecture-1':{tier:4,angle:242,parent:'architecture-0'},
    'architecture-2':{tier:4,angle:254,parent:'architecture-0'},
    'architecture-3':{tier:4,angle:230,parent:'bridge-5'},
    'architecture-4':{tier:4,angle:218,parent:'bridge-4'},
    'architecture-5':{tier:4,angle:292,parent:'bridge-3'},
    'architecture-6':{tier:4,angle:206,parent:'bridge-4'},
    'architecture-7':{tier:5,angle:236,parent:'architecture-3'},
    'patterns-0':{tier:3,angle:5,parent:'connection-3'},
    'patterns-1':{tier:3,angle:28,parent:'patterns-0'},
    'patterns-2':{tier:4,angle:142,parent:'spirals-0'},
    'patterns-3':{tier:4,angle:330,parent:'connection-0'},
    'patterns-4':{tier:4,angle:112,parent:'patterns-1'},
    'patterns-5':{tier:3,angle:55,parent:'patterns-0'},
    'patterns-6':{tier:3,angle:42,parent:'patterns-0'},
    'patterns-7':{tier:4,angle:76,parent:'patterns-4'},
    'patterns-8':{tier:3,angle:101,parent:'spirals-1'},
    'patterns-9':{tier:4,angle:130,parent:'patterns-8'},
    'patterns-10':{tier:5,angle:138,parent:'patterns-9'},
    'patterns-11':{tier:4,angle:174,parent:'spirals-1'},
    'patterns-12':{tier:5,angle:160,parent:'patterns-11'},
    'patterns-13':{tier:4,angle:190,parent:'spirals-3'},
    'patterns-14':{tier:4,angle:64,parent:'patterns-7'},
    'patterns-15':{tier:4,angle:52,parent:'patterns-6'},
    'patterns-16':{tier:4,angle:88,parent:'patterns-7'},
    'patterns-17':{tier:4,angle:40,parent:'connection-2'},
    'patterns-18':{tier:4,angle:20,parent:'steps-1'},
    'patterns-19':{tier:5,angle:182,parent:'spirals-4'}
  };
  const gatewayLayout={
    organization:{angle:270,radius:205},
    connection:{angle:325,radius:215},
    steps:{angle:20,radius:215},
    spirals:{angle:174,radius:220},
    awareness:{angle:220,radius:195},
    bridge:{angle:248,radius:350},
    architecture:{angle:220,radius:455},
    patterns:{angle:80,radius:455}
  };
  const depthZones=[
    {tier:1,name:'CORE',angle:120},
    {tier:2,name:'FOUNDATIONS',angle:120},
    {tier:3,name:'INTEGRATION',angle:120},
    {tier:4,name:'APPLICATION',angle:350},
    {tier:5,name:'EXPLORATION',angle:20}
  ];
  // These are deliberately sparse cross-family links. Strength 3 is a close functional
  // relationship; strength 2 is a useful bridge. Primary parent links are generated below.
  const semanticRelations=[
    {a:'connection-6',b:'bridge-3',strength:2,reason:'Frame depends on tone that can adapt while contact remains informative.'},
    {a:'connection-2',b:'steps-1',strength:3,reason:'Clear weight commitment depends directly on how support transfers through the feet.'},
    {a:'organization-1',b:'steps-5',strength:2,reason:'Whole-body availability includes adaptable lower-body joints.'},
    {a:'connection-1',b:'bridge-3',strength:2,reason:'Permeability depends on tone that can modulate instead of staying fixed.'},
    {a:'connection-0',b:'architecture-5',strength:2,reason:'Connection preservation extends basic connection principles across a full pattern.'},
    {a:'connection-3',b:'patterns-6',strength:2,reason:'The side basic applies timing through a concrete stepping pathway.'},
    {a:'steps-5',b:'bridge-1',strength:2,reason:'Joint availability supports repositioning without a preparatory reset.'},
    {a:'bridge-0',b:'patterns-4',strength:2,reason:'Viradinha makes changes of orientation concrete.'},
    {a:'architecture-0',b:'patterns-7',strength:2,reason:'Soltinho can be read through changing orientation and relative position.'},
    {a:'spirals-4',b:'patterns-12',strength:2,reason:'The advanced Boneca variation draws on coordinated full-body spiraling.'}
  ];
  const point=(angle,radius)=>({x:Math.round(C+Math.cos(angle*Math.PI/180)*radius),y:Math.round(C+Math.sin(angle*Math.PI/180)*radius)});
  const positions=new Map(),gateways=new Map(),occupied=[{x:C,y:C}];
  const curriculumIds=groups.flatMap(g=>g.topics.map((_,i)=>g.id+'-'+i));
  if(curriculumIds.length!==Object.keys(layout).length||curriculumIds.some(id=>!layout[id]))throw Error('Atlas semantic layout is out of sync with curriculum');
  curriculumIds.forEach(id=>{
    const spec=layout[id],p=point(spec.angle,radii[spec.tier]);
    if(p.x<110||p.x>W-110||p.y<110||p.y>W-110)throw Error('Atlas node outside map: '+id);
    if(occupied.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<=145))throw Error('Atlas semantic nodes overlap near '+id);
    positions.set(id,p);occupied.push(p);
  });
  groups.forEach(g=>{
    const spec=gatewayLayout[g.id];
    if(!spec)throw Error('Missing atlas gateway layout: '+g.id);
    gateways.set(g.id,point(spec.angle,spec.radius));
  });
  const primaryRelations=Object.entries(layout).flatMap(([id,spec])=>spec.parent?[{a:spec.parent,b:id,strength:3,kind:'primary'}]:[]);
  const relations=[...primaryRelations,...semanticRelations.map(r=>({...r,kind:'semantic'}))];
  const related=id=>relations.filter(r=>r.a===id||r.b===id).map(r=>({id:r.a===id?r.b:r.a,strength:r.strength,kind:r.kind,reason:r.reason||''})).sort((a,b)=>b.strength-a.strength||(a.kind==='primary'?-1:1));
  // Sparse, non-repeating stars are decorative: no student state is encoded here.
  const stars=Array.from({length:440},()=>({x:Math.round(random()*W),y:Math.round(random()*W),r:(.45+random()*1.5).toFixed(2),o:(.15+random()*.65).toFixed(2)}));
  const depthMarkup=()=>'<svg class="curriculumDepthRings" viewBox="0 0 2600 2600" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.72">'+depthZones.map((z,i)=>{
    const r=radii[z.tier],label=point(z.angle,r),w=Math.max(62,z.name.length*8+24);
    return '<circle cx="'+C+'" cy="'+C+'" r="'+r+'" fill="none" stroke="#b9cbe1" stroke-opacity="'+(.105+i*.012).toFixed(3)+'" stroke-width="1.4" stroke-dasharray="6 16" vector-effect="non-scaling-stroke"/><g transform="translate('+label.x+' '+label.y+')"><rect x="'+(-w/2)+'" y="-13" width="'+w+'" height="26" rx="13" fill="#080e1c" fill-opacity=".9" stroke="#b9cbe1" stroke-opacity=".15" vector-effect="non-scaling-stroke"/><text x="0" y="4" text-anchor="middle" fill="#c5d2e2" fill-opacity=".58" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="700" letter-spacing="1.5">'+z.name+'</text></g>';
  }).join('')+'</svg>';
  const background=()=>depthMarkup()+'<svg class="universeStars" viewBox="0 0 2600 2600" aria-hidden="true">'+stars.map(s=>'<circle cx="'+s.x+'" cy="'+s.y+'" r="'+s.r+'" fill="#dbeaff" opacity="'+s.o+'"/>').join('')+'</svg><div class="nebula nebulaRose" aria-hidden="true"></div><div class="nebula nebulaBlue" aria-hidden="true"></div><div class="nebula nebulaGold" aria-hidden="true"></div>';
  const landmarks=[{id:'horizon',x:1850,y:490,name:'The event horizon',kind:'blackhole',title:'Make room for the unknown.',text:'This black hole is a reflection stop. Which part of your dancing feels difficult to describe? Bring that question to your next lesson. Visiting here does not change your discoveries.',link:'#practice',cta:'Return to my practice'}, {id:'observatory',x:620,y:1220,name:'The observatory',kind:'observatory',title:'See your journey from here.',text:'Step back and revisit the lessons behind your discoveries. Distance from the ship describes curriculum depth: Core, Foundations, Integration, Application, then Exploration. Nearby concepts share stronger content relationships. Solid lines show the strongest structural links; lighter dashed links show useful secondary relationships. Your location on the map is not a rank of your ability.',link:'#sessions',cta:'Open lesson history'}];
  landmarks.forEach(l=>{
    const candidates=[];
    for(let x=200;x<=2400;x+=40)for(let y=200;y<=2400;y+=40){
      if(occupied.every(p=>Math.hypot(x-p.x,y-p.y)>230))candidates.push({x,y});
    }
    candidates.sort((a,b)=>Math.hypot(a.x-l.x,a.y-l.y)-Math.hypot(b.x-l.x,b.y-l.y));
    Object.assign(l,candidates[0]);occupied.push(l);
  });
  const landmarkMarkup=()=>landmarks.map(l=>'<button class="cosmicLandmark '+l.kind+'" data-landmark="'+l.id+'" style="left:'+l.x+'px;top:'+l.y+'px" aria-label="'+l.name+'"><span class="landmarkBody" aria-hidden="true"></span><span class="landmarkName">'+l.name+'</span></button>').join('');
  const type=id=>{const tier=layout[id]?.tier||1;return tier===1?'planet':tier===2?'moon':tier>=5?'ringed':'stellar';};
  const parent=(g,index)=>{
    const id=g.id+'-'+index,parentId=layout[id]?.parent;
    return parentId?positions.get(parentId):gateways.get(g.id);
  };
  window.ATLAS_UNIVERSE={positions,gateways,layout,radii,depthZones,semanticRelations,relations,related,background,landmarks,landmarkMarkup,type,parent};
})();
