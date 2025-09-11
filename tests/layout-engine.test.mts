import { describe, it, expect, beforeEach } from 'vitest'
import { LayoutEngine } from '../src/layout/LayoutEngine.mjs'

describe('LayoutEngine', () => {
  let layoutEngine: LayoutEngine
  
  const testEntities = [
    {
      type: 'System',
      alias: 'SYS1',
      label: 'System A',
      technology: 'System Tech',
      description: 'System description',
      children: [
        {
          type: 'Container',
          alias: 'CONT1',
          label: 'Container A',
          technology: 'Container Tech',
          description: 'Container description',
          children: [
            {
              type: 'Component',
              alias: 'COMP1',
              label: 'Component A',
              technology: 'Component Tech',
              description: 'Component description'
            }
          ]
        }
      ]
    },
    {
      type: 'System',
      alias: 'SYS2',
      label: 'System B',
      technology: 'System Tech',
      description: 'System description',
      children: [
        {
          type: 'Container',
          alias: 'CONT2',
          label: 'Container B',
          technology: 'Container Tech',
          description: 'Container description',
          children: [
            {
              type: 'Component',
              alias: 'COMP2',
              label: 'Component B',
              technology: 'Component Tech',
              description: 'Component description'
            }
          ]
        }
      ]
    }
  ]

  const testRelations = [
    {
      source: 'COMP1',
      target: 'COMP2',
      label: 'Uses',
      description: 'Component relationship'
    },
    {
      source: 'SYS1',
      target: 'SYS2',
      label: 'Integrates with',
      description: 'System relationship'
    }
  ]

  beforeEach(() => {
    layoutEngine = new LayoutEngine()
  })

  describe('initialization', () => {
    it('should create a new LayoutEngine instance', () => {
      expect(layoutEngine).toBeInstanceOf(LayoutEngine)
    })

    it('should have default layout options', () => {
      // Test that we can set layout options without errors
      expect(() => {
        layoutEngine.setLayoutOptions({
          rankdir: 'TB',
          nodesep: 50,
          edgesep: 10
        })
      }).not.toThrow()
    })
  })

  describe('node management', () => {
    it('should add nodes from entities without errors', () => {
      expect(() => {
        layoutEngine.addNodes(testEntities)
      }).not.toThrow()
    })

    it('should handle empty entity arrays', () => {
      expect(() => {
        layoutEngine.addNodes([])
      }).not.toThrow()
    })

    it('should handle entities without children', () => {
      const simpleEntities = [
        {
          type: 'Component',
          alias: 'SIMPLE',
          label: 'Simple Component',
          technology: 'Tech',
          description: 'Description'
        }
      ]
      
      expect(() => {
        layoutEngine.addNodes(simpleEntities)
      }).not.toThrow()
    })
  })

  describe('edge management', () => {
    it('should add edges from relations without errors', () => {
      layoutEngine.addNodes(testEntities)
      
      expect(() => {
        layoutEngine.addEdges(testRelations)
      }).not.toThrow()
    })

    it('should handle empty relations arrays', () => {
      layoutEngine.addNodes(testEntities)
      
      expect(() => {
        layoutEngine.addEdges([])
      }).not.toThrow()
    })
  })

  describe('layout calculation', () => {
    it('should calculate layout and return valid result structure', () => {
      layoutEngine.addNodes(testEntities)
      layoutEngine.addEdges(testRelations)
      
      const result = layoutEngine.calculateLayout()
      
      // Verify result structure
      expect(result).toHaveProperty('nodes')
      expect(result).toHaveProperty('edges')
      expect(result).toHaveProperty('clusters')
      expect(result).toHaveProperty('width')
      expect(result).toHaveProperty('height')
      
      // Verify types
      expect(Array.isArray(result.nodes)).toBe(true)
      expect(Array.isArray(result.edges)).toBe(true)
      expect(Array.isArray(result.clusters)).toBe(true)
      expect(typeof result.width).toBe('number')
      expect(typeof result.height).toBe('number')
      
      // Verify positive dimensions
      expect(result.width).toBeGreaterThan(0)
      expect(result.height).toBeGreaterThan(0)
    })

    it('should return positioned nodes with required properties', () => {
      layoutEngine.addNodes(testEntities)
      
      const result = layoutEngine.calculateLayout()
      
      // Should have leaf nodes (components)
      expect(result.nodes.length).toBeGreaterThan(0)
      
      result.nodes.forEach(node => {
        expect(node).toHaveProperty('id')
        expect(node).toHaveProperty('x')
        expect(node).toHaveProperty('y')
        expect(node).toHaveProperty('width')
        expect(node).toHaveProperty('height')
        
        // Verify positioning data is valid
        expect(typeof node.x).toBe('number')
        expect(typeof node.y).toBe('number')
        expect(node.width).toBeGreaterThan(0)
        expect(node.height).toBeGreaterThan(0)
      })
    })

    it('should return clusters with proper hierarchy', () => {
      layoutEngine.addNodes(testEntities)
      
      const result = layoutEngine.calculateLayout()
      
      // Should have clusters for systems and containers
      expect(result.clusters.length).toBeGreaterThan(0)
      
      result.clusters.forEach(cluster => {
        expect(cluster).toHaveProperty('id')
        expect(cluster).toHaveProperty('x')
        expect(cluster).toHaveProperty('y')
        expect(cluster).toHaveProperty('width')
        expect(cluster).toHaveProperty('height')
        
        // Verify positioning data is valid
        expect(typeof cluster.x).toBe('number')
        expect(typeof cluster.y).toBe('number')
        expect(cluster.width).toBeGreaterThan(0)
        expect(cluster.height).toBeGreaterThan(0)
      })
    })

    it('should handle layout with edges', () => {
      layoutEngine.addNodes(testEntities)
      layoutEngine.addEdges(testRelations)
      
      const result = layoutEngine.calculateLayout()
      
      // Should have edges
      expect(result.edges.length).toBeGreaterThan(0)
      
      result.edges.forEach(edge => {
        expect(edge).toHaveProperty('source')
        expect(edge).toHaveProperty('target')
        expect(typeof edge.source).toBe('string')
        expect(typeof edge.target).toBe('string')
      })
    })
  })

  describe('layout options', () => {
    it('should accept different layout directions', () => {
      const directions = ['TB', 'BT', 'LR', 'RL'] as const
      
      directions.forEach(direction => {
        expect(() => {
          layoutEngine.setLayoutOptions({ rankdir: direction })
        }).not.toThrow()
      })
    })

    it('should accept spacing options', () => {
      expect(() => {
        layoutEngine.setLayoutOptions({
          nodesep: 100,
          edgesep: 20,
          ranksep: 80,
          marginx: 30,
          marginy: 40
        })
      }).not.toThrow()
    })
  })

  describe('static factory method', () => {
    it('should calculate layout using static method', async () => {
      const result = await LayoutEngine.calculateLayout(testEntities, testRelations, {
        rankdir: 'TB',
        nodesep: 50
      })
      
      expect(result).toHaveProperty('nodes')
      expect(result).toHaveProperty('edges')
      expect(result).toHaveProperty('clusters')
      expect(result).toHaveProperty('width')
      expect(result).toHaveProperty('height')
      
      // Verify we get actual layout results
      expect(result.nodes.length).toBeGreaterThan(0)
      expect(result.clusters.length).toBeGreaterThan(0)
    })

    it('should work without options', async () => {
      const result = await LayoutEngine.calculateLayout(testEntities, testRelations)
      
      expect(result).toBeDefined()
      expect(Array.isArray(result.nodes)).toBe(true)
      expect(result.nodes.length).toBeGreaterThan(0)
    })

    it('should handle empty inputs gracefully', async () => {
      const result = await LayoutEngine.calculateLayout([], [])
      
      expect(result).toBeDefined()
      expect(Array.isArray(result.nodes)).toBe(true)
      expect(Array.isArray(result.edges)).toBe(true)
      expect(Array.isArray(result.clusters)).toBe(true)
    })
  })

  describe('hierarchical layout', () => {
    it('should properly handle nested entity structures', () => {
      const nestedEntities = [
        {
          type: 'System',
          alias: 'NESTED_SYS',
          label: 'Nested System',
          technology: 'tech',
          description: 'desc',
          children: [
            {
              type: 'Container',
              alias: 'NESTED_CONT',
              label: 'Nested Container',
              technology: 'tech',
              description: 'desc',
              children: [
                {
                  type: 'Component',
                  alias: 'NESTED_COMP1',
                  label: 'Nested Component 1',
                  technology: 'tech',
                  description: 'desc'
                },
                {
                  type: 'Component',
                  alias: 'NESTED_COMP2',
                  label: 'Nested Component 2',
                  technology: 'tech',
                  description: 'desc'
                }
              ]
            }
          ]
        }
      ]

      layoutEngine.addNodes(nestedEntities)
      const result = layoutEngine.calculateLayout()
      
      // Should have components as leaf nodes
      expect(result.nodes.length).toBe(2) // NESTED_COMP1 and NESTED_COMP2
      
      // Should have system and container as clusters
      expect(result.clusters.length).toBe(2) // NESTED_SYS and NESTED_CONT
      
      // Verify node IDs
      const nodeIds = result.nodes.map(n => n.id)
      expect(nodeIds).toContain('NESTED_COMP1')
      expect(nodeIds).toContain('NESTED_COMP2')
      
      // Verify cluster IDs
      const clusterIds = result.clusters.map(c => c.id)
      expect(clusterIds).toContain('NESTED_SYS')
      expect(clusterIds).toContain('NESTED_CONT')
    })

    it('should ensure components are positioned within their containers', () => {
      layoutEngine.addNodes(testEntities)
      const result = layoutEngine.calculateLayout()
      
      // Find a container and its components
      const container = result.clusters.find(c => c.id === 'CONT1')
      const component = result.nodes.find(n => n.id === 'COMP1')
      
      if (container && component && 
          container.x !== undefined && container.y !== undefined &&
          component.x !== undefined && component.y !== undefined) {
        // Component should be within container bounds (with some tolerance for positioning)
        const containerLeft = container.x - container.width / 2
        const containerRight = container.x + container.width / 2
        const containerTop = container.y - container.height / 2
        const containerBottom = container.y + container.height / 2
        
        const componentLeft = component.x - component.width / 2
        const componentRight = component.x + component.width / 2
        const componentTop = component.y - component.height / 2
        const componentBottom = component.y + component.height / 2
        
        // Component should be within container (allowing for some layout tolerance)
        expect(componentLeft).toBeGreaterThanOrEqual(containerLeft - 10)
        expect(componentRight).toBeLessThanOrEqual(containerRight + 10)
        expect(componentTop).toBeGreaterThanOrEqual(containerTop - 10)
        expect(componentBottom).toBeLessThanOrEqual(containerBottom + 10)
      }
    })
  })
})