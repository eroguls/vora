# Vora

Vora is a monorepo MVP for a single global feed, automatic content classification, public profiles and semantic-like global search.

## Architecture

- `apps/web`: Next.js App Router web app with responsive global feed, create flow, profile and content detail pages.
- `apps/api`: NestJS REST API with Swagger, Prisma, auth, content, feed, search, social graph, notifications, messaging, moderation and admin endpoints.
- `apps/admin`: separate Next.js admin app under `/admin` with dashboard and operational resource pages.
- `packages/content-engine`: rule-based classifier, AI adapter fallback, feed and search scoring.
- `packages/types`, `packages/validation`, `packages/config`, `packages/api-client`, `packages/ui`: shared contracts, Zod schemas, env validation, API client and UI primitives.
- `docker-compose.yml`: PostgreSQL, Redis, MinIO, Mailpit, API, web and admin services.

## Working MVP Features

- Email/password register, login, refresh-token rotation, logout and password reset token flow.
- Public profiles at `/@username` with SEO metadata and JSON-LD Person schema.
- Permanent content URLs at `/@username/content-slug` and ID fallback at `/content/:id`.
- One create screen with text, optional title, multiple media files, presigned upload, progress, previews, ordering, draft and publish.
- Automatic content classification into short text, photo, gallery, short video, long video, article, audio or mixed.
- Single global feed with mixed renderers and cursor pagination.
- Content-specific detail layouts for long video, article, short video and standard social posts.
- Like, unlike, comment, follow, unfollow, bookmark, unbookmark, share and report APIs.
- Notifications center with read-all action.
- One-to-one messaging API and UI shell with block checks.
- PostgreSQL-backed search over content, users, profiles and locations with documented scoring.
- Admin RBAC endpoints and admin app pages for dashboard, users, content, reports, moderation, media, jobs, search, settings and audit logs.
- Seed script creates 25 users, 60 mixed contents, follows, likes, comments, notifications, searches and moderation cases.

## Local Setup

Docker Desktop must be installed and running for the default PostgreSQL, Redis, MinIO and Mailpit setup. If `docker` is not recognized in PowerShell, install Docker Desktop for Windows, restart PowerShell, then run the commands again.

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres redis minio mailpit
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

After the first setup, use only the daily startup commands below. Do not run seed on every startup.

```bash
docker compose up -d postgres redis minio mailpit
pnpm dev
```

Without Docker, install PostgreSQL manually and set `DATABASE_URL` in `.env` to your local database before running migration and seed:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/vora?schema=public
```

Full Docker stack:

```bash
cp .env.example .env
docker compose up --build
```

## URLs

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Swagger: `http://localhost:4000/docs`
- Admin: `http://localhost:3002/admin`
- MinIO console: `http://localhost:9001`
- Mailpit: `http://localhost:8025`

## Demo Accounts

- User: `demo@vora.local` / `Password123!`
- Admin: `admin@vora.local` / `Admin123!`

## Verification Run

- `pnpm install`: passed.
- `pnpm prisma:generate`: passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed with Next.js deprecation notice for `next lint`, no lint errors.
- `pnpm test`: passed, including classifier and feed ranking unit tests.
- `pnpm build`: passed for shared packages, API, web and admin.
- `docker --version`: failed because Docker is not installed in this machine, so PostgreSQL-backed migration and seed execution were not run locally here.

## Database

- Prisma schema: `apps/api/prisma/schema.prisma`.
- Seed data: `apps/api/prisma/seed.ts`.
- Migration command: `pnpm prisma:migrate` after PostgreSQL is running.
- Safe seed command: `pnpm prisma:seed` after migration. It skips automatically if users already exist.
- Destructive demo reset: `pnpm prisma:seed:reset`. This wipes existing app data and recreates demo accounts.
- Avoid `docker compose down -v` unless you intentionally want to delete the PostgreSQL and MinIO volumes.

## Remaining Production Work

- Run and verify DB migration/seed on a machine with Docker or PostgreSQL installed.
- Add real FFmpeg/Sharp BullMQ workers for durable thumbnail/transcript metadata processing.
- Add Google OAuth provider credentials and external translation provider when available.
- Expand Playwright e2e coverage after the Docker stack is running.
- Replace PostgreSQL search implementation with OpenSearch adapter when scale requires it.
