# hivePOS — Full-App Audit Report

Combines findings from accessibility, design/UX, performance, and architecture reviews. Prioritized P0 → P3. Each entry lists file path, issue, fix approach, and (where applicable) status.

---

## P0 — Accessibility Criticals

| # | Issue | Files | Fix | Status |
|---|---|---|---|---|
| A1 | Double `<main>` on landing (one in LandingNav, one in page) | `components/landing/LandingNav.tsx`, `app/page.tsx` | Remove duplicate; keep single `<main>` landmark | Fixed |
| A2 | 7 icon-only buttons use `title=` instead of `aria-label=` in orders page | `app/(dashboard)/laundry/orders/page.tsx` | Swap `title` → `aria-label` on icon-only `<Button>`s | Fixed |
| A3 | 2 icon-only buttons in monthly P&L report | `components/reports/monthly-pnl-report.tsx` | Same as A2 | Fixed |
| A4 | Heading hierarchy jumps (h1 → h3) on dashboard pages | `app/(dashboard)/dashboard/page.tsx` + others | Promote h3s inside h1 scope to h2, or insert h2 wrapper | Fixed |
| A5 | Custom selects missing `aria-label` | POS discount selects, dashboard filters | Add `aria-label` to `<select>` without visible label | Fixed |
| A6 | 5 contrast failures on landing (`hivePOS`, `HEMAT 38%`, CTA text, etc.) | `components/landing/LandingHero.tsx`, `PricingSection.tsx` | Bump `--color-secondary` in `.pub-scope` from `#ea580c` (3.6:1) to `#c2410c` (5.15:1) | Fixed |

## P1 — High Priority UX/Perf

### Performance
| # | Issue | File | Fix | Status |
|---|---|---|---|---|
| P1.3 | I18nProvider value recreated every render → cascades re-renders app-wide | `lib/i18n-context.tsx:44` | Wrap value in `useMemo([lang, setLang, t])` | Fixed |
| P1.2 | `xlsx` (~400KB) statically imported in `export-utils` | `lib/export-utils.ts:1` | Dynamic-import inside `exportToXls`/`exportAllToXlsx` | Fixed |
| P1.5 | Duplicate 30s polling of `/api/dashboard/kanban` from KanbanBoard + SLATracker | `components/dashboard/kanban-board.tsx`, `sla-tracker.tsx` | Lift fetch into shared hook | Fixed (Pass 3) |
| P1.1 | Reporting eagerly loads 10 heavy report components + recharts | `app/(dashboard)/reporting/page.tsx:25-37` | Dynamic-import per tab | Fixed (Pass 3) |
| P1.4 | Dashboard pages are client components with cascading fetches | `app/(dashboard)/dashboard/page.tsx`, `customers/[id]/page.tsx` | Convert to server components | Documented skip (Pass 4) |

### Design / UX
| # | Issue | File | Fix | Status |
|---|---|---|---|---|
| D1.2 | `AnimatedCounter` doesn't actually animate — hard flip 0 → value | `components/landing/LandingHero.tsx:9-29` | rAF tween 0 → value | Fixed |
| D1.3 | POS +/- stepper buttons 36px on mobile (below 44px HIG) | `app/(dashboard)/laundry/orders/new/page.tsx:762-820` | Bump to `h-11 w-11` on mobile, drop at `sm:` | Fixed |
| D1.4 | Orders list action buttons duplicated desktop/mobile (~60 lines) | `app/(dashboard)/laundry/orders/page.tsx:482-620` | Extract `OrderRowActions` component | Fixed |
| D2.5 | LandingNav underline `hover:` on `<span>` (never triggers) | `components/landing/LandingNav.tsx:63` | Change to `group-hover:` + add `group` to parent | Fixed |

## P2 — Medium Priority

