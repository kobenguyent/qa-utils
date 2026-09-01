.PHONY: help setup setup-quick setup-clean dev start build build-all test test-all lint clean

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "============================================================"
	@echo "🚀 KobeanQAUtils — Makefile"
	@echo "============================================================"
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

setup: ## Full one-command repository setup (root + api + cli + mcp-server)
	npm run setup

setup-quick: ## Quick setup for web app development only
	npm run setup:quick

setup-clean: ## Clean reinstall: remove all node_modules and reinstall
	npm run setup:clean

dev: ## Start Vite development server for web app
	npm run dev

start: ## Alias for make dev
	npm start

build: ## Build the root web application
	npm run build

build-all: ## Build Web app, REST API, CLI, and MCP server
	npm run build:all

test: ## Run unit tests with Vitest
	npm test

test-all: ## Run all tests across root, API, CLI, and MCP server
	npm run test:all

lint: ## Run ESLint code checks
	npm run lint

clean: ## Clean build artifacts and caches
	rm -rf dist dist-ssr docs/.vitepress/dist api/dist cli/dist mcp-server/dist release out build coverage
