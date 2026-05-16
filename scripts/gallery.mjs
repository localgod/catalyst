#!/usr/bin/env node
/**
 * Batch dual-render GALLERY for the use-case corpus.
 *
 * For every tests/fixtures/corpus/*.puml it produces, side by side:
 *   - <name>.puml.png    — PlantUML render of the SOURCE (ground truth)
 *   - <name>.drawio      — the catalyst conversion
 *   - <name>.drawio.png  — draw.io render of that conversion
 * and writes docs/gallery/README.md grouping the fixtures by use-case class
 * with both images next to each other so a human can eyeball that every
 * element/connector/label survived the conversion.
 *
 * This is the human-review half of the correctness story; the machine half is
 * tests/corpus-sanity.test.mts (structural gate) + tests/golden.test.mjs.
 * PlantUML and draw.io use different layout engines, so the two images are
 * never pixel-identical even for a perfect conversion — compare CONTENT
 * (boxes, arrows, labels, descriptions), not geometry.
 *
 * Requirements: java, docker, network (PlantUML C4 !include + jar download).
 *
 * Env (all overridable, documented defaults — mirrors render-compare.mjs):
 *   PLANTUML_VERSION    default 1.2024.7
 *   PLANTUML_JAR        default <OUT>/plantuml.jar (downloaded if absent)
 *   DRAWIO_EXPORT_IMAGE default rlespinasse/drawio-export:latest
 *   DRAWIO_EXPORT_SCALE default 2
 *   CORPUS_DIR          default tests/fixtures/corpus
 *   GALLERY_OUT         default docs/gallery
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync, writeFileSync, copyFileSync, readdirSync, renameSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { Catalyst } from '../dist/catalyst.mjs';

const PLANTUML_VERSION = process.env.PLANTUML_VERSION ?? '1.2024.7';
const DRAWIO_IMAGE = process.env.DRAWIO_EXPORT_IMAGE ?? 'rlespinasse/drawio-export:latest';
const DRAWIO_SCALE = process.env.DRAWIO_EXPORT_SCALE ?? '2';
const CORPUS_DIR = resolve(process.env.CORPUS_DIR ?? 'tests/fixtures/corpus');
const OUT = resolve(process.env.GALLERY_OUT ?? 'docs/gallery');
const IMG = join(OUT, 'img');
const DRAWIO_DIR = join(OUT, 'drawio');

const CLASSES = [
  ['Topology shapes', 'topology-', 'Stresses the ELK layout engine: rank ordering, fan-out, wide ranks, cycles, disconnected components, deep nesting.'],
  ['Relationship variants', 'rel-', 'Bidirectional, directional hints, with/without technology, long labels, layout-only `Lay_` constraints.'],
  ['C4 level coverage', 'level-', 'One canonical diagram per C4 abstraction (Component, Dynamic, System Landscape). Context/Container/Deployment live in tests/fixtures/.'],
  ['Edge cases & styling', 'edge-', 'Tags / dashed rels, Unicode & XML-special chars, label-only entities, a ~30-node diagram.'],
];

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
}

mkdirSync(IMG, { recursive: true });
mkdirSync(DRAWIO_DIR, { recursive: true });

const fixtures = readdirSync(CORPUS_DIR).filter((f) => f.endsWith('.puml')).sort();
if (fixtures.length === 0) {
  console.error(`no .puml fixtures in ${CORPUS_DIR}`);
  process.exit(1);
}

// 1. PlantUML: render the whole corpus dir in one JVM invocation.
const jar = process.env.PLANTUML_JAR ?? join(OUT, 'plantuml.jar');
if (!existsSync(jar)) {
  console.log(`· downloading plantuml ${PLANTUML_VERSION}`);
  sh('curl', ['-sSL', '-o', jar,
    `https://repo1.maven.org/maven2/net/sourceforge/plantuml/plantuml/${PLANTUML_VERSION}/plantuml-${PLANTUML_VERSION}.jar`]);
}
console.log(`· rendering ${fixtures.length} source puml via PlantUML`);
sh('java', ['-jar', jar, '-tpng', '-nometadata', `${CORPUS_DIR}/`, '-o', IMG]);
for (const f of fixtures) {
  const stem = basename(f, '.puml');
  const produced = join(IMG, `${stem}.png`);
  if (existsSync(produced)) {
    // Rename (not copy) to the committed name so the bare PlantUML <stem>.png
    // isn't left behind as a redundant duplicate of <stem>.puml.png.
    renameSync(produced, join(IMG, `${stem}.puml.png`));
  }
}

// 2. catalyst: puml -> drawio for every fixture.
console.log('· converting puml -> drawio (catalyst)');
for (const f of fixtures) {
  const stem = basename(f, '.puml');
  const xml = await Catalyst.convert(readFileSync(join(CORPUS_DIR, f), 'utf-8'));
  writeFileSync(join(DRAWIO_DIR, `${stem}.drawio`), xml);
}

// 3. draw.io: render every .drawio in one container run (folder input).
//    The container runs as root and writes a root-owned `export/` dir, so its
//    lifecycle is managed root-side (a node rmSync would EACCES).
console.log('· rendering drawio via drawio-export');
const expDir = join(DRAWIO_DIR, 'export');
const cleanExport = () => {
  try {
    sh('docker', ['run', '--rm', '-v', `${DRAWIO_DIR}:/data`,
      '--entrypoint', '/bin/sh', DRAWIO_IMAGE, '-c', 'rm -rf /data/export']);
  } catch { /* nothing to clean */ }
};
cleanExport();
sh('docker', ['run', '--rm', '-v', `${DRAWIO_DIR}:/data`, DRAWIO_IMAGE,
  '-f', 'png', '--scale', DRAWIO_SCALE, '.']);
