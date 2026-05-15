# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](http://semver.org/).

This project adheres to [Keep a CHANGELOG](http://keepachangelog.com/).

## [Unreleased]

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

### Removed

- **BREAKING**: CLI functionality and commander dependency
- PlantUML executable dependencies (now uses server-only approach)
- Legacy LayoutConverter class
- Unused SVG utilities
- Deprecated `.gitpod.yml` configuration file

### Fixed

- Linting errors across the codebase
- Test suite compatibility with new layout system
- Logo rendering issue in GitHub README
- Test suite updated to work with new library API
