---
theme: seriph
background: https://source.unsplash.com/cPccYbPrF-A/1920x1080
class: text-center
highlighter: shiki
lineNumbers: false
drawings:
  persist: false
transition: slide-left
title: Welcome to Catalyst
---

# Welcome to Catalyst

Diagram transformation

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space for next page <carbon:arrow-right class="inline"/>
  </span>
</div>

<div class="abs-br m-6 flex gap-2">
  <a href="https://github.com/localgod/catalyst" target="_blank" alt="GitHub"
    class="text-xl slidev-icon-btn opacity-50 !border-none !hover:text-white">
    <carbon-logo-github />
  </a>
</div>

---
layout: image-right
image: https://source.unsplash.com/_lqTChNy0dk/1920x1080
---

# Code

Use code snippets and get the highlighting directly![^1]

```ts {all|0|1|2|3|all}
const svgData = await puml2Svg('diagram.puml')
const svg = new Svg()
await svg.load(svgData)
const data = await svg2mx(svg)

try {
  fs.writeFileSync('diagram.drawio', data)
  fs.writeFileSync('diagram.svg', svgData)
} catch (error) {
  console.error('Error writing files:', error)
}
```

<arrow v-click="3" x1="400" y1="420" x2="230" y2="330" color="#564" width="3" arrowSize="1" />

[^1]: [Learn More](https://sli.dev/guide/syntax.html#line-highlighting)

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

---
src: ./pages/diagrams.md
---