const exported = existsSync(expDir)
  ? readdirSync(expDir).filter((x) => x.endsWith('.png'))
  : [];
for (const f of fixtures) {
  const stem = basename(f, '.puml');
  // drawio-export names files "<stem>-<diagramName>.png" (diagram = "Page-1").
  const hit = exported.find((x) => x === `${stem}.png` || x.startsWith(`${stem}-`));
  if (hit) copyFileSync(join(expDir, hit), join(IMG, `${stem}.drawio.png`));
  else console.warn(`! no drawio png for ${stem}`);
}
cleanExport();

// 4. Gallery README — grouped by class, both images side by side.
const lines = [];
lines.push('# Conversion gallery — use-case corpus');
lines.push('');
lines.push('Generated by `make gallery` (`scripts/gallery.mjs`) from every fixture in');
lines.push('[`tests/fixtures/corpus/`](../../tests/fixtures/corpus/). Each row shows the');
lines.push('**source PlantUML** render next to the **catalyst → draw.io** render.');
lines.push('');
lines.push('> PlantUML and draw.io use different layout engines — the two images are');
lines.push('> never pixel-identical. Compare **content**: every box, arrow, verb,');
lines.push('> technology `[in brackets]`, and description must survive. The machine');
lines.push('> gate is [`tests/corpus-sanity.test.mts`](../../tests/corpus-sanity.test.mts).');
lines.push('');
lines.push('Regenerate after any engine change: `make gallery && git add docs/gallery/`.');
lines.push('');
for (const [title, prefix, blurb] of CLASSES) {
  const members = fixtures.filter((f) => f.startsWith(prefix));
  if (members.length === 0) continue;
  lines.push(`## ${title}`);
  lines.push('');
  lines.push(blurb);
  lines.push('');
  for (const f of members) {
    const stem = basename(f, '.puml');
    const src = readFileSync(join(CORPUS_DIR, f), 'utf-8').trim();
    lines.push(`### \`${f}\``);
    lines.push('');
    lines.push('| Source PlantUML | catalyst → draw.io |');
    lines.push('|---|---|');
    lines.push(`| ![${stem} source](img/${stem}.puml.png) | ![${stem} drawio](img/${stem}.drawio.png) |`);
    lines.push('');
    lines.push('<details><summary>PlantUML source</summary>');
    lines.push('');
    lines.push('```plantuml');
    lines.push(src);
    lines.push('```');
    lines.push('');
    lines.push('</details>');
    lines.push('');
  }
}
// Collapse any accidental run of blank lines to a single one and end with
// exactly one trailing newline — markdownlint MD012 (no multiple consecutive
// blank lines) is enforced by `npm run mdlint` in CI.
writeFileSync(
  join(OUT, 'README.md'),
  lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '') + '\n',
);

console.log(`\ngallery: ${join(OUT, 'README.md')}`);
console.log(`  ${fixtures.length} fixtures · images in ${IMG} · drawio in ${DRAWIO_DIR}`);
