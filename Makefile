.PHONY: help build run stop clean logs test extract push

# Variables
IMAGE_NAME := indeed-dashboard
CONTAINER_NAME := indeed-dashboard
PORT := 8080
REGISTRY := ghcr.io
USERNAME := $(shell git config user.name | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
IMAGE_TAG := $(REGISTRY)/$(USERNAME)/$(IMAGE_NAME):latest

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

## help: Show this help message
help:
	@echo "$(CYAN)Indeed Job Dashboard - Docker Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Available targets:$(NC)"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/^## /  /' | column -t -s ':'
	@echo ""

## build: Build Docker image
build:
	@echo "$(CYAN)Building Docker image...$(NC)"
	docker build -t $(IMAGE_NAME) .
	@echo "$(GREEN)✓ Build complete$(NC)"

## run: Run container with docker compose
run:
	@echo "$(CYAN)Starting container...$(NC)"
	docker compose up -d
	@echo "$(GREEN)✓ Container started at http://localhost:$(PORT)$(NC)"

## stop: Stop and remove container
stop:
	@echo "$(YELLOW)Stopping container...$(NC)"
	docker compose down
	@echo "$(GREEN)✓ Container stopped$(NC)"

## restart: Restart container
restart: stop run

## logs: Show container logs
logs:
	docker compose logs -f

## logs-tail: Show last 50 log lines
logs-tail:
	docker compose logs --tail=50

## test: Run health check on container
test:
	@echo "$(CYAN)Testing container...$(NC)"
	@docker compose up -d
	@sleep 5
	@if curl -sf http://localhost:$(PORT) > /dev/null; then \
		echo "$(GREEN)✓ Health check passed$(NC)"; \
	else \
		echo "$(RED)✗ Health check failed$(NC)"; \
		exit 1; \
	fi
	@docker compose down

## extract: Run extraction script inside container
extract:
	@echo "$(CYAN)Running extraction script...$(NC)"
	docker exec $(CONTAINER_NAME) python3 /app/scripts/extract_indeed_html.py
	docker cp $(CONTAINER_NAME):/app/data/indeed-applications.json ./data/
	@echo "$(GREEN)✓ Extraction complete$(NC)"

## shell: Open shell in running container
shell:
	docker exec -it $(CONTAINER_NAME) /bin/sh

## clean: Remove container, image, and volumes
clean:
	@echo "$(YELLOW)Cleaning up...$(NC)"
	docker compose down -v
	docker rmi $(IMAGE_NAME) 2>/dev/null || true
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

## prune: Remove all unused Docker resources
prune:
	@echo "$(YELLOW)Pruning Docker resources...$(NC)"
	docker system prune -af --volumes
	@echo "$(GREEN)✓ Prune complete$(NC)"

## stats: Show container resource usage
stats:
	docker stats $(CONTAINER_NAME)

## inspect: Show detailed container information
inspect:
	docker inspect $(CONTAINER_NAME)

## push: Push image to registry
push:
	@echo "$(CYAN)Pushing image to registry...$(NC)"
	docker tag $(IMAGE_NAME) $(IMAGE_TAG)
	docker push $(IMAGE_TAG)
	@echo "$(GREEN)✓ Push complete$(NC)"

## pull: Pull image from registry
pull:
	@echo "$(CYAN)Pulling image from registry...$(NC)"
	docker pull $(IMAGE_TAG)
	@echo "$(GREEN)✓ Pull complete$(NC)"

## scan: Scan image for vulnerabilities
scan:
	@echo "$(CYAN)Scanning image...$(NC)"
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
		aquasec/trivy image $(IMAGE_NAME)

## dev: Run in development mode with live reload
dev:
	@echo "$(CYAN)Starting development mode...$(NC)"
	docker run -d \
		--name $(CONTAINER_NAME)-dev \
		-p $(PORT):80 \
		-v $(PWD)/src:/usr/share/nginx/html \
		-v $(PWD)/data:/usr/share/nginx/html/data \
		$(IMAGE_NAME)
	@echo "$(GREEN)✓ Development server started at http://localhost:$(PORT)$(NC)"

## backup: Backup data directory
backup:
	@echo "$(CYAN)Creating backup...$(NC)"
	tar -czf backup-$(shell date +%Y%m%d-%H%M%S).tar.gz data/ extract/
	@echo "$(GREEN)✓ Backup created$(NC)"

## update: Pull latest changes and rebuild
update:
	@echo "$(CYAN)Updating application...$(NC)"
	git pull
	$(MAKE) build
	$(MAKE) restart
	@echo "$(GREEN)✓ Update complete$(NC)"