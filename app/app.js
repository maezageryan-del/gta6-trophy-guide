// Leonida Runbook — offline checklist tracker for the 55 GTA VI trophies.
// Audited, step-structured data: every trophy carries numbered steps, a run-sheet
// stage, a missable verdict and cited sources. Progress and counters live in
// localStorage; export/import moves them as a JSON file. No network calls are
// made: the trophy data is fetched once from the local data file.
const STORAGE_KEY = 'leonida-runbook-v1';
const COUNTER_KEY = 'leonida-runbook-counters-v1';
const DEMO_EARNED = [2, 3, 4, 8, 16, 20, 21, 44, 46, 52];
const KIND_LABELS = { story: 'Story', side: 'Side strand', activities: 'Activity', collectibles: 'Collectible', world: 'Open world', completion: 'Completion' };

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const sources = doc.sources ?? {};
const roadmap = doc.roadmap ?? [];
const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const missableListEl = $('missableList');

let earned = loadEarned();
let counters = loadCounters();
let openGuide = new Set();

function loadEarned() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')); }
  catch { return new Set(); }
}

function saveEarned() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function loadCounters() {
  try { return JSON.parse(localStorage.getItem(COUNTER_KEY) ?? '{}'); }
  catch { return {}; }
}

function saveCounters() {
  localStorage.setItem(COUNTER_KEY, JSON.stringify(counters));
}

function sourceName(key) {
  return sources[key]?.name ?? key;
}

function stageTitle(stage) {
  return roadmap.find((s) => s.stage === stage)?.title ?? `Stage ${stage}`;
}

function renderAudit() {
  const total = trophies.length;
  const withSteps = trophies.filter((t) => Array.isArray(t.steps) && t.steps.length > 0).length;
  const stepCount = trophies.reduce((n, t) => n + (t.steps?.length ?? 0), 0);
  const verdicts = trophies.filter((t) => t.missableWhy && t.missableWhy.trim()).length;
  const windows = trophies.filter((t) => t.missable && t.window).length;
  const counted = trophies.filter((t) => t.target != null).length;
  const readDates = [...new Set(Object.values(sources).map((s) => s.read).filter(Boolean))];
  $('auditStrip').textContent =
    `Audit: ${total}/${total} trophies · ${withSteps} with step-by-step guides · ${stepCount} steps · ` +
    `${verdicts} missable verdicts · ${windows} missable windows · ${counted} counted targets · ` +
    `sources read ${readDates.join(', ') || '—'}`;
}

function gradeCounts() {
  const counts = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const t of trophies) {
    counts[t.grade][1] += 1;
    if (earned.has(t.id)) counts[t.grade][0] += 1;
  }
  return counts;
}

function renderProgress() {
  const total = trophies.length;
  const pct = Math.round((earned.size / total) * 100);
  $('progressText').textContent = `${earned.size} / ${total} earned`;
  $('progressPct').textContent = `${pct}%`;
  $('progressFill').style.width = `${pct}%`;
  const counts = gradeCounts();
  $('gradeCounts').innerHTML = Object.entries(counts)
    .map(([g, [have, all]]) => `<span>${g[0].toUpperCase() + g.slice(1)} <b>${have}/${all}</b></span>`)
    .join('');
  const left = trophies.filter((t) => t.missable && !earned.has(t.id));
  $('missableBannerText').textContent = left.length
    ? `${left.length} missable ${left.length === 1 ? 'trophy' : 'trophies'} still open — ${left.slice(0, 3).map((t) => t.name).join(', ')}${left.length > 3 ? ` and ${left.length - 3} more` : ''}. Do them inside their windows.`
    : 'All missable trophies are earned. Nothing left that can pass you by.';
}

function spoilerHidden(t) {
  return $('spoiler').checked && t.hidden && !earned.has(t.id);
}

function displayName(t) {
  return spoilerHidden(t) ? 'Hidden trophy' : t.name;
}

function chip(text, cls) {
  const el = document.createElement('span');
  el.className = `chip ${cls}`;
  el.textContent = text;
  return el;
}

function counterStep(t) {
  return t.target >= 10000 ? 1000 : 1;
}

