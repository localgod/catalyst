import xml2js from 'xml2js'
import { MxGeometry } from './MxGeometry.mjs';
import type { MxFile } from './MxFile.interface.mjs';
import type { c4 } from './c4/c4.interface.mjs';
import { System } from './c4/System.mjs';
import { SystemExt } from './c4/SystemExt.mjs';
import { SystemDb } from './c4/SystemDb.mjs';
import { SystemQueue } from './c4/SystemQueue.mjs';
import { Component } from './c4/Component.mjs';
import { ComponentExt } from './c4/ComponentExt.mjs';
import { ComponentDb } from './c4/ComponentDb.mjs';
import { ComponentQueue } from './c4/ComponentQueue.mjs';
import { Container } from './c4/Container.mjs';
import { ContainerExt } from './c4/ContainerExt.mjs';
import { ContainerDb } from './c4/ContainerDb.mjs';
import { ContainerQueue } from './c4/ContainerQueue.mjs';
import { Person } from './c4/Person.mjs';
import { PersonExt } from './c4/PersonExt.mjs';
import { Boundary } from './c4/Boundary.mjs';
import { EnterpriseBoundary } from './c4/EnterpriseBoundary.mjs';
import { DeploymentNode } from './c4/DeploymentNode.mjs';
import { Relastionship } from './c4/Relationship.mjs';
import { StyleParser } from '../puml/StyleParser.mjs';
import type { StyleOverride } from '../puml/StyleParser.mjs';
import { htmlBreaks } from '../text/labelLines.mjs';

/**
 * xml2js escapes `&`, `<`, `"` in attribute values but leaves `>` raw
 * (legal per the XML spec, but strict/non-conformant consumers — e.g.
 * rlespinasse/drawio-export's Rust parser — and the project's own
 * round-trip contract want it escaped). Pre-encoding `>` -> `&gt;` here
 * rides the existing double-encode/un-double pipeline in Mx.generate()
 * (`&` -> `&amp;` by xml2js, then `&amp;gt;` -> `&gt;`), yielding a final
 * `&gt;`. Applied to catalyst-authored c4* text attributes only.
 */
const escGt = (s: string): string => s.replace(/>/g, '&gt;')

/**
 * Canonical encoder for every catalyst-authored c4* text attribute:
 * escape `>` (escGt), THEN turn PlantUML `\n` breaks into a pre-encoded
 * `&lt;br/&gt;` (htmlBreaks). Order matters — htmlBreaks must run on the
 * `>`-escaped string so the inserted break token survives escGt untouched
 * and the surrounding text's real `>` is still encoded.
 */
