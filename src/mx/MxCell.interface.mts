import { MxGeometry } from './MxGeometry.interface.mjs';

export interface MxCell {
    $: {
        id?: string;
        style?: string;
        parent?: string;
        source?: string;
        target?: string;
        edge?: number;
        vertex?: number;
    };
    MxGeometry?: MxGeometry;
}
