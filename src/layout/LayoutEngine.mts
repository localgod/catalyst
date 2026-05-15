import ELK from 'elkjs/lib/elk.bundled.js'
import type { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk-api.js'
import { EntityDescriptor } from '../puml/EntityDescriptor.interface.mjs'
import { lineHeight, spaceAdvance } from '../text/TextMetrics.mjs'
import { measureNode } from './measureNode.mjs'

interface LayoutNode {
  id: string
  width: number
  height: number
  x?: number
  y?: number
  type?: string
  isCluster?: boolean
  parent?: string
  children?: string[]
}

interface LayoutEdge {
  source: string
  target: string
  name?: string
  points?: { x: number; y: number }[]
}

interface LayoutResult {
  nodes: LayoutNode[]
  edges: LayoutEdge[]
  clusters: LayoutNode[]
  width: number
  height: number
}

type Rel = { source: string; target: string; label: string; description: string; direction?: 'U' | 'D' | 'L' | 'R' }
type Lay = { source: string; target: string; direction?: 'U' | 'D' | 'L' | 'R'; distance?: number }


/**
 * Layout via elkjs (Eclipse Layout Kernel, `org.eclipse.elk.layered`).
 *
 * Why ELK, not dagre: dagre 3.0.0's documented option surface (wiki + the
 * installed README's referenced config) and an empirical spike both prove it
 * has NO aspect-ratio / layer-wrapping / same-rank / in-layer-order control —
 * so it produced 8:1 ribbons and could not honor Rel_L/Rel_R. elkjs 0.11.1's
 * own `knownLayoutOptions()` registry confirms native support for all of
 * these. Verified by spike (ibmwm-c4-context: aspect 7.94 → 2.26, 13/13
 * nodes, 11/11 edges routed, compound nesting preserved).
 *
 * ELK coordinates are top-left and parent-relative — accumulated to absolute
 * here (no centre conversion). Interfaces/΅ static signature are unchanged so
 * catalyst.mts is untouched.
 */
class LayoutEngine {
  private elk = new ELK()
  private entities: EntityDescriptor[] = []
  private relations: Rel[] = []
  private constraints: Lay[] = []
  private graphOpts: Record<string, string> = {}

  /** Boundary title band — derived from the real title line height (16px
   * bold) via TextMetrics, plus a font-derived inset (space advance). Not an
   * invented constant. ELK reserves it as the parent's top padding. */
  private titlePadding(): { top: number; side: number } {
    return {
      top: Math.ceil(lineHeight(16, true) + spaceAdvance(16, true)),
      side: Math.ceil(spaceAdvance(11, false))
    }
  }

  addNodes(entities: EntityDescriptor[]): void { this.entities = entities }
  addEdges(relations: Rel[]): void { this.relations = relations }
  addLayoutConstraints(constraints: Lay[]): void { this.constraints = constraints }

  setLayoutOptions(options: {
    rankdir?: 'TB' | 'BT' | 'LR' | 'RL'
    nodesep?: number
    edgesep?: number
    ranksep?: number
    marginx?: number
    marginy?: number
  }): void {
    const dir = { TB: 'DOWN', BT: 'UP', LR: 'RIGHT', RL: 'LEFT' }[options.rankdir ?? 'TB']
    this.graphOpts = {
      'elk.direction': dir,
      // nodesep/ranksep map to ELK layered spacings (caller-tunable; the
      // CatalystOptions defaults are the public, documented values).
      ...(options.nodesep !== undefined ? { 'elk.spacing.nodeNode': String(options.nodesep) } : {}),
      ...(options.ranksep !== undefined ? { 'elk.layered.spacing.nodeNodeBetweenLayers': String(options.ranksep) } : {}),
      ...(options.edgesep !== undefined ? { 'elk.layered.spacing.edgeEdgeBetweenLayers': String(options.edgesep) } : {})
    }
  }

  /** Build the ELK node tree. Leaves are text-measured (L3); compound nodes
   * (boundaries / Deployment_Node) get children + a font-derived title pad. */
  private buildNodes(entities: EntityDescriptor[]): ElkNode[] {
    const pad = this.titlePadding()
    const toElk = (e: EntityDescriptor): ElkNode => {
      if (e.children && e.children.length) {
        return {
          id: e.alias,
          children: e.children.map(toElk),
          layoutOptions: {
            'elk.padding': `[top=${pad.top},left=${pad.side},bottom=${pad.side},right=${pad.side}]`
          }
        }
      }
      const d = measureNode(e)
      return { id: e.alias, width: d.width, height: d.height }
    }
    return entities.map(toElk)
  }

  /**
   * L1 L/R via ELK model order: ELK honors the children-array order within a
   * layer when considerModelOrder is on. For Rel_R(a,b) b is right of a, for
   * Rel_L(a,b) b is left of a — reorder same-parent sibling groups so the
   * array reflects that. Conflicts resolve first-seen (documented).
   */
  private applyHorizontalOrder(roots: ElkNode[]): void {
    const order = new Map<string, { left: Set<string>; right: Set<string> }>()
    const rel = (a: string) => order.get(a) ?? order.set(a, { left: new Set(), right: new Set() }).get(a)!
    for (const r of this.relations) {
      if (r.direction === 'R') rel(r.source).right.add(r.target)
      else if (r.direction === 'L') rel(r.source).left.add(r.target)
    }
    if (order.size === 0) return
    const sortSiblings = (nodes: ElkNode[]) => {
      nodes.sort((x, y) => {
        if (order.get(x.id)?.right.has(y.id) || order.get(y.id)?.left.has(x.id)) return -1
        if (order.get(x.id)?.left.has(y.id) || order.get(y.id)?.right.has(x.id)) return 1
        return 0
      })
      for (const n of nodes) if (n.children) sortSiblings(n.children)
    }
    sortSiblings(roots)
  }

  /**
   * Spec-grounded algorithm selection (not a numeric heuristic). A C4
   * *Context* diagram contains only people/systems (+ boundaries) and NO
   * Container/Component/Deployment_Node — it is an inherently hub-and-spoke
   * overview that `layered` spreads into a wide ribbon (true of dagre, ELK
   * AND PlantUML's own Graphviz/dot). Container/Component/Deployment diagrams
   * are hierarchical/flow and belong in `layered`. The discriminator is the
   * C4 spec's own diagram-level definition — the set of entity types present
   * — read straight from the parsed model.
   */
  private isHierarchical(): boolean {
    const deeper = /^(Container|Component|Node|Deployment_Node)/
    const scan = (es: EntityDescriptor[]): boolean =>
      es.some(e => deeper.test(e.type) || (e.children ? scan(e.children) : false))
    return scan(this.entities)
  }

  private buildGraph(): ElkNode {
    const children = this.buildNodes(this.entities)
    this.applyHorizontalOrder(children)

    // Visible relations as ELK edges. L1 U/D is engine-agnostic: feeding the
    // edge reversed makes the target rank above the source (the VISIBLE
    // connector is still emitted from pumlRelations in layoutData2mx with the
    // authored from→to, so this only affects placement). L/R handled by model
    // order above. `rel<i>` name lets layoutData2mx pull the routed polyline.
    const edges: ElkExtendedEdge[] = this.relations.map((r, i) => {
      const up = r.direction === 'U'
      return { id: `rel${i}`, sources: [up ? r.target : r.source], targets: [up ? r.source : r.target] }
    })
    // Layout-only Lay_* edges: present for ELK ranking, NOT in pumlRelations,
    // so layoutData2mx never draws them (it only emits `rel<n>` geometry +
    // visible edges from pumlRelations).
    this.constraints.forEach((c, i) => {
      const up = c.direction === 'U'
      edges.push({ id: `lay${i}`, sources: [up ? c.target : c.source], targets: [up ? c.source : c.target] })
    })

    const hierarchical = this.isHierarchical()
    const layoutOptions: Record<string, string> = hierarchical
      ? {
          // Hierarchical C4 (Container/Component/Deployment): layered flow.
          'elk.algorithm': 'org.eclipse.elk.layered',
          'elk.direction': 'DOWN',
          'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
          'elk.edgeRouting': 'ORTHOGONAL',
          // `elk.layered.wrapping.*` was tried and removed: ELK's docs state
          // wrapping splits a long *sequence of layers* into side-by-side
          // chunks — NOT a single over-wide rank — and it empirically
          // flattened normal ranking. Plain layered already balances
          // hierarchical C4 (multiple ranks); the wide-star case is handled
          // by the force branch below, not by mis-using wrapping.
          // L1 L/R: bias within-layer order by model order WITHOUT overriding
          // edge ranking (forceNodeModelOrder rejected — it flattens ranks).
          'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
          ...this.graphOpts
        }
      : {
          // C4 Context (hub-and-spoke): force gives a balanced, overlap-free
          // arrangement (spike on the real ibmwm-c4-context: layered 2.43 →
          // force 0.98, 0/12 overlaps). Edges are straight (a context
          // overview is not a flow diagram). graphOpts (rankdir/spacing) do
          // not apply to force and are intentionally not spread here.
          'elk.algorithm': 'org.eclipse.elk.force',
          'elk.hierarchyHandling': 'INCLUDE_CHILDREN'
        }

    return { id: 'root', layoutOptions, children, edges }
  }

  async calculateLayout(): Promise<LayoutResult> {
    const g = this.buildGraph()
    // elkjs returns a laid-out graph: x/y/width/height on shapes, routed
    // `sections` on edges (top-level edge coords are absolute).
    const r = await this.elk.layout(g)

    const nodes: LayoutNode[] = []
    const clusters: LayoutNode[] = []
    // ELK child coords are relative to the parent → accumulate to absolute.
    const walk = (n: { id: string; x?: number; y?: number; width?: number; height?: number; children?: unknown[] }, ox: number, oy: number, parent?: string) => {
      const x = (n.x ?? 0) + ox
      const y = (n.y ?? 0) + oy
      const kids = (n.children ?? []) as typeof nodes extends never ? never : Array<{ id: string; x?: number; y?: number; width?: number; height?: number; children?: unknown[] }>
      const isCluster = kids.length > 0
      const ln: LayoutNode = {
        id: n.id, x, y,
        width: n.width ?? 0, height: n.height ?? 0,
        isCluster,
        parent,
        children: isCluster ? kids.map(k => k.id) : undefined
      }
      ;(isCluster ? clusters : nodes).push(ln)
      for (const k of kids) walk(k, x, y, n.id)
    }
    for (const c of r.children ?? []) walk(c, 0, 0)

    // L1 L/R — safe same-rank post-pass. A Rel_L/Rel_R also emits an a→b
    // edge, so a layered engine ranks a and b on DIFFERENT rows whenever
    // that edge constrains them — "b beside a" is then geometrically
    // impossible (true of ELK, dagre, and PlantUML/dot alike). So we only
    // act when ELK *already* placed the two on the same rank — detected by
    // their vertical extents overlapping (a geometric fact from the real
    // output, not a tolerance/threshold). In that case swap their x to
    // satisfy the hint; otherwise leave the layout untouched. This never
    // fights the layered structure and cannot degrade the layout.
    const byId = new Map<string, LayoutNode>()
    for (const n of [...nodes, ...clusters]) byId.set(n.id, n)
    for (const rel of this.relations) {
      if (rel.direction !== 'L' && rel.direction !== 'R') continue
      const a = byId.get(rel.source)
      const b = byId.get(rel.target)
      if (!a || !b || a.x === undefined || b.x === undefined || a.y === undefined || b.y === undefined) continue
      const sameRank = a.y < b.y + b.height && b.y < a.y + a.height // y-extents overlap
      if (!sameRank) continue
      const wantBefore = rel.direction === 'L'              // L: target left of source
      const isBefore = b.x < a.x
      if (isBefore !== wantBefore) { const t = a.x; a.x = b.x; b.x = t }
    }

    // Top-level edges → coords are absolute (relative to root). Map ELK
    // sections to a polyline; layoutData2mx threads `rel<n>` ones as drawio
    // waypoints (L2) and ignores `lay<n>` (layout-only).
    const edges: LayoutEdge[] = []
    for (const e of r.edges ?? []) {
      const m = /^(rel|lay)(\d+)$/.exec(e.id)
      if (!m) continue
      const isRel = m[1] === 'rel'
      const src = isRel ? this.relations[+m[2]] : this.constraints[+m[2]]
      if (!src) continue
      const s = e.sections?.[0]
      const pts = s ? [s.startPoint, ...(s.bendPoints ?? []), s.endPoint] : []
      edges.push({ source: src.source, target: src.target, name: e.id, points: pts })
    }

    return {
      nodes,
      edges,
      clusters,
      width: Math.ceil(r.width ?? 0),
      height: Math.ceil(r.height ?? 0)
    }
  }

  static async calculateLayout(
    entities: EntityDescriptor[],
    relations: Rel[],
    options?: {
      rankdir?: 'TB' | 'BT' | 'LR' | 'RL'
      nodesep?: number
      edgesep?: number
      ranksep?: number
      marginx?: number
      marginy?: number
    },
    layoutConstraints: Lay[] = []
  ): Promise<LayoutResult> {
    const engine = new LayoutEngine()
    if (options) engine.setLayoutOptions(options)
    engine.addNodes(entities)
    engine.addEdges(relations)
    engine.addLayoutConstraints(layoutConstraints)
    return engine.calculateLayout()
  }
}

export { LayoutEngine, LayoutResult, LayoutNode, LayoutEdge }
