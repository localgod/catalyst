import { MxCell } from './MxCell.interface.mjs';

export interface MxGraphModel {
    $?: {
        pageWidth?: number;
        pageHeight?: number;
    };
    root: {
        MxCell?: MxCell[];
        object?: object[];
    };
}
