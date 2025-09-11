# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](http://semver.org/).

This project adheres to [Keep a CHANGELOG](http://keepachangelog.com/)

## [Unreleased]

### Added
- Support for Dagre layout engine for automatic graph layout
- New LayoutEngine class to handle graph positioning
- Enhanced CI workflow with additional testing steps
- Library API with `Catalyst.convert()`, `Catalyst.parseEntities()`, and `Catalyst.parseRelations()` methods
- `CatalystOptions` interface for configuration
- Sample usage scripts in `./sample/` folder
- TypeScript declaration files for better IDE support
- Centered logo display in README

### Changed
- **BREAKING**: Converted from CLI application to library for npm distribution
- Refactored layout system architecture
- Improved slide content with updated examples
- Enhanced catalyst.mts with better layout integration
- Updated package dependencies for Dagre support
- Package.json configured for ES modules with proper exports and type definitions
- TypeScript configuration optimized for library builds

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
