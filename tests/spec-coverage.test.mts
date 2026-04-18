import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Catalyst } from '../src/catalyst.mjs';
import { EntityParser } from '../src/puml/EntityParser.mjs';
import { RelParser } from '../src/puml/RelParser.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) =>
    readFileSync(join(__dirname, 'fixtures', name), 'utf-8');

// Count `id="<alias>"` occurrences — one per emitted shape (the diagram id
// `id="catalyst-diagram"` and the structural root cells `id="0"` / `id="1"`
// are subtracted by listing aliases explicitly rather than counting).
const emittedAliases = (xml: string): Set<string> => {
    const set = new Set<string>();
    for (const m of xml.matchAll(/id="([^"]+)"/g)) {
        const id = m[1];
        if (id === '0' || id === '1' || id === 'catalyst-diagram') continue;
        set.add(id);
    }
    return set;
};

describe('C4-PlantUML spec coverage — deployment level', () => {
    it('emits Deployment_Node shapes with containment', async () => {
        const xml = await Catalyst.convert(fixture('c4-deployment.puml'));
        const aliases = emittedAliases(xml);
        for (const a of ['aws', 'cluster', 'rds', 'cdn', 'api', 'cache', 'db']) {
            expect(aliases.has(a), `alias "${a}" not emitted`).toBe(true);
        }
    });

    it('preserves all 3 relationships in deployment fixture', async () => {
        const xml = await Catalyst.convert(fixture('c4-deployment.puml'));
        const pairs = new Set(
            [...xml.matchAll(/source="([^"]+)"\s+target="([^"]+)"/g)].map(
                (m) => `${m[1]}->${m[2]}`,
            ),
        );
        for (const pair of ['cdn->api', 'api->cache', 'api->db']) {
            expect(pairs.has(pair), `relationship "${pair}" missing`).toBe(true);
        }
    });
});

describe('C4-PlantUML spec coverage — all entity variants', () => {
    it('emits every non-deployment C4 entity type catalyst claims to support', async () => {
        const xml = await Catalyst.convert(fixture('c4-all-entity-variants.puml'));
        const aliases = emittedAliases(xml);
        const expected = [
            'p', 'pe',
            's', 'sdb', 'sq', 'se', 'sdbe', 'sqe',
            'c', 'cdb', 'cq', 'ce', 'cdbe', 'cqe',
        ];
        for (const a of expected) {
            expect(aliases.has(a), `alias "${a}" not emitted`).toBe(true);
        }
    });
});

describe('C4-PlantUML spec coverage — all relationship variants', () => {
    it('parses every Rel / BiRel / RelIndex variant', () => {
        const rels = RelParser.getRelations(fixture('c4-all-rel-variants.puml'));
        // 17 rel lines in the fixture; every one should parse.
        expect(rels.length).toBe(17);
    });

    it('flags BiRel variants as bidirectional', () => {
        const rels = RelParser.getRelations(fixture('c4-all-rel-variants.puml'));
        const biRels = rels.filter((r) => r.bidirectional);
        // 4 BiRel lines in the fixture.
        expect(biRels.length).toBe(4);
    });

    it('parses long-form Rel_Up/Down/Left/Right', () => {
        const rels = RelParser.getRelations(fixture('c4-all-rel-variants.puml'));
        const longFormLabels = rels
            .filter((r) => ['Rel_Up', 'Rel_Down', 'Rel_Left', 'Rel_Right'].includes(r.label))
            .map((r) => r.label);
        expect(longFormLabels.sort()).toEqual(['Rel_Down', 'Rel_Left', 'Rel_Right', 'Rel_Up']);
    });

    it('emits bidirectional arrow style (startArrow) for BiRel edges', async () => {
        const puml = `
System(a, "A")
System(b, "B")
BiRel(a, b, "Talks", "gRPC")
`;
        const xml = await Catalyst.convert(puml);
        // The edge should have startArrow set (bidirectional) in its style.
        const edgeStyle = xml.match(/source="a" target="b"[^/]*style="([^"]*)"/);
        // Actually style is on the mxCell, let's grep more broadly
        expect(xml).toContain('startArrow=blockThin');
    });
});

describe('C4-PlantUML spec coverage — entity parser skip list', () => {
    // Directives and non-entity lines should not be parsed as entities,
    // even though they syntactically look like `Identifier(...)`.
    it.each([
        'AddElementTag("critical", $bgColor="#red")',
        'AddRelTag("async", $lineStyle=DashedLine())',
        'UpdateElementStyle("system1", $bgColor="#abc")',
        'UpdateRelStyle("#green", "#blue")',
        'SHOW_LEGEND()',
        'SHOW_FLOATING_LEGEND()',
        'HIDE_STEREOTYPE()',
        'LAYOUT_TOP_DOWN()',
        'LAYOUT_LEFT_RIGHT()',
        'Lay_U(a, b)',
        'Lay_Up(a, b)',
        'Lay_Distance(a, b, 2)',
        'AddProperty("key", "value")',
        'SetPropertyHeader("name", "value")',
        'WithoutPropertyHeader()',
    ])('skips directive: %s', (directive) => {
        const input = `System(keep, "Keep")\n${directive}\n`;
        const entities = new EntityParser().parse(input);
        expect(entities.map((e) => e.alias)).toEqual(['keep']);
    });
});
