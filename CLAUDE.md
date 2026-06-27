# CLAUDE.md

hivePOS — Kasir Laundry Ringan di Browser untuk UMKM.
Next.js 16 App Router, React 19, Prisma 7 (PostgreSQL), NextAuth v5, Tailwind 4,
Vitest, Playwright. Bilingual (`en` + `id`). Dev port **3007**.

## Quick start

```bash
npm install
npm run db:push        # apply schema (no migrations folder)
npm run db:seed        # demo tenant + plans + super-admin
npx tsx prisma/seed-flags.ts   # idempotent flag upsert (15 flags)
npm run dev            # http://localhost:3007
```

Test / verify before shipping:
```bash
npx tsc --noEmit       # 0 errors
npm run build          # route manifest includes new routes
npm test               # vitest
npx playwright test    # e2e
```

## Stack at a glance

| Tech | Version | Purpose |
|---|---|---|
| Next.js | 16.1.6 | App Router, server components, API routes. Standalone output. |
| React | 19.2.3 | UI runtime |
| TypeScript | 5.7.0 | Strict, `@/*` path alias |
| Prisma | 7.5.0 | ORM + `@prisma/adapter-pg` (PostgreSQL 17) |
| NextAuth | 5.0.0-beta.31 | credentials + Google OAuth, JWT strategy |
| Tailwind | 4.1.0 | `@tailwindcss/postcss` |
| Vitest | 4.1.9 | Unit tests, 80% coverage threshold |
| Playwright | 1.60.0 | E2E, baseURL `localhost:3007` |
| Zod | ^4.3.6 | Body / form validation |
| Midtrans | ^1.4.3 | Payment gateway (Snap.js) |
| Sonner | ^2.0.7 | Toasts |
| Recharts | ^3.8.1 | Charts |

## Non-negotiables

These rules exist because breaking them has caused real bugs. Verify each before claiming a task is done.

1. **Every tenant-scoped query filters by `tenantId` from the session.** Never trust client-supplied `tenantId` — always use `ctx.tenantId` from the permission guard. Inside `prisma.$transaction`, pass it explicitly to every `create`.
2. **Every super-admin mutation writes an `auditLog` row** in the same `prisma.$transaction`. Action namespaced `<domain>.<verb>` (e.g. `tenant.suspend`, `billing.refund`).
3. **Every feature ships behind a flag.** Default `enabled: true`. Add to `FLAG_KEYS` + `prisma/seed-flags.ts` + seed the DB.
4. **Every user-facing string goes through `t("key")`** with entries in **both** `en` and `id` in `lib/i18n.ts`. No interpolation — use manual `.replace("{name}", value)`.
5. **Every new RBAC check needs the resource declared** in `lib/permissions/definitions.ts` (`RESOURCES` + `RESOURCE_ACTIONS` + `RESOURCE_LABELS`).
6. **Mark deliberate shortcuts** with `// ponytail: <ceiling> — <upgrade path>`. These regenerate `PONYTAIL-DEBT.md`.
7. **Sidebar filter rule**: both `hasFlag(item.flag) AND can(item.resource, item.action)` must remain. Removing either breaks DRY gating.
8. **If touching `lib/auth.ts` jwt callback**: feature flags must resolve in all paths — credentials login, Google OAuth, session refresh, impersonation swap.

## Brand voice & positioning

**One-liner**: Kasir laundry ringan di browser, untuk UMKM Indonesia.

**Primary slogan**: "Kasir laundry, tinggal buka browser."

### Positioning
- **Target**: UMKM laundry (1-5 outlets, owner-operated). NOT big laundry chains.
- **Differentiator**: browser-native, no install, transparent per-outlet pricing.
- **Reference brand**: Shopify (lightweight, practical-but-aspirational, "anyone can start").
- **Anti-patterns we don't follow**: heavy iPad POS apps (Moka-style), all-in-one suites (Majoo-style), Android-hardware bundles (Qasir-style).

### Voice rules
1. **Bahasa Indonesia, casual-professional.** "Anda" for CTAs, casual for marketing lines.
2. **No buzzwords.** "Dashboard real-time" ok. "AI-powered synergy" not ok.
3. **Concrete > abstract.** "2 menit" not "cepat". "Rp 49K/outlet" not "terjangkau".
4. **UMKM-friendly.** Avoid English-only phrases. Avoid jargon unless explained inline.
5. **Dogfooding is proof, not lead.** "Dibuat dan dipakai sendiri di laundry kami" is a supporting badge under the hero — not the hero itself.
6. **Anti-bloat is implicit.** Frame as "tanpa ribet", "tanpa install", "tanpa kontrak mahal". Never name competitors.
7. **Indonesian context is native.** Pickup, kiloan, QRIS, e-wallet, WhatsApp — these are not exotic, they're the default.

### Do
- Lead with browser-native + UMKM-laundry
- Use concrete numbers (2 menit, Rp 49K, 1 outlet gratis)
- Show honest proof (dogfooding, transparent pricing, real stats)

