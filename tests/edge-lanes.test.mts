import { describe, it, expect } from 'vitest';
import { assignEdgeLanes, EDGE_LANE_GAP_PX, type NodeCenter } from '../src/layout/edgeLanes.mjs';

/**
 * Unit contract for the multi-edge lane separator (finding #9 + review
 * follow-ups 8-a/8-c). Pure function — no ELK/draw.io. Synthetic boxes are
 * chosen so the perpendicular/midpoint math is exact and assertable.
 *
 * AB: A=(0,0) B=(0,100), each 160×80 (hw=80, hh=40). Edge dir (ex,ey)=(0,1) →
 * perpendicular (px,py)=(-1,0), midpoint=(0,50). Ray exits each box at
 * ty=hh/|ey|=40, so the along-edge cap = len/2 − max(tA,tB) = 50 − 40 = 10.
 */
const bx = (cx: number, cy: number): NodeCenter => ({ cx, cy, hw: 80, hh: 40 });
const AB = (): Map<string, NodeCenter> =>
  new Map([['A', bx(0, 0)], ['B', bx(0, 100)]]);
const never = () => false;

describe('assignEdgeLanes', () => {
  it('leaves a SINGLE edge between a pair untouched (no lane entry)', () => {
    expect(assignEdgeLanes([{ source: 'A', target: 'B' }], AB(), never).size).toBe(0);
  });

  it('leaves many distinct single-edge pairs untouched', () => {
    const lanes = assignEdgeLanes(
      [{ source: 'A', target: 'B' }, { source: 'B', target: 'C' }, { source: 'A', target: 'C' }],
      new Map([['A', bx(0, 0)], ['B', bx(0, 100)], ['C', bx(100, 0)]]),
      never,
    );
    expect(lanes.size).toBe(0);
  });

  it('excludes self-loops but still lanes a sibling group', () => {
    const lanes = assignEdgeLanes(
      [{ source: 'A', target: 'A' }, { source: 'A', target: 'B' }, { source: 'B', target: 'A' }],
      AB(), never,
    );
    expect(lanes.has(0)).toBe(false);
    expect(lanes.has(1)).toBe(true);
    expect(lanes.has(2)).toBe(true);
  });

  it('excludes a pair when either endpoint is excluded (cluster/boundary)', () => {
    const lanes = assignEdgeLanes(
      [{ source: 'A', target: 'BND' }, { source: 'BND', target: 'A' }],
      new Map([['A', bx(0, 0)], ['BND', bx(0, 100)]]),
      (id) => id === 'BND',
    );
    expect(lanes.size).toBe(0);
  });

  it('antiparallel pair: ONE canonical frame ⇒ waypoints + offsets mirror about the anchor', () => {
    const lanes = assignEdgeLanes(
      [{ source: 'A', target: 'B' }, { source: 'B', target: 'A' }],
      AB(), never,
    );
    const w0 = lanes.get(0)!;
    const w1 = lanes.get(1)!;
    expect(w0.waypoint).toEqual({ x: 22, y: 50 });   // lane -0.5 → shift -22 → x=-(-22)
    expect(w1.waypoint).toEqual({ x: -22, y: 50 });
    expect(w0.waypoint).not.toEqual(w1.waypoint);
    // px=-1,py=0; perpMag=lane·120; alongMag=clamp(lane·150,±10) (cap=10).
    expect(w0.labelOffset).toEqual({ dx: 60, dy: -10 });
    expect(w1.labelOffset).toEqual({ dx: -60, dy: 10 });
    expect(w0.labelOffset.dx).toBe(-w1.labelOffset.dx);
    expect(w0.labelOffset.dy).toBe(-w1.labelOffset.dy);
    // perp unit + signed shift exposed for the ELK-polyline (#3) path.
    expect(w0.perp).toEqual({ x: -1, y: 0 });
    expect(w0.shift).toBe(-22);
    expect(w1.shift).toBe(22);
  });

  it('≥3-edge group: symmetric fan, middle edge on the anchor', () => {
    const lanes = assignEdgeLanes(
      [{ source: 'A', target: 'B' }, { source: 'A', target: 'B' }, { source: 'B', target: 'A' }],
      AB(), never,
    );
    const [a, b, c] = [lanes.get(0)!, lanes.get(1)!, lanes.get(2)!];
    expect(a.waypoint).toEqual({ x: EDGE_LANE_GAP_PX, y: 50 });
    expect(b.waypoint).toEqual({ x: 0, y: 50 });
    expect(c.waypoint).toEqual({ x: -EDGE_LANE_GAP_PX, y: 50 });
    expect(new Set([a, b, c].map((l) => `${l.waypoint.x},${l.waypoint.y}`)).size).toBe(3);
    expect(a.waypoint.x + b.waypoint.x + c.waypoint.x).toBe(0);
    expect([a.labelOffset, b.labelOffset, c.labelOffset]).toEqual([
      { dx: 120, dy: -10 }, { dx: 0, dy: 0 }, { dx: -120, dy: 10 },
    ]);
    expect([a.shift, b.shift, c.shift]).toEqual([-EDGE_LANE_GAP_PX, 0, EDGE_LANE_GAP_PX]);
  });

  it('4-edge group: half-integer lanes, all distinct, symmetric', () => {
    const rels = [0, 1, 2, 3].map(() => ({ source: 'A', target: 'B' }));
    const lanes = assignEdgeLanes(rels, AB(), never);
    const ws = [0, 1, 2, 3].map((i) => lanes.get(i)!.waypoint);
    expect(new Set(ws.map((w) => `${w.x},${w.y}`)).size).toBe(4);
    expect(ws.some((w) => w.x === 0)).toBe(false);
    expect(ws.reduce((s, w) => s + w.x, 0)).toBe(0);
    const offs = [0, 1, 2, 3].map((i) => lanes.get(i)!.labelOffset);
    expect(new Set(offs.map((o) => `${o.dx},${o.dy}`)).size).toBe(4);
  });

  it('respects a custom waypoint gap (offset scales linearly)', () => {
    const rels = [{ source: 'A', target: 'B' }, { source: 'B', target: 'A' }];
    const def = assignEdgeLanes(rels, AB(), never);
    const wide = assignEdgeLanes(rels, AB(), never, EDGE_LANE_GAP_PX * 2);
    expect(Math.abs(wide.get(0)!.waypoint.x)).toBe(Math.abs(def.get(0)!.waypoint.x) * 2);
  });

  it('skips a group whose endpoint has no centre (no throw)', () => {
    const lanes = assignEdgeLanes(
      [{ source: 'A', target: 'Z' }, { source: 'Z', target: 'A' }],
      new Map([['A', bx(0, 0)]]), never,
    );
    expect(lanes.size).toBe(0);
  });

  it('keys the result by the ORIGINAL relation index (emission order preserved)', () => {
    const lanes = assignEdgeLanes(
      [{ source: 'X', target: 'Y' }, { source: 'A', target: 'B' }, { source: 'B', target: 'A' }],
      new Map([['A', bx(0, 0)], ['B', bx(0, 100)], ['X', bx(9, 9)], ['Y', bx(9, 90)]]),
      never,
    );
    expect([...lanes.keys()].sort()).toEqual([1, 2]);
  });

  // 8-a: pair grouping must be robust to ANY alias content (no delimiter
  // round-trip — the old join('|')/split('|') broke on a '|' in an alias).
  it('groups correctly when an alias contains the old separator or special chars', () => {
    const lanes = assignEdgeLanes(
      [{ source: 'a|b', target: 'c"]d' }, { source: 'c"]d', target: 'a|b' }],
      new Map([['a|b', bx(0, 0)], ['c"]d', bx(0, 100)]]),
      never,
    );
    expect(lanes.size).toBe(2);
    expect(lanes.get(0)!.waypoint).not.toEqual(lanes.get(1)!.waypoint);
  });

  // 8-c: along-edge component capped at the real free span between the two
  // box borders (geometry-derived, no heuristic fraction) — a short, dense
  // edge gets a SMALLER along offset than a long one.
  it('clamps the along-edge label offset to the free span between boxes', () => {
    const sm = (cx: number, cy: number): NodeCenter => ({ cx, cy, hw: 20, hh: 20 });
    // Horizontal edges so the along-axis lands in dx (ex=1, perp px=0).
    const longPair = assignEdgeLanes(
      [{ source: 'A', target: 'B' }, { source: 'B', target: 'A' }],
      new Map([['A', sm(0, 0)], ['B', sm(1000, 0)]]), never,
    );
    const shortPair = assignEdgeLanes(
      [{ source: 'A', target: 'B' }, { source: 'B', target: 'A' }],
      new Map([['A', sm(0, 0)], ['B', sm(120, 0)]]), never,
    );
    const longAlong = Math.abs(longPair.get(0)!.labelOffset.dx);  // dx == ex·alongMag (px=0)
    const shortAlong = Math.abs(shortPair.get(0)!.labelOffset.dx);
    expect(longAlong).toBe(75);            // cap(480) ≥ raw(75) ⇒ unclamped
    expect(shortAlong).toBeLessThan(75);   // cap(40) < raw(75) ⇒ clamped
    expect(shortAlong).toBe(40);           // len/2(60) − boxExit(20) = 40
  });
});
