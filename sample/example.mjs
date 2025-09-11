import fs from 'fs'
import { Catalyst } from '../dist/catalyst.mjs'

async function main() {
  try {
    // Read the PlantUML file
    const pumlContent = await fs.promises.readFile('diagram.puml', 'utf-8')
    
    // Convert to draw.io format with custom options
    const drawioXml = await Catalyst.convert(pumlContent, {
      layoutDirection: 'TB',
      nodesep: 50,
      edgesep: 10,
      ranksep: 50,
      marginx: 20,
      marginy: 20
    })
    
    // Write the output
    await fs.promises.writeFile('output.drawio', drawioXml)
    console.log('✅ Conversion completed successfully!')
    console.log('📄 Output written to: output.drawio')
    
  } catch (error) {
    console.error('❌ Error during conversion:', error.message)
    process.exit(1)
  }
}

main()