# WhiteMerce

Full-stack e-commerce monorepo pairing an **Astro 7** edge storefront with a **Next.js 16** API backend and merchant admin dashboard, backed by **PostgreSQL 18** and **Drizzle ORM**.

## Workspace Structure

- `apps/storefront` — Astro 7 (`output: 'server'`), React 19 Islands, Tailwind CSS v4, Nanostores (`cart` + `USD`/`IDR` currency switcher), React Hook Form + Zod, `@astrojs/cloudflare` (and `@astrojs/node` standalone auto-selected under Bun)
- `apps/web` — Next.js 16 App Router, Drizzle ORM (`postgres`), NextAuth v5 (`proxy.ts`), Stripe & Dev Checkout, Zustand Admin UI
- `packages/shared` — Shared Zod v4 schemas, domain DTO types, multi-currency `USD` (default) / `IDR` money utilities, and typed API client

## Quick Start (Local PostgreSQL 18 First)

1. Ensure local **PostgreSQL Server 18** (`postgresql-x64-18`) is running on `localhost:5432` and create database `whitemerce`.
2. Copy `.env.example` to `.env` (and set your local PostgreSQL credentials in `DATABASE_URL`).
3. Install dependencies and initialize the database:
   ```powershell
   pnpm install
   pnpm db:push
   pnpm db:seed
   ```
4. Start both apps concurrently:
   ```powershell
   pnpm dev
   ```
   - Storefront: `http://localhost:4321`
   - Backend API & Admin: `http://localhost:3000/admin` (seeded dev credentials: `admin@whitemerce.local` / `Admin123!`)

## Switching to Docker Later

When you are ready to run PostgreSQL (or the full stack) in Docker:
```powershell
pnpm db:docker:up
```
By default `docker-compose.yml` binds Docker Postgres to port `5433` (`DOCKER_POSTGRES_PORT`) to avoid conflicting with local PostgreSQL 18 on `5432`.

## Verification Commands

```powershell
pnpm turbo test
pnpm turbo typecheck lint build
```

## Running with Bun Runtime

Every workspace package also supports running directly with **Bun**:

```powershell
bun install          # or use existing node_modules installed via pnpm
bun run db:push:bun
bun run db:seed:bun
bun run dev:bun      # starts Next.js (:3000) + Astro storefront (:4321) concurrently
```

For tests and production builds/servers in Bun:

```powershell
bun run test:bun
bun run build:bun
bun run start:bun    # runs Next.js standalone (:3000) + Astro standalone (:4321); set a non-dev AUTH_SECRET
```

Under Bun (`process.versions.bun`), `apps/storefront/astro.config.mjs` automatically switches from `@astrojs/cloudflare` (`workerd`) to `@astrojs/node` (`mode: "standalone"`), and helper scripts in `apps/storefront/scripts/` + `apps/web/scripts/` launch Astro/Next standalone servers directly inside Bun. Node/`pnpm` builds continue targeting `@astrojs/cloudflare` unless overridden with `ASTRO_ADAPTER=node|cloudflare`.
