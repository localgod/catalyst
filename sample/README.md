# Catalyst Library Usage Example

This folder contains example scripts showing how to use Catalyst as a library.

## Files

- `example.mjs` - Main example script showing library usage
- `diagram.puml` - Sample PlantUML C4 diagram
- `README.md` - This file

## Usage

1. First, build the library:
   ```bash
   cd ..
   npm run build
   ```

2. Run the example:
   ```bash
   cd sample
   node example.mjs
   ```

3. The script will:
   - Read `diagram.puml`
   - Convert it to draw.io format
   - Save the result as `output.drawio`

## Library API

### Basic Usage

```javascript
import { Catalyst } from '../dist/catalyst.mjs'

// Convert PlantUML to draw.io XML
const drawioXml = await Catalyst.convert(pumlContent, options)
```

### Available Options

```javascript
const options = {
  layoutDirection: 'TB', // 'TB', 'BT', 'LR', 'RL'
  nodesep: 50,           // Node separation
  edgesep: 10,           // Edge separation  
  ranksep: 50,           // Rank separation
  marginx: 20,           // X margin
  marginy: 20            // Y margin
}
```

### Utility Methods

```javascript
// Parse entities only
const entities = Catalyst.parseEntities(pumlContent)

// Parse relations only
const relations = Catalyst.parseRelations(pumlContent)
```