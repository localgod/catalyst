import dagre from '@dagrejs/dagre'
import { EntityDescriptor } from '../puml/EntityDescriptor.interface.mjs'

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
  points?: { x: number; y: number }[]
}

interface LayoutResult {
  nodes: LayoutNode[]
  edges: LayoutEdge[]
  clusters: LayoutNode[]
  width: number
  height: number
}

class LayoutEngine {
  private graph: dagre.graphlib.Graph
  private clusters: Map<string, LayoutNode> = new Map()
  private nodeHierarchy: Map<string, string[]> = new Map()

  constructor() {
    // Start with simple graph, we'll handle hierarchy manually
    this.graph = new dagre.graphlib.Graph()
    this.graph.setGraph({
      rankdir: 'TB',
      align: 'UL',
      nodesep: 80,    // Increased horizontal spacing between nodes
      edgesep: 20,    // Increased edge separation
      ranksep: 100,   // Increased vertical spacing between ranks
      marginx: 40,    // Increased horizontal margins
      marginy: 40     // Increased vertical margins
    })
    this.graph.setDefaultEdgeLabel(() => ({}))
  }

  /**
   * Calculate default dimensions for different C4 element types
   */
  private getDefaultDimensions(type: string): { width: number; height: number } {
    switch (type) {
      case 'System':
        return { width: 220, height: 140 }  // Increased for better text space
      case 'Container':
        return { width: 200, height: 120 }  // Increased for better text space
      case 'Component':
        return { width: 180, height: 100 }  // Increased for better text space
      default:
        return { width: 160, height: 90 }
    }
  }

  /**
   * Calculate padding needed for container text (title, technology, description)
   */
  private getContainerTextPadding(type: string): { top: number; bottom: number; left: number; right: number } {
    switch (type) {
      case 'System':
        return { top: 70, bottom: 25, left: 25, right: 25 }  // Space for system title/description
      case 'Container':
        return { top: 50, bottom: 20, left: 20, right: 20 }  // Space for container title/technology
      case 'Component':
        return { top: 0, bottom: 0, left: 0, right: 0 }      // Components don't contain other elements
      default:
        return { top: 40, bottom: 15, left: 15, right: 15 }
    }
  }

  /**
   * Add nodes from parsed C4 entities with hierarchical support
   */
  addNodes(entities: EntityDescriptor[]): void {
    const addNodeRecursively = (entity: EntityDescriptor, parentId?: string) => {
      const dimensions = this.getDefaultDimensions(entity.type)
      const hasChildren = entity.children && entity.children.length > 0
      
      // Only add leaf nodes (components) to the graph for layout
      // Clusters will be calculated based on their children positions
      if (!hasChildren) {
        this.graph.setNode(entity.alias, {
          label: entity.label,
          width: dimensions.width,
          height: dimensions.height,
          type: entity.type,
          technology: entity.technology,
          description: entity.description,
          isCluster: false,
          parentId: parentId
        })
      } else {
        // Track clusters (nodes that contain other nodes) separately
        this.clusters.set(entity.alias, {
          id: entity.alias,
          width: dimensions.width,
          height: dimensions.height,
          type: entity.type,
          isCluster: true,
          children: entity.children!.map(child => child.alias),
          parent: parentId
        })
        
        this.nodeHierarchy.set(entity.alias, entity.children!.map(child => child.alias))
      }

      // Add child nodes recursively
      if (entity.children) {
        entity.children.forEach(child => addNodeRecursively(child, entity.alias))
      }
    }

    entities.forEach(entity => addNodeRecursively(entity))
  }

  /**
   * Add edges from parsed C4 relations
   */
  addEdges(relations: { source: string; target: string; label: string; description: string }[]): void {
    relations.forEach(relation => {
      this.graph.setEdge(relation.source, relation.target, {
        label: relation.label,
        description: relation.description
      })
    })
  }

