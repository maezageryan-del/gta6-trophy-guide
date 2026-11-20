/* The Platinum Docket — sworn trophy record for GTA VI.
   Every step is an exhibit; every exhibit carries its citation.
   Tracker state (earned flags, counters, reveals) persists in localStorage. */
'use strict';

const STORE_KEY = 'platinum-docket-v3';
let DATA = null;
let state = loadState();
let ui = { tab: 'docket', q: '', grade: 'all', stage: 'all', kind: 'all', missableOnly: false, openId: null };

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
  catch { return {}; }
}
function saveState() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function earned(id) { return !!(state.earned && state.earned[id]); }
function setEarned(id, on) {
  state.earned = state.earned || {};
  if (on) state.earned[id] = true; else delete state.earned[id];
  saveState();
}
function countOf(t) {
  if (!t.target) return null;
  const v = state.counts && state.counts[t.id];
  return typeof v === 'number' ? v : 0;
}
function setCount(id, v) {
  state.counts = state.counts || {};
  state.counts[id] = Math.max(0, v);
  saveState();
}
function revealed(id) { return !!(state.revealed && state.revealed[id]); }

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const shortSource = (name) => name.split('—')[0].trim();
function citeChip(key) {
  const src = DATA.sources[key];
  if (!src) return '';
  return `<span class="cite" title="${esc(src.name)} — ${esc(src.role)}">${esc(shortSource(src.name))} · read ${esc(src.read)}</span>`;
}
function totals() {
  const steps = DATA.trophies.reduce((n, t) => n + t.steps.length, 0);
  return { steps, cites: steps, miss: DATA.trophies.filter((t) => t.missable).length, srcs: Object.keys(DATA.sources).length };
}

