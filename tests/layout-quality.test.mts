import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { EntityParser } from '../src/puml/EntityParser.mjs'
import { RelParser } from '../src/puml/RelParser.mjs'
import { LayoutEngine } from '../src/layout/LayoutEngine.mjs'
import type { EntityDescriptor } from '../src/puml/EntityDescriptor.interface.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixture = (n: string) => readFileSync(join(__dirname, 'fixtures', n), 'utf-8')

// Visual-correctness gate. The parity/golden gates are structural and
// coordinate-independent (by design), so they cannot catch the class of bug
// where leaf shapes are sized too small and the RENDERED drawio shapes
// overlap/cram even though the layout itself is fine. This gate closes that:
//   1. no two leaf shapes overlap in the layout, AND
//   2. every leaf is at least the conventional C4 element box size for its
//      type (so the layout's no-overlap guarantee survives drawio rendering,
//      where the shape is ≈ that size).
// Together: a regression that under-sizes nodes (the actual cramming cause)
// becomes a failing test.

const C4_MIN = (type: string): [number, number] =>
  type.startsWith('System') || type.startsWith('Person') ? [220, 140]
  : type.startsWith('Container') ? [200, 120]
  : type.startsWith('Component') ? [180, 100]
  : [160, 90]

function flatten(es: EntityDescriptor[]): EntityDescriptor[] {
  const out: EntityDescriptor[] = []
  const w = (a: EntityDescriptor[]) => a.forEach(e => { out.push(e); if (e.children) w(e.children) })
  w(es)
  return out
}

const FIXTURES = [
  'c4-exhaustive.puml',
  'c4-context.puml',
  'c4-container.puml',
  'c4-deployment.puml',
  'c4-all-entity-variants.puml',
  'c4-all-rel-variants.puml',
]

describe('layout quality (rendered shapes do not overlap/cram)', () => {
  for (const name of FIXTURES) {
    it(`${name}: leaf shapes are ≥ C4 min size and never overlap`, async () => {
      const puml = fixture(name)
      const ents = new EntityParser().parse(puml)
      const r = await LayoutEngine.calculateLayout(
        ents,
        RelParser.getRelations(puml),
        { rankdir: 'TB', nodesep: 50, edgesep: 10, ranksep: 50, marginx: 20, marginy: 20 },
        RelParser.getLayoutConstraints(puml),
      )
      const typeOf = new Map(flatten(ents).map(e => [e.alias, e.type]))

      const undersized = r.nodes.filter(n => {
        const [mw, mh] = C4_MIN(typeOf.get(n.id) ?? '')
        return n.width < mw || n.height < mh
      })
      expect(
        undersized.map(n => `${n.id}(${typeOf.get(n.id)}) ${n.width}x${n.height}`),
        'leaf shapes smaller than the C4 element minimum (would cram on render)',
      ).toEqual([])

      const overlaps: string[] = []
      const L = r.nodes
      for (let i = 0; i < L.length; i++) {
        for (let j = i + 1; j < L.length; j++) {
          const a = L[i], b = L[j]
          if (a.x! < b.x! + b.width && a.x! + a.width > b.x! &&
              a.y! < b.y! + b.height && a.y! + a.height > b.y!) {
            overlaps.push(`${a.id}~${b.id}`)
          }
        }
      }
      expect(overlaps, 'overlapping leaf shapes in the layout').toEqual([])
    })
  }
})
