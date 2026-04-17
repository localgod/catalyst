import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Catalyst } from '../src/catalyst.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) =>
    readFileSync(join(__dirname, 'fixtures', name), 'utf-8');

describe('end-to-end export coverage for real C4-PlantUML diagrams', () => {
    it('emits diagram id + name so drawio-export accepts the XML', async () => {
        const xml = await Catalyst.convert(fixture('c4-context.puml'));
        expect(xml).toMatch(/<diagram\s+id="[^"]+"\s+name="[^"]+"/);
    });

    it('preserves Person + System_Ext + System_Boundary shapes + all 4 Rels in c4-context', async () => {
        const xml = await Catalyst.convert(fixture('c4-context.puml'));

        // Persons, boundaries and external systems must be emitted.
        expect(xml, 'Person "dev" not emitted').toContain('id="dev"');
        expect(xml, 'Workstation boundary not emitted').toContain('id="host"');
        expect(xml, 'System_Ext "docker" not emitted').toContain('id="docker"');
        expect(xml, 'System_Ext "registries" not emitted').toContain('id="registries"');
        expect(xml, 'System_Ext "charts" not emitted').toContain('id="charts"');

        // All 4 relationships should survive (one is 4-arg, three are 3-arg).
        const edges = [...xml.matchAll(/source="([^"]+)"\s+target="([^"]+)"/g)];
        const pairs = new Set(edges.map((m) => `${m[1]}->${m[2]}`));
        expect(pairs.has('dev->kind')).toBe(true);
        expect(pairs.has('kind->docker')).toBe(true);
        expect(pairs.has('kind->registries')).toBe(true);
        expect(pairs.has('kind->charts')).toBe(true);
    });

    it('preserves ContainerDb + nested boundaries + all 6 Rels in c4-container', async () => {
        const xml = await Catalyst.convert(fixture('c4-container.puml'));

        // Leaf containers + ContainerDb + Person.
        for (const alias of ['dev', 'docker', 'cp', 'worker', 'ingress', 'lb', 'metrics', 'dash', 'nfs', 'prom', 'apps']) {
            expect(xml, `alias "${alias}" not emitted`).toContain(`id="${alias}"`);
        }

        // Both System_Boundary wrappers.
        expect(xml, 'host boundary not emitted').toContain('id="host"');
        expect(xml, 'kind boundary not emitted').toContain('id="kind"');

        // All 6 relationships (4 are 3-arg, 2 are 4-arg).
        const edges = [...xml.matchAll(/source="([^"]+)"\s+target="([^"]+)"/g)];
        const pairs = new Set(edges.map((m) => `${m[1]}->${m[2]}`));
        for (const pair of ['dev->docker', 'dev->ingress', 'dev->lb', 'ingress->apps', 'lb->apps', 'apps->nfs']) {
            expect(pairs.has(pair), `relationship "${pair}" missing`).toBe(true);
        }
    });
});
