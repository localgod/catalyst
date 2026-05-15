import { EntityDescriptor } from '../puml/EntityDescriptor.interface.mjs'
import { textWidth, lineHeight, spaceAdvance, wrap } from '../text/TextMetrics.mjs'

/**
 * Text-measured leaf-node size (L3). Sizes a shape to its rendered label
 * using REAL font metrics (fontkit + bundled Liberation Sans, via
 * TextMetrics) — no estimated ratios. Models the exact label HTML the c4
 * shape classes emit:
 *   title  — c4Name, 16px bold     (`font-size:16px;font-weight:bold`)
 *   meta   — `[Type: Tech]`, 11px  (no font-size set → mxGraph default 11)
 *   descr  — c4Description, 11px    (`font-size:11px`), word-wrapped
 * Padding is the font's own space advance (a real metric, not an invented
 * constant); height is the sum of real per-line heights.
 */
export function measureNode(entity: EntityDescriptor): { width: number; height: number } {
  const TITLE_PX = 16, BODY_PX = 11
  const pad = spaceAdvance(TITLE_PX, true)            // font-derived padding unit

  const titleW = textWidth(entity.label ?? entity.alias, TITLE_PX, true)
  const meta = entity.technology
    ? `[${entity.type}: ${entity.technology}]`
    : `[${entity.type}]`
  const metaW = textWidth(meta, BODY_PX, false)

  const contentW = Math.max(titleW, metaW)
  const descLines = entity.description
    ? wrap(entity.description, Math.max(contentW, 1), BODY_PX, false)
    : []
  const longestDescW = descLines.reduce(
    (m, l) => Math.max(m, textWidth(l, BODY_PX, false)), 0)

  const textW = Math.ceil(Math.max(titleW, metaW, longestDescW) + 2 * pad)
  const textH = Math.ceil(
    lineHeight(TITLE_PX, true) +                       // title
    lineHeight(BODY_PX, false) +                       // meta
    descLines.length * lineHeight(BODY_PX, false) +    // wrapped description
    2 * pad)                                           // top/bottom breathing

  // Floor at the established C4 element box convention. fontkit measures the
  // raw glyph box, but the drawio C4 shape RENDERS larger (CSS line-height,
  // the rounded-rect chrome, the always-present `[Type]` stereotype line) —
  // unmeasurable without a renderer. These per-type minimums are the
  // conventional C4 element dimensions used by C4-PlantUML / Structurizr
  // (and the project's own pre-existing sizes that rendered without
  // cramming); they are a documented floor, NOT the sole metric — long
  // labels still grow the box past them via the measured values above.
  const t = entity.type
  const [minW, minH] =
    t.startsWith('System') || t.startsWith('Person') ? [220, 140]
    : t.startsWith('Container') ? [200, 120]
    : t.startsWith('Component') ? [180, 100]
    : [160, 90]                                        // Node / other leaves

  return { width: Math.max(textW, minW), height: Math.max(textH, minH) }
}
