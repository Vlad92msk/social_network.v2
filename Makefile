SHELL := /bin/bash

.PHONY: dev prod stop start-dev copy-env

# Копирование VITE переменных из корневого .env в client_react/.env
copy-env:
	@echo "Copying Firebase environment variables to client_react..."
	@if [ -f .env ]; then \
		echo "NODE_ENV=development" > client_react/.env; \
		grep '^VITE_' .env >> client_react/.env || echo "No VITE_ variables found"; \
		echo "✅ Environment variables copied to client_react/.env"; \
		cat client_react/.env; \
	else \
		echo "❌ Error: .env file not found in root directory"; \
		exit 1; \
	fi

dev: copy-env ## Start the Docker container in dev mode.
	docker-compose -f docker-compose.dev.yml up --build

prod: copy-env ## Start the Docker container in prod mode.
	docker-compose -f docker-compose.prod.yml up --build

stop: ## Stop the Docker container.
	docker-compose -f docker-compose.yml down

start-dev: copy-env ## Start development servers locally
	@echo "🚀 Starting development servers..."
	@echo "📱 Server will start on http://localhost:3001"
	@echo "🌐 React client will start on http://localhost:3000"
	@(source ~/.nvm/nvm.sh && cd server && nvm use 20.9.0 && yarn start:dev) & \
	(source ~/.nvm/nvm.sh && cd client_react && nvm use 20.9.0 && yarn dev)

# Проверка переменных окружения
check-env: ## Check environment variables
	@echo "🔍 Checking environment variables..."
	@if [ -f .env ]; then \
		echo "✅ Root .env exists"; \
		grep -E '^VITE_' .env || echo "⚠️  No VITE_ variables in root .env"; \
	else \
		echo "❌ Root .env not found"; \
	fi
	@if [ -f client_react/.env ]; then \
		echo "✅ Client .env exists"; \
		echo "📄 Client .env contents:"; \
		cat client_react/.env; \
	else \
		echo "❌ Client .env not found"; \
	fi
