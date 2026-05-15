#!/usr/bin/env node
/**
 * Side-by-side visual proof: render a C4 .puml with PlantUML and render the
 * catalyst-produced .drawio with drawio-export, so a human can eyeball that
 * every element/connector survived the conversion.
 *
 * This is PROOF, not a gate. PlantUML and draw.io use different layout
 * engines, so the two images are never pixel-identical even for a perfect
 * conversion — the machine correctness gate is the structural parity test
 * (tests/parity.test.mts) and the drawio structural snapshot
 * (tests/golden.test.mts). See README "Verifying conversions".
 *
 * Requirements: java, docker, network (PlantUML C4 !include + jar download).
 * Optional: ImageMagick `montage` for a combined image.
 *
 * Usage:
 *   node scripts/render-compare.mjs [src.puml] [outDir]
 *   PLANTUML_JAR=/path/to/plantuml.jar node scripts/render-compare.mjs ...
 *
 * Env (all overridable, documented defaults):
 *   PLANTUML_VERSION   default 1.2024.7
 *   PLANTUML_JAR       default <outDir>/plantuml.jar (downloaded if absent)
 *   DRAWIO_EXPORT_IMAGE default rlespinasse/drawio-export:latest
 *   DRAWIO_EXPORT_SCALE default 2
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { Catalyst } from '../dist/catalyst.mjs';

const SRC = resolve(process.argv[2] ?? 'tests/fixtures/c4-exhaustive.puml');
const OUT = resolve(process.argv[3] ?? 'build/render-compare');
const PLANTUML_VERSION = process.env.PLANTUML_VERSION ?? '1.2024.7';
const DRAWIO_IMAGE = process.env.DRAWIO_EXPORT_IMAGE ?? 'rlespinasse/drawio-export:latest';
const DRAWIO_SCALE = process.env.DRAWIO_EXPORT_SCALE ?? '2';

const name = basename(SRC).replace(/\.puml$/, '');
mkdirSync(OUT, { recursive: true });

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
}

// 1. Source .puml -> PNG (PlantUML).
const jar = process.env.PLANTUML_JAR ?? join(OUT, 'plantuml.jar');
if (!existsSync(jar)) {
  console.log(`· downloading plantuml ${PLANTUML_VERSION}`);
  sh('curl', ['-sSL', '-o', jar,
    `https://repo1.maven.org/maven2/net/sourceforge/plantuml/plantuml/${PLANTUML_VERSION}/plantuml-${PLANTUML_VERSION}.jar`]);
}
console.log('· rendering source puml via PlantUML');
sh('java', ['-jar', jar, '-tpng', '-nometadata', SRC, '-o', OUT]);
const sourcePng = join(OUT, `${name}.png`);

// 2. .puml -> .drawio (catalyst).
console.log('· converting puml -> drawio (catalyst)');
const drawio = join(OUT, `${name}.drawio`);
writeFileSync(drawio, await Catalyst.convert(readFileSync(SRC, 'utf-8')));

// 3. .drawio -> PNG (drawio-export container).
console.log('· rendering drawio via drawio-export');
sh('docker', ['run', '--rm', '-v', `${OUT}:/data`, DRAWIO_IMAGE,
  '-f', 'png', '--scale', DRAWIO_SCALE, `${name}.drawio`]);
// drawio-export names the file `<basename>-<diagramName>.png` (diagram name
// is "Page-1", not the source filename), so locate the produced PNG instead
// of assuming the name.
const exportDir = join(OUT, 'export');
const drawioPngFinal = join(OUT, `${name}.drawio.png`);
const produced = existsSync(exportDir)
  ? readdirSync(exportDir).filter((f) => f.endsWith('.png')).sort()
  : [];
if (produced.length > 0) {
  copyFileSync(join(exportDir, produced[0]), drawioPngFinal);
} else {
  console.warn('! drawio-export produced no PNG');
}

// 4. Side-by-side (best-effort; needs ImageMagick montage).
let combined = null;
try {
  combined = join(OUT, `${name}.compare.png`);
  sh('montage', ['-label', 'source.puml (PlantUML)', sourcePng,
    '-label', 'catalyst .drawio (draw.io)', drawioPngFinal,
    '-tile', '2x1', '-geometry', '+10+10', '-background', 'white', combined]);
} catch {
  combined = null; // montage unavailable — the two PNGs are still produced.
}

console.log('\nrendered:');
console.log(`  source : ${sourcePng}`);
console.log(`  drawio : ${drawioPngFinal}`);
if (combined) console.log(`  compare: ${combined}`);
else console.log('  (install ImageMagick `montage` for a combined image)');
