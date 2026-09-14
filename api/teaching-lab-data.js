const CONCEPTS = [
  {
    id:'elasticity',
    category:'Foundations',
    title:'Elasticity & weight transfer',
    problem:'Staying in the middle, rotating before fully transferring weight, or self-initiating turns.',
    cue:'Step past the midpoint, then rotate. Look for the limit. Let the block create the turn.',
    drill:'One-minute slow-song solo drill: transfer past center on every lateral before rotation.',
    evidence:'Repeated private work linked this focus with cleaner posture, feet and partner responsiveness.',
    group:'Slow basic in lines: pause beyond center before each rotation, then add partner block-and-release.'
  },
  {
    id:'torsion',
    category:'Foundations',
    title:'Torsion & hip rotation',
    problem:'Chest and hips stay aligned, or torsion becomes forced and oversized.',
    cue:'Chest rotates toward the stepping leg. Keep torsion small, continuous and natural.',
    drill:'Saltinho chair-circle; shoulder/chest self-touch; basic-step torsion repetitions.',
    evidence:'Private notes show quick uptake of Brazilian swing when torsion was isolated before integration.',
    group:'Call-and-response torsion basic, then transfer the same mechanic into laterals and bônus.'
  },
  {
    id:'counterbalance',
    category:'Axis',
    title:'Counterbalance & axis',
    problem:'Going up, leaning from chest or hips, incomplete transfer, or spinning before returning to center.',
    cue:'Move the whole body outward. Sit back rather than lean. Stay low. Return to center first.',
    drill:'Partner entries/exits emphasizing one-foot placement, low hips, leg collection and controlled return.',
    evidence:'Notes describe increased stability, fluidity and more natural head-body organization after this work.',
    group:'Rotating partner stations: place, extend, return to center, then exit without a turn before adding rotation.'
  },
  {
    id:'head',
    category:'Head movement',
    title:'Head movement: weight, pathway & timing',
    problem:'Head is fast or light, overextended, out of sync with feet, or travels forward instead of backward.',
    cue:'Chin leads. Make the head heavy. Use the spine and back rather than the shoulders. Reset with the landing foot.',
    drill:'Feet only → chin pathway → head/foot timing → relaxed arms; hands on hips/behind back to block shoulder compensation.',
    evidence:'A recurring “back, back, back” weight cue produced clear improvements in stability and fluidity.',
    group:'Three-layer progression with peer observation: feet, chin pathway, then full coordination.'
  },
  {
    id:'chicat',
    category:'Head movement',
    title:'Chicat: contraction & release',
    problem:'Arm force or neck whiplash replaces contraction; chest overactivates; contraction lacks clarity.',
    cue:'Contract, then let go. Use whole-hand compression rather than fingers; follower controls the rebound.',
    drill:'Apply timing first to simple turns, then baleno exits and Wi-Fi; repeat until the timing is automatic.',
    evidence:'Private notes describe clean executions by the end of a layered session.',
    group:'Partner rhythm drill: contraction, release, return, then transfer the timing onto a simple turn.'
  },
  {
    id:'frame',
    category:'Connection',
    title:'Frame, tension & proximity',
    problem:'Arms disconnect or grip; shoulders collapse inward; partners drift too far apart.',
    cue:'Arms are the rope; the back is the connection. Keep light continuous tension. Open the elevator door—do not clench.',
    drill:'Hold-frame walking and turning; safe overhead arm placement; back-to-shoulder connection for spins.',
    evidence:'Notes connect this work with improved close-embrace alignment, posture and foot organization.',
    group:'Connection dial: compare limp, gripping and continuous-light tension while walking and turning.'
  },
  {
    id:'posture',
    category:'Foundations',
    title:'Posture, hips & grounded footwork',
    problem:'Forward lean, hips drifting back, wide base, lifted feet or flat-footed transfer.',
    cue:'Bar at the hips. Pelvis forward without squeezing. Slide like on ice. Step down into the floor.',
    drill:'Elastic back-strap cue; foot triangle; side-center-side hip transfers; slow Dombolo-style circles.',
    evidence:'Private notes explicitly describe major resolution of foot dragging and improvements in posture.',
    group:'Solo locomotion warm-up using triangle-foot contact, sliding steps, low stance and hip-transfer patterns.'
  },
  {
    id:'completion',
    category:'Lambada',
    title:'Movement completion & sharpness',
    problem:'Movements look messy because they are unfinished, while students compensate by forcing speed.',
    cue:'Finish the direction fully before trying to go faster. Match rotation on both sides.',
    drill:'Half-speed repetitions with deliberate endpoints and passive chin drop where appropriate.',
    evidence:'Private notes identify completion—not more speed—as the key constraint in several Lambada phrases.',
    group:'Half-speed, full-finish rounds with frozen checkpoints for self-assessment.'
  },
  {
    id:'texture',
    category:'Musicality',
    title:'Musical texture & phrasing',
    problem:'Rushing intros, relying on one default texture, or chasing accents too fast to organize.',
    cue:'Choose a mode: legato, rhythmical or staccato. Let movement breathe before switching texture.',
    drill:'Repeat one phrase over contrasting music sections; practice fast-slow-fast-stop contrast.',
    evidence:'Notes repeatedly use texture contrast as a way to improve phrasing without adding vocabulary.',
    group:'Dance the same basic phrase three times: legato, rhythmical, then staccato; name the texture first.'
  },
  {
    id:'layering',
    category:'Pedagogy',
    title:'Layered skill acquisition',
    problem:'Feet, head, arms and connection are attempted simultaneously before any layer is stable.',
    cue:'Build one element at a time. Integrate only after each layer can survive on its own.',
    drill:'Lower body → upper-body pathway → frame → partnered integration.',
    evidence:'Across privates, layering before integration is one of the most consistent successful teaching strategies.',
    group:'Teach complex material in four passes, then test whether the full pattern survives partner and music variation.'
  }
];

function clean(value, max=2000){
  return String(value ?? '').replace(/[<>]/g,'').slice(0,max);
}

export default async function handler(req,res){
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).json({error:'Method not allowed'});
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, COACH_NOTIFICATION_EMAIL } = process.env;
  if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !COACH_NOTIFICATION_EMAIL){
    return res.status(503).json({error:'Teaching Lab access is not configured'});
  }

  const authHeader=req.headers.authorization||'';
  const token=authHeader.startsWith('Bearer ')?authHeader.slice(7):'';
  if(!token) return res.status(401).json({error:'Authentication required'});

  const userResponse=await fetch(`${SUPABASE_URL}/auth/v1/user`,{
    headers:{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${token}`}
  });
  if(!userResponse.ok) return res.status(401).json({error:'Invalid session'});
  const user=await userResponse.json();

  const allowedEmail=COACH_NOTIFICATION_EMAIL.trim().toLowerCase();
  const userEmail=String(user.email||'').trim().toLowerCase();
  if(!userEmail || userEmail!==allowedEmail){
    return res.status(403).json({error:'Gab-only workspace'});
  }

  const profileResponse=await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,display_name,email`,{
    headers:{apikey:SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${SUPABASE_SERVICE_ROLE_KEY}`}
  });
  const profiles=profileResponse.ok?await profileResponse.json():[];
  const profile=profiles?.[0];
  if(!profile || profile.role!=='coach'){
    return res.status(403).json({error:'Coach access required'});
  }

  return res.status(200).json({
    ok:true,
    owner:{display_name:clean(profile.display_name||'Gab',120)},
    source:{label:'Granola teaching notes',window:'Aug 16–Sep 14, 2026',privacy:'De-identified instructional synthesis'},
    concepts:CONCEPTS
  });
}
