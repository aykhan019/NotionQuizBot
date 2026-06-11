# Common tasks. Run `make help` to see them.
SERVER := flask-server
CLIENT := client
PY := $(SERVER)/venv/bin/python
PIP := $(SERVER)/venv/bin/pip

.DEFAULT_GOAL := help
.PHONY: help setup setup-server setup-client server client test seed eval build lint docker-up docker-down

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

setup: setup-server setup-client ## Install everything (server venv + client deps)

setup-server: ## Create the server venv and install Python deps
	python3 -m venv $(SERVER)/venv
	$(PIP) install --upgrade pip
	$(PIP) install -r $(SERVER)/requirements.txt
	@echo "Now: cp $(SERVER)/.env.example $(SERVER)/.env  and add your GEMINI_API_KEY"

setup-client: ## Install client dependencies
	cd $(CLIENT) && npm install

server: ## Run the Flask API (http://localhost:5000)
	cd $(SERVER) && venv/bin/python app.py

client: ## Run the React dev server (http://localhost:3000)
	cd $(CLIENT) && npm start

test: ## Run the backend test suite
	cd $(SERVER) && venv/bin/python -m pytest -q

seed: ## Generate a demo quiz from the bundled sample (needs GEMINI_API_KEY)
	cd $(SERVER) && venv/bin/python scripts/seed.py --num 5

eval: ## Run the quiz-quality gate on the sample (needs GEMINI_API_KEY)
	cd $(SERVER) && venv/bin/python scripts/eval_quiz.py --num 8

build: ## Production build of the client
	cd $(CLIENT) && npm run build

docker-up: ## Start the whole stack with Docker (reads .env)
	docker compose up --build

docker-down: ## Stop the Docker stack
	docker compose down
