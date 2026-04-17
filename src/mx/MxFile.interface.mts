import type { MxGraphModel } from './MxGraphModel.interface.mjs';

export interface MxFile {
    MxFile: {
        $: {
            version: string;
            type: string;
        };
        diagram: {
            $?: {
                id?: string;
                name?: string;
            };
            MxGraphModel: MxGraphModel;
        };
    };
}
