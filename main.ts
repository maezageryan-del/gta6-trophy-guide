// Leonida Runbook — a gta6-trophy-guide-01 entry (Node 22, standard library only).
// The guide is this directory's app/ folder: plain static files a browser opens at
// app/index.html (ES module, CSS, no build step), offline — it loads nothing over the
// network, and its trophy list and guides are app/data/trophies.json. The program hands
// it in: it copies app/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads (your screenshots, the first load's
// files and bytes, and your source), with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be byte for
// byte what its own copy writes.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// The app itself is fully offline: index.html, style.css, app.js and
// data/trophies.json are the only files it loads, all from the same folder.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Pre-flight data validation: the Runbook's promise is audited data, so refuse to
// hand in a dossier built on a broken trophy file. The list must hold exactly 55
// trophies, each with a non-blank name and a non-blank guide.
const dataFile = join(here, 'app', 'data', 'trophies.json');
const data = JSON.parse(readFileSync(dataFile, 'utf8'));
const trophies = data?.trophies;
if (!Array.isArray(trophies) || trophies.length !== 55) {
  throw new Error(`trophies.json: expected exactly 55 trophies, found ${Array.isArray(trophies) ? trophies.length : 'none'}`);
}
for (const t of trophies) {
  if (typeof t?.name !== 'string' || t.name.trim() === '') {
    throw new Error(`trophies.json: trophy id ${t?.id ?? '?'} has a blank name`);
  }
  if (typeof t?.guide !== 'string' || t.guide.trim() === '') {
    throw new Error(`trophies.json: trophy "${t.name}" (id ${t.id}) has a blank guide`);
  }
}
const totalSteps = trophies.reduce((n, t) => n + (Array.isArray(t.steps) ? t.steps.length : 0), 0);
const missableCount = trophies.filter((t) => t.missable).length;

// The hand-in needs 3–4 screenshots; check the folder before copying anything so a
// missing or extra shot fails here with a clear message instead of at the scorer.
const shotsDir = join(here, 'screenshots');
const shotFiles = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((f) => f.toLowerCase().endsWith('.png'))
  : [];
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`screenshots/: expected 3–4 PNG screenshots, found ${shotFiles.length}`);
}
console.log(`Leonida Runbook data OK: 55 trophies · ${totalSteps} steps · ${missableCount} missable windows · ${shotFiles.length} screenshots · all names and guides present`);

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
