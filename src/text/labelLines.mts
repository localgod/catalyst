/**
 * C4-PlantUML uses `\n` inside quoted label / description / relationship
 * strings as an explicit line break (the escaped `\\n` form also occurs in
 * the wild, e.g. macro-generated diagrams). catalyst's parser captures the
 * quoted body verbatim, so the two literal characters backslash + 'n' (or
 * the double-escaped variant) survive into EntityDescriptor / relation text.
 *
 * Left untranslated they cause TWO defects:
 *   1. draw.io renders a literal "\n" in the label.
 *   2. measureNode() sizes the box to one giant single line, so the text
 *      overflows the node and collides with its neighbours (the root cause
 *      of the "super crammed" c4-admin-sidecar render).
 *
 * This module is the single source of truth for "where are the breaks":
 * measureNode sizes from {@link splitLabelLines}; the Mx emit path turns
 * each break into a `<br/>` via {@link htmlBreaks}. One regex, used by
 * both, keeps measurement and emission in lock-step.
 */

/**
 * One or two backslashes followed by `n` (the PlantUML escape as it appears
 * in source), OR a real newline (defensive — folded continuations can leave
 * one behind). Global so `split`/`replace` see every occurrence.
 */
const LABEL_BREAK = /\\{1,2}n|\r?\n/g

/**
 * Split a raw (pre-escape) label/description into its visual lines. Empty
 * segments are preserved so `"a\n\nb"` keeps its blank middle line — it
 * occupies vertical space in the rendered box and measureNode must count it.
 */
export function splitLabelLines(s: string | undefined): string[] {
  if (!s) return []
  return s.split(LABEL_BREAK)
}

/**
 * Replace PlantUML line breaks with a pre-encoded `&lt;br/&gt;`.
 *
 * MUST be applied AFTER the value's `>` has been escaped (escGt) — the break
 * token contains no `>` so escGt cannot disturb it, while the pre-encoded
 * `&lt;…&gt;` form rides the exact same xml2js double-encode → un-double
 * pipeline that the c4 label *template* tags (`&lt;div&gt;`) already use in
 * Mx.generate(). Net XML attribute value: `&lt;br/&gt;`, which draw.io
 * decodes to a real `<br/>` and renders as a line break — and which a
 * strict (`>`-intolerant) XML consumer also accepts, unlike a raw `<br/>`.
 */
export function htmlBreaks(escaped: string): string {
  return escaped.replace(LABEL_BREAK, '&lt;br/&gt;')
}
