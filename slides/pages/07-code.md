---
---

# Code

How do use...

```bash {all|0|1|2-9|11}
$ node ./dist/catalyst.mjs -h
Usage: catalyst [options]

An application for converting plantuml diagrams to draw.io xml

Options:
  -i, --input <path>   path to input file
  -o, --output <path>  path to output file
  -h, --help           display help for command

$ node ./dist/catalyst.mjs -i diagram.puml -o output.drawio
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
