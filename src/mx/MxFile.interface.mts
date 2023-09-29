import { MxGraphModel } from './MxGraphModel.interface.mjs';

export interface MxFile {
    MxFile: {
        $: {
            version: string;
            type: string;
        };
        diagram: {
            MxGraphModel: MxGraphModel;
        };
    };
}