FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY packages packages
RUN pnpm install --filter @vora/admin... --frozen-lockfile=false
COPY apps/admin apps/admin
RUN pnpm --filter @vora/admin... build
EXPOSE 3002
CMD ["pnpm", "--filter", "@vora/admin", "start"]
