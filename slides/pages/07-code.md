---
---

# Code

How do use...

```bash {all|0|1|2-9|11}
$ node ./dist/src/catalyst.mjs -h
Usage: catalyst [options]

An application for converting C4 diagrams to draw.io xml using Dagre layout engine

Options:
  -i, --input <path>                    path to input file
  -o, --output <path>                   path to output file
  --layout-direction <direction>        layout direction (TB, BT, LR, RL) (default: "TB")
  -h, --help                           display help for command

$ node ./dist/src/catalyst.mjs -i diagram.puml -o output.drawio
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
