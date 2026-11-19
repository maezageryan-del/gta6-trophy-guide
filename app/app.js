// Leonida Trophy Atlas — offline checklist tracker for the 55 GTA VI trophies.
// Progress lives in localStorage; export/import moves it as a JSON file. No network
// calls are made: the trophy data is fetched once from the local data file.
const STORAGE_KEY = 'leonida-trophy-atlas-v1';
const DEMO_EARNED = [2, 3, 4, 8, 16, 20, 21, 44, 46, 52];
const KIND_LABELS = { story: 'Story', side: 'Side strand', activities: 'Activity', collectibles: 'Collectible', world: 'Open world', completion: 'Completion' };

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const missableListEl = $('missableList');

let earned = loadEarned();
let openGuide = new Set();

function loadEarned() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')); }
  catch { return new Set(); }
}

function saveEarned() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
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
    ? `${left.length} missable ${left.length === 1 ? 'trophy' : 'trophies'} still open — ${left.slice(0, 3).map((t) => t.name).join(', ')}${left.length > 3 ? ` and ${left.length - 3} more` : ''}. Do them before their windows close.`
    : 'All missable trophies are earned. Nothing left that can pass you by.';
}

function spoilerHidden(t) {
  return $('spoiler').checked && t.kind === 'story' && !earned.has(t.id);
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
  title.textContent = spoilerHidden(t) ? 'Hidden story trophy' : t.name;
  if (earned.has(t.id)) {
    const mark = document.createElement('span');
    mark.className = 'earned-mark';
    mark.textContent = ' ✓ earned';
    title.append(mark);
  }
  const desc = document.createElement('p');
  desc.className = 'card-desc';
  desc.textContent = spoilerHidden(t)
    ? 'Spoiler-safe mode is on — earn this trophy in game to reveal its name and description.'
    : t.description;
  const chips = document.createElement('div');
  chips.className = 'chips';
  chips.append(chip(t.grade, t.grade), chip(KIND_LABELS[t.kind] ?? t.kind, 'kind'));
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
  if (isOpen) {
    const guide = document.createElement('div');
    guide.className = 'guide';
    if (t.missable && t.missableWhen) {
      const miss = document.createElement('p');
      miss.className = 'miss-line';
      miss.textContent = `When it can be missed: ${t.missableWhen}`;
      guide.append(miss);
    }
    const body = document.createElement('p');
    body.textContent = t.guide;
    const src = document.createElement('p');
    src.className = 'guide-sources';
    src.textContent = `Sources: ${t.sources.join(' · ')}`;
    guide.append(body, src);
    main.append(guide);
  }
  top.append(box, main);
  card.append(top);
  return card;
}

function chip(text, cls) {
  const el = document.createElement('span');
  el.className = `chip ${cls}`;
  el.textContent = text;
  return el;
}

function currentFilters() {
  return {
    q: $('search').value.trim().toLowerCase(),
    kind: $('kind').value,
    grade: $('grade').value,
    missableOnly: $('missableOnly').checked,
    hideEarned: $('hideEarned').checked,
  };
}

function matchesFilters(t, f) {
  if (f.kind !== 'all' && t.kind !== f.kind) return false;
  if (f.grade !== 'all' && t.grade !== f.grade) return false;
  if (f.missableOnly && !t.missable) return false;
  if (f.hideEarned && earned.has(t.id)) return false;
  if (f.q && !(t.name.toLowerCase().includes(f.q) || t.description.toLowerCase().includes(f.q) || t.guide.toLowerCase().includes(f.q))) return false;
  return true;
}

function renderChecklist() {
  const f = currentFilters();
  const shown = trophies.filter((t) => matchesFilters(t, f));
  listEl.replaceChildren(...shown.map((t) => trophyCard(t)));
  $('emptyState').hidden = shown.length > 0;
  $('resultCount').textContent = `Showing ${shown.length} of ${trophies.length} trophies`;
}

function renderMissables() {
  const miss = trophies.filter((t) => t.missable);
  missableListEl.replaceChildren(...miss.map((t) => trophyCard(t, { showGuide: true })));
}

