# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev        # Next.js dev server
npm run build      # production build
npm run lint       # eslint (flat config, eslint-config-next)
npm test           # all tests (node:test via tsx)
npm run db:up      # docker compose up (postgres + adminer)
npm run db:down

# Run a single test file
npx tsx --experimental-test-module-mocks --test src/features/members/member-schemas.test.ts

# Prisma (client generates to src/generated/prisma — import from there or @/lib/prisma, never @prisma/client)
npx prisma migrate dev
npx prisma generate
npx prisma db seed
npx tsc --noEmit   # type check (build does not run tsc)
```

## Stack

Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, shadcn/ui (base-maia style, Base UI primitives — **not Radix**), Prisma 7 with `@prisma/adapter-pg` driver adapter on PostgreSQL, NextAuth v5 (credentials, bcryptjs), zod v4.

## Architecture

**Feature-sliced layout** — `src/features/<feature>/{actions,components,dialogs}` with thin route files in `src/app/` that mostly wire features together. Path aliases: `@/*` → `src/*` and `@features/*` → `src/features/*` (both are used interchangeably in the codebase).

Features: `auth` (NextAuth config in `lib/auth.ts`), `cash` (periods, incomes, expenses), `members`, `dashboard` (shell/sidebar).

**Server action conventions** (see `src/features/cash/actions/` for the reference implementation):
- One action per file, `"use server"` directive.
- Zod schemas live in a shared `*-schemas.ts` per feature; validate **every** input (including ids passed to getters) with `schema.safeParse` before touching Prisma.
- Read actions return a structured result interface: `{ success: boolean; data?: T; error?: string }` (e.g. `GetMembersResult`, `GetCashPeriodResult`). Components extract with `result.success ? result.data ?? fallback : fallback`. Use an **interface** (not a discriminated union) for result shapes.
- Write actions: check `session?.user?.id` from `auth()` first, wrap multi-step Prisma writes in `prisma.$transaction`, revalidate the affected path, and map Prisma error codes (P2002/P2003/P2001/P2025) to user-facing Indonesian error strings.
- Ownership: every mutation filters by `createdById` from the session — never delete/update by id alone.

**UI conventions**: components consume the structured result via optional-data props (`data?: T | null`). shadcn components in `src/components/ui/` wrap Base UI (`@base-ui/react`), where `AlertDialogAction` does **not** auto-close — dialogs are controlled (`open`/`onOpenChange` state) and closed manually in handlers. All user-facing copy is in Indonesian.

**TanStack Query (v5)**: `QueryProvider` is mounted in the root layout. Query options live in `src/features/cash/queries.ts` (`cashKeys` hierarchy `["cash", "periods", id, "summary"?]`, `cashPeriodsQuery`, `cashPeriodQuery(id)`, `cashSummaryQuery(id)`) and `src/features/members/queries.ts` (`membersQuery`). Server actions are the `queryFn`s and return the structured result as-is. The cash feature is fully migrated — mutate then `queryClient.invalidateQueries` (dialogs/tables invalidate themselves, no `onCreated` prop-drilling). New client-side fetching should use `useQuery` + `invalidateQueries`, not manual `useEffect`.

**Testing**: `node:test` + `node:assert/strict` via `tsx` with `--experimental-test-module-mocks`; dependencies (Prisma, auth) are mocked with `mock.module()` at the top of the test file before importing the action under test. Tests are colocated with the feature (e.g. `src/features/members/member-actions.test.ts`).

**Prisma**: driver-adapter pattern — the client singleton is `src/lib/prisma.ts` using `PrismaPg`. Generated types import from `@/generated/prisma/client` (namespace `Prisma`, model types like `Prisma.CashPeriodGetPayload<...>`); the schema has a custom `output` dir. Migrations live in `prisma/migrations`.
