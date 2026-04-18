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
| `Lay_U/D/L/R`, `Lay_Up/Down/Left/Right` | ✓ (skipped as non-entity; hints not fed to dagre) |
| `Lay_Distance` | ✓ (skipped; not fed to dagre) |
| `LAYOUT_TOP_DOWN` | ✓ (skipped; `layoutDirection` option gives equivalent) |
| `LAYOUT_LEFT_RIGHT` / `LAYOUT_LANDSCAPE` | ✓ (skipped) |
| `LAYOUT_AS_SKETCH` | ✓ (skipped) |

## Styling

| Primitive | State |
|---|---|
| `AddElementTag($tagStereo, $bgColor, ...)` | ✗ (silently skipped) |
| `AddRelTag` / `AddBoundaryTag` | ✗ |
| `UpdateElementStyle` / `UpdateRelStyle` / `UpdateBoundaryStyle` | ✗ |
| `$tags="critical"` inline on shape/rel | ✗ (parsed as `tags` field on EntityDescriptor but not applied) |
| `$sprite=img:foo` | ✗ (parsed as `sprite` but not rendered) |
| `$link=https://...` | ✗ (parsed as `link` but not rendered) |
| `SET_SKETCH_STYLE` | ✗ |

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

### Tier 1 — structural correctness

1. **Deployment nodes** (`Deployment_Node`, `Node`) — whole C4 level missing.
2. **BiRel bidirectional** — currently shown as unidirectional; visually misleading.
3. **Long-form Rel names** (`Rel_Up`/`Rel_Down`/etc.) + `BiRel_*` variants + `Rel_Back_Neighbor` in regex.
4. **`$tags` / `$sprite` / `$link` in shapes** — at minimum, don't break parsing when present.

### Tier 2 — visual fidelity

5. Dedicated shape classes for `SystemDb`, `SystemQueue`, `ContainerQueue`, `Component*` variants, `Container_Ext`/`Component_Ext`/`SystemDb_Ext` (proper colour distinction).
6. Boundary type distinction: `Enterprise_Boundary` styled bolder; `Container_Boundary` darker.
7. `$sprite` → drawio shape decorator.

### Tier 3 — nice-to-have

8. `AddElementTag` / `UpdateElementStyle` → per-tag style overrides.
9. `SHOW_LEGEND` → drawio legend box.
10. `Lay_*` hints fed to dagre as directional edge weights / layout constraints.
11. `$link` → drawio `UserObject` link.
12. `AddProperty` / property tables rendered below element.