const ROADMAP = [
  { title: 'Play the story — Chapters 1–2', text: 'Follow the main missions in order and sample each activity once as it unlocks. Grab the easy partner and world trophies that appear along the way (Hot Together, Retail Therapy) while your partner is with you.', covers: 'Just Like Paradise · Paradise Lost · T**s Ass Drug Money · Trust · Master of None' },
  { title: 'Chapters 3–4 and the finale', text: 'Push through the Vice City chapters and the final mission. Keep making story choices as they come — the choice counter only grows during the story — and finish the big heist missions when they appear.', covers: 'Vice City, Baby! · Top Of The World, Ma · Break the Bank · Family Matters · DWNFALL · Hi-Jacked · Snow Storm · You Gotta Know When to Get Off · Actions Speak Louder' },
  { title: 'Stranger strands', text: 'Clear the stranger mission strands across Leonida: Andy, Kenton, Billy, Randy, Tyrone and Bret, plus any others you find. Eight finished strands earns the silver; each strand\'s final mission is its own trophy.', covers: 'Strangers & Freaks · Road to Rehabilitation · This Was No Boat Accident · The Lone Rider · Supply & Demand · Spin On This! · Fair Game' },
  { title: 'Activities & skills', text: 'Gold all 42 Shooting Range challenges, win the 14 drone races and 20 different races, beat Cal at fishing, finish an arcade game and a bowling game, meditate at all 18 spots, and clear 50 challenges. Fold the 250 stunts into your driving between venues.', covers: 'The Shootist · Top Fun · Earn Cash, Not Kudos · Baited My Tackle · Stick Fiddler · Let’s Go Bowling · Positive Mental Attitude · One Last Thing · Cunning Stunts · Ten Pin' },
  { title: 'Open-world crime & money', text: 'Rob the 5 bank vaults, an armored truck and one illegal operation per gang, pull off the stealth jewelry-store robbery, and launder $250,000 of Marked Bills while spending $100,000 in shops. Buy all 8 garages and register 10 vehicles in the Scooter Bros app as you go.', covers: 'Maximum Withdrawal · A Classic Blitz Play · Pest Control · Sneakthief · Dime on the Dollar · Treat Yo Self · Little Boxes · On the Spot · Gunslinger · Catch Me If You Can · Challenging Tank' },
  { title: 'Collectibles & exploration sweep', text: 'The long tail: complete 3 card sets, WAiNK It at 100 locations, discover 100 vehicles and explore all 52 areas of Leonida. Use the checklist filters to sweep one kind at a time.', covers: 'Don\'t Touch My Deck · You WAiNKer! · Whip It Good · The Goodtime State · Capital Offense · In The Beginning… · Personal Best · Bad Luck, I Guess · The Truth Is Out There' },
  { title: '100% completion & platinum', text: 'Check the in-game completion stats for the last few percent — usually one missed strand, collectible set or activity. When it hits 100%, the gold pops, and the platinum follows the moment every other trophy is earned.', covers: 'A Long Road · Vice Got a Price!' },
];

function renderRoadmap() {
  const list = $('roadmapList');
  list.replaceChildren(...ROADMAP.map((stage) => {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = stage.title;
    const p = document.createElement('p');
    p.textContent = stage.text;
    const covers = document.createElement('p');
    covers.className = 'covers';
    covers.textContent = `Covers: ${stage.covers}`;
    li.append(h, p, covers);
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
  const blob = new Blob([JSON.stringify({ game: 'GTA VI', earned: [...earned].sort((a, b) => a - b), exported: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  if (!file) return;
  const data = JSON.parse(await file.text());
  const ids = Array.isArray(data) ? data : data.earned;
  earned = new Set(ids.filter((id) => trophies.some((t) => t.id === id)));
  saveEarned();
  renderAll();
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
  renderChecklist();
  renderMissables();
}

document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
$('missableBannerGo').addEventListener('click', () => switchTab('missables'));
for (const id of ['search', 'kind', 'grade', 'missableOnly', 'hideEarned', 'spoiler']) {
  $(id).addEventListener('input', renderAll);
  $(id).addEventListener('change', renderAll);
}
$('exportBtn').addEventListener('click', exportProgress);
$('importFile').addEventListener('change', (e) => importProgress(e.target.files[0]));
$('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all earned trophies?')) { earned = new Set(); saveEarned(); renderAll(); }
});

applyHashState();
renderRoadmap();
renderAll();
