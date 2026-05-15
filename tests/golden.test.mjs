import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Catalyst } from '../src/catalyst.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (n) => readFileSync(join(__dirname, 'fixtures', n), 'utf-8');
const goldenDir = join(__dirname, 'golden');

/**
 * Deterministic structural fingerprint of the drawio output. PlantUML↔drawio
 * pixel comparison is impossible (different layout engines), so the stable,
 * same-engine regression gate is this: the SET of shapes (id+c4Type), the SET
 * of connectors (source→target), styled-override counts, and the diagram id.
 * Coordinates are intentionally excluded — they're layout noise, not contract.
 *
 * Regenerate after an intentional change: `UPDATE_GOLDEN=1 npx vitest run tests/golden`
 */
function fingerprint(xml) {
  const nodes = [];
  const edges = [];
  let styled = 0;
  let links = 0;
  const re = /<object\b([^>]*)>\s*<mxCell\b([^>]*?)(?:\/>|>)/g;
  const attr = (s, n) => (new RegExp(`\\b${n}="([^"]*)"`).exec(s) ?? [])[1];
  let m;
  while ((m = re.exec(xml)) !== null) {
    const o = m[1], c = m[2];
    if (/\bvertex="1"/.test(c)) {
      nodes.push(`${attr(o, 'id')}:${attr(o, 'c4Type') ?? ''}`);
      if (attr(o, 'link')) links++;
      // a non-default fill/stroke/dashed beyond the base shape = applied override
      if (/\b(fillColor|strokeColor|fontColor|dashed)=/.test(c)) styled++;
    } else if (/\bedge="1"/.test(c)) {
      edges.push(`${attr(c, 'source')}->${attr(c, 'target')}`);
    }
  }
  return {
    nodes: nodes.sort(),
    edges: edges.sort(),
    nodeCount: nodes.length,
    edgeCount: edges.length,
    links,
    hasDiagramId: /<diagram\s+id="[^"]+"\s+name="[^"]+"/.test(xml),
  };
}

const FIXTURES = [
  'c4-exhaustive.puml',
  'c4-context.puml',
  'c4-container.puml',
  'c4-deployment.puml',
  'c4-all-entity-variants.puml',
  'c4-all-rel-variants.puml',
];

describe('drawio structural snapshot (same-engine regression gate)', () => {
  for (const name of FIXTURES) {
    it(name, async () => {
      const fp = fingerprint(await Catalyst.convert(fixture(name)));
      const goldenFile = join(goldenDir, `${name}.json`);

      if (process.env.UPDATE_GOLDEN === '1' || !existsSync(goldenFile)) {
        mkdirSync(goldenDir, { recursive: true });
        writeFileSync(goldenFile, JSON.stringify(fp, null, 2) + '\n');
        // Still assert internal invariants even when (re)creating the golden.
        expect(fp.hasDiagramId).toBe(true);
        expect(fp.edges.every((e) => !e.includes('undefined'))).toBe(true);
        return;
      }

      const golden = JSON.parse(readFileSync(goldenFile, 'utf-8'));
      expect(fp).toEqual(golden);
    });
  }
});
