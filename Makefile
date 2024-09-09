SHELL := /bin/bash

.PHONY: dev prod stop start-dev

dev: ## Start the Docker container in dev mode.
	docker-compose -f docker-compose.dev.yml up --build

prod: ## Start the Docker container in prod mode.
	docker-compose -f docker-compose.prod.yml up --build

stop: ## Stop the Docker container.
	docker-compose -f docker-compose.yml down

start-dev:
	@echo "Starting development servers..."
	@(source ~/.nvm/nvm.sh && cd client && nvm use 20.9.0 && yarn dev) & \
	(source ~/.nvm/nvm.sh && cd server && nvm use 20.9.0 && yarn start:dev)
