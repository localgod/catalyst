import fs from 'fs'
import { Command } from 'commander'
import { EntityParser, EntityDescriptor } from "./puml/EntityParser.mjs"
import { Mx, MxGeometry } from './mx/Mx.mjs'
import { RelParser } from './puml/RelParser.mjs'
import { LayoutEngine } from './layout/LayoutEngine.mjs'

async function layoutData2mx(layoutData: any, pumlElements: EntityDescriptor[], pumlRelations: { source: string, target: string, label: string, description: string }[]): Promise<string> {
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
        // Create a simple path for the relationship
        const points = edge.points || [
          { x: edge.sourceX || 0, y: edge.sourceY || 0 },
          { x: edge.targetX || 0, y: edge.targetY || 0 }
        ]
        await mx.addMxC4Relationship(points, edge.source, edge.target, 'Relationship', rel.label, rel.description)
      }
    }
  }

  return await mx.generate()
}



const program = new Command()

program.description('An application for converting C4 diagrams to draw.io xml using Dagre layout engine')
program.requiredOption('-i, --input <path>', 'path to input file')
program.requiredOption('-o, --output <path>', 'path to output file')
program.option('--layout-direction <direction>', 'layout direction (TB, BT, LR, RL)', 'TB')
program.action(async (options) => {
  if (fs.existsSync(options.input)) {
    const puml = await fs.promises.readFile(options.input, 'utf-8')
    const elements = new EntityParser().parse(puml)
    const relations = RelParser.getRelations(puml)

    // Use Dagre for layout calculation
    console.log('Using Dagre for layout calculation...')
    const layoutData = await LayoutEngine.calculateLayout(elements, relations, {
      rankdir: options.layoutDirection as 'TB' | 'BT' | 'LR' | 'RL',
      nodesep: 50,
      edgesep: 10,
      ranksep: 50,
      marginx: 20,
      marginy: 20
    })

    const data = await layoutData2mx(layoutData, elements, relations)

    try {
      fs.writeFileSync(options.output, data)
      console.log('File written successfully.')
    } catch (error) {
      console.error('Error writing file:', error)
    }
  } else {
    throw new Error('Input file does not exist')
  }
})

program.parse()
