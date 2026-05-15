import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Catalyst } from '../src/catalyst.mjs';
import type { EntityDescriptor } from '../src/puml/EntityDescriptor.interface.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) =>
    readFileSync(join(__dirname, 'fixtures', name), 'utf-8');

/** Flatten the parsed entity hierarchy into a flat alias→type list. */
function flatten(entities: EntityDescriptor[]): { alias: string; type: string }[] {
    const out: { alias: string; type: string }[] = [];
    const walk = (es: EntityDescriptor[]) => {
        for (const e of es) {
            out.push({ alias: e.alias, type: e.type });
            if (e.children) walk(e.children);
        }
    };
    walk(entities);
    return out;
}

interface ParsedDrawio {
    vertices: Map<string, string>; // id -> c4Type
    edges: { source: string; target: string }[];
    hasDiagramId: boolean;
}

/**
 * Parse the drawio XML into the only two things parity cares about: the set
 * of emitted shapes (id + c4Type) and the set of emitted connectors
 * (source/target). Attribute-order independent.
 */
function parseDrawio(xml: string): ParsedDrawio {
    const vertices = new Map<string, string>();
    const edges: { source: string; target: string }[] = [];

    const attr = (s: string, name: string): string | undefined => {
        const m = new RegExp(`\\b${name}="([^"]*)"`).exec(s);
        return m ? m[1] : undefined;
    };

    // Each shape/connector is an <object ...> wrapping an <mxCell ...>.
    const re = /<object\b([^>]*)>\s*<mxCell\b([^>]*?)(?:\/>|>)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) {
        const objAttrs = m[1];
        const cellAttrs = m[2];
        if (/\bvertex="1"/.test(cellAttrs)) {
            const id = attr(objAttrs, 'id');
            if (id) vertices.set(id, attr(objAttrs, 'c4Type') ?? '');
        } else if (/\bedge="1"/.test(cellAttrs)) {
            const s = attr(cellAttrs, 'source');
            const t = attr(cellAttrs, 'target');
            if (s !== undefined && t !== undefined) edges.push({ source: s, target: t });
        }
    }

    return {
        vertices,
        edges,
        hasDiagramId: /<diagram\s+id="[^"]+"\s+name="[^"]+"/.test(xml),
    };
}

// Every fixture must round-trip puml -> drawio with zero loss. c4-exhaustive
// is the all-encompassing surface (every element / boundary / relationship /
// styling primitive in docs/C4-COVERAGE.md); the rest are real-world shapes.
const FIXTURES = [
    'c4-exhaustive.puml',
    'c4-context.puml',
    'c4-container.puml',
    'c4-deployment.puml',
    'c4-all-entity-variants.puml',
    'c4-all-rel-variants.puml',
];

describe('structural parity: puml source ⇄ drawio output', () => {
    for (const name of FIXTURES) {
        describe(name, () => {
            it('emits a shape for every parsed entity, with matching c4Type', async () => {
                const puml = fixture(name);
                const entities = flatten(Catalyst.parseEntities(puml));
                const { vertices } = parseDrawio(await Catalyst.convert(puml));

                const missing = entities.filter((e) => !vertices.has(e.alias));
                expect(
                    missing,
                    `entities with no drawio shape: ${missing.map((e) => `${e.alias}(${e.type})`).join(', ')}`,
                ).toEqual([]);

                // c4Type must round-trip — a shape emitted with c4Type="" means
                // Mx.addMxC4's switch hit `default` and lost the element kind.
                const mistyped = entities.filter(
                    (e) => vertices.get(e.alias) !== e.type,
                );
                expect(
                    mistyped,
                    `entities whose drawio c4Type != puml type: ${mistyped
                        .map((e) => `${e.alias} puml=${e.type} drawio=${vertices.get(e.alias)}`)
                        .join(', ')}`,
                ).toEqual([]);
            });

            it('emits one connector per parsed relation (parallel + self-loop included)', async () => {
                const puml = fixture(name);
                const rels = Catalyst.parseRelations(puml);
                const { edges } = parseDrawio(await Catalyst.convert(puml));
                expect(edges.length).toBe(rels.length);
            });

            it('every connector endpoint resolves to an emitted shape (no orphans)', async () => {
                const puml = fixture(name);
                const { vertices, edges } = parseDrawio(await Catalyst.convert(puml));
                const orphans = edges.filter(
                    (e) => !vertices.has(e.source) || !vertices.has(e.target),
                );
                expect(
                    orphans,
                    `orphan connectors: ${orphans.map((e) => `${e.source}->${e.target}`).join(', ')}`,
                ).toEqual([]);
            });

            it('emits <diagram id+name> so drawio-export accepts the XML', async () => {
                const { hasDiagramId } = parseDrawio(await Catalyst.convert(fixture(name)));
                expect(hasDiagramId).toBe(true);
            });
        });
    }

    it('c4-exhaustive covers the documented surface breadth', async () => {
        const puml = fixture('c4-exhaustive.puml');
        const entities = flatten(Catalyst.parseEntities(puml));
        const types = new Set(entities.map((e) => e.type));
        // Sentinel set — at least one of every C4 level + boundary + deployment.
        for (const t of [
            'Person', 'Person_Ext',
            'System', 'SystemDb', 'SystemQueue', 'System_Ext', 'SystemDb_Ext', 'SystemQueue_Ext',
            'Container', 'ContainerDb', 'ContainerQueue', 'Container_Ext', 'ContainerDb_Ext', 'ContainerQueue_Ext',
            'Component', 'ComponentDb', 'ComponentQueue', 'Component_Ext', 'ComponentDb_Ext', 'ComponentQueue_Ext',
            'System_Boundary', 'Container_Boundary', 'Enterprise_Boundary', 'Boundary',
            'Deployment_Node', 'Deployment_Node_L', 'Deployment_Node_R', 'Node', 'Node_L', 'Node_R',
        ]) {
            expect(types.has(t), `c4-exhaustive.puml is missing a ${t}`).toBe(true);
        }
        // Bidirectional + parallel + self-loop relations are present.
        const rels = Catalyst.parseRelations(puml);
        expect(rels.some((r) => r.bidirectional), 'no BiRel in exhaustive fixture').toBe(true);
        expect(rels.some((r) => r.source === r.target), 'no self-loop in exhaustive fixture').toBe(true);
        const pairCounts = new Map<string, number>();
        for (const r of rels) pairCounts.set(`${r.source}->${r.target}`, (pairCounts.get(`${r.source}->${r.target}`) ?? 0) + 1);
        expect([...pairCounts.values()].some((c) => c > 1), 'no parallel relation in exhaustive fixture').toBe(true);
    });
});
