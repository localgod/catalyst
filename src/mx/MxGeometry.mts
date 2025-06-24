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
        // @ts-expect-error mxpoint might not exists on MxGeometry
        if (this.mxPoint === undefined) {
            // @ts-expect-error mxpoint might not exists on MxGeometry
            this.mxPoint = []
        }
        // @ts-expect-error mxpoint might not exists on MxGeometry
        this.mxPoint.push(point)
    }

    addArrayPoint(point: MxPoint): void {
        // @ts-expect-error Array might not exists on MxGeometry
        if (this.Array === undefined) {
            // @ts-expect-error Array might not exists on MxGeometry
            this.Array = { $: { as: 'points' }, mxPoint: [] }
        }
        // @ts-expect-error Array might not exists on MxGeometry
        this.Array.mxPoint.push(point)
    }
}

export { MxGeometry }
