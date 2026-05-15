import { openSync } from 'fontkit'
import type { Font } from 'fontkit'
import { fileURLToPath } from 'node:url'

/**
 * Real text measurement (L3) via fontkit on the bundled Liberation Sans TTFs
 * (SIL OFL 1.1; metric-compatible with Arial/Helvetica — mxGraph/drawio's
 * default label font). Every value comes from the font's own tables:
 *   width      — Σ glyph advances (hmtx) ÷ unitsPerEm × fontSize
 *   lineHeight — (ascent − descent + lineGap) ÷ unitsPerEm × fontSize
 *   space()    — advance of ' ' (used as the font-derived padding unit)
 * No estimated ratios. The bundled font makes it deterministic regardless of
 * host fonts (the documented residual caveat: a drawio-export host could
 * fall back to a different installed font — accepted ceiling).
 */
const fontDir = fileURLToPath(new URL('../assets/fonts/', import.meta.url))
const regular: Font = openSync(`${fontDir}LiberationSans-Regular.ttf`) as Font
const bold: Font = openSync(`${fontDir}LiberationSans-Bold.ttf`) as Font

const pick = (isBold: boolean): Font => (isBold ? bold : regular)

/** Rendered width (px) of a single line at the given px size. */
export function textWidth(text: string, fontSizePx: number, isBold = false): number {
  const f = pick(isBold)
  if (!text) return 0
  const run = f.layout(text)
  return (run.advanceWidth / f.unitsPerEm) * fontSizePx
}

/** Natural line height (px) — includes the font's own leading (lineGap). */
export function lineHeight(fontSizePx: number, isBold = false): number {
  const f = pick(isBold)
  return ((f.ascent - f.descent + f.lineGap) / f.unitsPerEm) * fontSizePx
}

/** Advance (px) of a space — the font-derived padding unit. */
export function spaceAdvance(fontSizePx: number, isBold = false): number {
  return textWidth(' ', fontSizePx, isBold)
}

/**
 * Greedy word-wrap to a max content width; returns the wrapped lines. Mirrors
 * drawio's `whiteSpace=wrap` (break on spaces). A single word longer than the
 * width is kept on its own line (drawio does not hyphenate).
 */
export function wrap(text: string, maxWidthPx: number, fontSizePx: number, isBold = false): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const lines: string[] = []
  let line = words[0]
  for (let i = 1; i < words.length; i++) {
    const candidate = `${line} ${words[i]}`
    if (textWidth(candidate, fontSizePx, isBold) <= maxWidthPx) {
      line = candidate
    } else {
      lines.push(line)
      line = words[i]
    }
  }
  lines.push(line)
  return lines
}
