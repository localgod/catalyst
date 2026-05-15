import { describe, it, expect } from 'vitest';
import { StyleParser } from '../../src/puml/StyleParser.mjs';

describe('StyleParser', () => {
    it('parses AddElementTag / AddRelTag / AddBoundaryTag', () => {
        const s = StyleParser.parse(`
AddElementTag("critical", $bgColor="#aa0000", $fontColor="#ffffff", $borderColor="#660000")
AddRelTag("async", $textColor="#0066cc", $lineColor="#0066cc", $lineStyle=DashedLine())
AddBoundaryTag("zone", $bgColor="#eef7ee", $borderColor="#338833")
`);
        expect(s.elementTags.get('critical')).toEqual({
            fillColor: '#aa0000', fontColor: '#ffffff', strokeColor: '#660000',
        });
        expect(s.relTags.get('async')).toEqual({
            fontColor: '#0066cc', strokeColor: '#0066cc', dashed: 1,
        });
        expect(s.boundaryTags.get('zone')).toEqual({
            fillColor: '#eef7ee', strokeColor: '#338833',
        });
    });

    it('parses UpdateElementStyle / UpdateRelStyle / UpdateBoundaryStyle', () => {
        const s = StyleParser.parse(`
UpdateElementStyle("external_system", $bgColor="#777777", $fontColor="#ffffff")
UpdateRelStyle("default", $textColor="#404040", $lineColor="#828282")
UpdateBoundaryStyle("default", $borderColor="#666666")
`);
        expect(s.elementStyles.get('external_system')).toEqual({
            fillColor: '#777777', fontColor: '#ffffff',
        });
        expect(s.relDefault).toEqual({ fontColor: '#404040', strokeColor: '#828282' });
        expect(s.boundaryDefault).toEqual({ strokeColor: '#666666' });
    });

    it('ignores unrelated lines and never throws', () => {
        expect(() => StyleParser.parse('System(a,"A")\nRel(a,a,"x")\n!include foo\n')).not.toThrow();
        const s = StyleParser.parse('System(a,"A")');
        expect(s.elementTags.size).toBe(0);
    });

    it('applyOverride replaces only the targeted style keys', () => {
        const base = 'rounded=1;fillColor=#1061B0;fontColor=#ffffff;strokeColor=#0D5091';
        const out = StyleParser.applyOverride(base, { fillColor: '#aa0000', dashed: 1 });
        expect(out).toContain('fillColor=#aa0000');
        expect(out).toContain('fontColor=#ffffff'); // untouched
        expect(out).toContain('rounded=1');         // untouched
        expect(out).toContain('dashed=1');          // added
    });

    it('applyOverride is a no-op when override is empty/undefined', () => {
        const base = 'rounded=1;fillColor=#1061B0';
        expect(StyleParser.applyOverride(base, undefined)).toBe(base);
        expect(StyleParser.applyOverride(base, {})).toBe(base);
    });
});
