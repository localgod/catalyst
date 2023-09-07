import fs, { PathLike } from 'fs'
import { Command } from 'commander'
import { Mx } from './mx/Mx.mjs'
import { MxGeometry } from "./mx/MxGeometry.mjs"
import { Svg } from './svg/Svg.mjs'
import { PlantUmlPipe } from "plantuml-pipe";
import { PumlParser } from "./pumlParser.mjs";

async function svg2mx(svg: Svg): Promise<string> {
  const output = new Mx(svg.getDocumentHeight(), svg.getDocumentWidth());
  const elements = svg.getElements();

  for (const element of elements) {
    if (element.rect !== undefined && (element.$.id.startsWith('elem_') || element.$.id.startsWith('cluster_'))) {
      const name = element.text[0]['_'];

      const g: MxGeometry = {
        $: {
          height: Math.ceil(element.rect[0].$.height),
          width: Math.ceil(element.rect[0].$.width),
          x: Math.ceil(element.rect[0].$.x),
          y: Math.ceil(element.rect[0].$.y),
          as: 'geometry',
        },
      };
      console.log(element?.text)
      await output.addMxC4Object(g, name, 'kurt', 'be awesome');
    }
  }

  return await output.generate();
}

async function puml2Svg(path: PathLike): Promise<string> {
  const puml = new PlantUmlPipe({ outputFormat: 'svg', pixelCutOffValue: 8192 });
  let data = '';

  puml.out.on('data', (chunk: string) => {
    data += chunk;
  });

  const fileData = await fs.promises.readFile(path);
  puml.in.write(fileData);
  puml.in.end();

  await new Promise<void>((resolve) => {
    puml.out.on('end', () => {
      resolve();
    });
  });

  return data;
}

const program = new Command()

program.description('An application for converting plantuml diagrams to draw.io xml')
program.requiredOption('-i, --input <path>', 'path to input file')
program.requiredOption('-o, --output <path>', 'path to output file')
program.action(async (options) => {
  if (fs.existsSync(options.input)) {
    const svg = new Svg()
    const puml = await fs.promises.readFile(options.input, 'utf-8')
    const parser = new PumlParser(puml)
    console.log(parser.parse())
    const svgData = await puml2Svg(options.input)
    await svg.load(svgData)
    const data = await svg2mx(svg)
  
    try {
      fs.writeFileSync(options.output, data);
      // fs.writeFileSync('diagram.svg', svgData);
      console.log('File written successfully.');
    } catch (error) {
      console.error('Error writing file:', error);
    }
  } else {
    throw new Error('Input file does not exist')
  }
})

program.parse()