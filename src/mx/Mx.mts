import xml2js from 'xml2js'
import { MxGeometry } from './MxGeometry.interface.mjs';
import { MxFile } from './MxFile.interface.mjs';
import { c4 } from './c4/c4.interface.mjs';
import { System } from './c4/System.mjs';
import { Component } from './c4/Component.mjs';
import { Container } from './c4/Container.mjs';
import { Relastionship } from './c4/Relationship.mjs';

class Mx {
    doc: MxFile

    private tags: Record<string, any>[] = [
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

    async addMxC4(geometry: MxGeometry, type: string, name: string, technology?: string, description?: string): Promise<void> {

        let c4Type = ''
        let label = ''
        let style = ''
        switch (type) {
            case 'System':
                c4Type = 'System'
                label = await System.label()
                style = System.style()
                break;
            case 'Container':
                c4Type = 'Container'
                label = await Container.label()
                style = Container.style()
                break;
            case 'Component':
                c4Type = 'Component'
                label = await Component.label()
                style = Component.style()
                break;

            default:
                break;
        }

        const t: c4 = {
            $: {
                placeholders: 1,
                c4Name: name,
                c4Type,
                c4Technology: technology || '',
                c4Description: description || '',
                label
            },
            MxCell: {
                $: {
                    style,
                    parent: "1",
                    vertex: 1
                },
                MxGeometry: geometry
            }
        }

        this.getRoot().object.push(t);
    }

    async addMxC4Relationship(geometry: MxGeometry, type: string, name: string, technology?: string, description?: string): Promise<void> {

           const t: c4 = {
            $: {
                placeholders: 1,
                c4Name: name,
                c4Type: 'Relationship',
                c4Technology: technology || '',
                c4Description: description || '',
                label: await Relastionship.label()
            },
            MxCell: {
                $: {
                    style: Relastionship.style(),
                    parent: "1",
                    edge: 1,
                    source: 7,
                    target: 4
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

export { Mx, MxGeometry, Relastionship, System, Component, Container }