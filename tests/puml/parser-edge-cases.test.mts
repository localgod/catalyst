import { describe, it, expect } from 'vitest';
import { EntityParser } from '../../src/puml/EntityParser.mjs';
import { RelParser } from '../../src/puml/RelParser.mjs';

describe('EntityParser — quote-aware parsing', () => {
    it('preserves commas inside quoted descriptions', () => {
        // Before the quote-aware fix, the description would be split on its
        // internal commas and the entity lost its description field.
        const input = 'System(s, "API", "Java", "Stores logs, metrics, and events")';
        const result = new EntityParser().parse(input);
        expect(result).toHaveLength(1);
        expect(result[0].description).toBe('Stores logs, metrics, and events');
    });

    it('preserves nested parens inside quoted descriptions', () => {
        const input = 'Container(lb, "LB", "docker", "Allocates IPs (primary; MetalLB alt via LB=metallb)")';
        const result = new EntityParser().parse(input);
        expect(result).toHaveLength(1);
        expect(result[0].alias).toBe('lb');
        expect(result[0].description).toBe('Allocates IPs (primary; MetalLB alt via LB=metallb)');
    });

    it('preserves embedded double quotes in descriptions (escaped)', () => {
        // NB: PlantUML uses `\"` for escaped quotes inside quoted strings.
        const input = 'System(s, "Greeter", "Go", "Responds with \\"hello\\" on /")';
        const result = new EntityParser().parse(input);
        expect(result).toHaveLength(1);
        expect(result[0].description).toContain('hello');
    });
});

describe('EntityParser — line continuation', () => {
    it('folds backslash-continued lines into a single logical line', () => {
        const input = [
            'System(s, "API", "Java", \\',
            '  "Accepts HTTPS requests and proxies them to the backend")',
        ].join('\n');
        const result = new EntityParser().parse(input);
        expect(result).toHaveLength(1);
        expect(result[0].alias).toBe('s');
        expect(result[0].description).toBe('Accepts HTTPS requests and proxies them to the backend');
    });
});

describe('EntityParser — named kwargs', () => {
    it('matches $sprite / $tags / $link by exact name, not prefix', () => {
        // Before the fix, `startsWith("$s")` also matched `$something`; the
        // rule now requires the full name followed by `=`.
        const input = 'System(s, "S", "Java", "desc", $sprite="img", $tags="t1,t2", $link="https://ex.com")';
        const result = new EntityParser().parse(input);
        expect(result).toHaveLength(1);
        expect(result[0].sprite).toBe('img');
        expect(result[0].tags).toBe('t1,t2');
        expect(result[0].link).toBe('https://ex.com');
    });

    it('returns undefined for each kwarg that is not provided', () => {
        const result = new EntityParser().parse('System(s, "S", "Java", "desc")');
        expect(result[0].sprite).toBeUndefined();
        expect(result[0].tags).toBeUndefined();
        expect(result[0].link).toBeUndefined();
    });
});

describe('RelParser — whitespace + quoted-arg tolerance', () => {
    it('accepts rel with arbitrary internal whitespace', () => {
        const input = `Rel(  a  ,  b  ,  "uses"  ,  "HTTPS"  )`;
        const rels = RelParser.getRelations(input);
        expect(rels).toHaveLength(1);
        expect(rels[0]).toMatchObject({
            source: 'a',
            target: 'b',
            label: 'uses',
            description: 'HTTPS',
            bidirectional: false,
        });
    });

    it('does not mis-match procedure names that contain "Rel" as substring', () => {
        // `AddRelTag(...)` and `UpdateRelStyle(...)` start with a different
        // prefix and must NOT be treated as relationships.
        const input = `
            AddRelTag("critical", $lineStyle=DashedLine())
            UpdateRelStyle("#red", "#black")
            Rel(a, b, "real rel")
        `;
        const rels = RelParser.getRelations(input);
        expect(rels).toHaveLength(1);
        expect(rels[0].source).toBe('a');
    });
});
