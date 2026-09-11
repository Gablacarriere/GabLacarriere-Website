(() => {
  const W=2600,C=1300;
  let seed=84721;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const directions=[-150,-43,15,72,142,184,224,283];
  const bases=[320,390,480,550,300,640,580,420];
  const positions=new Map(),gateways=new Map(),occupied=[{x:C,y:C}];
  const groups=window.ZOUK_ATLAS;
  groups.forEach((g,gi)=>{
    const angle=directions[gi]*Math.PI/180;
    const gateway={x:C+Math.cos(angle)*(bases[gi]-120),y:C+Math.sin(angle)*(bases[gi]-120)};
    gateways.set(g.id,gateway);
    g.topics.forEach((_,i)=>{
      let p;
      for(let attempt=0;attempt<2000;attempt++){
        const spread=gi===7?.95:.72;
        const a=angle+(random()-.5)*spread;
        const r=bases[gi]+random()*(gi===7?780:660);
        p={x:Math.round(C+Math.cos(a)*r),y:Math.round(C+Math.sin(a)*r)};
        if(p.x<110||p.x>W-110||p.y<110||p.y>W-110){p=null;continue;}
        if(occupied.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>145))break;
        p=null;
      }
      if(!p)throw Error('Unable to place curriculum node');
      positions.set(g.id+'-'+i,p);occupied.push(p);
    });
  });
  // Sparse, non-repeating stars are decorative: no student state is encoded here.
  const stars=Array.from({length:440},()=>({x:Math.round(random()*W),y:Math.round(random()*W),r:(.45+random()*1.5).toFixed(2),o:(.15+random()*.65).toFixed(2)}));
  const background=()=>'<svg class="universeStars" viewBox="0 0 2600 2600" aria-hidden="true">'+stars.map(s=>'<circle cx="'+s.x+'" cy="'+s.y+'" r="'+s.r+'" fill="#dbeaff" opacity="'+s.o+'"/>').join('')+'</svg><div class="nebula nebulaRose" aria-hidden="true"></div><div class="nebula nebulaBlue" aria-hidden="true"></div><div class="nebula nebulaGold" aria-hidden="true"></div>';
  const landmarks=[{id:'horizon',x:1850,y:490,name:'The event horizon',kind:'blackhole',title:'Make room for the unknown.',text:'This black hole is a reflection stop. Which part of your dancing feels difficult to describe? Bring that question to your next lesson. Visiting here does not change your discoveries.',link:'#practice',cta:'Return to my practice'}, {id:'observatory',x:620,y:1220,name:'The observatory',kind:'observatory',title:'See your journey from here.',text:'Step back and revisit the lessons behind your discoveries. A planet, moon, or star can all hold a concept: their size and distance do not rank your ability.',link:'#sessions',cta:'Open lesson history'}];
  landmarks.forEach(l=>{
    const candidates=[];
    for(let x=200;x<=2400;x+=40)for(let y=200;y<=2400;y+=40){
      if(occupied.every(p=>Math.hypot(x-p.x,y-p.y)>230))candidates.push({x,y});
    }
    candidates.sort((a,b)=>Math.hypot(a.x-l.x,a.y-l.y)-Math.hypot(b.x-l.x,b.y-l.y));
    Object.assign(l,candidates[0]);occupied.push(l);
  });
  const landmarkMarkup=()=>landmarks.map(l=>'<button class="cosmicLandmark '+l.kind+'" data-landmark="'+l.id+'" style="left:'+l.x+'px;top:'+l.y+'px" aria-label="'+l.name+'"><span class="landmarkBody" aria-hidden="true"></span><span class="landmarkName">'+l.name+'</span></button>').join('');
  const type=id=>{const i=Number(id.split('-').pop());return i===0?'planet':i%5===1?'moon':i%7===3?'ringed':'stellar';};
  const parent=(g,index)=>{
    if(index===0)return gateways.get(g.id);
    const p=positions.get(g.id+'-'+index);
    return Array.from({length:index},(_,i)=>positions.get(g.id+'-'+i)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
  };
  window.ATLAS_UNIVERSE={positions,gateways,background,landmarks,landmarkMarkup,type,parent};
})();