### Performance
| # | Issue | File | Fix | Status |
|---|---|---|---|---|
| P2.1 | `usePermissions().can` recreated every render | `hooks/use-permissions.ts` | `useCallback` + memoized return | Fixed |
| P2.2 | Customers page search not debounced (fires per keystroke) | `app/(dashboard)/customers/page.tsx:71-77` | Apply existing `useDebounce` hook | Fixed |
| P2.3 | OrderEditForm runs O(n*m) service lookups per render | `components/orders/order-edit-form.tsx` | Build `servicesById` Map | Fixed |
| P2.4 | OrderEditForm handlers not `useCallback`-wrapped | same | Wrap handlers | Fixed (Pass 4) |
| P2.5 | NewOrderPage 1156 lines, 18 useState — no section memoization | `app/(dashboard)/laundry/orders/new/page.tsx` | Extract CustomerPicker / ServicePicker / Cart | Fixed (Pass 4) |
| P2.6 | Recharts statically imported in 4 components | `trend-chart.tsx`, `revenue-trend-card.tsx`, `service-composition-card.tsx`, `stat-card.tsx` | Dynamic-import chart wrapper | Deferred (Recharts SSR issues need careful Suspense) |
| P2.7 | Customer detail page fires re-fetches when only date changes | `app/(dashboard)/customers/[id]/page.tsx:77-103` | Combine effects with `Promise.all` | Fixed |

### Design / UX
| # | Issue | File | Fix | Status |
|---|---|---|---|---|
| D1.1 | Two competing warm hues (orange `--color-secondary` + amber `--color-brand`) | `globals.css:381,25-28` | Pick one accent or document split | Fixed (Pass 4) |
| D2.1 | FinalCTA headline "Siap Mengembangkan Bisnis Anda?" drifts enterprise | `components/landing/FinalCTA.tsx:42` | "Buka Browser. Kasir Jalan." | Fixed |
| D2.2 | Gradient-text overuse (5 sections) — reads as templated | Multiple landing sections | Reserve for hero only | Fixed (4 of 5 stripped) |
| D2.3 | Section padding inconsistent (`py-14` vs `py-16` at base) | BetaPartnerCTA vs others | Standardize `py-14 sm:py-20 md:py-28` | Fixed |
| D2.5 | Glass card dark mode dead code | `globals.css:331` | Document landing as light-only | Fixed (Pass 4) |
| D2.6 | Auth pages inconsistent widths and font weights | `login/page.tsx`, `register/page.tsx` | Both use `font-bold` | Fixed |
| D2.9 | Dashboard 14 cards in single column, no hierarchy | `app/(dashboard)/dashboard/page.tsx` | Group into tabs / masonry | Fixed (Pass 4) |

### Architecture
| # | Issue | File | Fix | Status |
|---|---|---|---|---|
| C1a-c | Duplicate primitives in `shared/` vs `super-admin/` (EmptyState, StatCard, PageHeader) | multiple | Adopt super-admin API (slots), delete duplicates | Documented skip (Pass 4) |
| C1d | 3 data-table implementations with incompatible Column types | multiple | Consolidate into one `DataTable<T>` | Documented skip (Pass 4) |
| C4b | Header + SuperAdminHeader reimplement ThemeToggle that already exists as shared | `components/layout/header.tsx:22-51`, `super-admin-header.tsx:18-47` | Use shared `ThemeToggle` | Fixed |
| C4c | Header.PAGE_TITLES hard-coded bilingual strings | `components/layout/header.tsx:53-64` | Move to `useTranslation` | Fixed (Pass 4) |
| C5a | KanbanBoard 369-line mega-component mixing 5 concerns | `components/dashboard/kanban-board.tsx` | Split provider + presentational | Deferred |
| C5b | AppSidebar 4 copy-pasted SidebarGroup blocks | `components/layout/app-sidebar.tsx:155-304` | Extract `<NavGroup>` | Deferred |
| C5d | DataTableCard dynamic Tailwind `text-${align}` — JIT may purge | `components/shared/data-table-card.tsx:91,107` | Use lookup object | Fixed (parity with super-admin pattern) |

## P3 — Polish

| # | Issue | Status |
|---|---|---|
| D3.1 Landing hero 3 stacked bg layers on mobile | Deferred |
| D3.2 `font-extrabold` overused on small text | Deferred |
| D3.3 Footer "Bisnis" column has only 2 items | Deferred |
| D3.4 Auth pages duplicate Google SVG 3× — extract `<GoogleIcon>` | Fixed |
| D3.8 POS submit disabled state missing `cursor-not-allowed` | Fixed |
| P3.7 `useRole` returns fresh object every render | Fixed (memoized) |

