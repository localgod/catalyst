import { describe, it, expect } from 'vitest';
import { measureNode } from '../../src/layout/measureNode.mjs';
import type { EntityDescriptor } from '../../src/puml/EntityDescriptor.interface.mjs';

// A wide single-line title makes the box wide enough that each short
// description segment fits on its own line WITHOUT word-wrap — isolating
// the effect of the explicit `\n` breaks from greedy wrapping, and lifting
// the box past the per-type minimum width floor.
const WIDE_TITLE = 'A reasonably wide container title used for sizing tests';

const ent = (over: Partial<EntityDescriptor>): EntityDescriptor => ({
  type: 'Container',
  alias: 'a',
  label: WIDE_TITLE,
  ...over,
});

const lines = (n: number) => Array.from({ length: n }, (_, i) => `seg${i}`).join('\\n');

describe('measureNode — multi-line (Phase 1)', () => {
  it('explicit \\n breaks grow the box height past a single-line description', () => {
    const single = measureNode(ent({ description: 'short' }));
    const many = measureNode(ent({ description: lines(12) }));
    expect(many.height).toBeGreaterThan(single.height);
  });

  it('height keeps growing as more explicit lines are added', () => {
    const h8 = measureNode(ent({ description: lines(8) })).height;
    const h16 = measureNode(ent({ description: lines(16) })).height;
    const h24 = measureNode(ent({ description: lines(24) })).height;
    expect(h16).toBeGreaterThan(h8);
    expect(h24).toBeGreaterThan(h16);
  });

  it('a multi-line title is measured by its LONGEST line, not as one giant line', () => {
    const seg = 'Kubernetes Secret holding the issued leaf TLS certificate';
    const wide = measureNode(ent({ label: `${seg} ${seg} ${seg}` }));
    const split = measureNode(ent({ label: `${seg}\\n${seg}\\n${seg}` }));
    // One-line form is ~3x wider; split form's width is one segment + padding.
    expect(split.width).toBeLessThan(wide.width);
  });

  it('a multi-line title adds height (one row per title line)', () => {
    const oneLineTitle = measureNode(ent({ label: 'T', description: lines(10) }));
    const fiveLineTitle = measureNode(ent({ label: 'T\\nT\\nT\\nT\\nT', description: lines(10) }));
    expect(fiveLineTitle.height).toBeGreaterThan(oneLineTitle.height);
  });

  it('still honours the per-type minimum floor for short labels', () => {
    const d = measureNode(ent({ type: 'Container', label: 'X' }));
    expect(d.width).toBeGreaterThanOrEqual(200);
    expect(d.height).toBeGreaterThanOrEqual(120);
  });
});
