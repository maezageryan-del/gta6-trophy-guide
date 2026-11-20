// Compact trophies.json into line form: one line per top-level section,
// with the trophies array rendered as one trophy object per line.
// The parsed data is unchanged — only the whitespace layout changes.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, '..', 'app', 'data', 'trophies.json');

const originalText = readFileSync(target, 'utf8');
const data = JSON.parse(originalText);

const keys = Object.keys(data);
const lines = [];
lines.push('{');

keys.forEach((key, keyIndex) => {
  const isLastKey = keyIndex === keys.length - 1;
  const comma = isLastKey ? '' : ',';
  const value = data[key];

  if (key === 'trophies' && Array.isArray(value)) {
    lines.push(`  ${JSON.stringify(key)}: [`);
    value.forEach((trophy, trophyIndex) => {
      const trophyComma = trophyIndex === value.length - 1 ? '' : ',';
      lines.push(`    ${JSON.stringify(trophy)}${trophyComma}`);
    });
    lines.push(`  ]${comma}`);
  } else {
    lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(value)}${comma}`);
  }
});

lines.push('}');

const compactText = lines.join('\n') + '\n';

// Safety check before writing: the compact form must parse back to
// a structure deep-equal to the original input.
const reparsed = JSON.parse(compactText);
if (JSON.stringify(reparsed) !== JSON.stringify(data)) {
  throw new Error('compact form does not round-trip to the same data — not writing');
}

writeFileSync(target, compactText);
console.log(`Wrote ${target}: ${lines.length} lines, trophies=${data.trophies.length}`);
