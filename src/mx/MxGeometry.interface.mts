import { MxPoint } from "./MxPoint.interface.mjs";

export interface MxGeometry {
    $: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        as: string;
    };
    mxPoint?: MxPoint[];
    Array?: {
        $?: { as?: string };
        mxPoint?: MxPoint[]
    };
}
