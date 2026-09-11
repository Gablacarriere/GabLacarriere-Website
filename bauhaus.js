(() => {
  'use strict';
  // An optional art cabinet. No accounts, progress, analytics, or browser storage.
  const entries = [
    {label:'Open the small circle',title:'A study in looking.',body:`<p>One color changes when you place it beside another. Look slowly: which circle seems to move toward you?</p><img src="https://upload.wikimedia.org/wikipedia/commons/e/e9/Wassily_Kandinsky_Color_Study._Squares_with_Concentric_Circles.jpg" alt="Kandinsky’s study of twelve colored squares containing concentric circles" width="2400" height="1792"><small>Wassily Kandinsky, <em>Color Study — Squares with Concentric Circles</em>, 1913. This work predates the Bauhaus; Kandinsky later taught there from 1922 to 1933.</small><p><a href="https://commons.wikimedia.org/wiki/File:Wassily_Kandinsky_Color_Study._Squares_with_Concentric_Circles.jpg" target="_blank" rel="noopener noreferrer">Image source &amp; public-domain notice</a> · <a href="https://www.guggenheim.org/exhibition/kandinsky-at-the-bauhaus-1922-1933" target="_blank" rel="noopener noreferrer">Kandinsky at the Bauhaus</a></p>`},
    {label:'Open the small square',title:'Three cities. One school.',body:`<p class="bhDate">1919 / 1925 / 1932</p><p>Weimar. Dessau. Berlin. The Bauhaus changed cities twice during its life from 1919 to 1933.</p><p>A small reminder that an idea can keep its identity while its setting changes.</p><a href="https://bauhaus-dessau.de/en/institution/chronology/" target="_blank" rel="noopener noreferrer">Explore the Bauhaus chronology</a>`},
    {label:'Open the small triangle',title:'Space is a dance partner.',body:`<div class="bhExperiment" aria-hidden="true"><i></i><i></i><i></i></div><p>Oskar Schlemmer’s Bauhaus stage workshop explored the moving body in space. Geometry became something to experience through movement.</p><p>A question for your next dance: how does a change of direction change your relationship to the space around you?</p><a href="https://bauhauskooperation.com/kooperation/project-archive/magazine/dance-the-bauhaus/should-architects-dance" target="_blank" rel="noopener noreferrer">Discover the Bauhaus stage experiments</a>`}
  ];
  const colophon=document.createElement('div');colophon.className='bhColophon';
  const cabinet=document.createElement('dialog');cabinet.className='bhCabinet';cabinet.setAttribute('aria-labelledby','bhCabinetTitle');
  cabinet.innerHTML='<button class="bhClose" type="button">Close ×</button><div id="bhCabinetContent"></div>';
  let opener=null;
  entries.forEach((entry,i)=>{
    const button=document.createElement('button');button.className='bhSecret';button.type='button';button.setAttribute('aria-label',entry.label);button.innerHTML='<span aria-hidden="true"></span>';
    button.addEventListener('click',()=>{opener=button;cabinet.querySelector('#bhCabinetContent').innerHTML='<small>FOUND OBJECT / 0'+(i+1)+'</small><h2 id="bhCabinetTitle">'+entry.title+'</h2>'+entry.body;cabinet.showModal();});
    colophon.append(button);
  });
  cabinet.querySelector('.bhClose').addEventListener('click',()=>cabinet.close());
  cabinet.addEventListener('click',event=>{if(event.target===cabinet){const r=cabinet.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)cabinet.close();}});
  cabinet.addEventListener('close',()=>opener?.focus({preventScroll:true}));
  document.body.append(colophon,cabinet);
})();
