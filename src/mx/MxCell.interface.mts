import { MxGeometry } from './MxGeometry.interface.mjs';

export interface MxCell {
    $: {
        id?: string;
        style?: string;
        parent?: string;
        source?: number;
        target?: number;
        edge?: number;
        vertex?: number;
    };
    MxGeometry?: MxGeometry;
}