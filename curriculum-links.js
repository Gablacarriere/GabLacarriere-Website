/* Shared navigation relationships. The canonical curriculum owns display names; these mappings connect concepts to relevant practice skills. A mapping means related practice exists; it does not imply a dedicated pattern-specific drill. */
(function(root){'use strict';
const mappings=[
// Body organization & weight
{skill:'weight-transfer',concept:'connection-2',name:'Weight transfer'},
{skill:'weight-transfer',concept:'steps-0',name:'Weight transfer'},
{skill:'weight-transfer',concept:'steps-1',name:'Weight transfer'},
{skill:'weight-transfer',concept:'steps-2',name:'Weight transfer'},
{skill:'weight-transfer',concept:'steps-3',name:'Weight transfer'},
{skill:'weight-transfer',concept:'steps-4',name:'Weight transfer'},
{skill:'weight-transfer',concept:'steps-5',name:'Weight transfer'},
{skill:'balance',concept:'steps-5',name:'Balance & axis'},
{skill:'balance',concept:'bridge-2',name:'Balance & axis'},
{skill:'balance',concept:'organization-1',name:'Balance & axis'},

// Frame, connection & partnering
{skill:'frame',concept:'connection-6',name:'Frame & connection'},
{skill:'frame',concept:'connection-0',name:'Frame & connection'},
{skill:'frame',concept:'connection-1',name:'Frame & connection'},
{skill:'frame',concept:'partnering-0',name:'Frame & connection'},
{skill:'frame',concept:'partnering-1',name:'Frame & connection'},
{skill:'frame',concept:'partnering-2',name:'Frame & connection'},
{skill:'frame',concept:'bridge-3',name:'Frame & connection'},
{skill:'frame',concept:'architecture-2',name:'Frame & connection'},
{skill:'frame',concept:'architecture-5',name:'Frame & connection'},

// Rhythm & timing
{skill:'timing',concept:'rhythm-0',name:'Timing & rhythm'},
{skill:'timing',concept:'rhythm-1',name:'Timing & rhythm'},
{skill:'timing',concept:'connection-3',name:'Timing & rhythm'},
{skill:'timing',concept:'rhythm-2',name:'Timing & rhythm'},
{skill:'timing',concept:'connection-4',name:'Timing & rhythm'},
{skill:'timing',concept:'connection-5',name:'Timing & rhythm'},
{skill:'timing',concept:'rhythm-3',name:'Timing & rhythm'},

// Space & orientation
{skill:'space-orientation',concept:'architecture-0',name:'Space & orientation'},
{skill:'space-orientation',concept:'bridge-0',name:'Space & orientation'},
{skill:'space-orientation',concept:'bridge-1',name:'Space & orientation'},
{skill:'space-orientation',concept:'space-0',name:'Space & orientation'},

// Torsion & body pathways
{skill:'dissociation',concept:'pathways-0',name:'Dissociation'},
{skill:'dissociation',concept:'spirals-0',name:'Dissociation'},
{skill:'dissociation',concept:'spirals-1',name:'Dissociation'},
{skill:'rotation',concept:'spirals-2',name:'Rotation'},
{skill:'dissociation',concept:'pathways-1',name:'Dissociation'},
{skill:'dissociation',concept:'spirals-3',name:'Dissociation'},
{skill:'rotation',concept:'spirals-3',name:'Rotation'},
{skill:'dissociation',concept:'spirals-5',name:'Dissociation'},
{skill:'dissociation',concept:'pathways-2',name:'Dissociation'},
{skill:'elasticity',concept:'pathways-3',name:'Elasticity'},
{skill:'dissociation',concept:'spirals-4',name:'Dissociation'},
{skill:'rotation',concept:'spirals-4',name:'Rotation'},

// Movement grammar: related foundation practice, not a claim of dedicated pattern coverage
{skill:'movement-grammar',concept:'grammar-1',name:'Movement grammar'},
{skill:'movement-grammar',concept:'grammar-2',name:'Movement grammar'},
{skill:'movement-grammar',concept:'bridge-4',name:'Movement grammar'},
{skill:'movement-grammar',concept:'bridge-5',name:'Movement grammar'},
{skill:'movement-grammar',concept:'architecture-1',name:'Movement grammar'},
{skill:'movement-grammar',concept:'architecture-3',name:'Movement grammar'},
{skill:'movement-grammar',concept:'architecture-4',name:'Movement grammar'},
{skill:'movement-grammar',concept:'architecture-6',name:'Movement grammar'},
{skill:'movement-grammar',concept:'architecture-7',name:'Movement grammar'},
{skill:'movement-grammar',concept:'patterns-15',name:'Movement grammar'},
{skill:'movement-grammar',concept:'patterns-16',name:'Movement grammar'},
{skill:'movement-grammar',concept:'patterns-17',name:'Movement grammar'},
{skill:'weight-transfer',concept:'grammar-0',name:'Weight transfer'},
{skill:'timing',concept:'grammar-0',name:'Timing & rhythm'},
{skill:'dissociation',concept:'grammar-0',name:'Dissociation'},
{skill:'weight-transfer',concept:'patterns-0',name:'Weight transfer'},
{skill:'timing',concept:'patterns-0',name:'Timing & rhythm'},
{skill:'weight-transfer',concept:'patterns-1',name:'Weight transfer'},
{skill:'rotation',concept:'patterns-2',name:'Rotation'},
{skill:'elasticity',concept:'patterns-3',name:'Elasticity'},
{skill:'rotation',concept:'patterns-4',name:'Rotation'},
{skill:'weight-transfer',concept:'patterns-5',name:'Weight transfer'},
{skill:'dissociation',concept:'patterns-5',name:'Dissociation'},
{skill:'weight-transfer',concept:'patterns-6',name:'Weight transfer'},
{skill:'timing',concept:'patterns-6',name:'Timing & rhythm'},
{skill:'weight-transfer',concept:'patterns-7',name:'Weight transfer'},
{skill:'timing',concept:'patterns-7',name:'Timing & rhythm'},
{skill:'dissociation',concept:'patterns-7',name:'Dissociation'},
{skill:'rotation',concept:'patterns-8',name:'Rotation'},
{skill:'rotation',concept:'patterns-9',name:'Rotation'},
{skill:'rotation',concept:'patterns-10',name:'Rotation'},
{skill:'head-preparation',concept:'patterns-11',name:'Head-movement preparation'},
{skill:'head-preparation',concept:'patterns-12',name:'Head-movement preparation'},
{skill:'rotation',concept:'patterns-13',name:'Rotation'},
{skill:'dissociation',concept:'patterns-13',name:'Dissociation'},
{skill:'elasticity',concept:'patterns-14',name:'Elasticity'},
{skill:'rotation',concept:'patterns-14',name:'Rotation'},
{skill:'dissociation',concept:'patterns-14',name:'Dissociation'},
{skill:'frame',concept:'patterns-17',name:'Frame & connection'},
{skill:'weight-transfer',concept:'patterns-17',name:'Weight transfer'},
{skill:'weight-transfer',concept:'patterns-18',name:'Weight transfer'},

// Head movement & off-axis
{skill:'counterbalance',concept:'offaxis-2',name:'Counterbalance'},
{skill:'head-preparation',concept:'offaxis-0',name:'Head-movement preparation'},
{skill:'head-preparation',concept:'offaxis-1',name:'Head-movement preparation'},
{skill:'head-preparation',concept:'offaxis-3',name:'Head-movement preparation'},
{skill:'head-preparation',concept:'patterns-19',name:'Head-movement preparation'}
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
