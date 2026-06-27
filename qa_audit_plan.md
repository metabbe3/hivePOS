# hivePOS — QA & DRY Audit Plan

## Context
A Senior-QA audit (DRY, reusability, hidden bugs, test coverage) of the hivePOS codebase.
Three Explore agents swept DRY duplication, test gaps, and bug/risk patterns. **Every
high-stakes claim was then verified directly** — and several agent findings turned out to be
false positives, so they are deliberately **excluded** below. This plan contains only
verified, high-signal, low-risk changes. Principle: fix real money/security-path duplication
and real bugs; don't invent work (ponytail).

### Verified findings that drive this plan
- `["PENDING", "PARTIAL"]` is hardcoded as a Prisma `{ in: [...] }` filter in **10+ real sites**
  on the money/reporting path (`app/api/dashboard/stats`, `app/api/reports/*`,
  `app/api/reports/export`, `lib/ai-tools.ts`) with no shared constant. `lib/constants.ts`
  has `PAYMENT_STATUS_CONFIG` but no unpaid-set constant.
- **Promo-code create + toggle write to the DB with no `prisma.$transaction` and no `auditLog`**
  (`app/api/super-admin/promo-codes/route.ts:101,135`) — violates Non-negotiable #2. The same
  file also defines a local `assertSuperAdmin()` instead of the shared
  `assertSuperAdminOrThrow` (`@/lib/super-admin/permissions`) that `plans/[id]/route.ts` uses.
- `resolveAllFlags()` (`lib/feature-flags.ts:10`) has **no internal error handling**; its 4
  call sites in the JWT callback (`lib/auth.ts:327,354,396,472`) will throw → break
  login/session-refresh if the flag query hiccups. Violates Non-negotiable #8 ("flags must
  resolve in all paths"). Wrapping once centrally fixes both the robustness gap and the DRY
  of 4 identical call sites.
- `PAPER_WIDTHS` + `getLineWidth` are defined **identically** in `lib/escpos.ts:9-16` and
  `lib/client-printer.ts:8-15` — a real drift risk, and pure/testable.
- Several **pure, widely-used** lib utilities have **no unit tests**: `lib/format.ts`,
  `lib/dates.ts`, `lib/tenant-code.ts`, `lib/module-filter.ts`.

### Explicitly EXCLUDED (false positives / not worth it — verified)
- `plans/[id]/route.ts` "missing auditLog" — **FALSE**: it writes `auditLog` in both PATCH (line 64) and DELETE (line 98).
- Order-repo "scope-by-id" cross-tenant read (`prisma-order.repository.ts:293`) — **NOT a bug**: the
  preceding `update({ where: { id, branchId } })` scopes by branch and throws P2025 on mismatch.
- `Number(order.paidAmount) + data.amount` "precision bug" — **NOT a bug**: IDR is an integer
  currency, exact well below 2^53.
- `.catch(() => ({}))` JSON parse in super-admin routes — **graceful no-op, not a vuln**; changing it
  risks turning tolerant behavior into 400s.
- Bulk date-range refactor across ~20 report routes — **mostly already centralized** via
  `buildDateFilter` + `parseDateRange`; remaining inline sites filter different columns, so a
  bulk swap is messy/risky for little gain.
- Receipt currency-formatter swap (`formatRupiah`/`formatRp` → `formatCurrency`) — **output-sensitive**
  (receipt column widths depend on exact string length); deferred unless byte-identical.

---

## Phase 2 — Refactors (surgical Edit only, no rewrites)

### R1. Unpaid-payment-statuses constant  *(highest-signal DRY; money path)*
- Add `export const UNPAID_PAYMENT_STATUSES = ["PENDING", "PARTIAL"] as const;` to `lib/constants.ts`.
- Adopt at the verified sites (replace `{ in: ["PENDING", "PARTIAL"] }` → `{ in: UNPAID_PAYMENT_STATUSES }`):
  `app/api/dashboard/stats/route.ts`, `app/api/reports/{customers,monthly-pnl,monthly-pnl/export,payment-collection,outstanding,financial-statement}/route.ts`,
  `app/api/reports/export/route.ts`, `lib/ai-tools.ts`.

