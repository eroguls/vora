FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages packages
RUN pnpm install --filter @vora/api... --frozen-lockfile=false
COPY apps/api apps/api
RUN pnpm --filter @vora/api... build
EXPOSE 4000
CMD ["pnpm", "--filter", "@vora/api", "start:prod"]