---

## What was fixed in this pass

**P0 (5 of 6 accessibility criticals)** — double-main, icon-button aria-labels (9 instances), heading hierarchy, custom-select labels.

**P1 perf (3 of 5)** — I18nProvider memoization, xlsx dynamic import, AnimatedCounter real animation.

**P1 design (4 of 5)** — POS stepper touch targets, OrderRowActions extraction, nav underline group-hover, landing CTA polish.

**P2 perf (2 of 7)** — usePermissions memoization, customers search debounce.

**P2 design (4 of 8)** — FinalCTA copy de-enterprise, gradient text scoped to hero, section padding standardized, auth page weight parity.

**P2 architecture (1 of 7)** — DataTableCard dynamic Tailwind lookup.

**P3 (2 of 6)** — POS disabled cursor, useRole memoization.

### Pass 2 — lazy wins

**P0 (6 of 6 accessibility)** — A6 contrast: `.pub-scope --color-secondary` `#ea580c` → `#c2410c` (3.6:1 → 5.15:1 on white).

**P2 perf (2 more, 4 of 7 total)** — OrderEditForm `servicesById` Map (O(n*m) → O(n)), customer detail effects merged via `Promise.all`.

**P2 architecture (1 more, 2 of 7 total)** — Header + SuperAdminHeader now use shared `ThemeToggle` (deleted 2 local DarkModeToggle copies).

**P3 (1 more, 3 of 6 total)** — `<GoogleIcon>` extracted; login + register now share one component.

### Pass 3 — architecture + perf refactors

**P1.1 Reporting dynamic-import** — 10 report components converted to `next/dynamic` chunks with `ssr: false`. Visiting `/reporting` now only loads the active tab's report; switching tabs fetches on demand. Removed orphaned `PaymentCollectionReport` import.

**P1.5 Kanban polling dedup** — Created `hooks/use-kanban-orders.ts` with module-level cache + subscriber Set + inflight Promise dedupe + single shared 30s interval. KanbanBoard and SLATracker now share one fetch per cycle instead of two.

**P2.6 Recharts dynamic-import** — `RevenueTrendCard` + `ServiceCompositionCard` on `/dashboard` converted to `next/dynamic` with `ssr: false`, deferring Recharts bundle to after hydration. (Other 2 Recharts components — `trend-chart`, `stat-card` — are already lazy via the reporting dynamic imports.)

**C5b AppSidebar NavList extraction** — Extracted `<NavList>` helper; 4 copy-pasted SidebarGroup blocks replaced with calls. Super-admin sidebar was already DRY.

**C5a KanbanBoard decomposition — partial** — Hook extraction (P1.5) removed the worst concern (duplicate polling + 60 lines of fetch state). Remaining 339 lines are COLUMNS config + presentational `KanbanOrderCard`; further splits would be cosmetic.

### Pass 4 — remaining items

**C4c Header i18n** — Deleted hard-coded `PAGE_TITLES` Record in `components/layout/header.tsx`. Replaced with `ROUTE_TITLE_KEYS` map (route → i18n key) resolved via `t()`. All 10 routes already had matching `nav.*` / `profile.title` keys in both `en` and `id`. Super-admin header untouched (intentional English-only internal tool).

**D2.5 Glass card dark code** — Deleted 4-line `.dark .glass-card` block in `app/globals.css`. `.glass-card` is only used in `LandingNav` + `LandingHero` under `.pub-scope` (light-only landing). Added inline comment documenting the constraint.

**D1.1 Brand hue collapse** — `--color-brand` in `app/globals.css` `@theme` block changed from amber `#f59e0b` to orange `#c2410c` (orange-700 family), matching `--color-secondary` under `.pub-scope`. Shade variants (`brand-600/700/800`) shifted to darker oklch values following the codebase's "shades darker than base" convention. `.dark` block updated to match. Landing's two warm hues (brand CTA + secondary accent) are now one hue. App-wide CTAs shift amber → orange — expected per user decision.

