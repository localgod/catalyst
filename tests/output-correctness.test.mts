import { describe, it, expect } from 'vitest';
import xml2js from 'xml2js';
import { Catalyst } from '../src/catalyst.mjs';

/**
 * Whole-path output-correctness contracts (real parsers + real Mx — NO
 * mocks), for two bugs found wiring a strict .drawio→PNG renderer
 * (rlespinasse/drawio-export) downstream:
 *
 *  Bug 1 — attribute values must be XML-escaped (& < > "). draw.io's own
 *          reader is lenient; a strict XML parser rejects a bare `&`.
 *  Bug 2 — the C4-PlantUML sequence/dynamic family (or any input that
 *          yields zero entities + zero relations) must FAIL LOUDLY, never
 *          emit a content-less but structurally-valid stub.
 *
 * These are whole-path (Catalyst.convert end-to-end), not unit tests of a
 * helper — a unit test on the escape fn or the detector could pass while
 * the wiring silently bypassed it.
 */

const C4 = (inc: string, body: string) =>
  `@startuml t\n!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/v2.10.0/${inc}\n${body}\n@enduml\n`;

describe('Bug 1 — XML escaping of catalyst-authored attribute values', () => {
  it('escapes & < > " in c4Name/c4Technology/c4Description and stays well-formed', async () => {
    const xml = await Catalyst.convert(C4('C4_Component.puml',
      'Component(n, "A & B <C> D", "t & <u> v", "d & <x> y")\n'
      + 'Component(m, "Plain")\n'
      + 'Rel(n, m, "calls & waits <sync>", "g & <rpc>")'));

    // Well-formed for a STRICT parser (the failure mode draw.io hid).
    const doc = await xml2js.parseStringPromise(xml);
    expect(doc).toBeDefined();

    // No raw &, <, or > inside any c4* attribute value.
    for (const m of xml.matchAll(/c4(?:Name|Technology|Description)="([^"]*)"/g)) {
      expect(m[1], `raw markup char in ${m[0]}`).not.toMatch(/[<>&](?!(amp|lt|gt|quot|#39);)/);
    }

    // The literal characters survive the round-trip (draw.io decodes the
    // attribute, then substitutes %c4Name% into the label).
    const root = doc.mxfile.diagram[0].mxGraphModel[0].root[0];
    const names = (root.object ?? []).map((o: { $: { c4Name?: string } }) => o.$.c4Name);
    expect(names).toContain('A & B <C> D');                 // entity verb-less name
    expect(names).toContain('calls & waits <sync>');         // relationship verb
  });
});

describe('Bug 2 — fail loudly, never a content-less stub', () => {
  it('rejects a C4_Sequence diagram with a clear, specific message', async () => {
    const puml = C4('C4_Sequence.puml',
      'actor "Operator / app" as op\nparticipant "Certificate CR" as crt\nop -> crt : apply');
    await expect(Catalyst.convert(puml)).rejects.toThrow(
      /unsupported C4-PlantUML diagram type: C4_Sequence/,
    );
  });

  it('rejects sequence syntax even without the C4_Sequence include', async () => {
    await expect(
      Catalyst.convert('@startuml s\nparticipant "A" as a\nparticipant "B" as b\na -> b : x\n@enduml'),
    ).rejects.toThrow(/unsupported C4-PlantUML diagram type: C4_Sequence/);
  });

  it('rejects any non-empty input that yields zero entities and zero relations', async () => {
    await expect(Catalyst.convert('@startuml x\ntitle nothing here\n@enduml'))
      .rejects.toThrow(/no convertible C4 elements found/);
  });

  it('still converts a valid static C4 diagram (no false positive)', async () => {
    const xml = await Catalyst.convert(C4('C4_Container.puml',
      'System(a, "A")\nContainer(b, "B", "Go")\nRel(a, b, "uses")'));
    expect(xml).toContain('<mxfile');
    await expect(xml2js.parseStringPromise(xml)).resolves.toBeDefined();
  });
});

describe('Phase 1 — PlantUML \\n becomes a real line break, never a literal', () => {
  it('translates \\n in name/description/rel to <br/> and stays strict-XML well-formed', async () => {
    const xml = await Catalyst.convert(C4('C4_Container.puml',
      'ContainerDb(s, "K8s Secret\\n<workload>-tls", "Kubernetes", "Holds the issued\\nleaf cert\\nand key")\n'
      + 'Container(a, "Admin API", "Go", "OpenAPI 3.1 REST:\\n  POST /issue")\n'
      + 'Rel(a, s, "writes\\ncert + key to", "K8s API")'));

    // Strict-XML well-formed (the inserted break must be the pre-encoded
    // &lt;br/&gt;, not a raw <br/> that a strict consumer would reject).
    const doc = await xml2js.parseStringPromise(xml);
    expect(doc).toBeDefined();
    expect(xml).toContain('&lt;br/&gt;');

    // No literal backslash-n survives in any catalyst-authored attribute.
    for (const m of xml.matchAll(/c4(?:Name|Technology|Description)="([^"]*)"/g)) {
      expect(m[1], `literal \\n survived in ${m[0]}`).not.toMatch(/\\n/);
    }

    // After the XML round-trip the value carries a real <br/> at each break
    // (draw.io substitutes this into the html=1 label).
    const root = doc.mxfile.diagram[0].mxGraphModel[0].root[0];
    const objs = (root.object ?? []) as { $: Record<string, string> }[];
    const byId = (id: string) => objs.find((o) => o.$.id === id)!.$;
    expect(byId('s').c4Name).toBe('K8s Secret<br/><workload>-tls');
    expect(byId('s').c4Description).toBe('Holds the issued<br/>leaf cert<br/>and key');
    expect(byId('a').c4Description).toBe('OpenAPI 3.1 REST:<br/>  POST /issue');
    // Relationship verb keeps its break too.
    const rel = objs.find((o) => o.$.c4Name?.includes('writes'))!.$;
    expect(rel.c4Name).toBe('writes<br/>cert + key to');
  });
});
