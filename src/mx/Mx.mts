import xml2js from 'xml2js'
import { MxGeometry } from './MxGeometry.mjs';
import type { MxFile } from './MxFile.interface.mjs';
import type { c4 } from './c4/c4.interface.mjs';
import { System } from './c4/System.mjs';
import { Component } from './c4/Component.mjs';
import { Container } from './c4/Container.mjs';
import { ContainerDb } from './c4/ContainerDb.mjs';
import { Person } from './c4/Person.mjs';
import { PersonExt } from './c4/PersonExt.mjs';
import { SystemExt } from './c4/SystemExt.mjs';
import { Boundary } from './c4/Boundary.mjs';
import { Relastionship } from './c4/Relationship.mjs';

class Mx {
    doc: MxFile

    private tags: Record<string, unknown>[] = [
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

    async addMxC4(alias: string, geometry: MxGeometry, type: string, name: string, technology?: string, description?: string, parent?: string): Promise<void> {

        let c4Type = ''
        let label = ''
        let style = ''
        switch (type) {
            case 'Person':
                c4Type = 'Person'
                label = await Person.label()
                style = Person.style()
                break;
            case 'Person_Ext':
                c4Type = 'Person_Ext'
                label = await PersonExt.label()
                style = PersonExt.style()
                break;
            case 'System':
                c4Type = 'System'
                label = await System.label()
                style = System.style()
                break;
            case 'SystemDb':
            case 'SystemQueue':
                // Reuse Container cylinder styling for DB/Queue variants until
                // dedicated shape classes are added.
                c4Type = type
                label = await ContainerDb.label()
                style = ContainerDb.style()
                break;
            case 'System_Ext':
            case 'SystemDb_Ext':
            case 'SystemQueue_Ext':
                c4Type = type
                label = await SystemExt.label()
                style = SystemExt.style()
                break;
            case 'Container':
                c4Type = 'Container'
                label = await Container.label()
                style = Container.style()
                break;
            case 'ContainerDb':
            case 'ContainerQueue':
                c4Type = type
                label = await ContainerDb.label()
                style = ContainerDb.style()
                break;
            case 'Container_Ext':
            case 'ContainerDb_Ext':
            case 'ContainerQueue_Ext':
                c4Type = type
                label = await SystemExt.label()
                style = SystemExt.style()
                break;
            case 'Component':
                c4Type = 'Component'
                label = await Component.label()
                style = Component.style()
                break;
            case 'ComponentDb':
            case 'ComponentQueue':
                c4Type = type
                label = await ContainerDb.label()
                style = ContainerDb.style()
                break;
            case 'Component_Ext':
            case 'ComponentDb_Ext':
            case 'ComponentQueue_Ext':
                c4Type = type
                label = await SystemExt.label()
                style = SystemExt.style()
                break;
            case 'System_Boundary':
            case 'Container_Boundary':
            case 'Enterprise_Boundary':
            case 'Boundary':
                c4Type = type
                label = await Boundary.label()
                style = Boundary.style()
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
                label,
                id: alias
            },
            MxCell: {
                $: {
                    style,
                    parent: parent || "1",
                    vertex: 1
                },
                MxGeometry: geometry
            }
        }

        const object = this.getRoot().object ?? []
        object.push(t);
    }

    async addMxC4Relationship(geometry: MxGeometry, source: string, target: string, type: string, name: string, technology?: string, description?: string): Promise<void> {

        const t: c4 = {
            $: {
                placeholders: 1,
                c4Name: name,
                c4Type: type,
                c4Technology: technology || '',
                c4Description: description || '',
                label: await Relastionship.label()
            },
            MxCell: {
                $: {
                    style: Relastionship.style(),
                    parent: "1",
                    edge: 1,
                    source,
                    target
                },
                MxGeometry: geometry
            }
        }

        const object = this.getRoot().object ?? []
        object.push(t);
    }

    replaceKeysWithValue(records: Record<string, unknown>[], inputString: string): string {
        let outputString = inputString;

        for (const record of records) {
            Object.keys(record).forEach((key: string) => {
                const regex = new RegExp(`\\b${key}\\b`, 'g');
                outputString = outputString.replace(regex, record[key] as string);
            });
        }
        return outputString;
    }

    async generate(): Promise<string> {
        return this.replaceKeysWithValue(this.tags, (new xml2js.Builder({ headless: true }).buildObject(this.doc)).replaceAll('&amp;', '&'))
    }
}

export { Mx, MxGeometry, Relastionship, System, SystemExt, Component, Container, ContainerDb, Person, PersonExt, Boundary }
