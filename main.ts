// The Platinum Docket — Leonida's sworn trophy record (gta6-trophy-guide-01, v3).
// Entrypoint: validate the sworn record in app/data/trophies.json, then build
// the make.fun dossier for this entry directory with the vendored library.
// Run with: node main.ts   (Node with type stripping; no package.json needed.)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root = dirname(fileURLToPath(import.meta.url));

interface Step { t: string; c: string }
interface Trophy {
  id: number; name: string; guide: string; steps: Step[];
  missable: boolean; window: string | null; cites: string[];
}
interface Record {
  sources: Record<string, { name: string; role: string; read: string }>;
  trophies: Trophy[];
}

function fail(msg: string): never {
  throw new Error(`Platinum Docket validation: ${msg}`);
}

const data = JSON.parse(readFileSync(join(root, 'app', 'data', 'trophies.json'), 'utf8')) as Record;

// --- validate the sworn record -------------------------------------------
if (!data || typeof data !== 'object') fail('trophies.json is not an object');
if (!Array.isArray(data.trophies)) fail('trophies is not an array');
if (data.trophies.length !== 55) fail(`expected exactly 55 trophies, found ${data.trophies.length}`);
const register = data.sources ?? {};
if (Object.keys(register).length === 0) fail('sources register is empty');

let totalSteps = 0;
for (const trophy of data.trophies) {
  if (!trophy.guide || trophy.guide.trim() === '') fail(`trophy ${trophy.id} (${trophy.name}) has a blank guide`);
  if (!Array.isArray(trophy.steps) || trophy.steps.length === 0) fail(`trophy ${trophy.id} has no steps`);
  for (const step of trophy.steps) {
    if (typeof step !== 'object' || step === null || typeof step.t !== 'string' || step.t.trim() === '')
      fail(`trophy ${trophy.id} has a step that is not a { t, c } exhibit`);
    if (typeof step.c !== 'string' || !(step.c in register))
      fail(`trophy ${trophy.id} cites "${String(step.c)}", which is not in the sources register`);
    totalSteps += 1;
  }
}
if (totalSteps < 450) fail(`expected at least 450 cited steps, found ${totalSteps}`);

const missables = data.trophies.filter((t) => t.missable);
if (missables.length !== 8) fail(`expected exactly 8 missables, found ${missables.length}`);
for (const trophy of missables) {
  if (!trophy.window || trophy.window.trim() === '') fail(`missable trophy ${trophy.id} (${trophy.name}) has no window on record`);
}

console.log(`Platinum Docket validation passed: 55 trophies · ${totalSteps} steps · ${totalSteps} citations · 8 missables with windows · ${Object.keys(register).length} sources`);

// --- filing summary, by grade ----------------------------------------------
const byGrade = new Map<string, { cases: number; exhibits: number }>();
for (const trophy of data.trophies as (Trophy & { grade: string })[]) {
  const slot = byGrade.get(trophy.grade) ?? { cases: 0, exhibits: 0 };
  slot.cases += 1;
  slot.exhibits += trophy.steps.length;
  byGrade.set(trophy.grade, slot);
}
for (const [grade, slot] of [...byGrade.entries()].sort()) {
  console.log(`  ${grade}: ${slot.cases} cases · ${slot.exhibits} cited exhibits`);
}

// --- build the dossier ------------------------------------------------------
const dossier = buildDossier(root, {
  text_max_bytes: 4 * 1024 * 1024,
  screenshots: { max: 8, max_bytes: 256 * 1024 },
});
const out = join(root, 'dossier.json');
writeFileSync(out, dossier);
console.log(`Dossier written: ${out} (${dossier.length} bytes)`);
