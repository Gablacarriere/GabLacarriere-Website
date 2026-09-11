# Mentorship world — graphic direction
Approved direction, 11 September 2026. Applies to the member hub, Atlas, Zoukable, ECHO, practice planner, and future private member features.

## Identity
A calm, playful exploration world: soft geometric illustration, clear silhouettes, gentle perspective, airy layouts and small personal characters. Monument Valley is an atmospheric reference, not a requirement to put a monument everywhere. Other references from the discussion: the gentle exploration of Sky/Journey, personal ownership in Animal Crossing, and the outward discovery of Civilization/Final Fantasy skill trees. Use original artwork, not game assets or interfaces.

## Shared story
The mentorship hub is the shared mothership. Gab is captain, Steph co-captain, Lorell Mission Control. Zoukable is the practice world and personal-craft hangar. Atlas is the universe of concepts discovered in lessons. ECHO is human crew communication, not an AI persona.
Students own a small craft docked beside the shared ship. Never replace the mothership with an individual student's craft.

## Palette
Ink #293f51; muted copy #56697c; paper #fffdf8; sky #e9e2ef; pale lagoon #e1ece9; lilac action #68718c; warm cream #eadbb6; sage #8ab3ae; dusty rose #aa7887. Night-map field #17243b to #51496b and #223750. Keep celestial labels pale and legible on the dark map. Keep forms dark-text-on-light with visible borders. Avoid recurring bright yellow panels.

## Typography and layout
Serif display headings (Georgia), regular weight, modest negative tracking; system sans-serif controls and body. Body text about 16px, generous line height. Small spaced uppercase labels used sparingly. Cards: mostly quiet paper, asymmetric corner rounding (8/25/8/8px), thin cool borders, restrained soft shadows. Clear focus rings, 44px actions, responsive single columns on mobile. No decorative object may cover controls or text.

## Scenery
Journey: a traveling camp. Today: sunrise garden. Practice: stepping stones and a pool. Skills: floating islands. Rhythm: suspended sound orbs. Social: lantern grove. Teacher tools: easel and workshop. Architecture is one ingredient alongside nature, water, objects and open space. Different places share materials and color relationships.

## Characters and craft
Student explorer: tiny full-body, faceless robed figure; simple hat, scarf and readable silhouette. Preserve saved coat and hat preferences. Staff portraits have a separate established storybook/video-game character identity: Gab bald under a docker hat, small crown, neck and right-arm tattoos only, telescope; Steph and Lorell follow that established character family. Do not replace those staff avatars with generic students.
Personal crafts: saucer, shuttle or spaceboat, selected in the learning profile. Color follows selected explorer coat; default currently lilac. Shared module personal-craft.js draws both apps. Saved completed-practice XP produces cosmetic stages at 0/10/100/300/600 XP. No inactivity decay. These thresholds are presentation milestones, not pedagogy or competency thresholds.

## Interaction and evidence
A concise next action, optional exploration, gentle feedback and permanent cosmetic ownership. Three rhythm orbs follow the three-step preset via the existing player clock; decorative movement respects reduced-motion preferences. Never award mastery, reveal Atlas concepts, or bypass teacher clearance based on XP or scenery. Never fabricate drills, recordings, social activity or achievements. Lesson discoveries and practice evidence remain distinct.

## Implementation and maintenance
Zoukable base: world.css, chapters.css, world.js. Shared member shell: member-world.css and member-world.js, appended after public branding by apply_branding.cjs on exactly mentorship-hub, zouk-map, comms-deck and practice-planner. Preserve the public site's art direction elsewhere. The shared banner links Mothership, Practice & hangar, Atlas and ECHO. Authentication, hidden coach controls, private data policies and original form behavior must remain intact.
Use this guide when adding a new member feature. Add a distinctive setting while reusing these colors, characters, form treatments and navigation. Avoid introducing another unrelated theme or global public-site restyle.
