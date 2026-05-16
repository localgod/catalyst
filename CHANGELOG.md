# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](http://semver.org/).

This project adheres to [Keep a CHANGELOG](http://keepachangelog.com/).

## [Unreleased]

## [1.4.1] - 2026-05-16

### Removed

- `release-drafter` workflow + config
  (`.github/workflows/release-drafter.yml`, `.github/release-drafter.yml`).
  Releases are git tags only (no formal GitHub Releases); the perpetual
  auto-generated untagged Draft contradicted that documented convention.

### Fixed

- README Quick Start install pin (`#v1.3.0` → `#v1.4.0`) — it was stale
  the moment v1.4.0 shipped and would have installed previous code.
- Attribute values now also escape `>` → `&gt;` (in addition to the
  `&`/`<`/`"` already escaped since v1.4.0) for `c4Name`/`c4Technology`/
  `c4Description`. Raw `>` is legal XML but strict/non-conformant
  consumers (e.g. rlespinasse/drawio-export's Rust parser) and the
  round-trip contract want it escaped; an element named `A & B <C> "D"`
  now round-trips through `xmllint --noout` and a strict parser.
- C4-PlantUML **sequence/dynamic** input (`C4_Sequence.puml`,
  `participant`/sequence message syntax) no longer silently produces a
  valid-but-content-less `<mxGraphModel>` stub that renders as a blank
  image downstream. `Catalyst.convert()` now throws a clear, specific
  error; any input parsing to zero entities and zero relations is
  likewise rejected rather than emitting a stub.

## [1.4.0] - 2026-05-16

### Changed

- Replaced the dagre layout engine with elkjs (Eclipse Layout Kernel).
  Spec-driven algorithm selection: `layered` for hierarchical C4
  (Container/Component/Deployment), `force` for hub-and-spoke Context
  diagrams. Fixes the wide-ribbon layout for Context diagrams.
- Node sizing now uses real font metrics (fontkit + bundled Liberation
  Sans) instead of fixed per-type constants.
- Connectors carry the layout engine’s routed polyline as draw.io waypoints.
- Directional hints: `Rel_U/D` honored on the layered path; `Rel_L/R`
  honored when nodes share a rank; `Lay_*` fed as layout-only constraints.
- **BREAKING**: Converted from CLI application to library for npm distribution
- Refactored layout system architecture
- Improved slide content with updated examples
- Enhanced catalyst.mts with better layout integration
- package.json configured for ES modules with proper exports and type definitions
- TypeScript configuration optimized for library builds
- Relationship connectors no longer hardcode `entryX/entryY`/`elbow`; the
  orthogonal router picks the attach side from geometry, so routing is
  direction-agnostic (TB/BT/LR/RL) instead of forcing a left-side dog-leg.
- System-family label template renders `[%c4Type%]` (C4 `System` has no
  technology parameter — no stray `[System:]`).
- `make lint` and the `make ci` lint step now also run `markdownlint`,
  matching the CI `lint` job (previously the local pipeline never checked
  markdown, so a CI-only markdownlint failure could ship).

### Added

- Structural parity test + deterministic draw.io golden snapshot gate;
  exhaustive C4-PlantUML fixture. Independently maintained (originated
  from localgod/catalyst; now substantially diverged).
- LayoutEngine class to handle graph positioning
- Enhanced CI workflow with additional testing steps
- Library API with `Catalyst.convert()`, `Catalyst.parseEntities()`, and `Catalyst.parseRelations()` methods
- `CatalystOptions` interface for configuration
- Sample usage scripts in `./sample/` folder
- TypeScript declaration files for better IDE support
- Centered logo display in README
- Use-case corpus (`tests/fixtures/corpus/`, 19 fixtures): topology
  shapes, relationship variants, C4 levels, edge cases.
- Per-fixture structural sanity gate (`tests/corpus-sanity.test.mts`):
  well-formed XML, no dropped entity, every relation an edge with
  resolved endpoints in the PUML direction, non-empty verb, no `[]`
  artifact, descriptions preserved, distinct routes for same-pair edges.
- `src/layout/edgeLanes.mts`: pure, unit-tested multi-edge lane
  separator (`tests/edge-lanes.test.mts`).
- Dual-render gallery: `make gallery` / `scripts/gallery.mjs` →
  `docs/gallery/` (source `.puml` vs catalyst `.drawio`, indexed README).
- RelParser unit tests for `RelIndex` / numeric-alias safety.
- `markdownlint-cli` pinned as an exact devDependency.

### Removed

- **BREAKING**: CLI functionality and commander dependency
- PlantUML executable dependencies (now uses server-only approach)
- Legacy LayoutConverter class
- Unused SVG utilities
- `slides/` Slidev presentation deck (standalone; not part of the
  library build, tests, or CI) and its `/slides` Dependabot entry,
  `tsconfig.json` exclude, and `mdlint --ignore slides`.
- Gitpod configuration (`.gitpod.yml` and `.gitpod/automations.yaml`) —
  it was largely slides-driven and the project does not use Gitpod.
- `.devcontainer/` (Dev Container / "Ona" Gitpod-Flex image) — same
  ecosystem as the removed Gitpod config; the project does not use
  containerized/Codespaces dev. `.vscode/` is kept (project-relevant
  editor settings, decoupled).

### Fixed

- Linting errors across the codebase
- Test suite compatibility with new layout system
- Logo rendering issue in GitHub README
- Test suite updated to work with new library API
- Relationship label lost the verb and rendered an empty `[]` when there
  was no technology; the verb is now shown bold with the technology
  bracketed below it (and omitted entirely when absent).
- `Person`/`System` (and `_Ext`/`Db`/`Queue` variants) descriptions were
  dropped: their 3rd positional argument is the *description*, not a
  technology — now preserved.
- `RelIndex($index, $from, $to, …)` produced zero edges (the leading
  index was mis-parsed); now parsed, with the leading index consumed
  only for `RelIndex*` so a numeric source alias on a plain
  `Rel`/`BiRel` is not mistaken for an index.
- Emitted XML could be invalid: a literal `&` in a label/description was
  un-escaped to a bare `&`; only genuinely double-encoded entity refs
  are now reversed.
- Antiparallel (`Rel`+`Rel_Back`) and parallel-duplicate relations
  between the same node pair rendered collinear with stacked, unreadable
  labels; each is now fanned onto its own lane (perpendicular waypoint +
  offset label). ELK's obstacle-aware polyline is preserved when it has
  real bends.
