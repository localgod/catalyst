import fs, { PathLike } from 'fs'
import { Command } from 'commander'
import { PlantUmlPipe } from "plantuml-pipe"
import { EntityParser, EntityDescriptor } from "./puml/EntityParser.mjs"
import { Mx, MxGeometry } from './mx/Mx.mjs'
import { Svg } from './svg/Svg.mjs'
import { RelParser } from './puml/RelParser.mjs'

async function svg2mx(svg: Svg, pumlElements: EntityDescriptor[], pumlRelations: { source: string, target: string, label: string, description: string }[]): Promise<string> {
  const mx = new Mx(svg.getDocumentHeight(), svg.getDocumentWidth())
  const elements = svg.getGroups()

  for (const element of elements) {

    if (element.rect !== undefined && (element.$.id.startsWith('elem_') || element.$.id.startsWith('cluster_'))) {

      let alias: string = element.$.id.replace(/^elem_|^cluster_/, '');
      const rect: { height?: number, width?: number, x?: number, y?: number } = element.rect[0].$
      const g = new MxGeometry(rect.height, rect.width, rect.x, rect.y)
      const info = new EntityParser().getObjectWithPropertyAndValueInHierarchy(pumlElements, 'alias', alias)

      switch (info.type) {
        case 'System':
          await mx.addMxC4(alias, g, 'System', info.label, info.technology, info.description)
          break
        case 'Container':
          await mx.addMxC4(alias, g, 'Container', info.label, info.technology, info.description)
          break
        case 'Component':
          await mx.addMxC4(alias, g, 'Component', info.label, info.technology, info.description)
          break
        default:
          break
      }
    }

    if (element.path !== undefined && element.$.id.startsWith('link_')) {
      const from = element.$.id.replace(/^link_/, '').split('_')[0]
      const to = element.$.id.replace(/^link_/, '').split('_')[1]
      const rel = pumlRelations.filter((rel) => {
        if (rel.source === from && rel.target === to) {
          return rel
        }
      }
      )[0]
      const info = new RelParser(element)
      await mx.addMxC4Relationship(info.getpath(), info.getFrom(), info.getTo(), 'Relationship', rel.label, rel.description)
    }
  }

  return await mx.generate()
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
    const relations = RelParser.getRelations(puml)

    const svgData = await puml2Svg(options.input)
    await svg.load(svgData)
    const data = await svg2mx(svg, elements, relations)

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
