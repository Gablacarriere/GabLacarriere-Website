# Zoukable mentorship pilot

The app lives at `/zoukable/` in the existing website repository and uses the same origin, vendored Supabase client, authentication session, and `profiles` membership table as the mentorship hub. No separate signup or public account creation was added.

## Build

Run `node apply_branding.cjs && node integrate_zoukable.cjs`. The second step copies the isolated app shell, adds links to existing public and member navigation, and removes `.zoukable` development files from the public output. Existing public page source and API functions are unchanged.

## Implemented

- Teacher-authored drafts, publishing, private student assignment, primary and secondary skill tags, standard/simplified variants, duration, role, side, partner, rhythm, and HTTPS demonstration links.
- Session selection with due reviews, assigned practice, time budget, and context filters.
- Recall, optional instruction reveal, foreground timed practice, pause/stop, self-evaluation, confidence and failure reports.
- Server-timestamped attempts with immutable identity/context snapshots, teacher-clearance gates, and server-side review scheduling.
- Conservative rule-based intervals: 1, 2, 3, 5, 8, 12, 18, 28 days. Delayed independent success can extend an interval. Same-session repetitions do not accelerate the schedule. This is a pilot policy, not a validated motor-memory model.
- Separate review contexts for drill version, role, side, solo/partner, rhythm fingerprint, tempo band and standard/simplified variant.
- Practice XP and daily streak computed from completed logs, never used for competence or safety access. No XP reward for reporting Easy rather than Difficult.
- Skill evidence counts, teacher observations, recurring self-reported difficulties, social journal.
- Audio-clock metronome, tresillo, two unambiguous teaching templates, editable rhythm grid and teacher-published rhythm definitions. The four ambiguous spoken templates remain unconfirmed until their precise subdivisions are approved.

## Data and security

The additive Supabase migration `zoukable_pilot_foundation` is applied to the website project. Tables: `zoukable_skills`, `zoukable_drills`, `zoukable_clearances`, `zoukable_attempts`, `zoukable_review_states`, `zoukable_social_logs`, `zoukable_coach_notes`, `zoukable_rhythms`. All use row-level security. Student data is visible to its owner and existing coaches. Privileged trigger functions live in the unexposed `zoukable_private` schema with execution revoked from API roles. Frontend uses an intentionally public publishable key, never a service-role secret.

The curriculum starts with nine foundation labels and zero published drills. Demo practice is explicitly local and is never submitted to student accounts.

## Verification

`node --test .zoukable/core.test.cjs` runs 14 unit tests. Offline Chromium UI tests exercised navigation, responsive layouts, audio start/stop, rhythm-grid validation, minimum practice time, safe stop, complete practice feedback, XP, and escaped user text. Database tests under authenticated student/coach roles verified real scheduling and privacy in a rolled-back transaction. These are not a full production student login test.

## Deliberately not claimed

No calibrated motor-learning probabilities, inferred automatic mastery, AI video analysis, video uploading, native app-store package, population-trained recommendations, or full diagnostic/ten-level progression engine. Secondary skill tags do not automatically award mastery. Pattern prerequisite links are descriptive preparation links; independent-practice restrictions use explicit teacher clearance, not invented safety percentages. The next product iteration should validate the first teacher-authored drills and actual student workflow before expanding.
