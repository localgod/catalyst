import { MxPoint } from "./MxPoint.mjs";

class MxGeometry  {
    $: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        as: string;
    }

    constructor(height?: number, width?: number, x?: number, y?: number) {
        this.$ = { as: 'geometry' }
        if (height) {
            this.$.height = Math.floor(height)
        }
        if (width) {
            this.$.width = Math.floor(width)
        }
        if (x) {
            this.$.x = Math.floor(x)
        }
        if (y) {
            this.$.y = Math.floor(y)
        }
    }

    addPoint(point: MxPoint): void {
        // @ts-ignore
        if (this.mxPoint === undefined) {
            // @ts-ignore
            this.mxPoint = []
        }
        // @ts-ignore
        this.mxPoint as any
        // @ts-ignore
        this.mxPoint.push(point)
    }

    addArrayPoint(point: MxPoint): void {
        // @ts-ignore
        if (this.Array === undefined) {
            // @ts-ignore
            this.Array = { $: { as: 'points' }, mxPoint: [] }
        }
        // @ts-ignore
        this.Array.mxPoint.push(point)
    }
}

export { MxGeometry }
