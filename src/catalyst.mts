import fs, { PathLike } from 'fs'
import { Command } from 'commander'
import { PlantUmlPipe } from "plantuml-pipe"
import { EntityParser, EntityDescriptor, EntityType } from "./puml/EntityParser.mjs"
import { Mx, MxGeometry } from './mx/Mx.mjs'
import { Svg } from './svg/Svg.mjs'

async function svg2mx(svg: Svg, pumlElements: EntityDescriptor[]): Promise<string> {
  const mx = new Mx(svg.getDocumentHeight(), svg.getDocumentWidth())
  const elements = svg.getElements()

  for (const element of elements) {

    if (element.rect !== undefined && (element.$.id.startsWith('elem_') || element.$.id.startsWith('cluster_'))) {

      let alias: string = element.$.id.replace(/^elem_|^cluster_/, '');
      const rect = element.rect[0].$
      const g = createGeometry(rect.height, rect.width, rect.x, rect.y)
      const info = new EntityParser().getObjectWithPropertyAndValueInHierarchy(pumlElements, 'alias', alias)

      switch (info.type) {
        case EntityType.System:
          await mx.addMxC4(g, 'System', info.label, info.technology, info.description)
          break
        case EntityType.Container:
          await mx.addMxC4(g, 'Container', info.label, info.technology, info.description)
          break
        case EntityType.Component:
          await mx.addMxC4(g, 'Component', info.label, info.technology, info.description)
          break
        default:
          break
      }
    }
  }
  mx.addMxC4Relationship(createLine(240, { x: 370, y: 370 }, { x: 630, y: 220 }), 'name', 'tech', 'description')
  console.dir(mx.doc, { depth: null }) //Hardcode for testing, not working yet
  return await mx.generate()
}

function createLine(width: number, source: { x: number, y: number }, target: { x: number, y: number }): MxGeometry {
  return {
    $: {
      width: Math.ceil(width),
      as: 'geometry',
    },
    mxPoint: [
      {
        $: {
          x: Math.ceil(source.x),
          y: Math.ceil(source.y),
          as: 'sourcePoint',
        }
      },
      {
        $: {
          x: Math.ceil(target.x),
          y: Math.ceil(target.y),
          as: 'targetPoint',
        }
      }
    ]
  }
}

function createGeometry(height: number, width: number, x: number, y: number): MxGeometry {
  return {
    $: {
      height: Math.ceil(height),
      width: Math.ceil(width),
      x: Math.ceil(x),
      y: Math.ceil(y),
      as: 'geometry',
    }
  }
}

async function puml2Svg(path: PathLike): Promise<string> {
  const puml = new PlantUmlPipe({ outputFormat: 'svg', pixelCutOffValue: 8192 })
  let data = ''

  puml.out.on('data', (chunk: string) => {
    data += chunk
  })

  const fileData = await fs.promises.readFile(path)
  puml.in.write(fileData)
  puml.in.end()

  await new Promise<void>((resolve) => {
    puml.out.on('end', () => {
      resolve()
    })
  })

  return data
}

const program = new Command()

program.description('An application for converting plantuml diagrams to draw.io xml')
program.requiredOption('-i, --input <path>', 'path to input file')
program.requiredOption('-o, --output <path>', 'path to output file')
program.action(async (options) => {
  if (fs.existsSync(options.input)) {
    const svg = new Svg()
    const puml = await fs.promises.readFile(options.input, 'utf-8')
    const elements = new EntityParser().parse(puml)
    const svgData = await puml2Svg(options.input)
    await svg.load(svgData)
    const data = await svg2mx(svg, elements)

    try {
      fs.writeFileSync(options.output, data)
      fs.writeFileSync('diagram.svg', svgData)
      console.log('File written successfully.')
    } catch (error) {
      console.error('Error writing file:', error)
    }
  } else {
    throw new Error('Input file does not exist')
  }
})

program.parse()