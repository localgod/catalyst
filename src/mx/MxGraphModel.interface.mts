import { MxCell } from './MxCell.interface.mjs';

export interface MxGraphModel {
    $?: {
        dx?: number;
        dy?: number;
        pageWidth?: number;
        pageHeight?: number;
    };
    root: {
        MxCell?: MxCell[];
        object?: {}[];
    };
}