function buildCounter(t, wrap) {
  const box = document.createElement('div');
  box.className = 'counter';
  const label = document.createElement('span');
  label.className = 'counter-label';
  const value = document.createElement('strong');
  value.className = 'counter-value';
  const paint = () => {
    const n = counters[t.id] ?? 0;
    value.textContent = `${n.toLocaleString('en-US')} / ${t.target.toLocaleString('en-US')}`;
    label.textContent = `Progress — ${t.unit}: `;
  };
  const minus = document.createElement('button');
  minus.type = 'button';
  minus.textContent = '−';
  minus.setAttribute('aria-label', `Decrease ${t.name} progress`);
  minus.addEventListener('click', () => {
    counters[t.id] = Math.max(0, (counters[t.id] ?? 0) - counterStep(t));
    saveCounters();
    paint();
  });
  const plus = document.createElement('button');
  plus.type = 'button';
  plus.textContent = '+';
  plus.setAttribute('aria-label', `Increase ${t.name} progress`);
  plus.addEventListener('click', () => {
    counters[t.id] = Math.min(t.target, (counters[t.id] ?? 0) + counterStep(t));
    saveCounters();
    paint();
  });
  paint();
  box.append(label, minus, value, plus);
  wrap.append(box);
}

function trophyCard(t, { showGuide = false } = {}) {
  const card = document.createElement('article');
  card.className = 'card' + (earned.has(t.id) ? ' earned' : '');
  const top = document.createElement('div');
  top.className = 'card-top';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.id);
  box.setAttribute('aria-label', `Mark ${t.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.id); else earned.delete(t.id);
    saveEarned();
    renderAll();
  });
  const main = document.createElement('div');
  main.className = 'card-main';
  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = displayName(t);
  if (earned.has(t.id)) {
    const mark = document.createElement('span');
    mark.className = 'earned-mark';
    mark.textContent = ' ✓ earned';
    title.append(mark);
  }
  const desc = document.createElement('p');
  desc.className = 'card-desc';
  desc.textContent = spoilerHidden(t)
    ? 'Spoiler-safe mode is on — earn this hidden trophy in game to reveal its name and description.'
    : t.description;
  const chips = document.createElement('div');
  chips.className = 'chips';
  chips.append(chip(t.grade, t.grade), chip(KIND_LABELS[t.kind] ?? t.kind, 'kind'));
  chips.append(chip(`Stage ${t.stage} · ${stageTitle(t.stage)}`, 'stage'));
  chips.append(chip(t.chapter, 'chapter'));
  chips.append(chip(`⏱ ${t.time}`, 'meta'));
  chips.append(chip(`Difficulty ${t.difficulty}/5`, 'meta'));
  if (t.target != null) chips.append(chip(`Target ${t.target.toLocaleString('en-US')} ${t.unit}`, 'target'));
  if (t.hidden) chips.append(chip('Hidden on PSN', 'hidden'));
  if (t.missable) chips.append(chip('Missable', 'missable'));
  main.append(title, desc, chips);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'guide-toggle';
  const isOpen = showGuide || openGuide.has(t.id);
  toggle.textContent = isOpen ? 'Hide guide ▲' : 'Show guide ▼';
  toggle.addEventListener('click', () => {
    if (openGuide.has(t.id)) openGuide.delete(t.id); else openGuide.add(t.id);
    renderAll();
  });
  main.append(toggle);
  if (isOpen) main.append(buildGuide(t));
  top.append(box, main);
  card.append(top);
  return card;
}

function buildGuide(t) {
  const guide = document.createElement('div');
  guide.className = 'guide';
  const verdict = document.createElement('p');
  verdict.className = t.missable ? 'miss-line' : 'verdict-line';
  verdict.textContent = t.missable
    ? `Missable — ${t.missableWhy}`
    : `Not missable — ${t.missableWhy}`;
  guide.append(verdict);
  if (t.missable && t.window) {
    const win = document.createElement('p');
    win.className = 'window-callout';
    win.textContent = `Window: ${t.window} (Stage ${t.stage} · ${t.chapter})`;
    guide.append(win);
  }
  const body = document.createElement('p');
  body.textContent = t.guide;
  guide.append(body);
  if (Array.isArray(t.steps) && t.steps.length) {
    const head = document.createElement('p');
    head.className = 'steps-head';
    head.textContent = 'Step by step:';
    const ol = document.createElement('ol');
    ol.className = 'steps';
    for (const s of t.steps) {
      const li = document.createElement('li');
      li.textContent = s;
      ol.append(li);
    }
    guide.append(head, ol);
  }
  if (t.target != null) buildCounter(t, guide);
  const meta = document.createElement('p');
  meta.className = 'guide-meta';
  meta.textContent = `Stage ${t.stage} — ${stageTitle(t.stage)} · ${t.chapter} · Time ${t.time} · Difficulty ${t.difficulty}/5`;
  const src = document.createElement('p');
  src.className = 'guide-sources';
  const citeNames = (t.cites ?? []).map(sourceName);
  src.textContent = `Sources: ${citeNames.length ? citeNames.join(' · ') : t.sources.join(' · ')}`;
  guide.append(meta, src);
  return guide;
}

function currentFilters() {
  return {
    q: $('search').value.trim().toLowerCase(),
    kind: $('kind').value,
    grade: $('grade').value,
    stage: $('stage').value,
    missableOnly: $('missableOnly').checked,
    hideEarned: $('hideEarned').checked,
  };
}

function matchesFilters(t, f) {
  if (f.kind !== 'all' && t.kind !== f.kind) return false;
  if (f.grade !== 'all' && t.grade !== f.grade) return false;
  if (f.stage !== 'all' && t.stage !== Number(f.stage)) return false;
  if (f.missableOnly && !t.missable) return false;
  if (f.hideEarned && earned.has(t.id)) return false;
  if (f.q && !(t.name.toLowerCase().includes(f.q) || t.description.toLowerCase().includes(f.q) || t.guide.toLowerCase().includes(f.q) || (t.steps ?? []).join(' ').toLowerCase().includes(f.q))) return false;
  return true;
}

function renderChecklist() {
  const f = currentFilters();
  const shown = trophies.filter((t) => matchesFilters(t, f));
  listEl.replaceChildren(...shown.map((t) => trophyCard(t)));
  $('emptyState').hidden = shown.length > 0;
  $('resultCount').textContent = `Showing ${shown.length} of ${trophies.length} trophies`;
}

function renderNextUp() {
  const next = trophies
    .filter((t) => !earned.has(t.id))
    .sort((a, b) => (Number(b.missable) - Number(a.missable)) || (a.stage - b.stage) || (a.id - b.id))
    .slice(0, 5);
  const wrap = $('nextUpList');
  if (!next.length) {
    wrap.innerHTML = '<p class="next-up-done">Everything is earned — platinum run complete. 🏆</p>';
    return;
  }
  wrap.replaceChildren(...next.map((t, i) => {
    const row = document.createElement('div');
    row.className = 'next-up-row' + (t.missable ? ' urgent' : '');
    const rank = document.createElement('span');
    rank.className = 'next-up-rank';
    rank.textContent = `${i + 1}`;
    const body = document.createElement('div');
    body.className = 'next-up-body';
    const name = document.createElement('strong');
    name.textContent = displayName(t);
    const note = document.createElement('span');
    note.className = 'next-up-note';
    note.textContent = t.missable && t.window
      ? `Stage ${t.stage} · ${t.chapter} · Window: ${t.window}`
      : `Stage ${t.stage} · ${stageTitle(t.stage)} · ${t.chapter} · ${t.time}`;
    body.append(name, note);
    const go = document.createElement('button');
    go.type = 'button';
    go.textContent = 'Guide';
    go.addEventListener('click', () => {
      openGuide.add(t.id);
      renderAll();
      document.querySelectorAll('.card')[0]?.scrollIntoView;
      window.scrollTo({ top: document.body.scrollHeight * 0, behavior: 'smooth' });
      const cards = [...document.querySelectorAll('#trophyList .card')];
      const idx = trophies.filter((x) => matchesFilters(x, currentFilters())).findIndex((x) => x.id === t.id);
      if (idx >= 0 && cards[idx]) cards[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    row.append(rank, body, go);
    return row;
  }));
}

function renderMissables() {
  const miss = trophies.filter((t) => t.missable);
  missableListEl.replaceChildren(...miss.map((t) => trophyCard(t, { showGuide: true })));
}

function renderRoadmap() {
  const list = $('roadmapList');
  list.replaceChildren(...roadmap.map((stage) => {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = `Stage ${stage.stage} — ${stage.title}`;
    const p = document.createElement('p');
    p.textContent = stage.blurb;
    const inStage = trophies.filter((t) => t.stage === stage.stage).sort((a, b) => a.id - b.id);
    const done = inStage.filter((t) => earned.has(t.id)).length;
    const count = document.createElement('p');
    count.className = 'stage-count';
    count.textContent = `${done} / ${inStage.length} earned in this stage`;
    li.append(h, p, count);
    const rows = document.createElement('div');
    rows.className = 'run-rows';
    for (const t of inStage) {
      const row = document.createElement('div');
      row.className = 'run-row' + (earned.has(t.id) ? ' earned' : '');
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = earned.has(t.id);
      box.setAttribute('aria-label', `Mark ${t.name} as earned`);
      box.addEventListener('change', () => {
        if (box.checked) earned.add(t.id); else earned.delete(t.id);
        saveEarned();
        renderAll();
        renderRoadmap();
      });
      const label = document.createElement('span');
      label.className = 'run-name';
      label.textContent = `${displayName(t)} `;
      const meta = document.createElement('span');
      meta.className = 'run-meta';
      meta.textContent = `· ${t.grade} · ${t.chapter} · ${t.time}`;
      label.append(meta);
      row.append(box, label);
      if (t.missable && t.window) {
        const flag = document.createElement('span');
        flag.className = 'run-window';
        flag.textContent = `⚠ Window: ${t.window}`;
        row.append(flag);
      }
      rows.append(row);
    }
    li.append(rows);
    return li;
  }));
}

function renderSources() {
  const list = $('sourceList');
  list.replaceChildren(...Object.values(sources).map((s) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = s.name;
    li.append(strong, document.createTextNode(` — ${s.role} (read ${s.read}).`));
    return li;
  }));
}

function switchTab(name) {
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach((p) => {
    const isActive = p.id === `tab-${name}`;
    p.classList.toggle('active', isActive);
    p.hidden = !isActive;
  });
}

function exportProgress() {
  const blob = new Blob([JSON.stringify({ game: 'GTA VI', earned: [...earned].sort((a, b) => a - b), counters, exported: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-runbook-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  if (!file) return;
  const data = JSON.parse(await file.text());
  const ids = Array.isArray(data) ? data : data.earned;
  earned = new Set(ids.filter((id) => trophies.some((t) => t.id === id)));
  if (!Array.isArray(data) && data.counters && typeof data.counters === 'object') {
    counters = Object.fromEntries(Object.entries(data.counters).filter(([id]) => trophies.some((t) => t.id === Number(id))));
    saveCounters();
  }
  saveEarned();
  renderAll();
  renderRoadmap();
}

function applyHashState() {
  const hash = new URLSearchParams(location.hash.slice(1));
  const tab = hash.get('tab');
  if (tab && document.getElementById(`tab-${tab}`)) switchTab(tab);
  if (hash.has('demo')) {
    earned = new Set(DEMO_EARNED);
    saveEarned();
  }
  const open = Number(hash.get('open'));
  if (open && trophies.some((t) => t.id === open)) openGuide.add(open);
}

function renderAll() {
  renderProgress();
  renderNextUp();
  renderChecklist();
  renderMissables();
}

const stageSelect = $('stage');
for (const s of roadmap) {
  const opt = document.createElement('option');
  opt.value = String(s.stage);
  opt.textContent = `Stage ${s.stage} — ${s.title}`;
  stageSelect.append(opt);
}

document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
$('missableBannerGo').addEventListener('click', () => switchTab('missables'));
for (const id of ['search', 'kind', 'grade', 'stage', 'missableOnly', 'hideEarned', 'spoiler']) {
  $(id).addEventListener('input', renderAll);
  $(id).addEventListener('change', renderAll);
}
$('exportBtn').addEventListener('click', exportProgress);
$('importFile').addEventListener('change', (e) => importProgress(e.target.files[0]));
$('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all earned trophies and counters?')) { earned = new Set(); counters = {}; saveEarned(); saveCounters(); renderAll(); renderRoadmap(); }
});

applyHashState();
renderAudit();
renderSources();
renderRoadmap();
renderAll();
