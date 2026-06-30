# REGEXRIDDLE

REGEXRIDDLE is a web platform for regex-based textual riddles. This repository is structured as a Dockerized monorepo with a Django REST backend, a React + TypeScript + Tailwind frontend, PostgreSQL, and an optional nginx reverse proxy.

## Development

Copy or adapt the development environment variables:

```bash
cp env/dev.example .env
```

Start the full development stack:

```bash
docker compose up --build
```

Useful URLs:

- Frontend: http://localhost:5173
- Backend health: http://localhost:8000/api/health
- Frontend API proxy health: http://localhost:5173/api/health

Run backend checks:

```bash
docker compose exec backend python manage.py check
```

Run frontend build:

```bash
docker compose exec frontend npm run build
```

Run database migrations:

```bash
docker compose exec backend python manage.py migrate
```

## Production-oriented stack

Copy and fill the production environment template:

```bash
cp env/prod.example .env
```

Start the production-oriented stack:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

This stack runs Django behind Gunicorn, serves the built React app with nginx,
collects Django static files, applies migrations, and exposes only the edge
nginx service on `HTTP_PORT`.
