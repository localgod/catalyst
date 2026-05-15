/**
 * Extracts C4-PlantUML styling directives so the renderer can push drawio
 * output closer to what PlantUML would draw:
 *
 *   AddElementTag($tag, $bgColor=, $fontColor=, $borderColor=, $shadowing=)
 *   AddRelTag($tag, $textColor=, $lineColor=, $lineStyle=)
 *   AddBoundaryTag($tag, $bgColor=, $borderColor=, $fontColor=)
 *   UpdateElementStyle($elementName, $bgColor=, $fontColor=, $borderColor=)
 *   UpdateRelStyle($textColor, $lineColor)            (positional)
 *   UpdateBoundaryStyle($borderColor=, $fontColor=, $bgColor=)
 *
 * These lines are skipped by EntityParser (they are not entities) and by
 * RelParser (not relations), so a dedicated pass owns them. Anything it can't
 * map is ignored — never fatal — keeping the "nothing silently breaks parsing"
 * guarantee.
 */

export interface StyleOverride {
    fillColor?: string;
    fontColor?: string;
    strokeColor?: string;
    dashed?: 0 | 1;
}

export interface ParsedStyles {
    /** tag name -> element style override (AddElementTag). */
    elementTags: Map<string, StyleOverride>;
    /** tag name -> relationship style override (AddRelTag). */
    relTags: Map<string, StyleOverride>;
    /** tag name -> boundary style override (AddBoundaryTag). */
    boundaryTags: Map<string, StyleOverride>;
    /** C4 element-kind name (e.g. "external_system") -> override. */
    elementStyles: Map<string, StyleOverride>;
    /** Global relationship override (UpdateRelStyle). */
    relDefault?: StyleOverride;
    /** Global boundary override (UpdateBoundaryStyle). */
    boundaryDefault?: StyleOverride;
}

const kw = (args: string, name: string): string | undefined => {
    // $bgColor="#fff" | $bgColor='#fff' | $bgColor=#fff
    const m = new RegExp(`\\$${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^,)\\s]+))`).exec(args);
    if (!m) return undefined;
    return m[1] ?? m[2] ?? m[3];
};

/** Map the C4-PlantUML colour kwargs onto drawio style keys. */
function toOverride(args: string): StyleOverride {
    const o: StyleOverride = {};
    const bg = kw(args, 'bgColor');
    const fc = kw(args, 'fontColor');
    const bc = kw(args, 'borderColor');
    const lc = kw(args, 'lineColor');
    const tc = kw(args, 'textColor');
    if (bg) o.fillColor = bg;
    if (fc) o.fontColor = fc;
    if (tc) o.fontColor = tc; // rel text colour
    if (bc) o.strokeColor = bc;
    if (lc) o.strokeColor = lc; // rel line colour
    const ls = kw(args, 'lineStyle');
    if (ls && /dash/i.test(ls)) o.dashed = 1;
    return o;
}

/** Pull the argument list of `Name(...)` with paren-depth awareness. */
function argsOf(line: string): string | null {
    const open = line.indexOf('(');
    if (open < 0) return null;
    let depth = 0;
    for (let i = open; i < line.length; i++) {
        if (line[i] === '(') depth++;
        else if (line[i] === ')') {
            depth--;
            if (depth === 0) return line.slice(open + 1, i);
        }
    }
    return null;
}

/** First positional arg, unquoted. */
function firstArg(args: string): string | undefined {
    const m = /^\s*(?:"([^"]*)"|'([^']*)'|([^,]+))/.exec(args);
    if (!m) return undefined;
    return (m[1] ?? m[2] ?? m[3] ?? '').trim();
}

export class StyleParser {
    static parse(puml: string): ParsedStyles {
        const styles: ParsedStyles = {
            elementTags: new Map(),
            relTags: new Map(),
            boundaryTags: new Map(),
            elementStyles: new Map(),
        };

        for (const raw of puml.split('\n')) {
            const line = raw.trim();
            if (line.startsWith("'") || line.startsWith('!')) continue;

            const directive = /^(AddElementTag|AddRelTag|AddBoundaryTag|UpdateElementStyle|UpdateRelStyle|UpdateBoundaryStyle)\b/.exec(line);
            if (!directive) continue;

            const args = argsOf(line);
            if (args === null) continue;
            const name = firstArg(args);
            const override = toOverride(args);

            switch (directive[1]) {
                case 'AddElementTag':
                    if (name) styles.elementTags.set(name, override);
                    break;
                case 'AddRelTag':
                    if (name) styles.relTags.set(name, override);
                    break;
                case 'AddBoundaryTag':
                    if (name) styles.boundaryTags.set(name, override);
                    break;
                case 'UpdateElementStyle':
                    if (name) styles.elementStyles.set(name, override);
                    break;
                case 'UpdateRelStyle':
                    styles.relDefault = override;
                    break;
                case 'UpdateBoundaryStyle':
                    styles.boundaryDefault = override;
                    break;
            }
        }

        return styles;
    }

    /** Apply an override on top of a `key=value;key=value` drawio style string. */
    static applyOverride(baseStyle: string, override?: StyleOverride): string {
        if (!override || Object.keys(override).length === 0) return baseStyle;
        const map = new Map<string, string>();
        for (const part of baseStyle.split(';')) {
            if (!part) continue;
            const eq = part.indexOf('=');
            if (eq < 0) { map.set(part, ''); continue; }
            map.set(part.slice(0, eq), part.slice(eq + 1));
        }
        if (override.fillColor) map.set('fillColor', override.fillColor);
        if (override.fontColor) map.set('fontColor', override.fontColor);
        if (override.strokeColor) map.set('strokeColor', override.strokeColor);
        if (override.dashed !== undefined) map.set('dashed', String(override.dashed));
        return [...map.entries()].map(([k, v]) => (v === '' ? k : `${k}=${v}`)).join(';');
    }
}