### R2. Total flag resolution in auth  *(Non-negotiable #8 + DRY)*
- Add `export async function resolveAllFlagsSafe(tenantId: string): Promise<Record<string,boolean>>`
  to `lib/feature-flags.ts` — wraps `resolveAllFlags` in try/catch, returns `{}` on throw
  (fail-closed: features hidden when flags unknown). Add `// ponytail:` comment naming the
  trade-off (hide-all on DB error vs fail login).
- Replace the 4 `await resolveAllFlags(...)` calls in `lib/auth.ts` (327, 354, 396, 472) with
  `resolveAllFlagsSafe`. Keep `resolveAllFlags` exported for non-auth callers.

### R3. Promo-code audit trail + shared auth  *(Non-negotiable #2 bug fix)*
- In `app/api/super-admin/promo-codes/route.ts`:
  - Replace local `assertSuperAdmin()` with `assertSuperAdminOrThrow("SUPER_ADMIN")` (drop the helper).
  - POST: wrap `prisma.promoCode.create` in `prisma.$transaction` and write
    `auditLog(tx, { actor, action: "promoCode.create", target: { type: "PromoCode", id }, diff: {...}, req })`.
  - PATCH: wrap `prisma.promoCode.update` in `prisma.$transaction` and write
    `auditLog(tx, { action: "promoCode.toggle", diff: { isActive: {...} }, ... })`.
  - Match the exact `auditLog` signature already used in `plans/[id]/route.ts`.

### R4. Printer shared constants  *(self-contained DRY; pure + testable)*
- Create `lib/printer-shared.ts` exporting `PAPER_WIDTHS` + `getLineWidth(paperSize?)`.
- `lib/escpos.ts` and `lib/client-printer.ts` import them instead of redefining. Leave all
  byte-emit/layout logic untouched.

---

## Phase 2 — Tests (Vitest, pure functions; reuse `vi`/existing patterns)

> Note: `vitest.config.ts` coverage gate covers `modules/**/{domain,application}` + `modules/shared`;
> lib tests add real safety without moving the gate. All targets below are pure — no DB/Next infra.

- **`lib/dates.test.ts`** — `parseDateRange` (from-only, to-only, both, neither; `to` end-of-day),
  `endOfDay`. *(Backbone of date handling.)*
- **`lib/feature-flags.test.ts`** — `resolveAllFlagsSafe`: returns real map on success, `{}` when
  `prisma.featureFlag.findMany` rejects (mock `@/lib/prisma`); `resolveAllFlags` happy-path.
- **`lib/format.test.ts`** — `formatCurrency`, `formatCompactCurrency`, `formatRelative`,
  `formatDate`, `formatDateTime` (incl. NaN/0/negative edge cases).
- **`lib/tenant-code.test.ts`** — `deriveTenantCode` (single word → 3 chars, multi-word → initials,
  empty slug → "ORD", max 5 chars).
- **`lib/module-filter.test.ts`** — `sessionModule` (lowercase→enum, unknown→LAUNDRY, null/undefined).
- **`lib/constants.test.ts`** — `UNPAID_PAYMENT_STATUSES` membership (R1); add a quick
  `getLineWidth` case here or in a `lib/printer-shared.test.ts` (R4).

---

## Phase 3 — Verify & fix loop (logs stay local)
1. `npx tsc --noEmit` — must be 0 errors (catches refactor type breaks first).
2. `npm test 2>&1 | tee qa_test_logs.txt` — full suite.
3. Read last ~40 lines of `qa_test_logs.txt` only on failure; apply surgical Edit; re-run. Loop until green.

## Critical files
- `lib/constants.ts`, `lib/feature-flags.ts`, `lib/printer-shared.ts` (new)
- `lib/auth.ts` (jwt callback only — R2), `app/api/super-admin/promo-codes/route.ts` (R3)
- `lib/escpos.ts`, `lib/client-printer.ts` (R4)
- 10 `app/api/{dashboard,reports}/**` + `lib/ai-tools.ts` (R1 adoption)
- 6 new `lib/*.test.ts` files

## Verification (end-to-end)
- `npx tsc --noEmit` → 0 errors.
- `npm test` → all pass (existing suite + 6 new files); output in `qa_test_logs.txt`.
- `grep -rn '"PENDING", *"PARTIAL"' app/ lib/ modules/ | grep -v generated` → 0 remaining (R1 adopted).
- Confirm `app/api/super-admin/promo-codes/route.ts` POST+PATCH now contain `auditLog(` and `prisma.$transaction`.
- Final 4-bullet summary delivered per goal.
