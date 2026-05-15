import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import xml2js from 'xml2js';
import { Catalyst } from '../src/catalyst.mjs';
import type { EntityDescriptor } from '../src/puml/EntityParser.mjs';

/**
 * Per-fixture STRUCTURAL SANITY GATE for the use-case corpus.
 *
 * PlantUML↔draw.io pixel comparison is impossible (different layout engines),
 * so this is the machine-checkable correctness contract that complements the
 * human-eyeball gallery (docs/gallery, `make gallery`). It asserts the
 * engine-invariants that the three reported bugs each violated:
 *
 *   - every C4 entity becomes exactly one draw.io node            (no drops)
 *   - every relationship becomes one edge whose endpoints are
 *     emitted node ids, in the SAME direction as the PUML          (no orphan / no reversed)
 *   - a relationship always carries its verb (c4Name non-empty)    (bug #2)
 *   - no "[]" tofu artifact anywhere                               (bug #2)
 *   - an entity that declared a description keeps it               (bug #3)
 *
 * The golden snapshot (tests/golden.test.mjs) intentionally fingerprints only
 * ids/types/edges and excludes label text — this gate covers that gap.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const corpusDir = join(__dirname, 'fixtures', 'corpus');
const FIXTURES = readdirSync(corpusDir).filter((f) => f.endsWith('.puml')).sort();

function flatten(entities: EntityDescriptor[]): EntityDescriptor[] {
  const out: EntityDescriptor[] = [];
  for (const e of entities) {
    out.push(e);
    if (e.children?.length) out.push(...flatten(e.children));
  }
  return out;
}

interface EmittedNode { id: string; c4Name: string; c4Description: string; c4Technology: string }
interface EmittedEdge { source: string; target: string; c4Name: string }

/**
 * Parse the emitted draw.io XML via a real XML parser (not a regex — a raw
 * `>` is legal inside an XML attribute value and would defeat a `[^>]*`
 * approximation). Walks <root>'s <object> children, which each wrap one
 * <mxCell> that is either a vertex or an edge.
 */
async function parseXml(xml: string): Promise<{ nodes: Map<string, EmittedNode>; edges: EmittedEdge[]; raw: string }> {
  const nodes = new Map<string, EmittedNode>();
  const edges: EmittedEdge[] = [];
  const doc = await xml2js.parseStringPromise(xml);
  const root = doc?.mxfile?.diagram?.[0]?.mxGraphModel?.[0]?.root?.[0] ?? {};
  for (const obj of (root.object ?? [])) {
    const o = obj.$ ?? {};
    const cell = obj.mxCell?.[0]?.$ ?? {};
    if (cell.vertex === '1') {
      nodes.set(o.id, {
        id: o.id,
        c4Name: o.c4Name ?? '',
        c4Description: o.c4Description ?? '',
        c4Technology: o.c4Technology ?? '',
      });
    } else if (cell.edge === '1') {
      edges.push({ source: cell.source, target: cell.target, c4Name: o.c4Name ?? '' });
    }
  }
  return { nodes, edges, raw: xml };
}

describe('corpus structural sanity gate', () => {
  for (const name of FIXTURES) {
    it(name, async () => {
      const puml = readFileSync(join(corpusDir, name), 'utf-8');
      const entities = flatten(Catalyst.parseEntities(puml));
      const relations = Catalyst.parseRelations(puml);

      let xml = '';
      await expect((async () => { xml = await Catalyst.convert(puml); })()).resolves.not.toThrow();
      const { nodes, edges, raw } = await parseXml(xml);

      // 0. Output must be well-formed XML — a bare `&` in a label/description
      //    (e.g. "Reads & writes") used to be emitted unescaped, which
      //    draw.io's strict loader rejects.
      await expect(
        xml2js.parseStringPromise(xml),
        `${name}: emitted XML is well-formed`,
      ).resolves.toBeDefined();

      // 1. No entity dropped — one node per parsed entity (boundaries included).
      expect(nodes.size, `${name}: node count`).toBe(entities.length);

      // 2. No tofu artifact (bug #2) — empty bracket must never reach output.
      expect(raw, `${name}: "[]" tofu artifact`).not.toContain('c4Technology="[]"');
      expect(raw, `${name}: ">[]<" tofu artifact`).not.toContain('>[]<');

      // 3. Edge integrity: one edge per relationship, endpoints are emitted
      //    node ids, SAME direction as the PUML (no orphan, no reversed).
      expect(edges.length, `${name}: edge count`).toBe(relations.length);
      const pairs = new Set(relations.map((r) => `${r.source}->${r.target}`));
      for (const e of edges) {
        expect(nodes.has(e.source), `${name}: edge source "${e.source}" is an emitted node`).toBe(true);
        expect(nodes.has(e.target), `${name}: edge target "${e.target}" is an emitted node`).toBe(true);
        expect(pairs.has(`${e.source}->${e.target}`), `${name}: edge ${e.source}->${e.target} matches a PUML relation (not reversed/swapped)`).toBe(true);
        // 4. Relationship verb always present (bug #2: verb was lost to c4Name-unused).
        expect(e.c4Name.trim().length, `${name}: edge ${e.source}->${e.target} has a non-empty verb`).toBeGreaterThan(0);
      }

      // 5. Description preservation (bug #3): an entity that declared a
      //    description must keep it in the emitted node.
      for (const ent of entities) {
        if (ent.description && ent.description.trim().length > 0) {
          const node = nodes.get(ent.alias);
          expect(node, `${name}: entity "${ent.alias}" emitted`).toBeDefined();
          expect(node!.c4Description, `${name}: entity "${ent.alias}" keeps its description`).toBe(ent.description);
        }
      }
    });
  }
});
