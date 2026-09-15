(() => {
  'use strict';

  const METHOD = {
    version: '2026-09-15.3',
    name: 'Gab Lacarriere Methodology',
    aim: 'Develop dancers who can perceive, understand, organize, retrieve, adapt, diagnose and choose with increasing autonomy.',
    publicLoop: ['Understand', 'Feel', 'Practice', 'Adapt'],
    cognitiveLoop: ['Recognize', 'Visualize', 'Calculate', 'Choose', 'Execute', 'Update'],
    movementVariables: ['Timing', 'Direction', 'Connection', 'Body organization', 'Pathway', 'Decision'],
    outcomeDomains: [
      {id:'technical',name:'Technical',prompt:'What movement, timing, connection, coordination or decision-making skill should become more reliable?'},
      {id:'social',name:'Social',prompt:'What should improve in partnership, consent, floorcraft, communication, inclusion or social-dance behavior?'},
      {id:'personal',name:'Personal',prompt:'What should change in confidence, autonomy, trust, creativity, expression or self-regulation?'}
    ],
    principles: [
      {id:'diagnosis',name:'Diagnosis before correction',prompt:'Identify the bottleneck before choosing the correction.'},
      {id:'principles',name:'Principles over pattern accumulation',prompt:'Teach the reusable mechanism, not only the outer sequence.'},
      {id:'structure',name:'Structure creates freedom',prompt:'Clarify what must remain stable and what can vary.'},
      {id:'transfer',name:'Transfer over immediate performance',prompt:'Test the skill after delay or under a meaningful change of context.'},
      {id:'autonomy',name:'Autonomy',prompt:'Give learners opportunities to perceive, reconstruct, diagnose and choose without the teacher supplying every answer.'},
      {id:'mechanism',name:'Mechanism before ornament',prompt:'Reduce complexity when the foundation cannot remain reliable.'},
      {id:'problem-before-exercise',name:'Problem before exercise',prompt:'Observe the movement attempt first; the exercise should be selected because it addresses the problem that actually appeared.'},
      {id:'scope-before-density',name:'Protect practice density by limiting scope',prompt:'When time is limited, teach fewer movements well rather than adding movements that cannot receive diagnosis, exercise and supported practice.'}
    ],
    movementClass: {
      name:'Default movement / sequence class architecture',
      flow:['General warm-up','Specific warm-up with targeted drills','Show the class movements / destination','Decompose into a small number of movement units','For each movement: show → attempt → diagnose problem → choose exercise → supported practice','Connect the movement units','Practice the connected sequence','Brief cool-down / close'],
      perMovementLoop:['Show and isolate the movement','Let students attempt it','Identify the primary problem or bottleneck','Choose at least one exercise that targets that problem','Practice without music with teacher voice/counting/cues','Practice with music and teacher voice/counting/cues','Practice with music without teacher voice','Move to the next movement only when the current unit is sufficiently organized'],
      supportFading:['No music + teacher voice/counting/cues','Music + teacher voice/counting/cues','Music without teacher voice'],
      exerciseRule:'At least one problem-specific exercise should normally be available for each movement unit; use more only when distinct bottlenecks justify them.',
      scopeRule:'The number of movements is constrained by the time needed to demonstrate, diagnose, exercise, repeat and integrate each one. Reduce movement count before sacrificing practice quality.',
      integrationRule:'After the movement units have been trained separately, reconnect them progressively and diagnose transitions rather than simply repeating the entire sequence.'
    },
    sessionArchitecture: [
      {id:'mental-arrival',name:'Mental arrival',purpose:'Focus attention, establish context and make the intended learning clear before adding physical complexity.',keywords:['mental arrival','arrive','focus attention','learning intention','class goal','today we are']},
      {id:'general-warmup',name:'General warm-up',purpose:'Raise global physical readiness and move the whole body before more specific demands.',keywords:['general warm','whole body','global warm','raise temperature','global readiness','full-body','full body']},
      {id:'specific-warmup',name:'Specific warm-up',purpose:'Prepare the exact ranges of motion, tissues, coordination, timing and movement mechanisms used later in the class. Targeted drills can live inside this preparation.',keywords:['specific warm','specific preparation','supporting foundations','supporting concepts','prerequisite task','movement preparation','reconnect supporting','prepare the movement','targeted class preparation']},
      {id:'movement-preview',name:'Movement preview / destination',purpose:'Show the movements or sequence before teaching every detail so students know what the parts will eventually become.',keywords:['show the class movements','establish the destination','movement preview','show the sequence','destination']},
      {id:'decompose',name:'Movement decomposition',purpose:'Cut a sequence into a small number of useful movement units and, when necessary, cut each movement into smaller parts.',keywords:['cut the movement','smaller movement','movement unit','decompose','isolate the movement','cut into smaller']},
      {id:'diagnose',name:'Problem diagnosis',purpose:'Let students attempt the movement, observe the actual bottleneck, then decide what needs to be trained.',keywords:['find the problem','identify the problem','diagnose','primary bottleneck','actual problem','problem that appears']},
      {id:'exercise',name:'Problem-specific exercise',purpose:'Choose or create an exercise because it directly addresses the diagnosed bottleneck in the current movement.',keywords:['problem-specific exercise','exercise that specifically','problem determines the exercise','choose or create at least one exercise','targeted exercise']},
      {id:'support-fading',name:'Fade teacher support',purpose:'Move from teacher-supported counting/cueing toward music without teacher voice so students increasingly organize the movement themselves.',keywords:['fade teacher support','no music + gab','music + gab','without gab','teacher voice','music without teacher voice','support-fading','support fading']},
      {id:'integrate',name:'Recombine / integrate movements',purpose:'Reconnect trained movement units progressively, paying attention to the transitions between them.',keywords:['connect the movements','rebuild the sequence','connect the movement units','complete sequence','neighboring pieces','recombine']},
      {id:'understand',name:'Understand / model',purpose:'Give learners a simple mental model or observable question for the target skill.',keywords:['understand','define','model','explore','organizing','learning target','concept']},
      {id:'feel',name:'Feel / discriminate',purpose:'Let learners distinguish useful sensations, timing, pressure, weight, direction or organization.',keywords:['feel','notice','sense','contrast','pressure','weight','tone','support','discriminate']},
      {id:'practice',name:'Focused practice',purpose:'Use enough repetitions around one primary variable or observable question.',keywords:['practice','repetition','repetitions','one focus','observable question','drill']},
      {id:'adapt',name:'Variation & transfer',purpose:'Change one relevant condition and test whether the underlying skill survives.',keywords:['vary','variation','transfer','different partner','change partners','different timing','change one condition','social dance','new context']},
      {id:'retrieve',name:'Retrieval & reflection',purpose:'Ask learners to reconstruct, recall, explain or self-assess before being shown the answer again.',keywords:['retrieve','retrieval','recall','reconstruct','from memory','reflect','self-assess','self assess']},
      {id:'cooldown',name:'Cool-down / recovery',purpose:'Use a deliberate transition out of the class: lower intensity, restore comfortable movement, and close with useful reflection when appropriate.',keywords:['cool-down','cool down','cooldown','recovery','down-regulate','down regulate','decompress','return to baseline','closing mobility']}
    ],
    feedbackLoop: {
      name: 'Close the feedback loop',
      steps: ['Observe something specific', 'Give one concrete next action', 'Let the learner reattempt', 'Return and check what changed'],
      prompt: 'Feedback is not complete when the teacher speaks. Follow the next attempt and update the cue if necessary.'
    },
    reflectionLoop: {
      fields: ['Intended learning', 'Observed evidence', 'What transferred', 'What still broke down', 'What I will change next time'],
      prompt: 'Compare the intended outcome with what actually appeared in the students, then use that evidence to redesign the next class.'
    },
    teacherQuestions: [
      'What is the actual bottleneck?',
      'What should the learner understand, feel and be able to do?',
      'What are the technical, social and personal outcomes of this class or progression?',
      'How many movements can this class realistically support if each movement needs demonstration, diagnosis, at least one exercise and enough repetitions?',
      'What specific warm-up drill prepares the exact demands of the movements?',
      'What problem appears when students first try each movement?',
      'Which exercise directly targets that problem?',
      'How will teacher support fade from voice/counting toward independent movement on music?',
      'What is the simplest task that reveals the target mechanism?',
      'What evidence would show learning rather than temporary imitation?',
      'What can vary without destroying the skill?',
      'What regression, neutral option or alternative keeps the task appropriate?',
      'How will feedback be followed by another attempt and a check?',
      'How will the separately trained movements be reconnected?',
      'How will learners retrieve or diagnose the idea themselves?',
      'What should be revisited later for durable learning?',
      'After teaching, what did the students actually show compared with what I intended?'
    ],
    warmup: {
      general: 'General warm-up raises overall readiness and moves the body broadly.',
      specific: 'Specific warm-up rehearses the exact skills, ranges, coordination and movement demands that the class will use, often through targeted prerequisite drills.'
    },
    safety: {
      principle: 'Difficulty and expression are added only when the relevant support, organization, consent and alternatives are available.',
      advancedFamilies: ['offaxis']
    }
  };

  METHOD.activityRole = function activityRole(title, instructions) {
    const text = `${title || ''} ${instructions || ''}`.toLowerCase();
    return METHOD.sessionArchitecture.filter(section => section.keywords.some(k => text.includes(k))).map(section => section.id);
  };

  METHOD.section = id => METHOD.sessionArchitecture.find(section => section.id === id) || null;
  window.GAB_METHODOLOGY = Object.freeze(METHOD);
})();
