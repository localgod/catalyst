import { EntityParser, EntityDescriptor } from "./puml/EntityParser.mjs"
import { Mx, MxGeometry } from './mx/Mx.mjs'
import { RelParser } from './puml/RelParser.mjs'
import { LayoutEngine, LayoutResult } from './layout/LayoutEngine.mjs'

async function layoutData2mx(layoutData: LayoutResult, pumlElements: EntityDescriptor[], pumlRelations: { source: string, target: string, label: string, description: string }[]): Promise<string> {
  const mx = new Mx(layoutData.height || 600, layoutData.width || 800)
  
  // Handle nodes from layout data
  if (layoutData.nodes && Array.isArray(layoutData.nodes)) {
    for (const node of layoutData.nodes) {
      const g = new MxGeometry(node.height, node.width, node.x, node.y)
      const info = new EntityParser().getObjectWithPropertyAndValueInHierarchy(pumlElements, 'alias', node.id)

      if (info) {
        switch (info.type) {
          case 'System':
            await mx.addMxC4(node.id, g, 'System', info.label, info.technology, info.description)
            break
          case 'Container':
            await mx.addMxC4(node.id, g, 'Container', info.label, info.technology, info.description)
            break
          case 'Component':
            await mx.addMxC4(node.id, g, 'Component', info.label, info.technology, info.description)
            break
          default:
            break
        }
      }
    }
  }

  // Handle clusters from layout data
  if (layoutData.clusters && Array.isArray(layoutData.clusters)) {
    for (const cluster of layoutData.clusters) {
      const g = new MxGeometry(cluster.height, cluster.width, cluster.x, cluster.y)
      const info = new EntityParser().getObjectWithPropertyAndValueInHierarchy(pumlElements, 'alias', cluster.id)

      if (info) {
        switch (info.type) {
          case 'System':
            await mx.addMxC4(cluster.id, g, 'System', info.label, info.technology, info.description)
            break
          case 'Container':
            await mx.addMxC4(cluster.id, g, 'Container', info.label, info.technology, info.description)
            break
          default:
            break
        }
      }
    }
  }

  // Handle edges from layout data
  if (layoutData.edges && Array.isArray(layoutData.edges)) {
    for (const edge of layoutData.edges) {
      const rel = pumlRelations.find(r => r.source === edge.source && r.target === edge.target)
      if (rel) {
        // Create a simple path for the relationship using edge points or default positions
        const points = edge.points || [
          { x: 0, y: 0 },
          { x: 100, y: 100 }
        ]
        // Convert points array to MxGeometry format - for now use first point as geometry
        const firstPoint = points[0] || { x: 0, y: 0 }
        const g = new MxGeometry(20, 100, firstPoint.x, firstPoint.y) // Simple line geometry
        await mx.addMxC4Relationship(g, edge.source, edge.target, 'Relationship', rel.label, rel.description)
      }
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

    const layoutOptions = {
      rankdir: options.layoutDirection || 'TB',
      nodesep: options.nodesep || 50,
      edgesep: options.edgesep || 10,
      ranksep: options.ranksep || 50,
      marginx: options.marginx || 20,
      marginy: options.marginy || 20
    }

    const layoutData = await LayoutEngine.calculateLayout(elements, relations, layoutOptions)
    return await layoutData2mx(layoutData, elements, relations)
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
  static parseRelations(pumlContent: string): { source: string, target: string, label: string, description: string }[] {
    return RelParser.getRelations(pumlContent)
  }
}
