# Cabinet of curiosities: research and design direction

September 11, 2026. A focused shortlist of recent work and enduring references, not a claim to rank every website or prove conversion results.

| Reference | Useful idea | Application to Gab’s website |
| --- | --- | --- |
| [Bruno Simon’s current portfolio](https://bruno-simon.com/) | Visitors explore a playable world and find the creator’s work through it. | Give each object a small interaction and an identifiable personality. Keep the booking route direct and optional; no game completion gate. |
| [Chrome Music Lab](https://musiclab.chromeexperiments.com/) | Immediate hands-on learning, no account required. | A three-step rhythm experiment people can hear and compare before deciding to join a class. |
| [London Museum Objects & Stories](https://www.londonmuseum.org.uk/collections/) | Objects provide entry points into linked human stories and themed journeys. | Each object opens a teaching question and a relevant route, rather than an unrelated art fact. |
| [London Museum’s 2025 digital award entry](https://awards.museumsandheritage.com/awards/2025-winners/best-use-of-digital-uk-5/) | Relationships between objects and stories make a collection more connected. | Connection → method/private coaching; rhythm → classes/Zoukable; discovery → mentorship/real student stories. |
| [Rijksmuseum’s 2021 European Design Award case study](https://awards.europeandesign.org/winner/248792) | Visual storytelling with visitor-specific journeys and accessibility. | Strong object imagery, short focused text, clear onward choices, native keyboard controls. This is an older benchmark, not a new 2026 launch. |

## Implemented experience

Three original tactile sculptures invite visitors into interactive exhibits. The orbit lets visitors adjust timing on a shared path; it is explicitly a visual metaphor, not an assessment. The rhythm machine plays Traditional 1, R&B 1 and Contemporary 1 as three events in two beats at 90 BPM. Sound is opt-in and stops on tab hiding, leaving the cabinet or changing exhibits. The unfinished map illustrates notice → practice → revisit, with no account progress written.

The artwork is original generated imagery, compressed to a 46.7 KB WebP. CSS crops the three objects from one asset. The interaction uses native HTML/SVG and Web Audio with no new framework or rendering dependency. Visual styling blends warm museum paper, playful ceramic objects and the existing muted learning-world palette. Source data and copy are in index.html and curiosity.js; presentation is isolated in curiosity.css.

## What this is meant to improve

Attention: recognizable objects and an immediate invitation to touch.
Understanding: visitors experience timing and relationships instead of only reading selling points.
Relevance: the exhibit they choose offers a matching way to train.
Brand: art and pedagogy form one experience.
Trust: no fictional testimonials, skills, awards or progress.
Maintainability: add one exhibit at a time; preserve native controls, reduced-motion styling and readable no-JavaScript fallbacks.

## How to evaluate it

Compare cabinet visitors who open an exhibit, use its control, follow its learning link, and ultimately submit a genuine inquiry. Look at mobile separately. Longer time on the section alone is not success; confusion can also increase time spent. Collect a short qualitative response from prospective students: “What do you think Gab could help you with?”

The component emits `cabinet-interaction` events with `action` and `focus` only. These are local integration hooks, not a connected analytics service or a saved report. No event is sent to a server by this feature. Connect them to the site’s approved analytics setup before reporting rates or running comparisons. Baseline and post-launch booking data are needed before claiming an engagement or conversion improvement.

## Verification

Phone and desktop: exhibit selection, keyboard slider, rhythm changes, play/stop, stop on exhibit switch, map state, surprise selection, and horizontal overflow. All teaching paths remain visible with JavaScript disabled. No data writes are involved.

## Exhibit refinement

The first exhibit is now an opt-in animated duet, with together, echo and individual-expression modes plus manual scrubbing. Two distinct spheres retain their own space. The map now narrates a five-stop example of a rushed step, with coaching, independent exploration, Zoukable practice, Atlas review and transfer into other dances. The rhythm interface has playable low/mid/high percussion pads, a 60–130 BPM slider, a transport button and a sequencer display. Existing rhythm offsets are preserved. All motion and sound stop when switching exhibits or leaving the cabinet; nothing autoplays.
