import { MxGeometry } from "../mx/MxGeometry.interface.mjs"
import { MxPoint } from "../mx/MxPoint.interface.mjs"

class RelParser {
    readonly MAX_LINE_POINTS = 4
    private rel: { $?: { id?: string }, path?: { $?: { d?: string } }[] }
    private points: [][]
    constructor(rel: {}) {
        this.rel = rel
    }

    getpath(): MxGeometry {
        const g: MxGeometry = { $: { as: "geometry" }, mxPoint: [], Array: { $: { as: "points" }, mxPoint: [] } }
        let points = this.parsePoints()
        points = this.approximateLine(points, this.MAX_LINE_POINTS)
        const sourcePoint: MxPoint = { $: { x: points[0][0], y: points[0][1], as: 'sourcePoint' } }
        const targetPoint: MxPoint = { $: { x: points[points.length - 1][0], y: points[points.length - 1][1], as: 'targetPoint' } }
        g.mxPoint.push(sourcePoint)
        g.mxPoint.push(targetPoint)
        points.forEach((elm, index) => {
            if (index !== 0 && index !== points.length -1) {
                g.Array.mxPoint.push({ $: { x: elm[0], y: elm[1] } })
            }
        })
        return g
    }


    approximateLine(points, numPoints) {
        if (numPoints < 2 || numPoints > points.length) {
            return points
        }

        const start = points[0];
        const end = points[points.length - 1];

        const step = (points.length - 2) / (numPoints - 1);
        const approximatedPoints = [start];

        for (let i = 1; i < numPoints - 1; i++) {
            const index = Math.round(i * step);
            approximatedPoints.push(points[index]);
        }

        approximatedPoints.push(end);

        return approximatedPoints;
    }

    getFrom() {
        return this.parseStuff()[0]
    }

    getTo() {
        return this.parseStuff()[1]
    }

    private parseStuff(): string[] {
        return this.rel.$.id.replace('link_', '').split('_')
    }

    private parsePoints(): number[][] {
        const coordinates: number[][] = [];
        const path = this.rel.path[0].$.d;

        if (path) {
            const elements = path.split(" ").filter(element => element.trim() !== '');

            const coordinateMap = new Map<string, number[]>(); // Map to store coordinates and their index

            elements.forEach(el => {
                const [x, y] = el.split(',');

                if (x && y) {
                    let parsedX = parseInt(x);
                    let parsedY = parseInt(y);

                    if (isNaN(parsedX) || isNaN(parsedY)) {
                        return; // Skip invalid coordinates
                    }

                    if (x.charAt(0).match(/[A-Za-z]/)) {
                        parsedX = parseInt(x.substring(1));
                    }

                    const coordinateStr = `${parsedX},${parsedY}`;

                    if (!coordinateMap.has(coordinateStr)) {
                        coordinateMap.set(coordinateStr, [parsedX, parsedY]);
                        coordinates.push([parsedX, parsedY]);
                    }
                }
            });
        }

        return coordinates;
    }
}

export { RelParser }