function parseHash() {
  const h = location.hash.replace(/^#/, '');
  const parts = Object.fromEntries(h.split('&').filter(Boolean).map((kv) => {
    const i = kv.indexOf('='); return i < 0 ? [kv, '1'] : [kv.slice(0, i), kv.slice(i + 1)];
  }));
  if (parts.tab) ui.tab = parts.tab;
  if (parts.open) ui.openId = Number(parts.open);
  return parts;
}

function applyDemo() {
  // #demo pre-marks a small, honest sample as earned for screenshots.
  [2, 3, 8, 15, 33].forEach((id) => { state.earned = state.earned || {}; state.earned[id] = true; });
  const t15 = DATA.trophies.find((t) => t.id === 15);
  if (t15) setCount(15, 137);
  saveState();
}

function renderAudit() {
  const t = totals();
  const done = DATA.trophies.filter((x) => earned(x.id)).length;
  document.getElementById('audit').innerHTML =
    `AUDIT — sworn at load: <b>${DATA.trophies.length} trophies</b> · <b>${t.steps} steps</b> · <b>${t.cites} citations</b> · <b>${t.miss} missables with windows</b> · <b>${t.srcs} dated sources</b> · earned <b>${done}/55</b>`;
  const pct = Math.round((done / DATA.trophies.length) * 100);
  document.getElementById('progress').innerHTML =
    `Platinum progress <span class="bar"><span class="fill" style="width:${pct}%"></span></span> ${done} of ${DATA.trophies.length} cases closed (${pct}%)`;
}

function renderChips() {
  const grades = ['all', 'platinum', 'gold', 'silver', 'bronze'];
  const kinds = ['all', ...new Set(DATA.trophies.map((t) => t.kind))];
  const stages = ['all', '1', '2', '3', '4', '5', '6', '7'];
  const mk = (label, active, fn, cls = '') => `<button type="button" class="chip ${cls} ${active ? 'on' : ''}" data-fn="${fn}">${esc(label)}</button>`;
  let html = grades.map((g) => mk(g === 'all' ? 'All grades' : g, ui.grade === g, `grade:${g}`)).join('');
  html += stages.map((s) => mk(s === 'all' ? 'All stages' : 'Stage ' + s, ui.stage === s, `stage:${s}`)).join('');
  html += kinds.map((k) => mk(k === 'all' ? 'All kinds' : k, ui.kind === k, `kind:${k}`)).join('');
  html += mk('Missable only (8)', ui.missableOnly, 'miss:1', 'miss');
  document.getElementById('chips').innerHTML = html;
  document.querySelectorAll('#chips .chip').forEach((b) => b.addEventListener('click', () => {
    const [k, v] = b.dataset.fn.split(':');
    if (k === 'grade') ui.grade = v; else if (k === 'stage') ui.stage = v;
    else if (k === 'kind') ui.kind = v; else if (k === 'miss') ui.missableOnly = !ui.missableOnly;
    render();
  }));
}

function filtered() {
  const q = ui.q.trim().toLowerCase();
  return DATA.trophies.filter((t) => {
    if (ui.grade !== 'all' && t.grade !== ui.grade) return false;
    if (ui.stage !== 'all' && String(t.stage) !== ui.stage) return false;
    if (ui.kind !== 'all' && t.kind !== ui.kind) return false;
    if (ui.missableOnly && !t.missable) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.chapter + ' ' + t.kind + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
}

function displayName(t) {
  if (t.hidden && !revealed(t.id) && !earned(t.id)) {
    return `<span class="masked">Case sealed — hidden trophy</span><button type="button" class="reveal" data-reveal="${t.id}">Reveal</button>`;
  }
  return esc(t.name);
}

function caseFileRow(t) {
  const steps = t.steps.map((s) => `<li>${esc(typeof s === 'string' ? s : s.t)}${typeof s === 'string' ? '' : citeChip(s.c)}</li>`).join('');
  const counter = t.target ? `<div class="counter">Filed progress:
    <button type="button" data-dec="${t.id}" aria-label="Decrease">−</button>
    <span>${countOf(t)} / ${t.target} ${esc(t.unit || '')}</span>
    <button type="button" data-inc="${t.id}" aria-label="Increase">+</button></div>` : '';
  const warn = t.missable ? `<div class="warn"><b>Missable — window on record:</b> ${esc(t.missableWhy)}<br><b>Window:</b> ${esc(t.window || t.missableWhen || '')}</div>`
    : `<p class="src">Standing: ${esc(t.missableWhy)}</p>`;
  const srcs = (t.sources || []).map((s) => esc(s)).join(' · ');
  return `<tr class="file"><td colspan="10"><div class="filebox">
    <h3>Case ${t.id} — ${esc(t.name)}</h3>
    <div class="meta">${esc(t.description)} · ${esc(t.grade)} · stage ${t.stage} · ${esc(t.chapter)} · ${esc(t.kind)} · time ${esc(t.time)} · difficulty ${t.difficulty}/5</div>
    <p class="guide">${esc(t.guide)}</p>
    ${warn}${counter}
    <ol class="exhibits">${steps}</ol>
    <p class="src">Sources of record: ${srcs}</p>
  </div></td></tr>`;
}

function renderDocket() {
  const rows = filtered();
  const body = rows.map((t) => {
    const main = `<tr class="case ${earned(t.id) ? 'earned' : ''}" data-open="${t.id}">
      <td class="num">${t.id}</td>
      <td class="name">${displayName(t)}<span class="desc">${esc(t.description)}</span></td>
      <td><span class="grade ${esc(t.grade)}">${esc(t.grade)}</span></td>
      <td class="num">${t.stage}</td>
      <td>${esc(t.chapter)}</td>
      <td class="num">${t.steps.length}</td>
      <td class="num">${t.steps.length}</td>
      <td>${t.target ? esc(t.target) + ' ' + esc(t.unit || '') : '—'}</td>
      <td>${t.missable ? '<span class="miss">Missable</span>' : '<span class="safe">Safe</span>'}</td>
      <td><input type="checkbox" class="earn" data-earn="${t.id}" ${earned(t.id) ? 'checked' : ''} aria-label="Mark ${esc(t.name)} earned"></td>
    </tr>`;
    return ui.openId === t.id ? main + caseFileRow(t) : main;
  }).join('');
  document.getElementById('main').innerHTML = rows.length
    ? `<table class="docket"><thead><tr><th>#</th><th>Trophy — case</th><th>Grade</th><th>Stg</th><th>Chapter</th><th>Steps</th><th>Cites</th><th>Target</th><th>Missable</th><th>Earned</th></tr></thead><tbody>${body}</tbody></table>`
    : '<p class="empty">No cases match the current filters.</p>';
  wireRows();
}

function wireRows() {
  document.querySelectorAll('[data-open]').forEach((row) => row.addEventListener('click', (e) => {
    if (e.target.closest('input,button')) return;
    const id = Number(row.dataset.open);
    ui.openId = ui.openId === id ? null : id;
    render();
  }));
  document.querySelectorAll('[data-earn]').forEach((box) => box.addEventListener('change', () => {
    setEarned(Number(box.dataset.earn), box.checked); render();
  }));
  document.querySelectorAll('[data-reveal]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    state.revealed = state.revealed || {}; state.revealed[Number(b.dataset.reveal)] = true; saveState(); render();
  }));
  document.querySelectorAll('[data-inc],[data-dec]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    const id = Number(b.dataset.inc || b.dataset.dec);
    const t = DATA.trophies.find((x) => x.id === id);
    const next = countOf(t) + (b.dataset.inc ? 1 : -1);
    setCount(id, Math.min(next, t.target || next)); render();
  }));
}

