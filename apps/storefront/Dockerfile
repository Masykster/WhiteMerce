FROM node:24-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/storefront/package.json apps/storefront/package.json
RUN pnpm install --frozen-lockfile --filter @whitemerce/storefront...

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/storefront/node_modules ./apps/storefront/node_modules
COPY packages/shared ./packages/shared
COPY apps/storefront ./apps/storefront
COPY tsconfig.base.json ./
RUN pnpm --filter @whitemerce/storefront build

FROM node:24-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/storefront ./
EXPOSE 4321
CMD ["pnpm", "exec", "wrangler", "dev", "--ip", "0.0.0.0", "--port", "4321"]
