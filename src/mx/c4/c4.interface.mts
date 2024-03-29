import { MxCell } from '../MxCell.interface.mjs';

export interface c4 {
    $: {
        c4Name: string;
        c4Type?: string;
        c4Technology?: string;
        c4Description?: string;
        label?: string;
        placeholders?: number;
        type?: string;
        factSheetType?: string;
        factSheetId?: string;
        id?: string;
    };
    MxCell: MxCell;
}
