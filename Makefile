.PHONY: dev build up down migrate

dev:
	docker compose up --build -d

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

migrate:
	docker compose exec backend ./server migrate

psql:
	docker compose exec mysql mysql -uinspecthse -pinspecthsepass inspecthse

redis:
	docker compose exec redis redis-cli