function renderRoadmap() {
  const html = DATA.roadmap.map((r) => {
    const list = DATA.trophies.filter((t) => t.stage === r.stage)
      .map((t) => `<li>${earned(t.id) ? '☑' : '☐'} Case ${t.id} — ${esc(t.name)} (${t.steps.length} exhibits)</li>`).join('');
    return `<div class="stage"><h3>Stage ${r.stage} — ${esc(r.title)}</h3><p>${esc(r.blurb)}</p><ul>${list}</ul></div>`;
  }).join('');
  document.getElementById('main').innerHTML = `<section class="panel"><h2>Roadmap — the 7-stage run sheet</h2>${html}</section>`;
}

function renderMissables() {
  const rows = DATA.trophies.filter((t) => t.missable).map((t) =>
    `<tr><td class="num">${t.id}</td><td><b>${esc(t.name)}</b><span class="desc" style="display:block;color:var(--ink2)">${esc(t.description)}</span></td><td>${t.stage}</td><td>${esc(t.window || t.missableWhen || '')}</td><td>${esc(t.missableWhy)}</td><td><input type="checkbox" class="earn" data-earn="${t.id}" ${earned(t.id) ? 'checked' : ''}></td></tr>`).join('');
  document.getElementById('main').innerHTML = `<section class="panel"><h2>Missables — 8 cases with closing windows</h2>
    <p>These are the only cases that can close against you. Each window below is quoted from the record; file these before their stage passes.</p>
    <table class="plain"><thead><tr><th>#</th><th>Trophy</th><th>Stg</th><th>Window</th><th>Why it can be missed</th><th>Earned</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  wireRows();
}

function renderNext() {
  const left = DATA.trophies.filter((t) => !earned(t.id))
    .sort((a, b) => (a.stage - b.stage) || ((b.missable ? 1 : 0) - (a.missable ? 1 : 0)) || (a.id - b.id));
  const rows = left.map((t, i) => `<tr><td class="num">${i + 1}</td><td class="num">${t.id}</td><td><b>${displayName(t)}</b></td><td><span class="grade ${esc(t.grade)}">${esc(t.grade)}</span></td><td>${t.stage}</td><td>${esc(t.chapter)}</td><td>${t.missable ? '<span class="miss">Window open</span>' : '<span class="safe">Safe</span>'}</td><td class="num">${t.steps.length}</td></tr>`).join('');
  document.getElementById('main').innerHTML = `<section class="panel"><h2>Next-Up — ${left.length} cases still open</h2>
    <p>Ordered by roadmap stage, with missable windows first inside each stage — close the closing cases before the safe ones.</p>
    <table class="plain"><thead><tr><th>Order</th><th>#</th><th>Trophy</th><th>Grade</th><th>Stg</th><th>Chapter</th><th>Standing</th><th>Exhibits</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  wireRows();
}

function renderSources() {
  const rows = Object.entries(DATA.sources).map(([key, s]) =>
    `<tr><td><b>${esc(key)}</b></td><td>${esc(s.name)}</td><td>${esc(s.role)}</td><td>${esc(s.read)}</td><td class="num">${DATA.trophies.reduce((n, t) => n + t.steps.filter((x) => typeof x !== 'string' && x.c === key).length, 0)}</td></tr>`).join('');
  document.getElementById('main').innerHTML = `<section class="panel"><h2>Sources — the dated register</h2>
    <p>Every exhibit in every case file cites one of these registers. Citation counts are counted live from the data.</p>
    <table class="plain"><thead><tr><th>Key</th><th>Source</th><th>Role in the record</th><th>Read</th><th>Citations</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="src">${esc(DATA.note || '')}</p></section>`;
}

function render() {
  renderAudit(); renderChips();
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === ui.tab));
  if (ui.tab === 'roadmap') renderRoadmap();
  else if (ui.tab === 'missables') renderMissables();
  else if (ui.tab === 'next') renderNext();
  else if (ui.tab === 'sources') renderSources();
  else renderDocket();
}

function wireChrome() {
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => {
    ui.tab = b.dataset.tab;
    history.replaceState(null, '', ui.tab === 'docket' ? '#tab=docket' : '#tab=' + ui.tab);
    render();
  }));
  document.getElementById('q').addEventListener('input', (e) => { ui.q = e.target.value; if (ui.tab !== 'docket') ui.tab = 'docket'; render(); });
  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'platinum-docket-tracker.json'; a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', (e) => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then((txt) => { try { state = JSON.parse(txt); saveState(); render(); } catch { alert('That file is not a Docket tracker export.'); } });
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Reset the whole tracker? Earned flags, counters and reveals will be cleared.')) { state = {}; saveState(); render(); }
  });
}

fetch('data/trophies.json')
  .then((r) => { if (!r.ok) throw new Error('trophies.json ' + r.status); return r.json(); })
  .then((data) => {
    DATA = data;
    const parts = parseHash();
    if (parts.demo) applyDemo();
    wireChrome();
    render();
  })
  .catch((err) => { document.getElementById('main').innerHTML = `<p class="empty">The record could not be filed: ${esc(err.message)}</p>`; });
