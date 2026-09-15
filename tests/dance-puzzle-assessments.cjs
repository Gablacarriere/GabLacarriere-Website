const fs=require('fs'),assert=require('assert');
const sql=fs.readFileSync('database/dance-puzzle-assessments.sql','utf8');
const ui=fs.readFileSync('mentorship-dance-puzzle-assessments.js','utf8');
const loader=fs.readFileSync('session-boundary.js','utf8');

assert(sql.includes('create table if not exists public.dance_puzzle_assessments'),'assessment table migration should exist');
assert(sql.includes('alter table public.dance_puzzle_assessments enable row level security'),'assessment table must use RLS');
assert(sql.includes('dance_puzzle_assessments_coach_select'),'coach-only select policy should exist');
assert(sql.includes('using (public.is_coach())'),'select policy should require coach role');
assert(sql.includes('dance_puzzle_assessments_coach_insert'),'coach-only insert policy should exist');
assert(!/policy[\s\S]{0,120}(student|own)[\s\S]{0,120}select/i.test(sql),'pilot migration must not grant students a read policy');
assert(!/for update|for delete/i.test(sql),'pilot observations should remain append-only through RLS policies');

for(const marker of ['recognition','visualization','calculation','decision_quality','adaptation','puzzle_usefulness']){
  assert(ui.includes(marker),`pilot UI missing ${marker}`);
}
assert(ui.includes('Teacher-only pilot'),'coach UI should clearly label the pilot private');
assert(ui.includes('not visible to students'),'coach UI should state student visibility policy');
assert(ui.includes("const TABLE = 'dance_puzzle_assessments'"),'coach UI should write the pilot table');
assert(ui.includes('Repeated-puzzle change'),'coach UI should expose repeated-puzzle change signals');
assert(ui.includes('Descriptive pilot signals only'),'overview should avoid causal claims');

assert(loader.includes("loadMentorshipScript('dance-puzzles','/dance-puzzles.js?v=assessment-1')"),'Mothership should load puzzle definitions');
assert(loader.includes("loadMentorshipScript('mentorship-dance-puzzle-assessments','/mentorship-dance-puzzle-assessments.js?v=1')"),'Mothership should load coach assessment UI');
console.log('PASS: Dance Puzzle assessment pilot is coach-only, append-only, five-dimensional, and wired into Mothership.');
