import { EntityParser, EntityDescriptor } from "./puml/EntityParser.mjs"
import { Mx, MxGeometry } from './mx/Mx.mjs'
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

  // Build alias → parent-alias map by walking the entity hierarchy once.
  // Used to preserve drawio containment (e.g. Container inside System_Boundary).
  const parentOf = new Map<string, string>()
  const walk = (entities: EntityDescriptor[], parent?: string) => {
    for (const e of entities) {
      if (parent) parentOf.set(e.alias, parent)
      if (e.children) walk(e.children, e.alias)
    }
  }
  walk(pumlElements)

  // Every entity alias that actually got emitted as a drawio vertex/cluster.
  // Used to guarantee (and surface) edge-endpoint resolution: a relationship
  // whose source/target isn't in here would be an orphan connector in drawio.
  const emittedIds = new Set<string>()

  // Handle nodes from layout data. Pass every valid C4 type through — Mx.addMxC4's
  // switch decides the shape/style. `default: break` here would drop Persons,
  // System_Ext, ContainerDb, etc.
  if (layoutData.nodes && Array.isArray(layoutData.nodes)) {
    for (const node of layoutData.nodes) {
      const g = new MxGeometry(node.height, node.width, node.x, node.y)
      const info = parser.getObjectWithPropertyAndValueInHierarchy(pumlElements, 'alias', node.id)

      if (info) {
        await mx.addMxC4(node.id, g, info.type, info.label, info.technology, info.description, parentOf.get(node.id), overrideFor(info.type, info.tags, styles), info.link)
        emittedIds.add(node.id)
      }
    }
  }

  // Handle clusters from layout data — same treatment. Boundaries land here
  // (they're stack frames in the PUML and always have children).
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
        await mx.addMxC4(cluster.id, g, info.type, info.label, info.technology, info.description, parentOf.get(cluster.id), ovr, info.link)
        emittedIds.add(cluster.id)
      }
    }
  }

  // Emit ONE drawio edge per parsed relation — driven by pumlRelations, NOT by
  // the (deduped) dagre edge set. dagre's multigraph keeps parallel edges, but
  // correlating layout geometry back to relations is best-effort only; the
  // hard guarantee is "no relation is silently dropped", which means iterating
  // the relations themselves. Layout points are looked up by the `rel<index>`
  // edge name when present, else a default line geometry is used (drawio
  // re-routes edges from source/target cells anyway).
  const layoutEdgeByRelIdx = new Map<number, { x: number; y: number }[]>()
  if (layoutData.edges && Array.isArray(layoutData.edges)) {
    for (const e of layoutData.edges) {
      const m = /^rel(\d+)$/.exec(e.name ?? '')
      if (m && e.points && e.points.length > 0) {
        layoutEdgeByRelIdx.set(parseInt(m[1], 10), e.points)
      }
    }
  }

  for (let i = 0; i < pumlRelations.length; i++) {
    const rel = pumlRelations[i]
    const points = layoutEdgeByRelIdx.get(i) ?? [{ x: 0, y: 0 }, { x: 100, y: 100 }]
    const firstPoint = points[0] ?? { x: 0, y: 0 }
    const g = new MxGeometry(20, 100, firstPoint.x, firstPoint.y)
    const relOvr: StyleOverride = { ...styles.relDefault }
    for (const tag of (rel.tags ?? '').split('+').map(s => s.trim()).filter(Boolean)) {
      if (styles.relTags.has(tag)) Object.assign(relOvr, styles.relTags.get(tag))
    }
    await mx.addMxC4Relationship(g, rel.source, rel.target, 'Relationship', rel.label, undefined, rel.description, rel.bidirectional === true, Object.keys(relOvr).length ? relOvr : undefined)
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
    const styles = StyleParser.parse(pumlContent)

    const layoutOptions = {
      rankdir: options.layoutDirection || 'TB',
      nodesep: options.nodesep || 50,
      edgesep: options.edgesep || 10,
      ranksep: options.ranksep || 50,
      marginx: options.marginx || 20,
      marginy: options.marginy || 20
    }

    const layoutData = await LayoutEngine.calculateLayout(elements, relations, layoutOptions)
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
