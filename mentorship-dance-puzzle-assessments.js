(() => {
  'use strict';
  if (!/^\/mentorship-hub\/?$/.test(location.pathname)) return;

  const TABLE = 'dance_puzzle_assessments';
  const DIMS = [
    ['recognition','Recognition'],
    ['visualization','Visualization'],
    ['calculation','Calculation'],
    ['decision_quality','Decision'],
    ['adaptation','Adaptation']
  ];
  const SCALE = [
    ['', 'Not observed'],
    ['1','1 · needs substantial support'],
    ['2','2 · emerging'],
    ['3','3 · usable with attention'],
    ['4','4 · reliable in this task'],
    ['5','5 · flexible / independent here']
  ];
  const CONTEXTS = [
    ['class','Group class'],['private','Private'],['mentorship','Mentorship session'],['social','Social / practica'],['other','Other']
  ];
  let panel = null;
  let lastStudentId = null;
  let loadToken = 0;
  let loading = false;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const client = () => { try { return sb || null; } catch (_) { return null; } };
  const student = () => { try { return selectedStudent || null; } catch (_) { return null; } };
  const library = () => window.GAB_DANCE_PUZZLES || null;
  const puzzleName = id => library()?.puzzles?.find(p => p.id === id)?.title || id;
  const localNow = () => {
    const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    return d.toISOString().slice(0,16);
  };
  const mean = values => {
    const nums = values.filter(v => Number.isFinite(Number(v))).map(Number);
    return nums.length ? nums.reduce((a,b) => a+b,0) / nums.length : null;
  };
  const rowAverage = row => mean(DIMS.map(([key]) => row[key]).filter(v => v != null));
  const fmt = value => value == null ? '—' : Number(value).toFixed(1);
  const scoreOptions = () => SCALE.map(([v,label]) => `<option value="${v}">${esc(label)}</option>`).join('');
  const scoreSelect = (key,label) => `<label>${esc(label)}<select data-puzzle-score="${esc(key)}">${scoreOptions()}</select></label>`;

  function addStyles() {
    if (document.getElementById('dancePuzzleAssessmentStyles')) return;
    const style = document.createElement('style');
    style.id = 'dancePuzzleAssessmentStyles';
    style.textContent = `
      .puzzleAssessGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0}
      .puzzleAssessGrid label,.puzzleAssessMeta label{display:grid;gap:6px;color:#cbd4df;font-size:.9rem}
      .puzzleAssessGrid select,.puzzleAssessMeta select,.puzzleAssessMeta input,.puzzleAssessNotes{width:100%;padding:11px 12px;border-radius:12px;border:1px solid #ffffff22;background:#090e15;color:#fff;font:inherit}
      .puzzleAssessMeta{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:10px;margin:14px 0}
      .puzzleAssessNotes{min-height:82px;resize:vertical}
      .puzzleMetricGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:14px 0}
      .puzzleMetric{padding:12px;border:1px solid #ffffff17;border-radius:14px;background:#0a1017}.puzzleMetric b{display:block;font-size:1.45rem}.puzzleMetric small{color:#9ea7b5}
      .puzzleHistory{display:grid;gap:10px;margin-top:12px}.puzzleHistoryItem{padding:13px;border:1px solid #ffffff14;border-radius:14px;background:#0a1017}.puzzleHistoryItem p{margin:5px 0;color:#aeb6c2}.puzzleScoreLine{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.puzzleScoreLine span{padding:5px 8px;border-radius:999px;background:#ffffff08;border:1px solid #ffffff16;font-size:.78rem;color:#cbd4df}
      .puzzlePilotTable{width:100%;border-collapse:collapse;font-size:.88rem}.puzzlePilotTable th,.puzzlePilotTable td{text-align:left;padding:8px;border-bottom:1px solid #ffffff12;vertical-align:top}.puzzlePilotTable th{color:#9edfff}
      .puzzlePrivate{padding:10px 12px;border-left:3px solid #9edfff;background:#102030;color:#cfe8ff;border-radius:0 10px 10px 0;margin:10px 0 16px}.puzzleStatus{min-height:24px;color:#9edfff;margin-top:8px}
      @media(max-width:820px){.puzzleAssessGrid,.puzzleAssessMeta,.puzzleMetricGrid{grid-template-columns:1fr}.puzzlePilotTable{font-size:.8rem}}
    `;
    document.head.appendChild(style);
  }

  function buildPanel() {
    const host = document.getElementById('coachEditor');
    if (!host || panel) return;
    addStyles();
    panel = document.createElement('section');
    panel.id = 'dancePuzzleAssessmentPanel';
    panel.className = 'editorSection adminOnly';
    panel.innerHTML = `
      <p class="kicker">PERCEPTION &amp; PROJECTION · PILOT</p>
      <h3>Dance Puzzle assessment</h3>
      <div class="puzzlePrivate"><strong>Teacher-only pilot.</strong> These observations are not visible to students and are not a permanent level or grade.</div>
      <div id="puzzleAssessmentForm"></div>
      <div id="puzzleAssessmentStatus" class="puzzleStatus" role="status" aria-live="polite"></div>
      <div id="puzzleStudentSignals"></div>
      <div id="puzzleAssessmentHistory"></div>
      <details style="margin-top:16px"><summary>Whole-pilot overview</summary><div id="puzzlePilotOverview"><p class="muted">Loading pilot data…</p></div></details>
    `;
    host.appendChild(panel);
  }

  function renderForm() {
    const form = document.getElementById('puzzleAssessmentForm');
    const lib = library();
    const s = student();
    if (!form || !lib || !s) return;
    form.innerHTML = `
      <div class="puzzleAssessMeta">
        <label>Puzzle<select id="puzzleAssessmentPuzzle">${lib.puzzles.map(p => `<option value="${esc(p.id)}">${esc(p.id)} · ${esc(p.title)}</option>`).join('')}</select></label>
        <label>Context<select id="puzzleAssessmentContext">${CONTEXTS.map(([v,l]) => `<option value="${v}" ${v==='class'?'selected':''}>${esc(l)}</option>`).join('')}</select></label>
        <label>Observed at<input id="puzzleAssessmentDate" type="datetime-local" value="${localNow()}"></label>
      </div>
      <p class="muted">Score only what you actually observed. Leave the rest as “Not observed.”</p>
      <div class="puzzleAssessGrid">${DIMS.map(([key,label]) => scoreSelect(key,label)).join('')}${scoreSelect('puzzle_usefulness','Puzzle usefulness')}</div>
      <label style="display:grid;gap:6px">Coach note<textarea id="puzzleAssessmentNotes" class="puzzleAssessNotes" maxlength="5000" placeholder="What did the puzzle reveal? What would you repeat, modify or watch next?"></textarea></label>
      <div class="editorActions" style="margin-top:12px"><button type="button" class="smallBtn" id="savePuzzleAssessment">Save observation</button><a class="smallBtn" id="openPuzzleAssessment" href="/dance-puzzles/" target="_blank" rel="noopener">Open puzzle ↗</a></div>
    `;
    const select = document.getElementById('puzzleAssessmentPuzzle');
    const link = document.getElementById('openPuzzleAssessment');
    const syncLink = () => { if (link) link.href = `/dance-puzzles/#${encodeURIComponent(select.value)}`; };
    select?.addEventListener('change', syncLink);
    syncLink();
    document.getElementById('savePuzzleAssessment')?.addEventListener('click', saveAssessment);
  }

  function payloadFromForm() {
    const s = student();
    if (!s) return null;
    const scores = {};
    for (const [key] of [...DIMS, ['puzzle_usefulness','Puzzle usefulness']]) {
      const raw = document.querySelector(`[data-puzzle-score="${key}"]`)?.value || '';
      scores[key] = raw ? Number(raw) : null;
    }
    return {
      student_id: s.id,
      puzzle_id: document.getElementById('puzzleAssessmentPuzzle')?.value || '',
      assessed_at: document.getElementById('puzzleAssessmentDate')?.value ? new Date(document.getElementById('puzzleAssessmentDate').value).toISOString() : new Date().toISOString(),
      context: document.getElementById('puzzleAssessmentContext')?.value || 'class',
      ...scores,
      notes: (document.getElementById('puzzleAssessmentNotes')?.value || '').trim()
    };
  }

  async function saveAssessment() {
    const c = client();
    const payload = payloadFromForm();
    const status = document.getElementById('puzzleAssessmentStatus');
    if (!c || !payload) return;
    const observed = [...DIMS.map(([key]) => payload[key]), payload.puzzle_usefulness].some(v => v != null);
    if (!observed) { status.textContent = 'Score at least one observed dimension or puzzle usefulness before saving.'; return; }
    status.textContent = 'Saving observation…';
    const { error } = await c.from(TABLE).insert(payload);
    if (error) { status.textContent = 'Could not save this observation. Your other mentorship data was not changed.'; console.error(error); return; }
    status.textContent = `${payload.puzzle_id} saved for ${student()?.display_name || 'this student'}.`;
    document.getElementById('puzzleAssessmentNotes').value = '';
    document.querySelectorAll('[data-puzzle-score]').forEach(el => el.value = '');
    document.getElementById('puzzleAssessmentDate').value = localNow();
    await loadForStudent(true);
  }

  function renderStudentSignals(rows) {
    const target = document.getElementById('puzzleStudentSignals');
    if (!target) return;
    if (!rows.length) { target.innerHTML = '<p class="muted">No Dance Puzzle observations recorded for this student yet.</p>'; return; }
    const cards = DIMS.map(([key,label]) => {
      const avg = mean(rows.map(r => r[key]).filter(v => v != null));
      const n = rows.filter(r => r[key] != null).length;
      return `<div class="puzzleMetric"><b>${fmt(avg)}</b><small>${esc(label)} · ${n} observation${n===1?'':'s'}</small></div>`;
    }).join('');

    const repeatGroups = new Map();
    for (const row of [...rows].sort((a,b) => new Date(a.assessed_at)-new Date(b.assessed_at))) {
      if (!repeatGroups.has(row.puzzle_id)) repeatGroups.set(row.puzzle_id, []);
      repeatGroups.get(row.puzzle_id).push(row);
    }
    const repeats = [...repeatGroups.entries()].filter(([,items]) => items.length >= 2).map(([id,items]) => {
      const first = rowAverage(items[0]), last = rowAverage(items[items.length-1]);
      return { id, n:items.length, delta:first != null && last != null ? last-first : null };
    }).filter(x => x.delta != null).sort((a,b) => b.delta-a.delta);
    target.innerHTML = `<h3 style="margin-top:22px">Cognitive observation signals</h3><div class="puzzleMetricGrid">${cards}</div>${repeats.length ? `<p class="muted"><strong>Repeated-puzzle change:</strong> ${repeats.slice(0,4).map(x => `${esc(x.id)} ${x.delta>=0?'+':''}${x.delta.toFixed(1)} (${x.n} uses)`).join(' · ')}</p>` : '<p class="muted">Repeat a puzzle later to start seeing within-puzzle change signals.</p>'}`;
  }

  function renderHistory(rows) {
    const target = document.getElementById('puzzleAssessmentHistory');
    if (!target) return;
    if (!rows.length) { target.innerHTML = ''; return; }
    target.innerHTML = `<h3 style="margin-top:22px">Recent observations</h3><div class="puzzleHistory">${rows.slice(0,12).map(row => {
      const scores = DIMS.filter(([key]) => row[key] != null).map(([key,label]) => `<span>${esc(label)} ${row[key]}/5</span>`).join('');
      const usefulness = row.puzzle_usefulness != null ? `<span>Usefulness ${row.puzzle_usefulness}/5</span>` : '';
      return `<article class="puzzleHistoryItem"><strong>${esc(row.puzzle_id)} · ${esc(puzzleName(row.puzzle_id))}</strong><p>${new Date(row.assessed_at).toLocaleString()} · ${esc(row.context)}</p><div class="puzzleScoreLine">${scores}${usefulness}</div>${row.notes ? `<p>${esc(row.notes)}</p>` : ''}</article>`;
    }).join('')}</div>`;
  }

  function pilotStats(rows) {
    const byPuzzle = new Map();
    for (const row of rows) {
      if (!byPuzzle.has(row.puzzle_id)) byPuzzle.set(row.puzzle_id, []);
      byPuzzle.get(row.puzzle_id).push(row);
    }
    const stats = [...byPuzzle.entries()].map(([id,items]) => {
      const usefulness = mean(items.map(x => x.puzzle_usefulness).filter(v => v != null));
      const byStudent = new Map();
      for (const row of [...items].sort((a,b) => new Date(a.assessed_at)-new Date(b.assessed_at))) {
        if (!byStudent.has(row.student_id)) byStudent.set(row.student_id, []);
        byStudent.get(row.student_id).push(row);
      }
      const deltas = [...byStudent.values()].filter(x => x.length >= 2).map(x => {
        const first=rowAverage(x[0]), last=rowAverage(x[x.length-1]);
        return first != null && last != null ? last-first : null;
      }).filter(x => x != null);
      return {id,n:items.length,students:new Set(items.map(x=>x.student_id)).size,usefulness,repeatPairs:deltas.length,delta:mean(deltas)};
    });
    return stats.sort((a,b) => b.n-a.n || (b.usefulness ?? -1)-(a.usefulness ?? -1));
  }

  async function renderPilotOverview() {
    const c = client();
    const target = document.getElementById('puzzlePilotOverview');
    if (!c || !target) return;
    const { data, error } = await c.from(TABLE).select('student_id,puzzle_id,assessed_at,recognition,visualization,calculation,decision_quality,adaptation,puzzle_usefulness').order('assessed_at',{ascending:false}).limit(500);
    if (error) { target.innerHTML = '<p class="muted">Pilot overview is unavailable.</p>'; return; }
    const rows = data || [], stats = pilotStats(rows);
    if (!rows.length) { target.innerHTML = '<p class="muted">No pilot observations yet.</p>'; return; }
    target.innerHTML = `<p class="muted">${rows.length} observations · ${new Set(rows.map(x=>x.student_id)).size} students · ${stats.length} puzzles used. Descriptive pilot signals only; this does not establish that a puzzle caused improvement.</p><table class="puzzlePilotTable"><thead><tr><th>Puzzle</th><th>Uses</th><th>Students</th><th>Usefulness</th><th>Repeat change</th></tr></thead><tbody>${stats.slice(0,12).map(x => `<tr><td>${esc(x.id)} · ${esc(puzzleName(x.id))}</td><td>${x.n}</td><td>${x.students}</td><td>${fmt(x.usefulness)}</td><td>${x.repeatPairs ? `${x.delta>=0?'+':''}${x.delta.toFixed(1)} · ${x.repeatPairs} repeated` : '—'}</td></tr>`).join('')}</tbody></table>`;
  }

  async function loadForStudent(force=false) {
    const c = client(), s = student();
    if (!c || !s || !document.body.classList.contains('isAdmin')) return;
    if (!force && loading) return;
    const token = ++loadToken;
    loading = true;
    const { data, error } = await c.from(TABLE).select('id,student_id,puzzle_id,assessed_at,context,recognition,visualization,calculation,decision_quality,adaptation,puzzle_usefulness,notes,created_at').eq('student_id',s.id).order('assessed_at',{ascending:false}).limit(100);
    loading = false;
    if (token !== loadToken || student()?.id !== s.id) return;
    if (error) {
      document.getElementById('puzzleAssessmentStatus').textContent = 'Dance Puzzle assessment history could not be loaded.';
      console.error(error);
      return;
    }
    const rows = data || [];
    renderStudentSignals(rows);
    renderHistory(rows);
    renderPilotOverview();
  }

  function sync() {
    if (!document.body.classList.contains('isAdmin')) return;
    const s = student();
    const host = document.getElementById('coachEditor');
    if (!host || !library() || !client()) return;
    buildPanel();
    if (!panel) return;
    const id = s?.id || null;
    if (!id) return;
    if (lastStudentId !== id) {
      lastStudentId = id;
      renderForm();
      loadForStudent(true);
    }
  }

  const observer = new MutationObserver(() => requestAnimationFrame(sync));
  const start = () => {
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    sync();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
  window.addEventListener('pageshow',sync);
})();