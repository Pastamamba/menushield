# MenuShield Development Commands

.PHONY: help install dev build up down logs clean migrate seed

help: ## Show this help message
	@echo "MenuShield Development Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies for both frontend and backend
	@echo "Installing frontend dependencies..."
	pnpm install
	@echo "Installing backend dependencies..."
	cd backend && pnpm install

dev-backend: ## Start backend in development mode
	cd backend && pnpm run dev

dev-frontend: ## Start frontend in development mode  
	pnpm run dev

dev: ## Start both frontend and backend in development mode
	@echo "Starting development servers..."
	@echo "Backend will run on http://localhost:4000"
	@echo "Frontend will run on http://localhost:5176"
	@echo ""
	@echo "Run 'make dev-backend' and 'make dev-frontend' in separate terminals"

build: ## Build for production
	@echo "Building frontend..."
	pnpm run build
	@echo "Backend is ready (no build step needed)"

up: ## Start all services with Docker Compose
	docker-compose up -d
	@echo "Services started! Frontend: http://localhost:3000, Backend: http://localhost:4000"

down: ## Stop all Docker services
	docker-compose down

logs: ## Show Docker logs
	docker-compose logs -f

clean: ## Clean Docker volumes and rebuild
	docker-compose down -v
	docker-compose build --no-cache
	docker-compose up -d

migrate: ## Run database migrations
	cd backend && npx prisma migrate dev

migrate-deploy: ## Deploy migrations (production)
	cd backend && npx prisma migrate deploy

generate: ## Generate Prisma client
	cd backend && npx prisma generate

seed: ## Seed the database with sample data
	cd backend && pnpm run db:seed

reset-db: ## Reset database and reseed
	cd backend && npx prisma migrate reset --force
	cd backend && pnpm run db:seed

studio: ## Open Prisma Studio
	cd backend && npx prisma studio

# Docker database only (for local development with external frontend/backend)
db-up: ## Start only MySQL database
	docker-compose up -d mysql

db-down: ## Stop MySQL database
	docker-compose stop mysql
