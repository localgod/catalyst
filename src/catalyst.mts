import { EntityParser, EntityDescriptor } from "./puml/EntityParser.mjs"
import { Mx, MxGeometry } from './mx/Mx.mjs'
import { MxPoint } from './mx/MxPoint.mjs'
import { RelParser } from './puml/RelParser.mjs'
import { LayoutEngine, LayoutResult } from './layout/LayoutEngine.mjs'
import { StyleParser } from './puml/StyleParser.mjs'
import type { ParsedStyles, StyleOverride } from './puml/StyleParser.mjs'

// C4 element type -> the element-kind name used by UpdateElementStyle().
const ELEMENT_KIND: Record<string, string> = {
  Person: 'person', Person_Ext: 'external_person',
  System: 'system', System_Ext: 'external_system',
  SystemDb: 'system_db', SystemQueue: 'system_queue',
  Container: 'container', Container_Ext: 'external_container',
  ContainerDb: 'container_db', ContainerQueue: 'container_queue',
  Component: 'component', Component_Ext: 'external_component',
}

/** Merge UpdateElementStyle(by-kind) then AddElementTag(by $tags) overrides. */
function overrideFor(type: string, tags: string | undefined, styles: ParsedStyles): StyleOverride | undefined {
  const merged: StyleOverride = {}
  const kind = ELEMENT_KIND[type]
  if (kind && styles.elementStyles.has(kind)) Object.assign(merged, styles.elementStyles.get(kind))
  for (const tag of (tags ?? '').split('+').map(s => s.trim()).filter(Boolean)) {
    if (styles.elementTags.has(tag)) Object.assign(merged, styles.elementTags.get(tag))
  }
  return Object.keys(merged).length ? merged : undefined
}

async function layoutData2mx(layoutData: LayoutResult, pumlElements: EntityDescriptor[], pumlRelations: { source: string, target: string, label: string, description: string, bidirectional?: boolean, tags?: string }[], styles: ParsedStyles): Promise<string> {
  const mx = new Mx(layoutData.height || 600, layoutData.width || 800)
  const parser = new EntityParser()

  // LayoutEngine (elkjs) returns every shape in ONE absolute coordinate
  // space (ELK parent-relative top-left coords accumulated to absolute).
  // Every cell is emitted flat under root ("1"); a boundary visually
  // contains its children because its computed box encloses their absolute
  // positions. (drawio parent-relative coords would double-offset against
  // the absolute layout output — flat + absolute is the consistent model.)

  // Every entity alias that actually got emitted as a drawio vertex/cluster.
  // Used to guarantee (and surface) edge-endpoint resolution: a relationship
  // whose source/target isn't in here would be an orphan connector in drawio.
  const emittedIds = new Set<string>()

  // Clusters (boundaries / Deployment_Node) FIRST so they render behind their
  // children (drawio z-order = document order). ELK-computed box encloses
  // the children's absolute positions; emitted flat (parent "1").
  if (layoutData.clusters && Array.isArray(layoutData.clusters)) {
    for (const cluster of layoutData.clusters) {
      const g = new MxGeometry(cluster.height, cluster.width, cluster.x, cluster.y)
      const info = parser.getObjectWithPropertyAndValueInHierarchy(pumlElements, 'alias', cluster.id)

      if (info) {
        // Boundary tags use boundaryTags/boundaryDefault; non-boundary
        // clusters (e.g. Deployment_Node) reuse the element override path.
        const isBoundary = info.type.endsWith('Boundary')
        let ovr = overrideFor(info.type, info.tags, styles)
        if (isBoundary) {
          const b: StyleOverride = { ...styles.boundaryDefault }
          for (const tag of (info.tags ?? '').split('+').map(s => s.trim()).filter(Boolean)) {
            if (styles.boundaryTags.has(tag)) Object.assign(b, styles.boundaryTags.get(tag))
          }
          ovr = Object.keys(b).length ? b : undefined
        }
        await mx.addMxC4(cluster.id, g, info.type, info.label, info.technology, info.description, undefined, ovr, info.link)
        emittedIds.add(cluster.id)
      }
    }
  }

  // Leaf shapes on top. Pass every valid C4 type through — Mx.addMxC4's
  // switch decides the shape/style.
  if (layoutData.nodes && Array.isArray(layoutData.nodes)) {
    for (const node of layoutData.nodes) {
      const g = new MxGeometry(node.height, node.width, node.x, node.y)
      const info = parser.getObjectWithPropertyAndValueInHierarchy(pumlElements, 'alias', node.id)

      if (info) {
        await mx.addMxC4(node.id, g, info.type, info.label, info.technology, info.description, undefined, overrideFor(info.type, info.tags, styles), info.link)
        emittedIds.add(node.id)
      }
    }
  }

  // Emit ONE drawio edge per parsed relation — driven by pumlRelations, NOT by
  // the layout engine's edge set. The hard guarantee is "no relation is
  // silently dropped", which means iterating the relations themselves. Layout
  // points are looked up by the `rel<index>` edge name when present, else a
  // default geometry is used (drawio re-routes from source/target cells).
  const layoutEdgeByRelIdx = new Map<number, { x: number; y: number }[]>()
  if (layoutData.edges && Array.isArray(layoutData.edges)) {
    for (const e of layoutData.edges) {
      const m = /^rel(\d+)$/.exec(e.name ?? '')
      if (m && e.points && e.points.length > 0) {
        layoutEdgeByRelIdx.set(parseInt(m[1], 10), e.points)
      }
    }
  }
  // L2: ELK computes a routed polyline (edge sections) in the SAME absolute
  // space as the emitted shapes (LayoutEngine accumulates ELK's parent-
  // relative coords to absolute). Thread the INTERIOR points (drop the
  // first/last node-attach points — drawio anchors to the cells itself) as
  // drawio waypoints. Skipped when an endpoint is a
  // cluster: L4 reroutes such ranking edges onto a leaf, so that polyline
  // would not match the visible boundary endpoints — let drawio auto-route.
  const clusterIds = new Set<string>((layoutData.clusters ?? []).map(c => c.id))

  for (let i = 0; i < pumlRelations.length; i++) {
    const rel = pumlRelations[i]
    const g = new MxGeometry()
    g.$.relative = 1
    const poly = layoutEdgeByRelIdx.get(i)
    if (poly && poly.length > 2 && !clusterIds.has(rel.source) && !clusterIds.has(rel.target)) {
      for (const p of poly.slice(1, -1)) {
        g.addArrayPoint(new MxPoint(Math.round(p.x), Math.round(p.y)))
      }
    }
    const relOvr: StyleOverride = { ...styles.relDefault }
    for (const tag of (rel.tags ?? '').split('+').map(s => s.trim()).filter(Boolean)) {
      if (styles.relTags.has(tag)) Object.assign(relOvr, styles.relTags.get(tag))
    }
    // C4-PlantUML grammar: Rel(from, to, "verb", ?"technology"). The parser
    // names group 5 `label` (the verb shown bold, -> c4Name) and group 6
    // `description` (which is semantically the *technology*, shown bracketed
    // -> c4Technology). Passing rel.description as the `technology` arg fixes
    // the swapped-field bug where the verb landed in unused c4Name and the
    // template rendered the technology bold + an empty "[]".
    await mx.addMxC4Relationship(g, rel.source, rel.target, 'Relationship', rel.label, rel.description, undefined, rel.bidirectional === true, Object.keys(relOvr).length ? relOvr : undefined)
    if (!emittedIds.has(rel.source) || !emittedIds.has(rel.target)) {
      // Not silently swallowed: an unresolved endpoint means the puml
      // referenced an alias that never produced a shape. Surface it so the
      // parity test / CI fails loudly instead of shipping an orphan connector.
      console.warn(`catalyst: relationship "${rel.source}" -> "${rel.target}" has an endpoint with no emitted shape; drawio connector will be orphaned`)
    }
  }

  return await mx.generate()
}



