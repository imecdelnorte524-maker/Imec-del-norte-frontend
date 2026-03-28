# Makefile

run:
	docker-compose -f docker-compose.prod.yml down -v && make prod

# --------------------
# Desarrollo
# --------------------

dev:
	docker-compose -f docker-compose.dev.yml up -d --build

dev-up:
	docker-compose -f docker-compose.dev.yml up -d

dev-down:
	docker-compose -f docker-compose.dev.yml down

dev-down-volumes:
	docker-compose -f docker-compose.dev.yml down -v

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f


# --------------------
# Producción
# --------------------

prod:
	docker-compose -f docker-compose.prod.yml build --no-cache && docker-compose -f docker-compose.prod.yml up -d --build

prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

prod-down-volumes:
	docker-compose -f docker-compose.prod.yml down -v

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f


# --------------------
# Utilidades
# --------------------

clean:
	docker system prune -f

rebuild:
	docker-compose -f docker-compose.prod.yml down --rmi all --volumes --remove-orphans
	docker-compose -f docker-compose.prod.yml up --build -d


build:
	npm run build && rm -rf dist

add:
	git add .

# Solo push
push:
	git push origin main
