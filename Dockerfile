FROM node:20-slim
WORKDIR /app

# Install OpenSSL for Prisma engine & curl
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@9

# Copy all repository source files
COPY . .

# Install dependencies across monorepo
RUN pnpm install --no-frozen-lockfile

# Generate Prisma Client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build API application
RUN pnpm --filter @tripos/api build

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["sh", "-c", "npx prisma db push --schema=packages/database/prisma/schema.prisma --accept-data-loss && node apps/api/dist/main.js"]
