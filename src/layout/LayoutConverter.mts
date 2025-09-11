import { DagreLayoutEngine, LayoutResult } from './DagreLayoutEngine.mjs'
import { EntityDescriptor } from '../puml/EntityDescriptor.interface.mjs'
import { MxGeometry } from '../mx/MxGeometry.mjs'

/**
 * Converts Dagre layout results to the format expected by the existing Mx system
 */
class LayoutConverter {
  
  /**
   * Convert Dagre layout result to a format compatible with existing svg2mx function
   */
  static convertToSvgFormat(layoutResult: LayoutResult): {
    getDocumentHeight: () => number
    getDocumentWidth: () => number
    getGroups: () => Array<{
      $: { id: string }
      rect?: Array<{ $: { height: number; width: number; x: number; y: number } }>
      path?: { $: { d: string } }
    }>
  } {
    const groups: Array<{
      $: { id: string }
      rect?: Array<{ $: { height: number; width: number; x: number; y: number } }>
      path?: { $: { d: string } }
    }> = []

    // Convert clusters (Systems/Containers) to cluster elements
    layoutResult.clusters.forEach(cluster => {
      if (cluster.x !== undefined && cluster.y !== undefined) {
        groups.push({
          $: { id: `cluster_${cluster.id}` },
          rect: [{
            $: {
              height: cluster.height,
              width: cluster.width,
              x: cluster.x - cluster.width / 2, // Dagre uses center coordinates
              y: cluster.y - cluster.height / 2
            }
          }]
        })
      }
    })

    // Convert leaf nodes (Components) to elem elements
    layoutResult.nodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        groups.push({
          $: { id: `elem_${node.id}` },
          rect: [{
            $: {
              height: node.height,
              width: node.width,
              x: node.x - node.width / 2, // Dagre uses center coordinates
              y: node.y - node.height / 2
            }
          }]
        })
      }
    })

    // Convert edges to path elements
    layoutResult.edges.forEach(edge => {
      if (edge.points && edge.points.length >= 2) {
        const pathData = this.generatePathData(edge.points)
        groups.push({
          $: { id: `link_${edge.source}_${edge.target}` },
          path: {
            $: { d: pathData }
          }
        })
      }
    })

    return {
      getDocumentHeight: () => layoutResult.height,
      getDocumentWidth: () => layoutResult.width,
      getGroups: () => groups
    }
  }

  /**
   * Generate SVG path data from edge points
   */
  private static generatePathData(points: Array<{ x: number; y: number }>): string {
    if (points.length < 2) return ''

    const start = points[0]
    const end = points[points.length - 1]

    // Create a simple path with control points for smooth curves
    if (points.length === 2) {
      // Simple straight line
      return `M${start.x},${start.y}L${end.x},${end.y}`
    } else {
      // Use cubic bezier curves for multi-point paths
      let pathData = `M${start.x},${start.y}`
      
      for (let i = 1; i < points.length - 1; i++) {
        const current = points[i]
        pathData += `L${current.x},${current.y}`
      }
      
      pathData += `L${end.x},${end.y}`
      return pathData
    }
  }

  /**
   * Create a layout engine and calculate layout for given entities and relations
   */
  static async calculateLayout(
    entities: EntityDescriptor[],
    relations: Array<{ source: string; target: string; label: string; description: string }>,
    options?: {
      rankdir?: 'TB' | 'BT' | 'LR' | 'RL'
      align?: 'UL' | 'UR' | 'DL' | 'DR'
      nodesep?: number
      edgesep?: number
      ranksep?: number
      marginx?: number
      marginy?: number
    }
  ): Promise<{
    getDocumentHeight: () => number
    getDocumentWidth: () => number
    getGroups: () => Array<{
      $: { id: string }
      rect?: Array<{ $: { height: number; width: number; x: number; y: number } }>
      path?: { $: { d: string } }
    }>
  }> {
    const layoutEngine = new DagreLayoutEngine()
    
    if (options) {
      layoutEngine.setLayoutOptions(options)
    }
    
    layoutEngine.addNodes(entities)
    layoutEngine.addEdges(relations)
    
    const layoutResult = layoutEngine.calculateLayout()
    
    return this.convertToSvgFormat(layoutResult)
  }
}

export { LayoutConverter }