import { MxGeometry } from './MxGeometry.mjs';

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
