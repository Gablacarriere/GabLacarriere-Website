# Curriculum sync workflow

The curriculum is a curated model of Gab's teaching, not a verbatim transcript of class notes.

## Methodology layer

- `design/gab-lacarriere-methodology.md` is the top-level living methodology document.
- `design/methodology-candidates.md` is the de-identified review layer for useful observations that are not yet canonical.
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
3. Explicit curriculum and methodology decisions made by Gab.
4. Relevant website/tool changes that operationalize a teaching decision.
5. Logical dependency analysis: what a dancer needs for another concept to be understandable, safe, or reusable.
6. Research evidence when it materially supports, qualifies, or challenges a methodological claim.

Raw Granola notes are private evidence. Never publish student names, private quotes, meeting URLs, or identifiable lesson details to the public website repository or the candidate register.

## Classification before promotion

Every new observation should first be classified as one of:

- methodology principle
- reusable mechanism / concept
- concept relationship / dependency
- pattern family
- variant of an existing pattern
- drill / exercise
- cue / metaphor
- safety / progression rule
- teacher-design principle
- teaching / practice principle
- terminology alias
- product implementation detail
- correction specific to one student or situation

Drills, cues, metaphors, product details, and individual corrections do not become curriculum nodes by default.

## Candidate capture rule

When an observation is useful and plausibly generalizable but is not yet canonical, add a concise de-identified record to `design/methodology-candidates.md` rather than losing it or prematurely publishing it.

A candidate record should track:

- the proposed idea;
- classification/domain;
- independent evidence count;
- distinct teaching contexts;
- whether Gab explicitly adopted it;
- whether it is already operationalized somewhere in the site/tools;
- relevant research status when needed;
- its relationship to current canonical principles;
- the exact promotion test still required.

Do not create a candidate entry for every passing remark. Preserve only observations with plausible future methodological value.

## Promotion thresholds

### New curriculum concept
Promote when either:
- it recurs in at least 3 distinct teaching notes/classes; or
- it appears across at least 2 distinct teaching contexts (for example regular class + private lesson) and clearly generalizes across multiple movements; or
- Gab explicitly identifies it as a foundational or canonical curriculum principle.

The concept must also be distinct from existing nodes and have a defensible place in the dependency graph.

### Broader methodology principle
A principle may be promoted immediately when Gab explicitly adopts it. Otherwise, require enough repeated evidence to show it generalizes beyond one class, student, or movement, and check it against the existing methodology before promotion.

### New relationship / dependency
Promote after repeated evidence in at least 2 teaching notes, or when it follows directly from an already accepted definition without adding a new teaching claim.

### Alias / terminology normalization
Promote when notes clearly use multiple labels for the same structure. Preserve uncertainty when the evidence does not establish identity. Do not merge similar names merely for tidiness.

### Drill
Route reusable drills toward Zoukable or the drill library. A drill may reference several curriculum concepts but is not itself a curriculum concept unless it names a reusable mechanism.

### One-off observation
Keep as evidence only. Do not publish automatically. Add it to the candidate register only when it has plausible methodological value.

## Propagation rule

An approved change should be checked against all relevant consumers, not blindly copied everywhere:

1. Living methodology master when the change expresses or modifies a broader methodological principle.
2. Candidate register: mark the source candidate Promoted or archive it with the promotion date.
3. Atlas map geometry, labels, search, and relationships when the change belongs in the student-addressable curriculum.
4. Coach lesson-recording form.
5. Zoukable Atlas links and relevant practice-skill/drill relationships.
6. Mentorship Hub roadmap, learning, or check-in logic when relevant.
7. Curriculum/class-planning and teacher tools when relevant.
8. Safety/preparation tools when relevant.
9. Public Method pages when the change affects student-facing explanation.
10. Regression tests and documentation.

## Drift detection

The sync should also work in reverse. If the website or a teaching tool now embodies a methodological decision that is missing from the master document, reconcile the methodology. If a public page contradicts the canonical methodology, correct the inconsistency when intent is clear or add an open question when it is not.

## Privacy and quality gates

- Never expose private student information.
- Preserve stable IDs.
- Prefer mechanisms over a long list of memorized patterns.
- Keep Zouk and Lambada variants separate when the notes support different timing or structure.
- Do not infer equivalence from transcription spelling alone.
- Advanced nodes should depend on a smaller set of reusable foundations whenever possible.
- The map represents curriculum depth and semantic relationship, not student rank or mastery.
- Distinguish evidence from doctrine; repeated observation can support a principle without proving a causal scientific claim.

## Review output

Each sync should result in one of four outcomes:

- **No change:** evidence reinforces the existing methodology/curriculum.
- **Candidate captured/updated:** potentially useful but below promotion threshold.
- **Promoted change:** update the canonical methodology/curriculum and only the relevant consumers, with a concise explanation of what changed and why.
- **Decision needed:** contradictory evidence, terminology, or architecture requires Gab's judgment before promotion.
