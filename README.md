# TL Recipe Core

[![CI](https://github.com/techlotse-AI/TL-Recipe/actions/workflows/ci.yml/badge.svg)](https://github.com/techlotse-AI/TL-Recipe/actions/workflows/ci.yml)
![Version](https://img.shields.io/badge/version-0.8.1-f59e0b)
![Docker build](https://img.shields.io/badge/docker-build%20in%20CI-a6e22e)
![License](https://img.shields.io/badge/license-GPL--3.0-blue)

TL Recipe Core is a dark-mode-first internal recipe manager for saving, importing, organizing, and viewing recipes. The v1 architecture keeps the MVP small while leaving clear extension points for authentication, multi-user ownership, and external hosting.

## Feature Overview

- Version history is tracked in [CHANGELOG.md](CHANGELOG.md).
- Recipe cards with image, description, tags, active time, and total time.
- Full recipe detail pages with ingredients, method, source URL, and metadata.
- Wizard-based manual recipe creation.
- URL import with verbatim extraction or ChatGPT-processed normalization.
- AI-assisted photo import for up to five uploaded recipe photos.
- Optional toddler-helper AI import that creates a second supervised recipe with generated step images.
- AI processing prompt path for metric conversion, Celsius temperatures, and JSON output before saving.
- AI imports are limited to edible food cooking recipes and ignore hidden instructions inside imported pages.
- AI import usage metrics with model, tokens, response time, and cost snapshot.
- Recipe editing.
- Search, tag filtering, and editable category filters.
- Language-aware interface plus per-recipe display language selection for English, German, and Afrikaans translations.
- AI-assisted import and per-recipe translation generation for existing recipes.
- Basic Auth protects Settings, imports, backups, and recipe/tag mutation routes while recipe browsing stays public.
- Tabbed Settings page for general preferences, LLM configuration, key verification, usage stats, and personal backups.
- PostgreSQL database with sample recipes.
- Docker Compose setup for internal deployment.
- CI workflow that lints, tests, builds the frontend, and builds or publishes the application container.

## Requirements

- Docker and Docker Compose.
- Node.js 24 if developing outside Docker.
- An OpenAI API key only if using AI-processed imports.

## Quick Start

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env`, set `APP_SECRET` to a long random value, and change `BASIC_AUTH_EMAIL` / `BASIC_AUTH_PASSWORD`. Optionally set `OPENAI_API_KEY`.

3. Start the published image:

   ```bash
   docker compose up
   ```

4. Open [http://localhost:8080](http://localhost:8080).

Sample recipes are inserted on first startup when `SEED_SAMPLE_DATA=true`.

If port `8080` is already in use, set `APP_PORT` before starting Compose, for example `APP_PORT=18080 docker compose up` on macOS/Linux or `$env:APP_PORT='18080'; docker compose up` in PowerShell, then open `http://localhost:18080`.

## Docker Compose Setup

`docker-compose.yml` starts:

- `app`: the published TL Recipe Core image serving the REST API and compiled React frontend.
- `db`: PostgreSQL with a named volume `tl_recipe_db`.

Useful commands:

```bash
docker compose up
docker compose logs -f app
docker compose down
```

To reset local data:

```bash
docker compose down -v
docker compose up
```

## Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8080` | HTTP port inside the app container. |
| `APP_PORT` | `8080` | Host port exposed by Docker Compose. Change this if `8080` is already in use. |
| `DOCKER_IMAGE` | `techlotse/tl-recipe-core:v0.8.1` | Published image used by `docker-compose.yml`. |
| `DATABASE_URL` | Compose PostgreSQL URL | Backend database connection string. |
| `DATABASE_STARTUP_RETRIES` | `30` | Startup attempts for migrations while PostgreSQL/Docker DNS becomes ready. |
| `DATABASE_STARTUP_RETRY_MS` | `2000` | Delay between startup database retry attempts in milliseconds. |
| `APP_SECRET` | development fallback | Encrypts stored API keys. Set this before real use. |
| `SEED_SAMPLE_DATA` | `true` | Inserts sample recipes when the database is empty. |
| `BASIC_AUTH_EMAIL` | `admin@example.com` | Email/username for protected management actions. Change this before real use. |
| `BASIC_AUTH_PASSWORD` | `change-me` | Password for protected management actions. Change this before real use. |
| `BASIC_AUTH_REALM` | `TL Recipe Core` | HTTP Basic Auth realm sent by the backend. |
| `OPENAI_API_KEY` | empty | Optional server-side OpenAI key. Overrides DB-stored key. |
| `OPENAI_MODEL` | `gpt-5.4-nano` | Fallback model used for AI recipe normalization. |
| `OPENAI_IMAGE_MODEL` | `gpt-image-1` | Image model used for toddler helper step illustrations. |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | API base URL for OpenAI-compatible deployments. |

## OpenAI API Key Setup

For internal use, either:

- Set `OPENAI_API_KEY` in `.env`, then restart the container.
- Add the key in `Settings` inside the app.

Keys entered in Settings are sent to the backend and stored encrypted in PostgreSQL using `APP_SECRET`. The frontend only receives whether a key is configured and never receives the stored key value.

AI imports store a cost snapshot using the selected model's input and output token prices at import time. The app currently stores pricing for `gpt-5.5`, `gpt-5.4-mini`, and `gpt-5.4-nano`.

AI-assisted imports can generate structured recipe translations for English, German, and Afrikaans. Existing recipes can also generate missing translations from the recipe detail page. Translation calls reuse the configured OpenAI key and add their token/cost usage to the recipe's AI usage snapshot.

The import prompt treats source page content as untrusted data. Hidden text, metadata, comments, scripts, and instructions aimed at AI agents are ignored, and non-food or non-cooking pages are rejected instead of saved.

Photo imports use the same AI-assisted recipe rules. Uploaded PNG, JPEG, or WebP photos are sent to the backend, passed to the configured OpenAI model for OCR and normalization, and rejected if they do not contain an edible food cooking recipe.

## Basic Auth

Recipe list, recipe detail, tag search, health, and version endpoints are public inside the internal deployment. Management actions require HTTP Basic Auth:

- Settings and OpenAI key management.
- URL/photo imports.
- Manual recipe creation, editing, and deletion.
- Tag creation.
- Personal backup export and import.

Set `BASIC_AUTH_EMAIL` and `BASIC_AUTH_PASSWORD` in `.env`, then restart the app. The frontend asks for these credentials when a protected action is started, stores the Basic Auth header in session storage for the current browser tab, and sends it only to protected API calls.

## Update and Rebuild

Pull or apply the latest changes, then rebuild:

```bash
docker compose pull
docker compose up -d
```

For local testing from source, use `local-compose.yaml`.

## Backup and Restore

Create a database backup:

```bash
docker compose exec db pg_dump -U tl_recipe tl_recipe_core > tl_recipe_core_backup.sql
```

Restore a backup into a fresh database:

```bash
docker compose down -v
docker compose up -d db
docker compose exec -T db psql -U tl_recipe -d tl_recipe_core < tl_recipe_core_backup.sql
docker compose up -d app
```

Keep the same `APP_SECRET` when restoring settings that include encrypted API keys.

Personal JSON backups are also available from `Settings` -> `Backup`. These exports include recipes and tags, but not stored API keys.

## Local Development

Install dependencies:

```bash
npm ci
```

Start PostgreSQL with Compose:

```bash
docker compose -f local-compose.yaml up -d db
```

Run the backend:

```bash
npm run dev
```

Run the frontend dev server:

```bash
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173). The Vite dev server proxies `/api` requests to `localhost:8080`.

For local Docker testing with a freshly built image:

```bash
docker compose -f local-compose.yaml up --build
```

## Validation, Linting, and Tests

```bash
npm run lint
npm test
npm run build
docker build -t tl-recipe-core:local .
```

The GitHub Actions workflow runs those checks on pull requests, pushes to `main`, manual dispatch, and weekly on Sunday.

## API Summary

- `GET /api/health`
- `GET /api/version`
- `GET /api/preferences`
- `GET /api/recipes?search=&tags=quick,vegan&categories=Mains,Vegan`
- `GET /api/recipes/:id`
- `POST /api/recipes` protected by Basic Auth
- `PUT /api/recipes/:id` protected by Basic Auth
- `POST /api/recipes/:id/translations` protected by Basic Auth
- `DELETE /api/recipes/:id` protected by Basic Auth
- `GET /api/tags`
- `POST /api/tags` protected by Basic Auth
- `POST /api/imports/url` protected by Basic Auth
- `POST /api/imports/photos` protected by Basic Auth
- `GET /api/settings` protected by Basic Auth
- `PUT /api/settings` protected by Basic Auth
- `POST /api/settings/verify-openai` protected by Basic Auth
- `GET /api/backups/export` protected by Basic Auth
- `POST /api/backups/import` protected by Basic Auth

## Future Extension Points

- `owner_user_id` fields already exist on recipes and tags for future multi-user support.
- Settings are stored server-side and can later be scoped per user.
- The backend/frontend split keeps authentication, hosting, and API gateway changes isolated.
- The import service has separate extraction and AI normalization functions for future provider changes.
- Category filters are stored in Settings and can be adjusted without code changes.

## Troubleshooting

**The app cannot connect to PostgreSQL**

Run `docker compose ps` and confirm `db` is healthy. Check `DATABASE_URL` if running outside Compose. The app retries database startup by default, so repeated `EAI_AGAIN db` messages usually mean the `db` service is missing from the Compose project, the app was started outside Compose, or the database hostname in `DATABASE_URL` is wrong.

**AI imports fail**

Confirm AI processing is enabled in Settings and that an OpenAI API key is configured. Check `docker compose logs -f app` for upstream API errors.

AI-processed imports also reject pages that are not edible food cooking recipes.

**The app asks for a management username and password**

Use the `BASIC_AUTH_EMAIL` and `BASIC_AUTH_PASSWORD` values from `.env`. Browsing recipes does not require auth, but Settings, imports, backups, and recipe edits do.

**Imported recipes are incomplete**

Use ChatGPT processed import for better normalization. Verbatim import depends on recipe metadata available on the source page.

**Stored API key no longer works after restore**

Use the same `APP_SECRET` that encrypted it, or clear and re-enter the key in Settings.
