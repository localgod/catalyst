---
---

# Code

How to use the library...

```javascript {all|1|3-4|6-7|9-14}
import { Catalyst } from 'catalyst'

// Read PlantUML content
const pumlContent = await fs.promises.readFile('diagram.puml', 'utf-8')

// Convert to draw.io XML
const drawioXml = await Catalyst.convert(pumlContent)

// Advanced usage with options
const drawioXml = await Catalyst.convert(pumlContent, {
  layoutDirection: 'LR',  // 'TB', 'BT', 'LR', 'RL'
  nodesep: 50,           // Node separation
  ranksep: 50            // Rank separation
})
```

<style>
.footnotes-sep {
  @apply mt-20 opacity-10;
}
.footnotes {
  @apply text-sm opacity-75;
}
.footnote-backref {
  display: none;
}
</style>
