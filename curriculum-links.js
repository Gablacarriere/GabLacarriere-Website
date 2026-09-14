/* Shared navigation relationships. The canonical curriculum owns display names; these mappings only connect practice skills to concepts. */
(function(root){'use strict';
const mappings=[
{skill:'weight-transfer',concept:'connection-2',name:'Weight transfer'},
{skill:'weight-transfer',concept:'steps-0',name:'Weight transfer'},
{skill:'weight-transfer',concept:'steps-1',name:'Weight transfer'},
{skill:'timing',concept:'rhythm-0',name:'Timing & rhythm'},
{skill:'timing',concept:'rhythm-1',name:'Timing & rhythm'},
{skill:'timing',concept:'connection-3',name:'Timing & rhythm'},
{skill:'timing',concept:'rhythm-2',name:'Timing & rhythm'},
{skill:'timing',concept:'connection-5',name:'Timing & rhythm'},
{skill:'frame',concept:'connection-6',name:'Frame & connection'},
{skill:'frame',concept:'connection-0',name:'Frame & connection'},
{skill:'frame',concept:'connection-1',name:'Frame & connection'},
{skill:'frame',concept:'partnering-0',name:'Frame & connection'},
{skill:'frame',concept:'partnering-1',name:'Frame & connection'},
{skill:'rotation',concept:'spirals-2',name:'Rotation'},
{skill:'rotation',concept:'patterns-8',name:'Rotation'},
{skill:'rotation',concept:'patterns-9',name:'Rotation'},
{skill:'dissociation',concept:'pathways-0',name:'Dissociation'},
{skill:'dissociation',concept:'spirals-0',name:'Dissociation'},
{skill:'dissociation',concept:'spirals-1',name:'Dissociation'},
{skill:'balance',concept:'bridge-2',name:'Balance & axis'},
{skill:'balance',concept:'organization-1',name:'Balance & axis'},
{skill:'elasticity',concept:'pathways-3',name:'Elasticity'},
{skill:'elasticity',concept:'patterns-3',name:'Elasticity'},
{skill:'counterbalance',concept:'offaxis-2',name:'Counterbalance'},
{skill:'head-movement-preparation',concept:'offaxis-0',name:'Head-movement preparation'},
{skill:'head-movement-preparation',concept:'offaxis-1',name:'Head-movement preparation'},
{skill:'head-movement-preparation',concept:'offaxis-3',name:'Head-movement preparation'}
];
const build=()=>{
 const curriculum=root.GAB_CURRICULUM;
 return mappings.filter(x=>!curriculum||curriculum.concept(x.concept)).map(x=>({...x,title:curriculum?.displayName(x.concept)||x.concept}));
};
const api={
 get links(){return build();},
 forSkill:slug=>build().filter(x=>x.skill===slug),
 forConcept:id=>build().filter(x=>x.concept===id)
};
root.GAB_CURRICULUM_LINKS=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
