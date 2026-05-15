import { MxGeometry } from "../mx/MxGeometry.mjs"
import { MxPoint } from "../mx/MxPoint.mjs"

interface Point {
    x: number;
    y: number;
}

interface ParsedCoordinates {
    start: Point;
    end: Point;
}

class RelParser {
    private rel: { $?: { id?: string }, path?: { $?: { d?: string } }[] }
    private points: [][]
    constructor(rel: object) {
        this.rel = rel
        this.points = []
    }

    /** C4 directional intent extracted from a Rel/BiRel primitive suffix. */
    private static directionOf(primitive: string): 'U' | 'D' | 'L' | 'R' | undefined {
        const m = /_(Up|Down|Left|Right|U|D|L|R)(?:_|$)/.exec(primitive);
        if (!m) return undefined;
        return ({ Up: 'U', U: 'U', Down: 'D', D: 'D', Left: 'L', L: 'L', Right: 'R', R: 'R' } as const)[m[1]];
    }

    static getRelations(pumlString: string): Array<{ source: string, target: string, label: string, description: string, bidirectional: boolean, tags?: string, direction?: 'U' | 'D' | 'L' | 'R' }> {
        const relations: Array<{ source: string, target: string, label: string, description: string, bidirectional: boolean, tags?: string, direction?: 'U' | 'D' | 'L' | 'R' }> = [];

        // Cover the full C4-PlantUML relationship surface. The leading
        // (?<primitive>...) capture lets us tell BiRel apart so the renderer
        // can emit a bidirectional arrow.
        //
        // Supported primitives:
        //   Rel, Rel_Back, Rel_Neighbor, Rel_Back_Neighbor
        //   Rel_U / Rel_D / Rel_L / Rel_R (short directional)
        //   Rel_Up / Rel_Down / Rel_Left / Rel_Right (long directional)
        //   BiRel, BiRel_Neighbor
        //   BiRel_U / BiRel_D / BiRel_L / BiRel_R
        //   BiRel_Up / BiRel_Down / BiRel_Left / BiRel_Right
        //   RelIndex and RelIndex_* (dynamic diagrams — leading numeric index
        //     discarded for layout purposes).
        //
        // The 4th positional arg (technology/description) is optional — 3-arg
        // `Rel(src, tgt, "label")` is equally valid in C4-PlantUML.
        const relationPattern = /(RelIndex(?:_Back)?(?:_Neighbor)?(?:_U|_D|_L|_R|_Up|_Down|_Left|_Right)?|BiRel(?:_Neighbor)?(?:_U|_D|_L|_R|_Up|_Down|_Left|_Right)?|Rel(?:_Back)?(?:_Neighbor)?(?:_U|_D|_L|_R|_Up|_Down|_Left|_Right)?)\(\s*([^,\s)]+)\s*,\s*([^,\s)]+)\s*,\s*(?:(\d+)\s*,\s*)?"([^"]*)"(?:\s*,\s*"([^"]*)")?[^)]*\)/g;

        let match;
        while ((match = relationPattern.exec(pumlString)) !== null) {
            const primitive = match[1];
            const source = match[2].trim();
            const target = match[3].trim();
            // Group 4 is the optional RelIndex leading integer; ignored for
            // layout but consumed by the regex so it doesn't break label capture.
            const label = match[5].trim();
            const description = (match[6] ?? '').trim();
            const bidirectional = primitive.startsWith('BiRel');
            // $tags="x" may appear in the trailing args swallowed by `[^)]*`.
            const tagMatch = /\$tags\s*=\s*"([^"]*)"/.exec(match[0]);
            const tags = tagMatch ? tagMatch[1] : undefined;

            relations.push({
                source,
                target,
                label,
                description,
                bidirectional,
                tags,
                direction: RelParser.directionOf(primitive),
            });
        }

        return relations;
    }

    /**
     * Layout-only constraints: `Lay_U/D/L/R`, `Lay_Up/Down/Left/Right`,
     * `Lay_Distance(a,b,n)`. These produce NO visible connector — they only
     * bias placement. Returned separately so the renderer never emits an edge
     * for them; the LayoutEngine feeds them to the layout engine (ELK) as invisible
     * ranking edges. `distance` (Lay_Distance 3rd arg) is carried through.
     */
    static getLayoutConstraints(pumlString: string): Array<{ source: string, target: string, direction?: 'U' | 'D' | 'L' | 'R', distance?: number }> {
        const out: Array<{ source: string, target: string, direction?: 'U' | 'D' | 'L' | 'R', distance?: number }> = [];
        const pattern = /\bLay_(U|D|L|R|Up|Down|Left|Right|Distance)\(\s*([^,\s)]+)\s*,\s*([^,\s)]+)\s*(?:,\s*(\d+)\s*)?\)/g;
        let m;
        while ((m = pattern.exec(pumlString)) !== null) {
            const kind = m[1];
            const entry: { source: string, target: string, direction?: 'U' | 'D' | 'L' | 'R', distance?: number } = {
                source: m[2].trim(),
                target: m[3].trim(),
            };
            if (kind === 'Distance') {
                if (m[4] !== undefined) entry.distance = parseInt(m[4], 10);
            } else {
                entry.direction = ({ Up: 'U', U: 'U', Down: 'D', D: 'D', Left: 'L', L: 'L', Right: 'R', R: 'R' } as const)[kind];
            }
            out.push(entry);
        }
        return out;
    }

    parsePathCoordinates(path: string): ParsedCoordinates | null {
        const regex = /M([\d.-]+),([\d.-]+).*?C[\d.-]+\s*,\s*[\d.-]+\s*[\d.-]+\s*,\s*[\d.-]+\s*([\d.-]+),\s*([\d.-]+)/i;
        const matches = path.match(regex);

        if (!matches) {
            return null;
        }

        const start: Point = {
            x: parseFloat(matches[1]),
            y: parseFloat(matches[2])
        };

        const end: Point = {
            x: parseFloat(matches[3]),
            y: parseFloat(matches[4])
        };

        return { start, end };
    }

    getpath(): MxGeometry {
        const geometry: MxGeometry = new MxGeometry()
        let points: ParsedCoordinates | null
        if (this.rel.path && this.rel.path[0] && this.rel.path[0].$ && this.rel.path[0].$.d) {
            points = this.parsePathCoordinates(this.rel.path[0].$.d)
            if (points !== null) {
                geometry.addPoint(new MxPoint(points.start.x, points.start.y, 'sourcePoint'))
                geometry.addPoint(new MxPoint(points.end.x, points.end.y, 'targetPoint'))
            }
        }
        return geometry
    }

    getFrom() {
        return this.parseStuff()[0]
    }

    getTo() {
        return this.parseStuff()[1]
    }

    private parseStuff(): string[] {
        if (this.rel && this.rel.$ && this.rel.$.id) {
            return this.rel.$.id.replace('link_', '').split('_')
        }
        return []
    }
}

export { RelParser }
