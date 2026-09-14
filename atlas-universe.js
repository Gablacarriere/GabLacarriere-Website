(() => {
  'use strict';
  const W=2600,C=1300,curr=window.ATLAS_CURRICULUM_V2;
  if(!curr)throw Error('Atlas curriculum v2 must load before universe');
  let seed=84721;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const radii={1:360,2:580,3:800,4:1010,5:1170};
  const depthZones=[
    {tier:1,name:'CORE',angle:120},
    {tier:2,name:'FOUNDATIONS',angle:120},
    {tier:3,name:'INTEGRATION',angle:120},
    {tier:4,name:'APPLICATION',angle:350},
    {tier:5,name:'EXPLORATION',angle:20}
  ];
  const point=(angle,radius)=>({x:Math.round(C+Math.cos(angle*Math.PI/180)*radius),y:Math.round(C+Math.sin(angle*Math.PI/180)*radius)});
  const positions=new Map(),gateways=new Map(),occupied=[{x:C,y:C}];
  const capacities={1:3,2:5,3:6,4:9,5:9},steps={1:25,2:16,3:12,4:9,5:8};

  curr.families.forEach(f=>gateways.set(f.id,point(f.angle,215)));
  for(const family of curr.families){
    for(let tier=1;tier<=5;tier++){
      const bucket=curr.nodesByFamily(family.id).filter(n=>curr.meta[n.id].tier===tier);
      if(!bucket.length)continue;
      const capacity=capacities[tier],rows=[];
      for(let i=0;i<bucket.length;i+=capacity)rows.push(bucket.slice(i,i+capacity));
      rows.forEach((row,rowIndex)=>{
        const radialBase=radii[tier]+(rowIndex-(rows.length-1)/2)*74;
        const start=-(row.length-1)*steps[tier]/2;
        row.forEach((n,index)=>{
          const baseAngle=family.angle+start+index*steps[tier];
          let placed=null;
          const radialOffsets=[0,34,-34,62,-62,92,-92];
          const angleOffsets=[0,2.5,-2.5,5,-5,7.5,-7.5,10,-10];
          for(const ro of radialOffsets){
            for(const ao of angleOffsets){
              const p=point(baseAngle+ao,radialBase+ro);
              if(p.x<110||p.x>W-110||p.y<110||p.y>W-110)continue;
              if(occupied.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>145)){placed=p;break;}
            }
            if(placed)break;
          }
          if(!placed)throw Error('Unable to place curriculum node '+n.id);
          positions.set(n.id,placed);occupied.push(placed);
        });
      });
    }
  }
  if(positions.size!==curr.total)throw Error('Atlas geometry missing curriculum nodes');

  const stars=Array.from({length:440},()=>({x:Math.round(random()*W),y:Math.round(random()*W),r:(.45+random()*1.5).toFixed(2),o:(.15+random()*.65).toFixed(2)}));
  const depthMarkup=()=>'<svg class="curriculumDepthRings" viewBox="0 0 2600 2600" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.72">'+depthZones.map((z,i)=>{
    const r=radii[z.tier],label=point(z.angle,r),w=Math.max(62,z.name.length*8+24);
    return '<circle cx="'+C+'" cy="'+C+'" r="'+r+'" fill="none" stroke="#b9cbe1" stroke-opacity="'+(.105+i*.012).toFixed(3)+'" stroke-width="1.4" stroke-dasharray="6 16" vector-effect="non-scaling-stroke"/><g transform="translate('+label.x+' '+label.y+')"><rect x="'+(-w/2)+'" y="-13" width="'+w+'" height="26" rx="13" fill="#080e1c" fill-opacity=".9" stroke="#b9cbe1" stroke-opacity=".15" vector-effect="non-scaling-stroke"/><text x="0" y="4" text-anchor="middle" fill="#c5d2e2" fill-opacity=".58" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="700" letter-spacing="1.5">'+z.name+'</text></g>';
  }).join('')+'</svg>';
  const background=()=>depthMarkup()+'<svg class="universeStars" viewBox="0 0 2600 2600" aria-hidden="true">'+stars.map(s=>'<circle cx="'+s.x+'" cy="'+s.y+'" r="'+s.r+'" fill="#dbeaff" opacity="'+s.o+'"/>').join('')+'</svg><div class="nebula nebulaRose" aria-hidden="true"></div><div class="nebula nebulaBlue" aria-hidden="true"></div><div class="nebula nebulaGold" aria-hidden="true"></div>';

  const landmarks=[
    {id:'horizon',x:1850,y:490,name:'The event horizon',kind:'blackhole',title:'Make room for the unknown.',text:'This black hole is a reflection stop. Which part of your dancing feels difficult to describe? Bring that question to your next lesson. Visiting here does not change your discoveries.',link:'#practice',cta:'Return to my practice'},
    {id:'observatory',x:620,y:1220,name:'The observatory',kind:'observatory',title:'See your journey from here.',text:'Distance from the ship describes curriculum depth: Core, Foundations, Integration, Application, then Exploration. Position around the map groups concepts by function: body organization, partnering, rhythm, space, movement grammar, off-axis work, body pathways, and learning. Lines show conceptual support, not mastery ranks or hard prerequisites.',link:'#sessions',cta:'Open lesson history'}
  ];
  landmarks.forEach(l=>{
    const candidates=[];
    for(let x=200;x<=2400;x+=40)for(let y=200;y<=2400;y+=40)if(occupied.every(p=>Math.hypot(x-p.x,y-p.y)>230))candidates.push({x,y});
    candidates.sort((a,b)=>Math.hypot(a.x-l.x,a.y-l.y)-Math.hypot(b.x-l.x,b.y-l.y));
    Object.assign(l,candidates[0]);occupied.push(l);
  });
  const landmarkMarkup=()=>landmarks.map(l=>'<button class="cosmicLandmark '+l.kind+'" data-landmark="'+l.id+'" style="left:'+l.x+'px;top:'+l.y+'px" aria-label="'+l.name+'"><span class="landmarkBody" aria-hidden="true"></span><span class="landmarkName">'+l.name+'</span></button>').join('');
  const type=id=>{const tier=curr.meta[id]?.tier||1;return tier===1?'planet':tier===2?'moon':tier>=5?'ringed':'stellar';};
  const parent=id=>{const support=curr.meta[id]?.supports?.[0];return support&&positions.get(support)?positions.get(support):gateways.get(curr.meta[id]?.family);};
  const related=id=>curr.related(id);
  window.ATLAS_UNIVERSE={positions,gateways,layout:curr.meta,radii,depthZones,relations:curr.relations,related,background,landmarks,landmarkMarkup,type,parent};
})();