/* Shared navigation relationships, not prerequisites or mastery equivalences. */
(function(root){'use strict';
const links=[
{skill:'weight-transfer',name:'Weight transfer',concept:'connection-2',title:'Weight Commitment'},
{skill:'weight-transfer',name:'Weight transfer',concept:'steps-0',title:'Function of the Steps'},
{skill:'timing',name:'Timing & rhythm',concept:'connection-3',title:'Timing (Traditional 1 & Traditional 2)'},
{skill:'timing',name:'Timing & rhythm',concept:'connection-5',title:'Timing & Connection'},
{skill:'frame',name:'Frame & connection',concept:'connection-0',title:'Connection Principles'},
{skill:'frame',name:'Frame & connection',concept:'connection-1',title:'Permeability'},
{skill:'rotation',name:'Rotation',concept:'spirals-2',title:'External Rotation (Arms–Spine Connection)'},
{skill:'rotation',name:'Rotation',concept:'patterns-8',title:'Simple Turn'},
{skill:'dissociation',name:'Dissociation',concept:'spirals-0',title:'Pelvic Twist'},
{skill:'dissociation',name:'Dissociation',concept:'spirals-1',title:'Chest Spiral'},
{skill:'balance',name:'Balance & axis',concept:'bridge-2',title:'Axis Enables Directional Freedom'},
{skill:'balance',name:'Balance & axis',concept:'organization-1',title:'Posture, Availability & Tone'},
{skill:'elasticity',name:'Elasticity',concept:'patterns-3',title:'Elástico'}
];
const api={links,forSkill:slug=>links.filter(x=>x.skill===slug),forConcept:id=>links.filter(x=>x.concept===id)};root.GAB_CURRICULUM_LINKS=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
