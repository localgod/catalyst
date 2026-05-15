# C4-PlantUML Coverage Matrix

Tracks catalyst's export coverage against the [C4-PlantUML v2.10.0](https://github.com/plantuml-stdlib/C4-PlantUML/tree/v2.10.0) spec surface. Updated as fixes land.

Legend: `✓` full, `~` partial (rendered but not with dedicated styling), `✗` silently dropped, `!` crashes parser.

## Entity-creation procedures

### Context level

| Primitive | Spec signature | State |
|---|---|---|
| `Person` | `Person($alias, $label, $descr="", $sprite="", $tags="", $link="")` | ✓ |
| `Person_Ext` | same | ✓ |
| `System` | `System($alias, $label, $descr="", $sprite="", $tags="", $link="")` | ✓ |
| `SystemDb` | same | ~ (reuses ContainerDb cylinder styling) |
| `SystemQueue` | same | ~ (reuses ContainerDb cylinder) |
| `System_Ext` | same | ✓ |
| `SystemDb_Ext` | same | ~ (grey SystemExt) |
| `SystemQueue_Ext` | same | ~ (grey SystemExt) |
| `System_Boundary` | `System_Boundary($alias, $label, $tags="", $link="")` | ✓ |
| `Enterprise_Boundary` | same | ~ (renders as generic Boundary) |

### Container level

| Primitive | State |
|---|---|
| `Container` | ✓ |
| `ContainerDb` | ✓ (dedicated cylinder) |
| `ContainerQueue` | ~ (reuses ContainerDb) |
| `Container_Ext` | ~ (grey SystemExt) |
| `ContainerDb_Ext` | ~ (grey SystemExt — loses cylinder) |
| `ContainerQueue_Ext` | ~ (grey SystemExt) |
| `Container_Boundary` | ✓ (renders as generic Boundary) |

### Component level

| Primitive | State |
|---|---|
| `Component` | ✓ |
| `ComponentDb` | ~ (reuses ContainerDb) |
| `ComponentQueue` | ~ (reuses ContainerDb) |
| `Component_Ext` | ~ (grey SystemExt) |
| `ComponentDb_Ext` | ~ (grey SystemExt) |
| `ComponentQueue_Ext` | ~ (grey SystemExt) |

### Deployment level

| Primitive | Spec | State |
|---|---|---|
| `Deployment_Node` | `Deployment_Node($alias, $label, $type="", $descr="", $sprite="", $tags="", $link="")` | ✗ |
| `Deployment_Node_L` / `_R` | same | ✗ |
| `Node` | same | ✗ |
| `Node_L` / `_R` | same | ✗ |

### Sequence level

| Primitive | State |
|---|---|
| All Context/Container/Component types | ✓ (inherited) |
| `Boundary` (generic) | ✓ |
| `SHOW_ELEMENT_DESCRIPTIONS` | ✗ (skipped as comment) |
| `SHOW_FOOT_BOXES` / `SHOW_INDEX` | ✗ (skipped as comment) |

## Relationships