### Don't
- Pretend to be enterprise ("platform", "solution", "ecosystem")
- Use hype words ("revolusioner", "game-changer", "next-gen")
- Promise features we don't have (offline mode, hardware bundles)
- Bash competitors by name
- Lead with the dogfooding backstory — it's supporting proof, not the hook

## Doc map

| File | Read when… |
|---|---|
| `docs/architecture.md` | You need to understand how the app is wired (auth, session, Prisma, modules). |
| `docs/features.md` | You're looking for "where does X live?" — every route, module, API group. |
| `docs/preferences.md` | Before writing any code — code style, what NOT to build, definition of done, git conventions. |
| `docs/sop/api-routes.md` | Adding or modifying an API route. Most-referenced SOP. |
| `docs/sop/frontend.md` | Building a page, wiring a client component, editing the sidebar. |
| `docs/sop/feature-flags.md` | Adding or gating a feature flag. |
| `docs/sop/rbac.md` | Adding a new RBAC resource or changing permissions. |
| `docs/sop/data.md` | Editing Prisma schema, running seeds, writing tests. |
| `docs/sop/super-admin.md` | Building anything in the `/super-admin` panel. |
| `PONYTAIL-DEBT.md` | You want to see the current shortcut ledger. Don't duplicate — regenerate with the grep command in `docs/preferences.md`. |
| `DYNAMIC_FORMS.md` | You're working with dynamic form schemas. |

## Common file map (most-edited)

| File | What |
|---|---|
| `lib/auth.ts` | NextAuth config — jwt/session callbacks, providers, impersonation |
| `lib/prisma.ts` | PrismaClient singleton |
| `lib/feature-flags.ts` | `FLAG_KEYS`, `resolveAllFlags`, `resolveFlag` |
| `lib/require-feature-flag.ts` | `requireFeatureFlag`, `hasFeatureFlag` |
| `lib/permissions/definitions.ts` | RESOURCES, ACTIONS, RESOURCE_ACTIONS, RESOURCE_LABELS, `hasPermission` |
| `lib/permissions/check.ts` | `requireWithBranchOrThrow`, `requirePermissionOrThrow` |
| `lib/permissions/defaults.ts` | Default system roles (Owner / Manager / Kasir / Staff) |
| `lib/super-admin/permissions.ts` | `requireSuperAdminPanelSession`, `assertSuperAdminOrThrow` |
| `lib/audit.ts` | `auditLog(tx, input)` writer |
| `lib/i18n.ts` | `en` + `id` translations (~400 keys, flat dot-notation) |
| `modules/shared/` | Errors, http wrappers, logging, domain — `import { X } from "@/modules/shared"` |
| `components/layout/app-sidebar.tsx` | Tenant sidebar (4 buckets, flag + permission gated) |
| `components/layout/super-admin-sidebar.tsx` | Super-admin sidebar (3 groups) |
| `hooks/use-translation.ts`, `hooks/use-permissions.ts`, `hooks/use-feature-flag.ts` | Client hooks |
| `prisma/schema.prisma` | Schema (use `db:push`, not `migrate dev`) |
| `prisma/seed.ts`, `prisma/seed-flags.ts` | Seed scripts |
| `middleware.ts` | Edge middleware — subdomain routing, bearer→cookie rewrite |
| `instrumentation.ts` | Server boot — registers ErrorLog writer |

## Conventions summary

- **API envelope**: `{ success: true, data, meta? }` via `apiSuccess` / `apiCreated`. Errors via throw — never build error responses manually.
- **`ctx!.params`** in dynamic route handlers (typed optional by `withErrorHandler`).
- **Tenant + branch filter pattern**: `{ tenantId: ctx.tenantId, ...(ctx.isAllOutlets ? {} : { branchId: ctx.branchId }) }`.
- **Module selector**: tenant dashboard switches between `laundry` / `fnb` / `salon` via `MODULE_META`.
- **ALL-outlets mode**: `branchId === "ALL"` → sidebar hides module nav, API drops `branchId` filter.
- **Decimal serialization**: use `modules/shared/serialization` helpers. Don't `.toString()` ad-hoc.
- **i18n**: dot-notation keys (`section.entity.field`), no interpolation. Locale-aware dates via `toLocaleString(lang === "id" ? "id-ID" : "en-US")`.
- **`ponytail:`** comments mark every deliberate shortcut. Regenerate ledger:
  ```bash
  grep -rnE '(#|//) ?ponytail:' . \
    --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next \
    --exclude-dir=coverage --exclude-dir=test-results
  ```

## Git conventions

- **Conventional commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- **Body focuses on WHY**, not what (diff shows what).
- **Co-author trailer** on AI-assisted commits: `Co-Authored-By: Claude <noreply@anthropic.com>`.
- **Branch naming**: `feat/<scope>`, `fix/<scope>`, `docs/<scope>`.
- **Never** commit `.env`, credentials, `coverage/`, `.next/`, `node_modules/`, `.playwright-mcp/`, `test-results/`.
- **Never** push without being asked. Never force-push to main. Never amend a pushed commit.

Full preferences + definition-of-done checklist: `docs/preferences.md`.
