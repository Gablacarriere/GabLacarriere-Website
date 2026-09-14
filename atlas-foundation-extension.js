(() => {
  const connection=window.ZOUK_ATLAS?.find(g=>g.id==='connection');
  if(!connection||!window.ZOUK_DETAILS)return;

  // Append-only curriculum extension: preserve every existing concept ID used by saved lessons.
  if(!connection.topics.includes('Frame / Contact Organization'))connection.topics.push('Frame / Contact Organization');
  connection.name='Connection, Frame & Timing';
  connection.intro='Explore contact organization, permeability, weight, timing and the information shared between bodies.';

  window.ZOUK_DETAILS['connection-6']={
    understand:'Frame is the adaptable organization of the body at points of contact. It is not a fixed arm shape: posture, tone and joint organization make contact clear enough to transmit and receive information while remaining responsive.',
    notice:'Can you keep contact informative while changing direction or tone without stiffening, collapsing, or gripping?'
  };
})();
