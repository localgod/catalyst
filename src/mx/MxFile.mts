import { MxGraphModel } from './MxGraphModel.mjs';

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