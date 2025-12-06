.PHONY: help setup install build run stop restart clean logs test extract push pull scan dev backup validate monitor stats health

# Variables
IMAGE_NAME := indeed-dashboard
CONTAINER_NAME := indeed-dashboard
PORT := 8080
REGISTRY := ghcr.io

# Try to get username from git config, otherwise default to 'indeed-user'
GIT_USER := $(shell git config user.name | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
USERNAME := $(if $(GIT_USER),$(GIT_USER),indeed-user)

IMAGE_TAG := $(REGISTRY)/$(USERNAME)/$(IMAGE_NAME):latest

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

#===================================
# Help & Documentation
#===================================

## help: Show this help message
help:
	@echo "$(CYAN)Indeed Job Dashboard - Make Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Available targets:$(NC)"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/^## /  /' | column -t -s ':'
	@echo ""
	@echo "$(YELLOW)Examples:$(NC)"
	@echo "  make setup        # First-time setup"
	@echo "  make dev          # Run development server"
	@echo "  make test         # Run all tests"
	@echo "  make extract      # Extract Indeed data"
	@echo ""

#===================================
# Setup & Installation
#===================================

## setup: Initial project setup (first run)
setup:
	@echo "$(CYAN)Setting up project...$(NC)"
	@mkdir -p extract data backups logs tests/fixtures
	@touch extract/.gitkeep backups/.gitkeep logs/.gitkeep
	@if [ ! -f .env ]; then cp .env.example .env && echo "$(GREEN)✓ Created .env from template$(NC)"; fi
	@echo "$(YELLOW)Installing Python dependencies...$(NC)"
	@pip install -r scripts/requirements.txt || pip3 install -r scripts/requirements.txt
	@echo "$(YELLOW)Installing Node.js dependencies...$(NC)"
	@npm install
	@echo "$(GREEN)✓ Setup complete$(NC)"
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Review and customize .env file"
	@echo "  2. Place your Indeed HTML file in extract/"
	@echo "  3. Run: make extract"
	@echo "  4. Run: make dev"

## install: Install dependencies only
install:
	@echo "$(CYAN)Installing dependencies...$(NC)"
	@pip install -r scripts/requirements.txt || pip3 install -r scripts/requirements.txt
	@npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

#===================================
# Development
#===================================

## dev: Run development server (Python)
dev:
	@echo "$(CYAN)Starting development server...$(NC)"
	@echo "$(YELLOW)Opening http://localhost:8000$(NC)"
	@cd src && python3 -m http.server 8000

## dev-node: Run development server (Node.js)
dev-node:
	@echo "$(CYAN)Starting Node.js development server...$(NC)"
	@npx http-server src -p 8000 -c-1

#===================================
# Docker Operations
#===================================

## build: Build Docker image
build:
	@echo "$(CYAN)Building Docker image...$(NC)"
	@mkdir -p extract
	@docker build -t $(IMAGE_NAME) .
	@echo "$(GREEN)✓ Build complete$(NC)"

## run: Run container with docker compose
run:
	@echo "$(CYAN)Starting container...$(NC)"
	@docker compose up -d
	@sleep 3
	@echo "$(GREEN)✓ Container started at http://localhost:$(PORT)$(NC)"

## stop: Stop and remove container
stop:
	@echo "$(YELLOW)Stopping container...$(NC)"
	@docker compose down
	@echo "$(GREEN)✓ Container stopped$(NC)"

## restart: Restart container
restart: stop run

## logs: Show container logs (follow)
logs:
	@docker compose logs -f

## logs-tail: Show last 50 log lines
logs-tail:
	@docker compose logs --tail=50

## shell: Open shell in running container
shell:
	@docker exec -it $(CONTAINER_NAME) /bin/sh

#===================================
# Data Management
#===================================

## extract: Run extraction script
extract:
	@echo "$(CYAN)Running extraction script...$(NC)"
	@python3 scripts/extract_indeed_html.py
	@echo "$(GREEN)✓ Extraction complete$(NC)"

## validate: Validate JSON data files
validate:
	@echo "$(CYAN)Validating JSON files...$(NC)"
	@python3 scripts/fix_json.py
	@echo "$(GREEN)✓ Validation complete$(NC)"

## clean-data: Clean JSON data (remove extra fields)
clean-data:
	@echo "$(CYAN)Cleaning JSON data...$(NC)"
	@python3 scripts/clean_json.py
	@echo "$(GREEN)✓ Data cleaned$(NC)"

## backup: Create timestamped backup of data
backup:
	@echo "$(CYAN)Creating backup...$(NC)"
	@mkdir -p backups
	@tar -czf backups/data-$(shell date +%Y%m%d-%H%M%S).tar.gz data/ extract/
	@echo "$(GREEN)✓ Backup created in backups/$(NC)"

## backup-auto: Automatic daily backup (add to cron)
backup-auto:
	@$(MAKE) backup
	@find backups/ -name "data-*.tar.gz" -mtime +30 -delete
	@echo "$(GREEN)✓ Backup complete, old backups cleaned$(NC)"

## restore: Restore from latest backup
restore:
	@echo "$(YELLOW)Restoring from latest backup...$(NC)"
	@latest=$$(ls -t backups/data-*.tar.gz | head -1); \
	if [ -n "$$latest" ]; then \
		tar -xzf $$latest; \
		echo "$(GREEN)✓ Restored from $$latest$(NC)"; \
	else \
		echo "$(RED)✗ No backup files found$(NC)"; \
	fi

#===================================
# Testing
#===================================

## test: Run all tests
test:
	@echo "$(CYAN)Running tests...$(NC)"
	@npm test

## test-watch: Run tests in watch mode
test-watch:
	@echo "$(CYAN)Running tests in watch mode...$(NC)"
	@npm run test:watch

## test-coverage: Run tests with coverage report
test-coverage:
	@echo "$(CYAN)Running tests with coverage...$(NC)"
	@npm run test:coverage

## test-docker: Test Docker container
test-docker:
	@echo "$(CYAN)Testing container...$(NC)"
	@docker compose up -d
	@sleep 5
	@if curl -sf http://localhost:$(PORT) > /dev/null; then \
		echo "$(GREEN)✓ Health check passed$(NC)"; \
	else \
		echo "$(RED)✗ Health check failed$(NC)"; \
		docker compose logs; \
		exit 1; \
	fi
	@docker compose down
	@echo "$(GREEN)✓ Docker tests complete$(NC)"

## lint: Run Python linting
lint:
	@echo "$(CYAN)Running linters...$(NC)"
	@pip install flake8 2>/dev/null || pip3 install flake8
	@flake8 scripts/ --count --select=E9,F63,F7,F82 --show-source --statistics || true
	@echo "$(GREEN)✓ Linting complete$(NC)"

#===================================
# Docker Registry Operations
#===================================

## push: Push image to registry
push:
	@echo "$(CYAN)Pushing image to registry...$(NC)"
	@docker tag $(IMAGE_NAME) $(IMAGE_TAG)
	@docker push $(IMAGE_TAG)
	@echo "$(GREEN)✓ Push complete$(NC)"

## pull: Pull image from registry
pull:
	@echo "$(CYAN)Pulling image from registry...$(NC)"
	@docker pull $(IMAGE_TAG)
	@echo "$(GREEN)✓ Pull complete$(NC)"

#===================================
# Security & Monitoring
#===================================

## scan: Scan image for vulnerabilities
scan:
	@echo "$(CYAN)Scanning image for vulnerabilities...$(NC)"
	@docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
		aquasec/trivy image $(IMAGE_NAME)

## health: Check container health status
health:
	@echo "$(CYAN)Checking container health...$(NC)"
	@docker inspect --format='{{.State.Health.Status}}' $(CONTAINER_NAME) || echo "$(RED)Container not running$(NC)"

## stats: Show container resource usage
stats:
	@docker stats $(CONTAINER_NAME) --no-stream

## monitor: Real-time container monitoring
monitor:
	@echo "$(CYAN)Monitoring container (Ctrl+C to exit)...$(NC)"
	@watch -n 2 'docker stats $(CONTAINER_NAME) --no-stream'

## inspect: Show detailed container information
inspect:
	@docker inspect $(CONTAINER_NAME) | less

#===================================
# Cleanup Operations
#===================================

## clean: Remove container and image
clean:
	@echo "$(YELLOW)Cleaning up...$(NC)"
	@docker compose down -v
	@docker rmi $(IMAGE_NAME) 2>/dev/null || true
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

## clean-all: Deep clean (containers, images, cache)
clean-all: clean
	@echo "$(YELLOW)Deep cleaning...$(NC)"
	@docker system prune -f
	@rm -rf node_modules coverage .jest-cache
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "$(GREEN)✓ Deep clean complete$(NC)"

## prune: Remove all unused Docker resources
prune:
	@echo "$(YELLOW)Pruning Docker resources...$(NC)"
	@docker system prune -af --volumes
	@echo "$(GREEN)✓ Prune complete$(NC)"

## clean-logs: Remove old log files
clean-logs:
	@echo "$(YELLOW)Cleaning log files...$(NC)"
	@find logs/ -name "*.log" -mtime +7 -delete 2>/dev/null || true
	@echo "$(GREEN)✓ Logs cleaned$(NC)"

## clean-backups: Remove old backup files (>30 days)
clean-backups:
	@echo "$(YELLOW)Cleaning old backups...$(NC)"
	@find backups/ -name "data-*.tar.gz" -mtime +30 -delete 2>/dev/null || true
	@echo "$(GREEN)✓ Old backups removed$(NC)"

#===================================
# Utility Commands
#===================================

## update: Pull latest changes and rebuild
update:
	@echo "$(CYAN)Updating application...$(NC)"
	@git pull
	@$(MAKE) install
	@$(MAKE) build
	@$(MAKE) restart
	@echo "$(GREEN)✓ Update complete$(NC)"

## version: Show version information
version:
	@echo "$(CYAN)Version Information:$(NC)"
	@echo "Docker: $$(docker --version)"
	@echo "Python: $$(python3 --version)"
	@echo "Node: $$(node --version 2>/dev/null || echo 'Not installed')"
	@echo "Git: $$(git --version)"

## size: Show Docker image size
size:
	@echo "$(CYAN)Image sizes:$(NC)"
	@docker images | grep $(IMAGE_NAME) || echo "Image not built yet"

## port: Show running port mappings
port:
	@echo "$(CYAN)Port mappings:$(NC)"
	@docker port $(CONTAINER_NAME) 2>/dev/null || echo "Container not running"

## env: Show environment configuration
env:
	@echo "$(CYAN)Environment Configuration:$(NC)"
	@if [ -f .env ]; then cat .env | grep -v "^#" | grep -v "^$$"; else echo ".env file not found"; fi

#===================================
# CI/CD Helpers
#===================================

## ci: Run CI pipeline locally
ci: lint test test-docker
	@echo "$(GREEN)✓ CI pipeline complete$(NC)"

## release: Create a new release
release:
	@echo "$(CYAN)Creating release...$(NC)"
	@if [ -z "$(VERSION)" ]; then \
		echo "$(RED)Error: VERSION not specified. Use: make release VERSION=1.0.0$(NC)"; \
		exit 1; \
	fi
	@git tag -a v$(VERSION) -m "Release version $(VERSION)"
	@git push origin v$(VERSION)
	@echo "$(GREEN)✓ Release v$(VERSION) created$(NC)"

#===================================
# Documentation
#===================================

## docs: Generate documentation
docs:
	@echo "$(CYAN)Documentation is available in README.md$(NC)"
	@echo "$(YELLOW)Key files:$(NC)"
	@echo "  - README.md: Main documentation"
	@echo "  - DOCKER.md: Docker deployment guide"
	@echo "  - .env.example: Configuration template"

## info: Show project information
info:
	@echo "$(CYAN)═══════════════════════════════════════$(NC)"
	@echo "$(CYAN)  Indeed Job Application Dashboard$(NC)"
	@echo "$(CYAN)═══════════════════════════════════════$(NC)"
	@echo "$(GREEN)Project Structure:$(NC)"
	@echo "  • src/        - Frontend application"
	@echo "  • scripts/    - Data extraction tools"
	@echo "  • tests/      - Test suite"
	@echo "  • data/       - JSON data files"
	@echo "  • extract/    - HTML input files"
	@echo ""
	@echo "$(GREEN)Quick Start:$(NC)"
	@echo "  1. make setup"
	@echo "  2. Place HTML in extract/"
	@echo "  3. make extract"
	@echo "  4. make dev"
	@echo ""
	@echo "$(GREEN)Container Status:$(NC)"
	@docker ps -a | grep $(CONTAINER_NAME) || echo "  Not running"
	@echo ""