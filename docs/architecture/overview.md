# Architecture Overview

- Monorepo with `apps/web`, `apps/api`, `apps/admin` and shared `packages/*`.
- NestJS API exposes REST, OpenAPI, auth, content, feed, search, notifications and admin endpoints.
- Prisma models social graph, content, media, moderation, notifications, messaging and analytics.
- PostgreSQL is the source of truth; Redis and BullMQ back background processing.
- MinIO provides S3-compatible media upload URLs in development.
- Next.js public pages are server-rendered for profiles and content details.
