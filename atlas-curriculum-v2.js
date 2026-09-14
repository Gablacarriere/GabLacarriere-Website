(() => {
  'use strict';
  const atlas=window.ZOUK_ATLAS,details=window.ZOUK_DETAILS;
  if(!atlas||!details)return;

  const addGroup=(id,name,color,intro,topics,guides)=>{
    let group=atlas.find(g=>g.id===id);
    if(!group){group={id,region:'Curriculum v2',name,color,intro,topics:[],principle:null};atlas.push(group);}
    topics.forEach((topic,i)=>{
      if(!group.topics.includes(topic))group.topics.push(topic);
      const index=group.topics.indexOf(topic),key=id+'-'+index;
      if(guides[i]&&!details[key])details[key]=guides[i];
    });
  };

  addGroup('rhythm','Rhythm & Timing','#87b8ee','Build a stable internal pulse before choosing timing, phrasing, or style-specific rhythmic structures.',[
    'Pulse, Counting & Continuity',
    'Timing Families & Intentional Choice',
    'Phrasing, Energy & Musical Structure',
    'Lambada Question–Answer Timing'
  ],[
    {understand:'A stable internal pulse lets your movement keep time even when a pattern, pause, or transition feels finished. Counting is used as a training tool so rhythm continues through the whole phrase rather than restarting after each figure.',notice:'Can you keep the pulse and count through transitions, pauses, and the apparent end of a pattern?'},
    {understand:'Timing is a deliberate movement choice rather than an automatic speed. This curriculum compares Traditional, R&B, Contemporary, and other taught timing families so you can preserve the pulse while changing where actions sit inside it.',notice:'Can you change timing intentionally without speeding up, slowing down, or losing the shared pulse?'},
    {understand:'Musical structure includes phrases, changes of energy, introductions, pauses, and recovery moments. The goal is to keep transferring weight and organizing movement musically rather than treating only named patterns as dancing.',notice:'When the music changes energy or density, can your movement change with it without abandoning timing or weight transfer?'},
    {understand:'Lambada often organizes proposals and responses across rhythmic blocks. A proposal is completed before the response enters the next available block, creating a question–answer relationship that differs from more simultaneous Zouk timing.',notice:'Can you finish the current rhythmic structure before answering the proposal, rather than responding too early?'}
  ]);

  addGroup('partnering','Partnering Logic','#8ad8d0','Organize contact, embrace, and responsiveness so information can travel without gripping or anticipation.',[
    'Active Contact Point',
    'Embrace Continuum',
    'Follower Responsiveness & Proposal'
  ],[
    {understand:'Partner connection does not need every possible contact point at once. The useful contact can migrate between hands, upper back, shoulder blade, hips, or another taught surface while the rest of the body remains available.',notice:'Which contact point is actually carrying useful information right now, and are you adding pressure somewhere else unnecessarily?'},
    {understand:'Closed, half-open, open, and low-contact positions form a continuum rather than separate worlds. Transitions should preserve orientation, comfort, and usable information instead of jumping abruptly from one embrace to another.',notice:'Can you open or close the embrace while keeping the partner relationship clear and comfortable throughout the transition?'},
    {understand:'Leading is a proposal and following is an active interpretation. Pattern recognition can help orientation, but the follower still waits for present information rather than completing a memorized answer automatically.',notice:'Are you responding to what is happening now, or finishing the movement you expected to happen?'}
  ]);

  addGroup('pathways','Torsion & Body Pathways','#e6a2b5','Use dissociation, elasticity, and segmental pathways as reusable mechanisms rather than decorative styling.',[
    'Torsion / Dissociation',
    'Isolation vs Undulation',
    'Contraction–Extension & Body Pathways',
    'Elasticity & Rebound'
  ],[
    {understand:'Torsion is the organized relationship between differently oriented body segments, especially chest and pelvis or stepping leg. It stores and redirects rotational information across basic steps, turns, Bônus, tilts, and transitions.',notice:'Can you maintain the chest–pelvis relationship through the movement instead of releasing the spiral between actions?'},
    {understand:'Isolation changes one region while neighboring regions stay comparatively quiet; undulation lets movement travel through several segments. Distinguishing the two gives you control over whether movement stays local or becomes a wave.',notice:'Can you tell whether the movement is staying in one region or travelling through the body, and choose intentionally between them?'},
    {understand:'Contraction and extension organize pathways through the chest, diaphragm, spine, and hips. They can initiate waves, Boneca-family actions, and head-movement entries without requiring the neck or arms to force the result.',notice:'Where does the pathway begin, and can the next segment receive it without an abrupt muscular push?'},
    {understand:'Elasticity describes movement that travels beyond a neutral midpoint and returns or redirects while preserving organization. It depends on weight transfer, available joints, and timing rather than a sudden muscular snap.',notice:'Can the movement rebound or redirect without losing support, timing, or the partner connection?'}
  ]);

  addGroup('grammar','Movement Grammar','#a6bded','Understand how foundational movements combine, transform, and return to recognizable structures.',[
    'Sortinho / Basic-Step Relationship',
    'Compound Pattern Logic',
    'Open–Close Transition Logic'
  ],[
    {understand:'The notes repeatedly treat the free/default stepping structure and the constrained basic step as related movement architectures. The goal is to understand what the partner position or block changes instead of memorizing unrelated sequences.',notice:'What changed in the available space or partner orientation that turned the default stepping structure into this version?'},
    {understand:'Patterns can be understood as combinations of smaller movement units. Turns, Elástico, laterals, redirections, and other components can combine into larger structures while each component keeps its own functional logic.',notice:'Can you name the smaller movement units inside the pattern and identify where one unit becomes the next?'},
    {understand:'Many partner patterns repeatedly move through closed, opening, and returning relationships. Treating open–close as a reusable transition rule helps you understand lateral, side-basic, Sortinho-family, and embrace changes without memorizing every route separately.',notice:'Can you identify when the partnership is opening, what keeps information available, and what organizes the return?'}
  ]);

  addGroup('space','Spatial Logic','#f3c68e','Use orientation, position, blocks, and available space to explain why a partner moves where they do.',[
    'Blocking & Space Creation'
  ],[
    {understand:'A block removes or redirects one available pathway while created space invites another. The leader organizes position and available routes rather than forcing the follower through a memorized trajectory.',notice:'Which pathway became unavailable, which space became available, and did the follower have enough information to choose the new route?'}
  ]);

  addGroup('offaxis','Head Movement & Off-Axis','#d9a3d7','Build head movement, counterbalance, and tilted structures only on reliable support, torsion, and partner information.',[
    'Head-Movement Principles',
    'Active & Passive Head Initiation',
    'Counterbalance & Shared Axis',
    'Tilt Preparation & Lateral Flexion'
  ],[
    {understand:'Head movement is a whole-body pathway with a complete trajectory, not an isolated neck action. Breath, shoulder organization, torso pathway, rotation, and the return arc all affect comfort, timing, and continuity.',notice:'Can you complete the full pathway—including the return—without shortening it, bracing the neck, or arriving early?'},
    {understand:'Head movement can be initiated more actively by the dancer or emerge more passively from partner and torso information. Distinguishing the two clarifies responsibility, reduces forcing, and helps the leader follow the follower’s actual pathway.',notice:'Who is initiating this pathway, and can both partners adapt to what the body actually does instead of forcing a predetermined arc?'},
    {understand:'Counterbalance uses coordinated whole-body weight and a shared relationship to support, not hanging from the arms. Each dancer maintains their own organization while the partnership creates a usable shared axis or opposition.',notice:'If the hand connection disappeared, would your body still be organized, and is the shared weight relationship clear rather than collapsing?'},
    {understand:'A tilted turn is prepared through completed weight transfer, torsion, and lateral flexion before larger off-axis expression is added. Treating those ingredients separately makes the final action safer and easier to diagnose.',notice:'Did weight transfer finish before torsion and lateral flexion were added, or are several prerequisites being improvised at once?'}
  ]);

  addGroup('practice','Learning & Practice','#b9d994','Use retrieval, spacing, focus, and progressive layering to turn class performance into durable learning.',[
    'Retrieval & Delayed Recall',
    'One Focus at a Time',
    'Distributed & Variable Practice',
    'Layering & Automaticity'
  ],[
    {understand:'Immediate reproduction in class is not the same as durable learning. Recalling a concept or movement later—before rewatching the answer—tests whether the information can actually be retrieved and reconstructed.',notice:'Before checking a video or note, what can you reconstruct from memory, and what disappears after a delay?'},
    {understand:'A practice session becomes easier to evaluate when one technical or relational goal is foregrounded. Other skills still operate, but one chosen question guides attention, feedback, and the decision about what to change next.',notice:'What single thing are you trying to improve in this repetition, and can you describe whether it changed?'},
    {understand:'Short repeated sessions and changes of context create more useful retrieval opportunities than rare marathon practice. Variation should be large enough to test adaptability without changing so many variables that feedback becomes ambiguous.',notice:'Can you revisit the same idea across days, sides, speeds, or contexts while still knowing what variable you are testing?'},
    {understand:'Additional layers such as styling, head movement, or musical variation become more reliable when the underlying step or pattern can run with less conscious attention. Difficulty at the base should be solved before stacking another demand on top.',notice:'Can the foundational action continue reliably while attention moves to the new layer, or does the base collapse as soon as complexity increases?'}
  ]);

  const families=[
    {id:'body',name:'Body Organization & Weight',color:'#e7c78e',angle:270,intro:'Breath, posture, support, weight transfer, grounding, joints, and axis.'},
    {id:'partnering',name:'Frame & Connection',color:'#8ad8d0',angle:315,intro:'Contact organization, permeability, embrace, responsiveness, and shared information.'},
    {id:'rhythm',name:'Rhythm & Timing',color:'#87b8ee',angle:355,intro:'Pulse, timing families, phrasing, continuity, and Lambada question–answer structure.'},
    {id:'space',name:'Space & Orientation',color:'#f3c68e',angle:40,intro:'Chest direction, relative position, available pathways, blocks, and redirection.'},
    {id:'grammar',name:'Movement Grammar',color:'#a6bded',angle:85,intro:'Basic structures, turns, named patterns, components, transformations, and pattern logic.'},
    {id:'offaxis',name:'Head Movement & Off-Axis',color:'#d9a3d7',angle:135,intro:'Head pathways, counterbalance, tilted structures, and shared-axis applications.'},
    {id:'pathways',name:'Torsion & Body Pathways',color:'#e6a2b5',angle:180,intro:'Dissociation, spirals, waves, elasticity, contraction, extension, and flow.'},
    {id:'learning',name:'Learning & Practice',color:'#b9d994',angle:225,intro:'Metacognition, retrieval, spacing, focus, variability, and progressive layering.'}
  ];
  const familyById=Object.fromEntries(families.map(f=>[f.id,f]));
  const meta={};
  const assign=(ids,family,tier,kind='concept')=>ids.forEach((id,order)=>meta[id]={...(meta[id]||{}),family,tier,kind,order});

  assign(['organization-0','organization-1','connection-2','steps-0'],'body',1);
  assign(['organization-2','steps-1','steps-2','steps-3','steps-4','steps-5','bridge-2'],'body',2);

  assign(['connection-6'],'partnering',1);
  assign(['connection-0','connection-1','partnering-0','partnering-1'],'partnering',2);
  assign(['partnering-2','bridge-3'],'partnering',3);
  assign(['architecture-2','architecture-5'],'partnering',4,'lens');

  assign(['rhythm-0'],'rhythm',1);
  assign(['connection-3','rhythm-1'],'rhythm',2);
  assign(['rhythm-2','connection-4','connection-5'],'rhythm',3);
  assign(['rhythm-3'],'rhythm',4);

  assign(['architecture-0'],'space',2);
  assign(['bridge-0','bridge-1','space-0'],'space',3);

  assign(['pathways-0','spirals-0','spirals-1','spirals-2','pathways-1'],'pathways',2);
  assign(['spirals-3','spirals-5','pathways-2','pathways-3'],'pathways',3);
  assign(['spirals-4'],'pathways',4);

  assign(['grammar-0','patterns-0','patterns-1'],'grammar',2,'pattern');
  assign(['grammar-1','grammar-2','patterns-5','patterns-6','patterns-8'],'grammar',3,'pattern');
  assign(['patterns-2','patterns-3','patterns-4','patterns-7','patterns-9','patterns-11','patterns-13','patterns-14','patterns-15','patterns-16','patterns-17','patterns-18','bridge-4','bridge-5','architecture-1','architecture-3','architecture-4','architecture-6'],'grammar',4,'pattern');
  assign(['patterns-10','patterns-12','architecture-7'],'grammar',5,'pattern');

  assign(['offaxis-0'],'offaxis',3);
  assign(['offaxis-1','offaxis-2','patterns-19'],'offaxis',4);
  assign(['offaxis-3'],'offaxis',5);

  assign(['awareness-0','practice-0','practice-1'],'learning',1,'learning');
  assign(['practice-2','practice-3'],'learning',2,'learning');

  const overrides={
    'connection-2':{name:'Full Weight Transfer & Commitment',supports:['organization-1']},
    'steps-0':{name:'Step Function & Weight Change',supports:['connection-2']},
    'steps-1':{name:'Footwork Mechanics & Grounding',supports:['steps-0','connection-2']},
    'steps-2':{supports:['steps-1']},'steps-3':{supports:['steps-1']},'steps-4':{supports:['steps-1']},'steps-5':{supports:['steps-2','steps-3','steps-4']},
    'organization-2':{supports:['organization-0','organization-1']},
    'bridge-2':{name:'Axis & Directional Freedom',supports:['organization-1','connection-2']},

    'connection-6':{supports:['organization-1']},
    'connection-0':{supports:['connection-6','connection-2']},
    'connection-1':{supports:['connection-0']},
    'partnering-0':{supports:['connection-6','connection-0']},
    'partnering-1':{supports:['connection-6','architecture-0']},
    'partnering-2':{supports:['connection-0','partnering-0']},
    'bridge-3':{name:'Tone Modulation & Connection',supports:['connection-6','connection-1']},
    'architecture-2':{supports:['partnering-2','architecture-0']},
    'architecture-5':{supports:['connection-0','grammar-1']},

    'rhythm-0':{supports:[]},
    'connection-3':{name:'Traditional Timing References',supports:['rhythm-0']},
    'rhythm-1':{supports:['rhythm-0']},
    'rhythm-2':{supports:['rhythm-0','rhythm-1']},
    'connection-4':{supports:['rhythm-1','organization-1']},
    'connection-5':{supports:['rhythm-1','connection-0']},
    'rhythm-3':{track:'lambada',supports:['rhythm-1','partnering-2']},

    'architecture-0':{name:'Chest Direction & Relative Position',supports:['organization-1','connection-6']},
    'bridge-0':{name:'Availability → Orientation',supports:['architecture-0','organization-1']},
    'bridge-1':{name:'Availability → Positioning',supports:['architecture-0','connection-2']},
    'space-0':{supports:['architecture-0','connection-6']},

    'pathways-0':{supports:['bridge-2','connection-2']},
    'spirals-0':{supports:['pathways-0']},'spirals-1':{supports:['pathways-0']},'spirals-2':{supports:['organization-1','pathways-0']},
    'pathways-1':{supports:['organization-1']},
    'spirals-3':{supports:['pathways-0','spirals-1']},'spirals-4':{supports:['spirals-3','bridge-2']},'spirals-5':{supports:['pathways-0','pathways-1']},
    'pathways-2':{supports:['pathways-1','organization-0']},'pathways-3':{supports:['connection-2','pathways-0']},

    'grammar-0':{aliases:['Saltinho','Soltinho','Sortinho','Sortino','Sortillo'],supports:['connection-2','rhythm-1','pathways-0','architecture-0']},
    'patterns-0':{supports:['grammar-0','rhythm-1']},'patterns-1':{supports:['grammar-0','connection-2']},
    'grammar-1':{supports:['grammar-0']},'grammar-2':{supports:['grammar-0','partnering-1']},
    'patterns-5':{supports:['grammar-0','pathways-0']},'patterns-6':{supports:['grammar-0','grammar-2']},'patterns-8':{supports:['pathways-0','connection-2']},
    'patterns-2':{supports:['patterns-8','bridge-2']},'patterns-3':{supports:['pathways-3','connection-0']},'patterns-4':{supports:['architecture-0','patterns-8']},
    'patterns-7':{name:'Sortinho / Saltinho Family',aliases:['Soltinho','Saltinho','Sortinho','Sortino','Sortillo'],supports:['grammar-0','architecture-0']},
    'patterns-9':{supports:['patterns-8']},'patterns-10':{supports:['patterns-9']},
    'patterns-11':{supports:['pathways-2','patterns-8']},'patterns-12':{supports:['patterns-11']},'patterns-13':{supports:['pathways-0']},
    'patterns-14':{name:'Bônus',aliases:['Bonus','Bonas'],relatedTerms:['Patinha','Patina'],supports:['patterns-8','patterns-3']},
    'patterns-15':{supports:['grammar-0','pathways-0']},'patterns-16':{supports:['grammar-0']},'patterns-17':{supports:['grammar-2','connection-2']},'patterns-18':{supports:['connection-2','steps-1']},
    'bridge-4':{supports:['grammar-1']},'bridge-5':{supports:['grammar-1']},
    'architecture-1':{supports:['architecture-0','grammar-0']},'architecture-3':{supports:['grammar-1']},'architecture-4':{supports:['grammar-1']},'architecture-6':{supports:['bridge-4']},'architecture-7':{supports:['architecture-3','architecture-4']},

    'offaxis-0':{supports:['organization-0','pathways-0','bridge-2']},
    'offaxis-1':{supports:['offaxis-0','partnering-2']},
    'offaxis-2':{supports:['connection-2','bridge-2','connection-0']},
    'patterns-19':{supports:['offaxis-0','pathways-0']},
    'offaxis-3':{supports:['offaxis-2','pathways-0','connection-2']},

    'awareness-0':{supports:[]},'practice-0':{supports:['awareness-0']},'practice-1':{supports:['awareness-0']},'practice-2':{supports:['practice-0','practice-1']},'practice-3':{supports:['practice-1']}
  };
  Object.entries(overrides).forEach(([id,patch])=>{meta[id]={...(meta[id]||{}),...patch};});

  const rawNodes=atlas.flatMap(g=>g.topics.map((name,i)=>({id:g.id+'-'+i,sourceName:name,sourceGroup:g.id})));
  const missing=rawNodes.filter(n=>!meta[n.id]);
  if(missing.length)throw Error('Curriculum v2 missing metadata: '+missing.map(n=>n.id).join(', '));
  rawNodes.forEach(n=>{meta[n.id].name=meta[n.id].name||n.sourceName;meta[n.id].aliases=meta[n.id].aliases||[];meta[n.id].relatedTerms=meta[n.id].relatedTerms||[];meta[n.id].supports=meta[n.id].supports||[];meta[n.id].track=meta[n.id].track||'shared';});

  const nodesByFamily=familyId=>rawNodes.filter(n=>meta[n.id].family===familyId).sort((a,b)=>meta[a.id].tier-meta[b.id].tier||meta[a.id].order-meta[b.id].order||meta[a.id].name.localeCompare(meta[b.id].name));
  const familyFor=id=>familyById[meta[id]?.family];
  const displayName=id=>meta[id]?.name||id;
  const relations=[];
  rawNodes.forEach(n=>meta[n.id].supports.forEach((support,index)=>{if(meta[support])relations.push({a:support,b:n.id,strength:index===0?3:2,kind:'support'});}));
  const related=id=>relations.filter(r=>r.a===id||r.b===id).map(r=>({id:r.a===id?r.b:r.a,strength:r.strength,kind:r.kind})).sort((a,b)=>b.strength-a.strength);

  window.ATLAS_CURRICULUM_V2={families,familyById,meta,rawNodes,nodesByFamily,familyFor,displayName,relations,related,total:rawNodes.length};
})();