export interface CatalystOptions {
  layoutDirection?: 'TB' | 'BT' | 'LR' | 'RL'
  nodesep?: number
  edgesep?: number
  ranksep?: number
  marginx?: number
  marginy?: number
}

export class Catalyst {
  /**
   * Convert PlantUML C4 diagram to draw.io XML format
   * @param pumlContent - The PlantUML content as string
   * @param options - Layout options for the diagram
   * @returns Promise<string> - The draw.io XML content
   */
  static async convert(pumlContent: string, options: CatalystOptions = {}): Promise<string> {
    const elements = new EntityParser().parse(pumlContent)
    const relations = RelParser.getRelations(pumlContent)
    const layoutConstraints = RelParser.getLayoutConstraints(pumlContent)
    const styles = StyleParser.parse(pumlContent)

    const layoutOptions = {
      rankdir: options.layoutDirection || 'TB',
      nodesep: options.nodesep || 50,
      edgesep: options.edgesep || 10,
      ranksep: options.ranksep || 50,
      marginx: options.marginx || 20,
      marginy: options.marginy || 20
    }

    const layoutData = await LayoutEngine.calculateLayout(elements, relations, layoutOptions, layoutConstraints)
    return await layoutData2mx(layoutData, elements, relations, styles)
  }

  /**
   * Parse PlantUML content and extract entities
   * @param pumlContent - The PlantUML content as string
   * @returns EntityDescriptor[] - Array of parsed entities
   */
  static parseEntities(pumlContent: string): EntityDescriptor[] {
    return new EntityParser().parse(pumlContent)
  }

  /**
   * Parse PlantUML content and extract relations
   * @param pumlContent - The PlantUML content as string
   * @returns Array of relations
   */
  static parseRelations(pumlContent: string): { source: string, target: string, label: string, description: string, bidirectional: boolean }[] {
    return RelParser.getRelations(pumlContent)
  }
}
