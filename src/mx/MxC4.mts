import { MxCell } from './MxCell.mjs';

export interface MxC4 {
    $: {
        MxC4Name: string;
        MxC4Type?: string;
        MxC4Description?: string;
        label?: string;
        placeholders?: number;
        type?: string;
        factSheetType?: string;
        factSheetId?: string;
        id?: number;
    };
    MxCell: MxCell;
}