(() => {
  'use strict';

  const METHOD = {
    version: '2026-09-15.2',
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
      {id:'mechanism',name:'Mechanism before ornament',prompt:'Reduce complexity when the foundation cannot remain reliable.'}
    ],
    sessionArchitecture: [
      {id:'mental-arrival',name:'Mental arrival',purpose:'Focus attention, establish context and make the intended learning clear before adding physical complexity.',keywords:['mental arrival','arrive','focus attention','learning intention','class goal','today we are']},
      {id:'general-warmup',name:'General warm-up',purpose:'Raise global physical readiness and move the whole body before more specific demands.',keywords:['general warm','whole body','global warm','raise temperature','global readiness','full-body','full body']},
      {id:'specific-warmup',name:'Specific warm-up',purpose:'Prepare the exact ranges of motion, tissues, coordination, timing and movement mechanisms used later in the class.',keywords:['specific warm','specific preparation','supporting foundations','supporting concepts','prerequisite task','movement preparation','reconnect supporting','prepare the movement']},
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
      'What is the simplest task that reveals the target mechanism?',
      'What evidence would show learning rather than temporary imitation?',
      'What can vary without destroying the skill?',
      'What regression, neutral option or alternative keeps the task appropriate?',
      'How will feedback be followed by another attempt and a check?',
      'How will learners retrieve or diagnose the idea themselves?',
      'What should be revisited later for durable learning?',
      'After teaching, what did the students actually show compared with what I intended?'
    ],
    warmup: {
      general: 'General warm-up raises overall readiness and moves the body broadly.',
      specific: 'Specific warm-up rehearses the exact skills, ranges, coordination and movement demands that the class will use.'
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
