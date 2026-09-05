FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @tripos/database exec prisma generate --schema=packages/database/prisma/schema.prisma
RUN pnpm --filter @tripos/api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000

COPY --from=builder /app /app

EXPOSE 10000

CMD ["sh", "-c", "pnpm --filter @tripos/database exec prisma db push --schema=packages/database/prisma/schema.prisma --accept-data-loss && node apps/api/dist/main.js"]
