import fs, { PathLike } from 'fs'
import { Command } from 'commander'
import { Mx } from './mx/Mx.mjs'
import { MxGeometry } from "./mx/MxGeometry.mjs"
import { Svg } from './svg/Svg.mjs'
import { PlantUmlPipe } from "plantuml-pipe"
import { PumlParser, Element } from "./pumlParser.mjs"

async function svg2mx(svg: Svg, pumlElements: Element[]): Promise<string> {
  const output = new Mx(svg.getDocumentHeight(), svg.getDocumentWidth())
  const elements = svg.getElements()

  for (const element of elements) {
    if (element.rect !== undefined && (element.$.id.startsWith('elem_') || element.$.id.startsWith('cluster_'))) {
      let alias: string = element.$.id.replace(/^elem_|^cluster_/, '');
      const rect = element.rect[0].$
      const g = createGeometry(rect.height, rect.width, rect.x,rect.y)
      const info = pumlElements.find(el => el.type == alias) as Element
      await output.addMxC4Object(g, info.alias, info.label, info.description)
    }
  }
  return await output.generate()
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
    const elements = new PumlParser(puml).parse()
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