const c4Text = (s: string): string => htmlBreaks(escGt(s))

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
                    // Emit id + name so drawio-export / drawio-desktop headless
                    // tools accept the XML (they reject bare <diagram>).
                    $: {
                        id: 'catalyst-diagram',
                        name: 'Page-1'
                    },
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

    async addMxC4(alias: string, geometry: MxGeometry, type: string, name: string, technology?: string, description?: string, parent?: string, styleOverride?: StyleOverride, link?: string): Promise<void> {

        let c4Type = type
        let label = ''
        let style = ''
        switch (type) {
            // --- Persons ---
            case 'Person':
                label = await Person.label()
                style = Person.style()
                break;
            case 'Person_Ext':
                label = await PersonExt.label()
                style = PersonExt.style()
                break;

            // --- Systems ---
            case 'System':
                label = await System.label()
                style = System.style()
                break;
            case 'SystemDb':
                label = await SystemDb.label()
                style = SystemDb.style()
                break;
            case 'SystemQueue':
                label = await SystemQueue.label()
                style = SystemQueue.style()
                break;
            case 'System_Ext':
            case 'SystemDb_Ext':
            case 'SystemQueue_Ext':
                // Grey external variants — could further diverge DB/Queue shapes
                // but the spec's upstream skinparam-based styling collapses them
                // into the same grey rectangle in most renderers.
                label = await SystemExt.label()
                style = SystemExt.style()
                break;

            // --- Containers ---
            case 'Container':
                label = await Container.label()
                style = Container.style()
                break;
            case 'ContainerDb':
                label = await ContainerDb.label()
                style = ContainerDb.style()
                break;
            case 'ContainerQueue':
                label = await ContainerQueue.label()
                style = ContainerQueue.style()
                break;
            case 'Container_Ext':
            case 'ContainerDb_Ext':
            case 'ContainerQueue_Ext':
                label = await ContainerExt.label()
                style = ContainerExt.style()
                break;

            // --- Components ---
            case 'Component':
                label = await Component.label()
                style = Component.style()
                break;
            case 'ComponentDb':
                label = await ComponentDb.label()
                style = ComponentDb.style()
                break;
            case 'ComponentQueue':
                label = await ComponentQueue.label()
                style = ComponentQueue.style()
                break;
            case 'Component_Ext':
            case 'ComponentDb_Ext':
            case 'ComponentQueue_Ext':
                label = await ComponentExt.label()
                style = ComponentExt.style()
                break;

            // --- Deployment level ---
            case 'Node':
            case 'Node_L':
            case 'Node_R':
            case 'Deployment_Node':
            case 'Deployment_Node_L':
            case 'Deployment_Node_R':
                label = await DeploymentNode.label()
                style = DeploymentNode.style()
                break;

            // --- Boundaries ---
            case 'Enterprise_Boundary':
                label = await EnterpriseBoundary.label()
                style = EnterpriseBoundary.style()
                break;
            case 'System_Boundary':
            case 'Container_Boundary':
            case 'Boundary':
                label = await Boundary.label()
                style = Boundary.style()
                break;

            default:
                c4Type = ''
                break;
        }

        // Tag / UpdateElementStyle colour overrides push the shape toward what
        // PlantUML would render. Base style is untouched when no override.
        style = StyleParser.applyOverride(style, styleOverride)

        const t: c4 = {
            $: {
                placeholders: 1,
                c4Name: c4Text(name),
                c4Type,
                c4Technology: c4Text(technology || ''),
                c4Description: c4Text(description || ''),
                label,
                id: alias,
                ...(link ? { link } : {})
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

    async addMxC4Relationship(geometry: MxGeometry, source: string, target: string, type: string, name: string, technology?: string, description?: string, bidirectional: boolean = false, styleOverride?: StyleOverride): Promise<void> {

        // Bidirectional rels get arrowheads on BOTH ends (startArrow+endArrow).
        // The existing Relastionship.style() sets endArrow=blockThin; we override
        // startArrow here so the base class stays focused on the common case.
        let style = Relastionship.style()
        if (bidirectional) {
            style = style + ';startArrow=blockThin;startFill=1'
        }
        // AddRelTag / UpdateRelStyle colour + dashed overrides.
        style = StyleParser.applyOverride(style, styleOverride)

        const t: c4 = {
            $: {
                placeholders: 1,
                c4Name: c4Text(name),
                c4Type: type,
                // Pre-bracket the technology in the VALUE so the label template
                // (which is just `%c4Technology%`, no literal brackets) renders
                // "[HTTPS]" when present and an empty <div> when absent — never
                // a bare "[]" tofu box. See Relastionship.label().
                c4Technology: technology ? c4Text(`[${technology}]`) : '',
                c4Description: c4Text(description || ''),
                label: await Relastionship.label()
            },
            MxCell: {
                $: {
                    style,
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
        // The c4 label templates are PRE-encoded to HTML entities
        // (encodeHtmlEntities: < -> &lt;, & -> &amp;, ...) so draw.io renders
        // them as HTML. xml2js then encodes the leading `&` of each entity ref
        // again, double-encoding `&lt;` -> `&amp;lt;` etc. The old code undid
        // this with a blanket `.replaceAll('&amp;','&')` — which ALSO turned a
        // genuine `&` in a label/description (xml2js: `&` -> `&amp;`) back into
        // a raw `&`, emitting INVALID XML (draw.io's strict loader rejects a
        // bare `&` in an attribute). Reverse ONLY the double-encoded entity
        // refs the pre-encoder produced; leave a real `&amp;` intact.
        const xml = new xml2js.Builder({ headless: true }).buildObject(this.doc)
            .replace(/&amp;(lt|gt|quot|amp|#39);/g, '&$1;')
        return this.replaceKeysWithValue(this.tags, xml)
    }
}

export {
    Mx,
    MxGeometry,
    Relastionship,
    System, SystemExt, SystemDb, SystemQueue,
    Component, ComponentExt, ComponentDb, ComponentQueue,
    Container, ContainerExt, ContainerDb, ContainerQueue,
    Person, PersonExt,
    Boundary, EnterpriseBoundary,
    DeploymentNode,
}
