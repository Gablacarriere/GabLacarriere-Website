(()=>{'use strict';
const root=document.getElementById('curiosity');if(!root)return;
const choices=root.querySelector('.curiosityChoices');
const buttons=[...choices.querySelectorAll('button[data-focus]')];
const studies=[...root.querySelectorAll('[data-study]')];
function select(key,announce){
 if(!studies.some(s=>s.dataset.study===key))return;
 studies.forEach(s=>{s.hidden=s.dataset.study!==key;});
 buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.focus===key)));
 if(announce)root.querySelector('[role="status"]').textContent=buttons.find(b=>b.dataset.focus===key).textContent.replace('↗','')+' selected. Read the study below.';
}
buttons.forEach(b=>b.addEventListener('click',()=>select(b.dataset.focus,true)));
select('connection',false);choices.hidden=false;
})();