| Primitive | State |
|---|---|
| `Rel($from, $to, $label, $techn="", $descr="", ...)` | ✓ |
| `Rel_Back` | ✓ (captured by regex; arrow direction not reversed yet) |
| `Rel_Neighbor` / `Rel_Back_Neighbor` | ~ (captured, rendered as plain Rel) |
| `Rel_U` / `Rel_D` / `Rel_L` / `Rel_R` | ✓ (captured; hint ignored) |
| `Rel_Up` / `Rel_Down` / `Rel_Left` / `Rel_Right` | ✗ (regex doesn't match long-form) |
| `BiRel` | ~ (captured as unidirectional; should emit bidirectional arrow) |
| `BiRel_U/D/L/R` / `BiRel_Up/Down/Left/Right` / `BiRel_Neighbor` | ✗ |
| `RelIndex*` series (dynamic) | ✗ |

## Layout hints

| Primitive | State |
|---|---|
| `Lay_U/D/L/R`, `Lay_Up/Down/Left/Right` | ✓ parsed (`RelParser.getLayoutConstraints`) and fed to ELK as invisible, layout-only ranking edges (never drawn) |
| `Lay_Distance` | ✓ parsed; carried as a layout-only constraint |
| `LAYOUT_TOP_DOWN` | ✓ (skipped; `layoutDirection` option gives equivalent) |
| `LAYOUT_LEFT_RIGHT` / `LAYOUT_LANDSCAPE` | ✓ (skipped) |
| `LAYOUT_AS_SKETCH` | ✓ (skipped) |

## Styling

Handled by `src/puml/StyleParser.mts` (colour kwargs `$bgColor`/`$fontColor`/`$borderColor`/`$lineColor`/`$textColor`/`$lineStyle` → drawio `fillColor`/`fontColor`/`strokeColor`/`dashed`).

| Primitive | State |
|---|---|
| `AddElementTag($tagStereo, $bgColor, $fontColor, $borderColor)` | ✓ (applied to elements whose `$tags` matches) |
| `AddRelTag($tag, $textColor, $lineColor, $lineStyle)` | ✓ (applied to rels whose `$tags` matches; `DashedLine()` → `dashed=1`) |
| `AddBoundaryTag($tag, $bgColor, $borderColor, $fontColor)` | ✓ (applied to boundaries whose `$tags` matches) |
| `UpdateElementStyle($elementName, ...)` | ✓ for mapped kinds (person/system/container/component + `_ext`/`_db`/`_queue`); unmapped kinds ignored |
| `UpdateRelStyle` / `UpdateBoundaryStyle` | ✓ (global default override) |
| `$tags="critical"` inline on shape / rel / boundary | ✓ (`+`-separated multi-tag supported; last tag wins on conflict) |
| `$link=https://...` | ✓ (emitted as clickable `link=` attribute on the drawio object) |
| `$sprite=img:foo` / `$sprite=&icon` | ✗ (parsed as `sprite`; not rendered — drawio has no PlantUML sprite registry. Parsing never breaks) |
| `$shadowing`, custom `$lineStyle` (Bold/Dotted), `SET_SKETCH_STYLE` | ✗ (parsed/skipped; not mapped to drawio equivalents) |

## Legend / display

| Primitive | State |
|---|---|
| `SHOW_LEGEND`, `SHOW_FLOATING_LEGEND`, `SHOW_DYNAMIC_LEGEND` | ✗ (skipped) |
| `HIDE_STEREOTYPE` | ✗ |
| `SHOW_PERSON_OUTLINE` / `_PORTRAIT` / `_SPRITE` | ✗ |

## Properties

| Primitive | State |
|---|---|
| `AddProperty` / `SetPropertyHeader` / `WithoutPropertyHeader` | ✗ |

## Priority backlog

Ordered by value × tractability.

### Done (structural correctness — parity-gated by `tests/parity.test.mts`)

1. ✅ **Deployment nodes** (`Deployment_Node`/`Node` + `_L`/`_R`), including deep nesting (ELK native hierarchical/compound layout).
2. ✅ **BiRel bidirectional** — `startArrow` emitted.
3. ✅ **Long-form Rel names** + `BiRel_*` + `Rel_Back_Neighbor`.
4. ✅ **Parallel relations + self-loops** — one drawio edge per parsed relation (multigraph; was collapsing 17→6).
5. ✅ **`$tags` / `$link` applied; `AddElementTag`/`AddRelTag`/`AddBoundaryTag`/`UpdateElementStyle`/`UpdateRelStyle`/`UpdateBoundaryStyle`** → colour/dashed overrides.

The parity test asserts: every entity → a shape with matching `c4Type`; every relation → an edge; every endpoint resolves; `<diagram id+name>` present. Run against `c4-exhaustive.puml` (the all-encompassing fixture) + 5 real fixtures. Parity + the `tests/golden.test.mjs` structural snapshot held unchanged through the dagre→elkjs engine swap.

### Layout fidelity (L1–L5) — engine: elkjs (Eclipse Layout Kernel)

dagre 3.0.0 was replaced by **elkjs**: its documented option surface (wiki + spike) has no aspect/wrapping/same-rank/in-layer-order control; elkjs does. Algorithm is chosen per the **C4 spec level** of the source (a semantic fact, not a heuristic):

- **Container / Component / Deployment** (hierarchical) → `org.eclipse.elk.layered` (flow + orthogonal routing + compound nesting). c4-exhaustive aspect ≈ 1.2.
- **Context** (people/systems only — hub-and-spoke) → `org.eclipse.elk.force` (balanced; ibmwm-c4-context aspect 7.9 → ~1.1, 0 overlaps). A context overview is not a flow diagram, so straight edges are appropriate.

| Item | State |
|---|---|
| **L1 U/D** | ✓ (layered path) — engine-agnostic edge reversal ranks the target above/below |
| **L1 L/R** | ~ honored only when the two nodes already land on the same rank (safe post-pass; cross-rank L/R is impossible in any layered engine incl. PlantUML/dot). Parsed + fed as ELK model-order influence otherwise |
| **L2 edge routing** | ✓ ELK-computed `sections` → drawio waypoints (layered path; force uses straight edges) |
| **L3 node sizing** | ✓ real font metrics — fontkit + bundled Liberation Sans (no estimated ratios) |
| **L4 nesting** | ✓ ELK native hierarchical/compound (boundaries, Deployment_Node), any depth |
| **L5 aspect** | ✓ spec-driven force/layered selection (the wide-star ribbon is fixed) |

### Tier 2 — remaining visual fidelity

1. Dedicated shape classes for `SystemDb`, `SystemQueue`, `ContainerQueue`, `Component*` variants, `Container_Ext`/`Component_Ext`/`SystemDb_Ext` (proper colour distinction — currently `~`, see tables above).
2. Boundary type distinction: `Container_Boundary` rendered as generic `Boundary` (`~`); `Enterprise_Boundary` already distinct.
3. `$sprite` → drawio shape decorator (no drawio sprite registry; parsing never breaks).

### Tier 3 — nice-to-have

1. `SHOW_LEGEND` → drawio legend box (currently skipped; structural parity unaffected).
2. `AddProperty` / property tables rendered below element.
