(() => {
  'use strict';
  // An optional art cabinet. No accounts, progress, analytics, or browser storage.
  const entries = [
    {label:'Open the small circle',title:'A study in looking.',body:`<p>One color changes when you place it beside another. Look slowly: which circle seems to move toward you?</p><img src="https://upload.wikimedia.org/wikipedia/commons/e/e9/Wassily_Kandinsky_Color_Study._Squares_with_Concentric_Circles.jpg" alt="Kandinsky’s study of twelve colored squares containing concentric circles" width="2400" height="1792"><small>Wassily Kandinsky, <em>Color Study — Squares with Concentric Circles</em>, 1913. This work predates the Bauhaus; Kandinsky later taught there from 1922 to 1933.</small><p><a href="https://commons.wikimedia.org/wiki/File:Wassily_Kandinsky_Color_Study._Squares_with_Concentric_Circles.jpg" target="_blank" rel="noopener noreferrer">Image source &amp; public-domain notice</a> · <a href="https://www.guggenheim.org/exhibition/kandinsky-at-the-bauhaus-1922-1933" target="_blank" rel="noopener noreferrer">Kandinsky at the Bauhaus</a></p>`},
    {label:'Open the small square',title:'Three cities. One school.',body:`<p class="bhDate">1919 / 1925 / 1932</p><p>Weimar. Dessau. Berlin. The Bauhaus changed cities twice during its life from 1919 to 1933.</p><p>A small reminder that an idea can keep its identity while its setting changes.</p><a href="https://bauhaus-dessau.de/en/institution/chronology/" target="_blank" rel="noopener noreferrer">Explore the Bauhaus chronology</a>`},
    {label:'Open the small triangle',title:'Space is a dance partner.',body:`<div class="bhExperiment" aria-hidden="true"><i></i><i></i><i></i></div><p>Oskar Schlemmer’s Bauhaus stage workshop explored the moving body in space. Geometry became something to experience through movement.</p><p>A question for your next dance: how does a change of direction change your relationship to the space around you?</p><a href="https://bauhauskooperation.com/kooperation/project-archive/magazine/dance-the-bauhaus/should-architects-dance" target="_blank" rel="noopener noreferrer">Discover the Bauhaus stage experiments</a>`}
  ];
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  entries.forEach((e,i)=>e.id=['kandinsky','bauhaus','schlemmer'][i]);
  (window.GAB_ART_DISCOVERIES||[]).forEach(e=>entries.push({id:e.id,title:e.title,body:'<p class="artArtist">'+esc(e.artist)+'</p><p>'+esc(e.text)+'</p>'+(e.image?'<img src="'+esc(e.image)+'" alt="'+esc(e.imageAlt)+'" width="500" height="511"><small>'+esc(e.credit)+'</small><p><a href="'+esc(e.rights)+'" target="_blank" rel="noopener noreferrer">Image source &amp; reuse notice</a></p>':'')+'<p><a href="'+esc(e.url)+'" target="_blank" rel="noopener noreferrer">Explore the artwork &amp; its story ↗</a></p>'}));
  const routes={
    '':['matisse','vangogh','kandinsky'],
    'about':['courbet','manet','basquiat'],
    'classes':['haring','matisse','fauvism'],
    'privates':['klimt','annunciation','picasso'],
    'mentorship':['raphael','monet','schlemmer'],
    'method':['picasso','annunciation','magritte'],
    'zouk-bnb':['pissarro','klimt','haring'],
    'workshops':['schlemmer','fauvism','haring'],
    'work-with-gab':['basquiat','lichtenstein','courbet'],
    'wedding':['klimt','botticelli','matisse'],
    'creative':['basquiat','lichtenstein','magritte'],
    'experience':['pissarro','manet','bauhaus'],
    'learn':['botticelli','raphael','monet'],
    'movement-architecture':['picasso','raphael','bauhaus'],
    'kinesthetic-practice':['munch','schlemmer','annunciation'],
    'how-to-practice-zouk':['monet','courbet','vangogh'],
    'brazilian-zouk-classes-nyc':['matisse','haring','klimt'],
    'lambada-classes-nyc':['fauvism','lichtenstein','matisse'],
    'zouk-nyc-guide':['pissarro','basquiat','haring'],
    'mentorship-hub':['raphael','courbet','kandinsky'],
    'practice-planner':['monet','munch','schlemmer'],
    'zouk-map':['vangogh','magritte','kandinsky']
  };
  const route=location.pathname.replace(/^\/|\/$/g,'').replace(/\.html$/,'').replace(/^index$/,'');
  const picks=routes[route]||['kandinsky','bauhaus','schlemmer'];
  const colophon=document.createElement('div');colophon.className='bhColophon';
  const cabinet=document.createElement('dialog');cabinet.className='bhCabinet';cabinet.setAttribute('aria-labelledby','bhCabinetTitle');
  cabinet.innerHTML='<button class="bhClose" type="button">Close ×</button><div id="bhCabinetContent"></div>';
  let opener=null;
  const anchors=[...document.querySelectorAll('main h2,main figcaption,main .kicker')].filter(e=>!e.closest('a,button,form,details,[hidden],.hidden'));
  const seed=[...route].reduce((sum,c)=>sum+c.charCodeAt(0),0);
  picks.forEach((id,i)=>{
    const entry=entries.find(e=>e.id===id);if(!entry)return;
    const button=document.createElement('button');button.className='bhSecret artSecret artMark'+((seed+i)%6);button.type='button';button.dataset.art=id;button.setAttribute('aria-label','Explore a hidden art detail');
    button.innerHTML='<span aria-hidden="true">'+['◌','∴','◇','∿','·','⌁'][(seed+i)%6]+'</span>';
    button.addEventListener('click',()=>{opener=button;cabinet.querySelector('#bhCabinetContent').innerHTML='<small>A SMALL DISCOVERY</small><h2 id="bhCabinetTitle">'+esc(entry.title)+'</h2>'+entry.body;cabinet.showModal();});
    if(i<2 && document.body.classList.contains('publicSite') && anchors.length){
      const index=(seed+i*Math.max(1,Math.floor(anchors.length/2)))%anchors.length;
      const anchor=anchors.splice(index,1)[0];
      const dock=document.createElement('div');dock.className='artDock '+((seed+i)%2?'artDockLeft':'artDockRight');dock.append(button);anchor.insertAdjacentElement('afterend',dock);
    }else if(i===0 && document.querySelector('.rail')){
      const dock=document.createElement('div');dock.className='artDock artDockLeft';dock.append(button);document.querySelector('.rail').append(dock);
    }else if(i===0 && document.querySelector('.portalShell,.toolBox')){
      const dock=document.createElement('div');dock.className='artDock artDockRight';dock.append(button);document.querySelector('.portalShell,.toolBox').insertAdjacentElement('afterend',dock);
    }else colophon.append(button);
  });
  cabinet.querySelector('.bhClose').addEventListener('click',()=>cabinet.close());
  cabinet.addEventListener('click',event=>{if(event.target===cabinet){const r=cabinet.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)cabinet.close();}});
  cabinet.addEventListener('close',()=>opener?.focus({preventScroll:true}));
  document.body.append(colophon,cabinet);
})();
