import xml2js from 'xml2js'
import { MxGeometry } from './MxGeometry.mjs';
import { MxFile } from './MxFile.mjs';
import { MxC4 } from './MxC4.mjs';
import { System } from './c4/System.mjs';

class Mx {
    private doc: MxFile

    private tags: Record<string, any> [] = [
        { MxGraphModel: 'mxGraphModel' },
        { MxCell: 'mxCell' },
        { MxGeometry: 'mxGeometry' },
        { MxFile: 'mxfile' },
      ]

    constructor(height: number, width: number) {
        const diagramHeight = Math.ceil(height);
        const diagramWidth = Math.ceil(width);

        this.doc = {
            MxFile: {
                $: {
                    version: '20.1.4',
                    type: 'atlas'
                },
                diagram: {
                    MxGraphModel: {
                        $: {
                            dx: 1815,
                            dy: 751,
                            pageHeight: diagramHeight,
                            pageWidth: diagramWidth
                        },
                        root: {
                            MxCell: [{ $: { id: "0" } }, { $: { id: "1", parent: "0" } }],
                            object: []
                        }
                    }
                }
            }
        }
    }


    private getRoot() {
        return this.doc.MxFile.diagram.MxGraphModel.root
    }

    async addMxC4Object(geometry: MxGeometry, name: string, type?: string, description?: string): Promise<void> {
        const t: MxC4 = {
            $: {
                placeholders: 1,
                MxC4Name: name,
                MxC4Type: type || '',
                MxC4Description: description || '',
                label: await System.label()
            },
            MxCell: {
                $: {
                    style: System.style(),
                    parent: "1",
                    vertex: 1
                },
                MxGeometry: geometry
            }
        }

        this.getRoot().object.push(t);
    }

    replaceKeysWithValue(records: Record<string, any>[], inputString: string): string {
        let outputString = inputString;
      
        for (const record of records) {
          Object.keys(record).forEach((key) => {
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            outputString = outputString.replace(regex, record[key]);
          });
        }
        return outputString;
      }

    async generate(): Promise<string> {
        return this.replaceKeysWithValue(this.tags, (new xml2js.Builder({ headless: true }).buildObject(this.doc)).replaceAll('&amp;', '&'))
    }
}

export { Mx, MxGeometry }