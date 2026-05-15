import { describe, it, expect } from 'vitest'
import { LayoutEngine } from '../src/layout/LayoutEngine.mjs'

// Behavioral tests for the elkjs-based LayoutEngine. They assert the public
// contract (positions, hierarchy, edges) — NOT engine internals — so they
// stay valid across layout-algorithm changes. Coordinates are absolute
// top-left (ELK convention, accumulated from parent-relative).

const entities = [
  {
    type: 'System', alias: 'SYS1', label: 'System A',
    technology: 'Tech', description: 'System description',
    children: [
      {
        type: 'Container', alias: 'CONT1', label: 'Container A',
        technology: 'Tech', description: 'Container description',
        children: [
          { type: 'Component', alias: 'COMP1', label: 'Component A', technology: 'Tech', description: 'desc' }
        ]
      }
    ]
  },
  { type: 'System', alias: 'SYS2', label: 'System B', technology: 'Tech', description: 'desc' }
]

const relations = [
  { source: 'COMP1', target: 'SYS2', label: 'Uses', description: 'rel' }
]

describe('LayoutEngine (elkjs)', () => {
  describe('initialization', () => {
    it('constructs and accepts layout options without throwing', () => {
      const e = new LayoutEngine()
      expect(e).toBeInstanceOf(LayoutEngine)
      expect(() => e.setLayoutOptions({ rankdir: 'TB', nodesep: 50, edgesep: 10, ranksep: 50 })).not.toThrow()
    })

    it('accepts nodes/edges/constraints without throwing', () => {
      const e = new LayoutEngine()
      expect(() => { e.addNodes(entities); e.addEdges(relations); e.addLayoutConstraints([]) }).not.toThrow()
    })
  })

  describe('calculateLayout', () => {
    it('returns the LayoutResult shape', async () => {
      const r = await LayoutEngine.calculateLayout(entities, relations, { rankdir: 'TB' })
      expect(Array.isArray(r.nodes)).toBe(true)
      expect(Array.isArray(r.edges)).toBe(true)
      expect(Array.isArray(r.clusters)).toBe(true)
      expect(r.width).toBeGreaterThan(0)
      expect(r.height).toBeGreaterThan(0)
    })

    it('positions every leaf with finite coords + positive size', async () => {
      const r = await LayoutEngine.calculateLayout(entities, relations)
      expect(r.nodes.length).toBeGreaterThan(0)
      for (const n of r.nodes) {
        expect(Number.isFinite(n.x)).toBe(true)
        expect(Number.isFinite(n.y)).toBe(true)
        expect(n.width).toBeGreaterThan(0)
        expect(n.height).toBeGreaterThan(0)
      }
    })

    it('emits clusters for parents and resolves the full hierarchy', async () => {
      const r = await LayoutEngine.calculateLayout(entities, relations)
      const ids = new Set([...r.nodes, ...r.clusters].map(n => n.id))
      // Every entity (leaf and container) is laid out — parity invariant.
      for (const a of ['SYS1', 'CONT1', 'COMP1', 'SYS2']) {
        expect(ids.has(a), `${a} not laid out`).toBe(true)
      }
      expect(r.clusters.map(c => c.id).sort()).toEqual(['CONT1', 'SYS1'])
    })

    it('a child sits inside its parent cluster box (absolute top-left)', async () => {
      const r = await LayoutEngine.calculateLayout(entities, relations)
      const cont = r.clusters.find(c => c.id === 'CONT1')!
      const comp = r.nodes.find(n => n.id === 'COMP1')!
      // ELK hierarchical layout guarantees containment; assert it exactly.
      expect(comp.x!).toBeGreaterThanOrEqual(cont.x!)
      expect(comp.y!).toBeGreaterThanOrEqual(cont.y!)
      expect(comp.x! + comp.width).toBeLessThanOrEqual(cont.x! + cont.width)
      expect(comp.y! + comp.height).toBeLessThanOrEqual(cont.y! + cont.height)
    })

    it('keeps every relation as an edge with both endpoints', async () => {
      const r = await LayoutEngine.calculateLayout(entities, relations)
      const rel = r.edges.find(e => e.source === 'COMP1' && e.target === 'SYS2')
      expect(rel, 'relation COMP1->SYS2 missing').toBeDefined()
    })

    it('handles empty input and a single childless entity', async () => {
      const empty = await LayoutEngine.calculateLayout([], [])
      expect(empty.nodes).toEqual([])
      const one = await LayoutEngine.calculateLayout(
        [{ type: 'Component', alias: 'X', label: 'X' }], [])
      expect(one.nodes.map(n => n.id)).toEqual(['X'])
    })

    it('also works via the instance path (addNodes → calculateLayout)', async () => {
      const e = new LayoutEngine()
      e.addNodes([{ type: 'System', alias: 'A', label: 'A' }, { type: 'System', alias: 'B', label: 'B' }])
      e.addEdges([{ source: 'A', target: 'B', label: 'r', description: '' }])
      const r = await e.calculateLayout()
      expect(r.nodes.map(n => n.id).sort()).toEqual(['A', 'B'])
      expect(r.edges.some(x => x.source === 'A' && x.target === 'B')).toBe(true)
    })
  })

  describe('L1 directional intent', () => {
    // Containers → the diagram is hierarchical → the `layered` path (where
    // directional intent applies). Context-level (people/systems only) is
    // routed to `force`, which is intentionally non-directional.
    const two = [
      { type: 'Container', alias: 'a', label: 'a' },
      { type: 'Container', alias: 'b', label: 'b' }
    ]
    const at = (r: Awaited<ReturnType<typeof LayoutEngine.calculateLayout>>, id: string) =>
      [...r.nodes, ...r.clusters].find(n => n.id === id)!

    it('Rel_U places the target above the source (smaller y)', async () => {
      const r = await LayoutEngine.calculateLayout(
        two, [{ source: 'a', target: 'b', label: 'up', description: '', direction: 'U' }])
      // Rel_U(a,b): b is up relative to a → b.y < a.y.
      expect(at(r, 'b').y!).toBeLessThan(at(r, 'a').y!)
    })

    it('default (no direction) places the target below the source (larger y)', async () => {
      const r = await LayoutEngine.calculateLayout(
        two, [{ source: 'a', target: 'b', label: 'down', description: '' }])
      expect(at(r, 'b').y!).toBeGreaterThan(at(r, 'a').y!)
    })

    // Honest L/R contract: a Rel_L/Rel_R STILL emits an a→b edge, so a
    // layered engine (ELK, dagre, and PlantUML's own Graphviz/dot) ranks
    // a and b in DIFFERENT layers — "b left/right of a" is geometrically
    // impossible for edge-connected nodes. L/R is fed as ELK
    // considerModelOrder *influence* for the cases where it is meaningful
    // (same-rank peers); it is not a guarantee and must not break layout.
    // Asserting a strict x-order here would be a false claim.
    it('Rel_L/Rel_R are accepted, keep parity, and still rank by the edge', async () => {
      for (const d of ['L', 'R'] as const) {
        const r = await LayoutEngine.calculateLayout(
          two, [{ source: 'a', target: 'b', label: d, description: '', direction: d }])
        expect(r.nodes.map(n => n.id).sort()).toEqual(['a', 'b'])
        expect(r.edges.some(e => e.source === 'a' && e.target === 'b')).toBe(true)
        // edge-connected → still different ranks (b below a in TB).
        expect(at(r, 'b').y!).toBeGreaterThan(at(r, 'a').y!)
      }
    })
  })

  describe('setLayoutOptions affects the layout', () => {
    it('rankdir LR orients horizontally vs TB vertically', async () => {
      // Containers → hierarchical → layered path (rankdir applies there;
      // Context/force is non-directional by design).
      const ents = [
        { type: 'Container', alias: 'p', label: 'p' },
        { type: 'Container', alias: 'q', label: 'q' }
      ]
      const rels = [{ source: 'p', target: 'q', label: 'r', description: '' }]
      const tb = await LayoutEngine.calculateLayout(ents, rels, { rankdir: 'TB' })
      const lr = await LayoutEngine.calculateLayout(ents, rels, { rankdir: 'LR' })
      const dy = (g: typeof tb) => Math.abs(
        [...g.nodes].find(n => n.id === 'q')!.y! - [...g.nodes].find(n => n.id === 'p')!.y!)
      const dx = (g: typeof lr) => Math.abs(
        [...g.nodes].find(n => n.id === 'q')!.x! - [...g.nodes].find(n => n.id === 'p')!.x!)
      // TB: the rank gap is vertical; LR: it becomes horizontal.
      expect(dy(tb)).toBeGreaterThan(dx(tb))
      expect(dx(lr)).toBeGreaterThan(dy(lr))
    })
  })

  describe('addLayoutConstraints (Lay_*)', () => {
    it('accepts a layout-only constraint and still lays out every node', async () => {
      const ents = [
        { type: 'System', alias: 'm', label: 'm' },
        { type: 'System', alias: 'n', label: 'n' }
      ]
      const r = await LayoutEngine.calculateLayout(
        ents, [], { rankdir: 'TB' }, [{ source: 'm', target: 'n', direction: 'D' }])
      expect(r.nodes.map(n => n.id).sort()).toEqual(['m', 'n'])
      // Lay_* must NOT become a drawn relation edge.
      expect(r.edges.every(e => /^lay\d+$/.test(e.name ?? '') || /^rel\d+$/.test(e.name ?? ''))).toBe(true)
      expect(r.edges.some(e => /^rel\d+$/.test(e.name ?? ''))).toBe(false) // no visible rels here
    })
  })
})
