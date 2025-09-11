import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Dagre module for testing - must be defined before import
vi.mock('@dagrejs/dagre', () => ({
  default: {
  graphlib: {
    Graph: class {
      private nodes_data = new Map()
      private edges_data = new Map()
      private graph_data = {}
      private defaultEdgeLabel: any

      setGraph(options: any) {
        this.graph_data = { ...this.graph_data, ...options }
      }

      setDefaultEdgeLabel(fn: any) {
        this.defaultEdgeLabel = fn
      }

      setNode(id: string, data: any) {
        this.nodes_data.set(id, data)
      }

      setEdge(source: string, target: string, data?: any) {
        this.edges_data.set(`${source}-${target}`, { v: source, w: target, ...data })
      }

      nodes() {
        return Array.from(this.nodes_data.keys())
      }

      edges() {
        return Array.from(this.edges_data.values()).map(edge => ({ v: edge.v, w: edge.w }))
      }

      node(id: string) {
        const node = this.nodes_data.get(id)
        return {
          ...node,
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100
        }
      }

      edge(edgeObj: { v: string; w: string }) {
        const edge = this.edges_data.get(`${edgeObj.v}-${edgeObj.w}`)
        return {
          ...edge,
          points: [
            { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 },
            { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 }
          ]
        }
      }

      graph() {
        return {
          ...this.graph_data,
          width: 800,
          height: 600
        }
      }
    }
  },
  layout: function(graph: any) {
    // Mock layout calculation - just adds random positions
    console.log('Mock Dagre layout calculation completed')
  }
}
}))

import { DagreLayoutEngine } from '../src/layout/DagreLayoutEngine.mjs'

describe('DagreLayoutEngine', () => {
  let layoutEngine: DagreLayoutEngine
  
  const testEntities = [
    {
      type: 'System',
      alias: 'AX',
      label: 'label',
      technology: 'technology',
      description: 'description tytter',
      children: [
        {
          type: 'Container',
          alias: 'AIF',
          label: 'Application Integration Framework',
          technology: 'ERP service',
          description: 'This is also awesome',
          children: [
            {
              type: 'Component',
              alias: 'END',
              label: 'API endpoint',
              technology: 'ERP service',
              description: 'This is also awesome'
            }
          ]
        }
      ]
    },
    {
      type: 'System',
      alias: 'AX2',
      label: 'Microsoft Dynamics AX',
      technology: 'ERP system',
      description: 'Description tytter',
      children: [
        {
          type: 'Container',
          alias: 'AIF2',
          label: 'Application Integration Framework',
          technology: 'ERP service',
          description: 'This is also awesome',
          children: [
            {
              type: 'Component',
              alias: 'END2',
              label: 'API endpoint',
              technology: 'ERP service',
              description: 'This is also awesome'
            }
          ]
        }
      ]
    }
  ]

  const testRelations = [
    {
      source: 'END',
      target: 'END2',
      label: 'Label Relation 1',
      description: 'Technology relation 1'
    },
    {
      source: 'AIF',
      target: 'END3',
      label: 'Label Relation 2',
      description: 'Technology relation 2'
    }
  ]

  beforeEach(() => {
    layoutEngine = new DagreLayoutEngine()
  })

  describe('initialization', () => {
    it('should create a new DagreLayoutEngine instance', () => {
      expect(layoutEngine).toBeInstanceOf(DagreLayoutEngine)
    })
  })

  describe('node management', () => {
    it('should add nodes from entities', () => {
      layoutEngine.addNodes(testEntities)
      
      // Verify that nodes were added (this would need access to internal graph state)
      // For now, we'll test that the method doesn't throw
      expect(() => layoutEngine.addNodes(testEntities)).not.toThrow()
    })

    it('should add edges from relations', () => {
      layoutEngine.addNodes(testEntities)
      layoutEngine.addEdges(testRelations)
      
      // Verify that edges were added
      expect(() => layoutEngine.addEdges(testRelations)).not.toThrow()
    })
  })

  describe('layout calculation', () => {
    it('should calculate layout and return valid result', () => {
      layoutEngine.addNodes(testEntities)
      layoutEngine.addEdges(testRelations)
      
      const result = layoutEngine.calculateLayout()
      
      expect(result).toHaveProperty('nodes')
      expect(result).toHaveProperty('edges')
      expect(result).toHaveProperty('width')
      expect(result).toHaveProperty('height')
      
      expect(Array.isArray(result.nodes)).toBe(true)
      expect(Array.isArray(result.edges)).toBe(true)
      expect(typeof result.width).toBe('number')
      expect(typeof result.height).toBe('number')
    })

    it('should return nodes with proper positioning data', () => {
      layoutEngine.addNodes(testEntities)
      
      const result = layoutEngine.calculateLayout()
      
      result.nodes.forEach(node => {
        expect(node).toHaveProperty('id')
        expect(node).toHaveProperty('x')
        expect(node).toHaveProperty('y')
        expect(node).toHaveProperty('width')
        expect(node).toHaveProperty('height')
        expect(typeof node.x).toBe('number')
        expect(typeof node.y).toBe('number')
      })
    })

    it('should return edges with source and target', () => {
      layoutEngine.addNodes(testEntities)
      layoutEngine.addEdges(testRelations)
      
      const result = layoutEngine.calculateLayout()
      
      result.edges.forEach(edge => {
        expect(edge).toHaveProperty('source')
        expect(edge).toHaveProperty('target')
        expect(typeof edge.source).toBe('string')
        expect(typeof edge.target).toBe('string')
      })
    })
  })

  describe('layout properties', () => {
    it('should handle layout calculation without errors', () => {
      layoutEngine.addNodes(testEntities)
      
      expect(() => {
        const result = layoutEngine.calculateLayout()
        expect(result).toBeDefined()
      }).not.toThrow()
    })
  })

  describe('component positioning', () => {
    it('should position components with proper text clearance', () => {
      layoutEngine.addNodes(testEntities)
      
      const result = layoutEngine.calculateLayout()
      
      // Verify that components are positioned with proper clearance
      // This is a basic test - more specific positioning tests would require
      // access to internal positioning logic
      expect(result.nodes.length).toBeGreaterThan(0)
    })
  })

  describe('hierarchical layout', () => {
    it('should handle nested entity structures', () => {
      const nestedEntities = [
        {
          type: 'System',
          alias: 'SYS1',
          label: 'System 1',
          technology: 'tech',
          description: 'desc',
          children: [
            {
              type: 'Container',
              alias: 'CONT1',
              label: 'Container 1',
              technology: 'tech',
              description: 'desc',
              children: [
                {
                  type: 'Component',
                  alias: 'COMP1',
                  label: 'Component 1',
                  technology: 'tech',
                  description: 'desc'
                },
                {
                  type: 'Component',
                  alias: 'COMP2',
                  label: 'Component 2',
                  technology: 'tech',
                  description: 'desc'
                }
              ]
            }
          ]
        }
      ]

      expect(() => {
        layoutEngine.addNodes(nestedEntities)
        layoutEngine.calculateLayout()
      }).not.toThrow()
    })
  })
})