  /**
   * Calculate cluster bounds based on children positions
   */
  private calculateClusterBounds(clusterId: string, allNodes: Map<string, LayoutNode>, allClusters: Map<string, LayoutNode>): { x: number; y: number; width: number; height: number } {
    const childrenIds = this.nodeHierarchy.get(clusterId) || []
    const clusterInfo = this.clusters.get(clusterId)
    
    if (childrenIds.length === 0) {
      const defaultDims = this.getDefaultDimensions(clusterInfo?.type || 'System')
      return {
        x: 0,
        y: 0,
        width: defaultDims.width,
        height: defaultDims.height
      }
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    let hasValidChildren = false

    childrenIds.forEach(childId => {
      // Check if child is a node or cluster
      const childNode = allNodes.get(childId)
      const childCluster = allClusters.get(childId)
      const child = childNode || childCluster
      
      if (child && child.x !== undefined && child.y !== undefined && 
          isFinite(child.x) && isFinite(child.y)) {
        const childMinX = child.x - child.width / 2
        const childMinY = child.y - child.height / 2
        const childMaxX = child.x + child.width / 2
        const childMaxY = child.y + child.height / 2

        minX = Math.min(minX, childMinX)
        minY = Math.min(minY, childMinY)
        maxX = Math.max(maxX, childMaxX)
        maxY = Math.max(maxY, childMaxY)
        hasValidChildren = true
      }
    })

    // If no valid children found, use default dimensions
    if (!hasValidChildren || !isFinite(minX) || !isFinite(minY)) {
      const defaultDims = this.getDefaultDimensions(clusterInfo?.type || 'System')
      return {
        x: 0,
        y: 0,
        width: defaultDims.width,
        height: defaultDims.height
      }
    }

    // Get appropriate padding based on container type
    const padding = this.getContainerTextPadding(clusterInfo?.type || 'System')
    
    // Calculate bounds with proper padding for text areas
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    
    return {
      x: minX - padding.left,
      y: minY - padding.top,
      width: contentWidth + padding.left + padding.right,
      height: contentHeight + padding.top + padding.bottom
    }
  }

  /**
   * Calculate layout using Dagre with proper hierarchical positioning
   */
  calculateLayout(): LayoutResult {
    // Layout only the leaf nodes (components)
    dagre.layout(this.graph)

    const allNodesMap = new Map<string, LayoutNode>()
    const allNodes: LayoutNode[] = []

    // Collect positioned leaf nodes
    this.graph.nodes().forEach(nodeId => {
      const node = this.graph.node(nodeId) as any
      
      if (node && node.x !== undefined && node.y !== undefined) {
        const layoutNode: LayoutNode = {
          id: nodeId,
          ...node,
          x: node.x,
          y: node.y
        }
        allNodesMap.set(nodeId, layoutNode)
        allNodes.push(layoutNode)
      }
    })

    // Calculate hierarchical layout: Systems -> Containers -> Components
    const clustersArray: LayoutNode[] = []
    const allClustersMap = new Map<string, LayoutNode>()

    // Step 1: Position root systems in a grid layout
    const rootClusters = Array.from(this.clusters.values()).filter(cluster => !cluster.parent)
    const systemSpacing = 100
    
    let currentX = 0
    let currentY = 0
    let maxRowHeight = 0
    const maxRowWidth = 1200

    rootClusters.forEach((systemInfo, index) => {
      // Calculate system bounds based on its containers and components
      const systemBounds = this.calculateSystemBounds(systemInfo.id, allNodesMap)
      
      // Check if we need to wrap to next row
      if (currentX + systemBounds.width > maxRowWidth && index > 0) {
        currentY += maxRowHeight + systemSpacing
        currentX = 0
        maxRowHeight = 0
      }
      
      const systemNode: LayoutNode = {
        ...systemInfo,
        x: currentX + systemBounds.width / 2,
        y: currentY + systemBounds.height / 2,
        width: systemBounds.width,
        height: systemBounds.height
      }
      
      allClustersMap.set(systemInfo.id, systemNode)
      clustersArray.push(systemNode)
      
      // Step 2: Position containers within this system
      this.positionContainersInSystem(systemInfo.id, systemNode, allNodesMap, allClustersMap, clustersArray)
      
      // Update position for next system
      currentX += systemBounds.width + systemSpacing
      maxRowHeight = Math.max(maxRowHeight, systemBounds.height)
    })

    const edges: LayoutEdge[] = this.graph.edges().map(edgeObj => {
      const edge = this.graph.edge(edgeObj)
      return {
        source: edgeObj.v,
        target: edgeObj.w,
        ...edge,
        points: edge.points || []
      }
    })

    // Calculate total layout dimensions
    const allElements = [...allNodes, ...clustersArray]
    let maxX = 0, maxY = 0
    allElements.forEach(element => {
      if (element.x !== undefined && element.y !== undefined) {
        maxX = Math.max(maxX, element.x + element.width / 2)
        maxY = Math.max(maxY, element.y + element.height / 2)
      }
    })
    
    return {
      nodes: allNodes,
      edges,
      clusters: clustersArray,
      width: Math.max(maxX + 50, 800),
      height: Math.max(maxY + 50, 600)
    }
  }

  /**
   * Calculate system bounds based on its containers and components
   */
  private calculateSystemBounds(systemId: string, allNodes: Map<string, LayoutNode>): { width: number; height: number } {
    const childrenIds = this.nodeHierarchy.get(systemId) || []
    
    if (childrenIds.length === 0) {
      return this.getDefaultDimensions('System')
    }

    // Calculate bounds needed for all containers and their components
    let totalContentWidth = 0
    let totalContentHeight = 0
    let maxContainerWidth = 0

    childrenIds.forEach(childId => {
      const childCluster = this.clusters.get(childId)
      if (childCluster) {
        // This is a container - calculate its bounds including components
        const containerBounds = this.calculateContainerBounds(childId, allNodes)
        maxContainerWidth = Math.max(maxContainerWidth, containerBounds.width)
        totalContentHeight += containerBounds.height + 20 // spacing between containers
      } else {
        // This is a direct component in the system
        const component = allNodes.get(childId)
        if (component) {
          maxContainerWidth = Math.max(maxContainerWidth, component.width)
          totalContentHeight += component.height + 20
        }
      }
    })

    const padding = this.getContainerTextPadding('System')
    return {
      width: Math.max(maxContainerWidth + padding.left + padding.right, 300),
      height: Math.max(totalContentHeight + padding.top + padding.bottom, 200)
    }
  }

  /**
   * Calculate container bounds based on its components
   */
  private calculateContainerBounds(containerId: string, allNodes: Map<string, LayoutNode>): { width: number; height: number } {
    const childrenIds = this.nodeHierarchy.get(containerId) || []
    
    if (childrenIds.length === 0) {
      return this.getDefaultDimensions('Container')
    }

    let maxComponentWidth = 0
    let totalComponentHeight = 0

    childrenIds.forEach(childId => {
      const component = allNodes.get(childId)
      if (component) {
        maxComponentWidth = Math.max(maxComponentWidth, component.width)
        totalComponentHeight += component.height + 15 // spacing between components
      }
    })

    const padding = this.getContainerTextPadding('Container')
    const textClearance = 40 // Additional space after container text (matches component positioning)
    
    return {
      width: Math.max(maxComponentWidth + padding.left + padding.right, 250),
      height: Math.max(totalComponentHeight + padding.top + padding.bottom + textClearance, 150)
    }
  }

  /**
   * Position containers within a system
   */
  private positionContainersInSystem(
    systemId: string, 
    systemNode: LayoutNode, 
    allNodes: Map<string, LayoutNode>, 
    allClustersMap: Map<string, LayoutNode>, 
    clustersArray: LayoutNode[]
  ): void {
    const childrenIds = this.nodeHierarchy.get(systemId) || []
    const systemPadding = this.getContainerTextPadding('System')
    
    let currentY = (systemNode.y || 0) - (systemNode.height / 2) + systemPadding.top
    
    childrenIds.forEach(childId => {
      const childCluster = this.clusters.get(childId)
      if (childCluster) {
        // Position container within system
        const containerBounds = this.calculateContainerBounds(childId, allNodes)
        
        const containerNode: LayoutNode = {
          ...childCluster,
          x: (systemNode.x || 0), // Center horizontally in system
          y: currentY + containerBounds.height / 2,
          width: containerBounds.width,
          height: containerBounds.height
        }
        
        allClustersMap.set(childId, containerNode)
        clustersArray.push(containerNode)
        
        // Position components within this container
        this.positionComponentsInContainer(childId, containerNode, allNodes)
        
        currentY += containerBounds.height + 20 // spacing between containers
      } else {
        // Direct component in system (like END3 in AX3)
        const component = allNodes.get(childId)
        if (component) {
          component.x = (systemNode.x || 0)
          component.y = currentY + component.height / 2
          currentY += component.height + 20
        }
      }
    })
  }

  /**
   * Position components within a container
   */
  private positionComponentsInContainer(
    containerId: string, 
    containerNode: LayoutNode, 
    allNodes: Map<string, LayoutNode>
  ): void {
    const childrenIds = this.nodeHierarchy.get(containerId) || []
    const containerPadding = this.getContainerTextPadding('Container')
    
    // Start positioning after container text area + additional clearance
    const textClearance = 40 // Additional space after container text for proper visual spacing
    let currentY = (containerNode.y || 0) - (containerNode.height / 2) + containerPadding.top + textClearance
    
    childrenIds.forEach(childId => {
      const component = allNodes.get(childId)
      if (component) {
        component.x = containerNode.x || 0 // Center horizontally in container
        component.y = currentY + component.height / 2
        currentY += component.height + 15 // spacing between components
      }
    })
  }

  /**
   * Configure layout options
   */
  setLayoutOptions(options: {
    rankdir?: 'TB' | 'BT' | 'LR' | 'RL'
    align?: 'UL' | 'UR' | 'DL' | 'DR'
    nodesep?: number
    edgesep?: number
    ranksep?: number
    marginx?: number
    marginy?: number
  }): void {
    const currentGraph = this.graph.graph()
    this.graph.setGraph({ ...currentGraph, ...options })
  }

  /**
   * Static factory method to create a layout engine and calculate layout for given entities and relations
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
  ): Promise<LayoutResult> {
    const layoutEngine = new LayoutEngine()
    
    if (options) {
      layoutEngine.setLayoutOptions(options)
    }
    
    layoutEngine.addNodes(entities)
    layoutEngine.addEdges(relations)
    
    return layoutEngine.calculateLayout()
  }
}

export { LayoutEngine, LayoutResult, LayoutNode, LayoutEdge }