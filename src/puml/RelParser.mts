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

    static getRelations(pumlString: string): Array<{ source: string, target: string, label: string, description: string }> {
        const relations: Array<{ source: string, target: string, label: string, description: string }> = [];

        // Define the regular expression pattern to match relations
        const relationPattern = /Rel\(([^,]+),\s*([^,]+),\s*"([^"]+)",\s*"([^"]+)"\)/g;

        // Find all matches of relations in the PlantUML string
        let match;
        while ((match = relationPattern.exec(pumlString)) !== null) {
            const source = match[1].trim();
            const target = match[2].trim();
            const label = match[3].trim();
            const description = match[4].trim();

            relations.push({
                source,
                target,
                label,
                description
            });
        }

        return relations;
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
