FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages packages
RUN pnpm install --filter @vora/web... --frozen-lockfile=false
COPY apps/web apps/web
RUN pnpm --filter @vora/web... build
EXPOSE 3000
CMD ["pnpm", "--filter", "@vora/web", "start"]
