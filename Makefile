.PHONY: dev
start: ## Start the Docker container.
	docker-compose -f docker-compose.dev.yml up --build

.PHONY: prod
start: ## Start the Docker container.
	docker-compose -f docker-compose.prod.yml up --build

.PHONY: stop
stop: ## Stop the Docker container.
	docker-compose -f docker-compose.yml down


start-dev:
	(cd client && yarn dev) & \
	(cd server && yarn start:dev)