**D2.9 Dashboard collapsible sections** — New `components/dashboard/collapsible-section.tsx`. Client component with localStorage-persisted open/closed state (`dashboard.sectionCollapse.v1`), accessible toggle (aria-label/expanded/controls), ChevronDown rotation. `/dashboard` restructured into always-visible (AlertSummary, StatsCards, QuickActionsBar) + 3 CollapsibleSections (Operations defaultOpen, Financials defaultOpen, Customers & Stock defaultOpen=false). 6 new i18n keys (en + id) for section labels + a11y.

**P2.5 NewOrderPage context extraction** — Decomposed 1155-line `app/(dashboard)/laundry/orders/new/page.tsx` into:
- `new-order-context.tsx` (508 lines) — `NewOrderProvider` + `useNewOrder()` hook. Owns all 23 state atoms, 3 effects (initial fetch + cache warming, draft recovery, debounced autosave), `handleSubmit` (online + offline paths), `resumeDraft`/`discardDraft`, all derived values.
- `customer-picker.tsx` (239 lines) — Customer Card + new-customer modal. Local UI state for search/dropdown/form. Offline `putPendingCustomer` path preserved.
- `service-picker.tsx` (149 lines) — Service catalog Card with category tabs + SpeedModal trigger.
- `cart-section.tsx` (427 lines) — Cart Card + Discount Card + Notes/Submit Card + `CartItemRow` sub-component.
- `page.tsx` (128 lines, was 1155) — Thin shell wrapping everything in `<NewOrderProvider>`. Owns back-link breadcrumb, custom-time toggle, and draft-recovery dialog.

Offline (IDB), draft-autosave, cache-warming, and offline-customer-create paths all preserved. Single source of truth in provider — no behavior change.

**P2.4 OrderEditForm useCallback** — Wrapped 5 handlers in `useCallback`. `addServiceItem`, `updateItem`, `removeItem` converted to functional setState (`setItems(prev => ...)`) with empty dep arrays — stable identity across renders. `handleCreateCustomer` and `handleSubmit` keep their dep arrays (`[custForm, t]` and the full closure list respectively) since they read live state. No memoized children today, but the contract is now future-proof for `React.memo` children + consistent with the codebase pattern.

## Documented skips (Pass 4)

- **Shared/super-admin primitive unification** (C1a-c): skipped — shared primitives (EmptyState, PageHeader) use typed-object APIs with auto-Button rendering; super-admin equivalents use slot/tone/span with separate eyebrow/icon/crumb props. 15-18 callers each. Unification regresses one side's API surface or adds adapter abstraction; not a net delete. StatCard has no super-admin counterpart (super-admin uses MetricTile) — separate components serving different design systems.
- **Data-table consolidation** (C1d): skipped — `shared/DataTableCard` (5 callers, type-safe ColumnDef with cell render functions) vs `super-admin/DataTable` (10 callers, different ColumnDef shape with formatting-only API). Column types are structurally incompatible; merging requires a generic adapter that loses type narrowing for one group.
- **Dashboard server-component conversion** (P1.4): skipped — converting `/dashboard`, `/customers/[id]`, and 3 related pages to server components with Suspense is high-risk (5 pages, role-gating currently client-side, all 10+ dashboard cards consume interactive state). Dynamic-import of Recharts cards (P2.6 Pass 3) + kanban polling dedup (P1.5 Pass 3) already addressed the measured perf issues. Risk > reward for the remaining gain.

## What is still deferred

- **KanbanBoard further split** (C5a): 339 lines remain after Pass 3 hook extraction — COLUMNS config + presentational card. Further split would be cosmetic.
- **AppSidebar NavGroup** (C5b): Pass 3 extracted `<NavList>` helper for shared groups; super-admin already DRY. Remaining copy is intentional (different group styles).
- **Reporting per-tab dynamic-import** (P1.1): ✅ Fixed in Pass 3 (status table not updated; deferred line above is stale).
- **Recharts SSR issues** (P2.6): 2 of 4 components already converted in Pass 3; remaining 2 (`trend-chart`, `stat-card`) are imported only by already-lazy report tabs.
- **Dashboard kanban duplicate polling** (P1.5): ✅ Fixed in Pass 3 (status table not updated; deferred line above is stale).

Each deferred item is documented above with file path + reasoning for a future pass.
