# Curriculum sync workflow

The curriculum is a curated model of Gab's teaching, not a verbatim transcript of class notes.

## Methodology layer

- `design/gab-lacarriere-methodology.md` is the top-level living methodology document.
- The Atlas is a structured curriculum projection of that broader methodology, not the complete method.
- Methodology changes may affect the Atlas, Zoukable, the Mentorship Hub, teacher tools, safety/preparation systems, or public Method pages without necessarily creating a new Atlas node.
- When a curriculum change expresses a broader teaching or learning principle, update the methodology master first or in the same reviewed change.

## Canonical public layer

- `atlas-curriculum-v2.js` contains the active curriculum structure and stable concept IDs.
- `curriculum-registry.js` exposes that structure to Atlas, Zoukable, lesson recording, and future teaching tools as `window.GAB_CURRICULUM`.
- Existing saved lesson IDs are append-only. Renaming or regrouping a concept must not renumber historical IDs.

## Evidence sources

1. Granola notes from regular classes.
2. Granola notes from private lessons.
3. Explicit curriculum decisions made by Gab.
4. Logical dependency analysis: what a dancer needs for another concept to be understandable, safe, or reusable.

Raw Granola notes are private evidence. Never publish student names, private quotes, meeting URLs, or identifiable lesson details to the public website repository.

## Classification before promotion

Every new observation should first be classified as one of:

- reusable mechanism / concept
- pattern family
- variant of an existing pattern
- drill / exercise
- cue / metaphor
- terminology alias
- teaching / practice principle
- correction specific to one student or situation

Drills, cues, metaphors, and individual corrections do not become curriculum nodes by default.

## Promotion thresholds

### New curriculum concept
Promote when either:
- it recurs in at least 3 distinct teaching notes/classes; or
- it appears across at least 2 distinct teaching contexts (for example regular class + private lesson) and clearly generalizes across multiple movements; or
- Gab explicitly identifies it as a foundational or canonical curriculum principle.

The concept must also be distinct from existing nodes and have a defensible place in the dependency graph.

### New relationship / dependency
Promote after repeated evidence in at least 2 teaching notes, or when it follows directly from an already accepted definition without adding a new teaching claim.

### Alias / terminology normalization
Promote when notes clearly use multiple labels for the same structure. Preserve uncertainty when the evidence does not establish identity. Do not merge similar names merely for tidiness.

### Drill
Route reusable drills toward Zoukable or the drill library. A drill may reference several curriculum concepts but is not itself a curriculum concept unless it names a reusable mechanism.

### One-off observation
Keep as evidence only. Do not publish automatically.

## Propagation rule

An approved curriculum change should be checked against all consumers:

1. Living methodology master when the change expresses or modifies a broader methodological principle.
2. Atlas map geometry, labels, search, and relationships.
3. Coach lesson-recording form.
4. Zoukable Atlas links and relevant practice-skill relationships.
5. Curriculum/class-planning tools when they use the shared registry.
6. Public Method pages when the change affects student-facing explanation.
7. Regression tests and documentation.

## Privacy and quality gates

- Never expose private student information.
- Preserve stable IDs.
- Prefer mechanisms over a long list of memorized patterns.
- Keep Zouk and Lambada variants separate when the notes support different timing or structure.
- Do not infer equivalence from transcription spelling alone.
- Advanced nodes should depend on a smaller set of reusable foundations whenever possible.
- The map represents curriculum depth and semantic relationship, not student rank or mastery.

## Review output

Each sync should result in one of three outcomes:

- **No change:** evidence reinforces the existing curriculum.
- **Candidate:** potentially useful but below promotion threshold.
- **Promoted change:** update the canonical curriculum and its consumers, with a concise explanation of what changed and why.
