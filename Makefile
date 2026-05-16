# Catalyst — PlantUML C4 → draw.io converter.
# Tunables mirror scripts/render-compare.mjs env defaults (?= lets env/CI override).
PLANTUML_VERSION    ?= 1.2024.7
DRAWIO_EXPORT_IMAGE ?= rlespinasse/drawio-export:latest
DRAWIO_EXPORT_SCALE ?= 2
RENDER_SRC          ?= tests/fixtures/c4-exhaustive.puml
RENDER_OUT          ?= build/render-compare
CORPUS_DIR          ?= tests/fixtures/corpus
GALLERY_OUT         ?= docs/gallery

.DEFAULT_GOAL := help

.PHONY: help
help: ## List targets
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
	  | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-16s\033[0m %s\n",$$1,$$2}'

.PHONY: deps
deps: ## Install dependencies (npm ci)
	npm ci

.PHONY: build
build: ## Compile TypeScript -> dist/
	npm run build

.PHONY: lint
lint: ## oxlint src/ + markdownlint (parity with CI's lint job)
	npm run lint
	npm run mdlint

.PHONY: test
test: ## Run the full vitest suite (parity + golden + units)
	npm run test:run

.PHONY: golden-update
golden-update: ## Regenerate drawio structural snapshots after an intentional change
	npm run golden:update

.PHONY: render-compare
render-compare: build ## Visual proof: render SRC puml + catalyst drawio side-by-side (needs java+docker)
	PLANTUML_VERSION=$(PLANTUML_VERSION) \
	DRAWIO_EXPORT_IMAGE=$(DRAWIO_EXPORT_IMAGE) \
	DRAWIO_EXPORT_SCALE=$(DRAWIO_EXPORT_SCALE) \
	node scripts/render-compare.mjs "$(RENDER_SRC)" "$(RENDER_OUT)"

.PHONY: gallery
gallery: build ## Dual-render the use-case corpus into docs/gallery (needs java+docker)
	PLANTUML_VERSION=$(PLANTUML_VERSION) \
	DRAWIO_EXPORT_IMAGE=$(DRAWIO_EXPORT_IMAGE) \
	DRAWIO_EXPORT_SCALE=$(DRAWIO_EXPORT_SCALE) \
	CORPUS_DIR=$(CORPUS_DIR) \
	GALLERY_OUT=$(GALLERY_OUT) \
	node scripts/gallery.mjs

.PHONY: ci
ci: build lint test ## Local CI pipeline (build + lint + tests)
