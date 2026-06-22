import { prisma } from "@/lib/prisma";

// ponytail: feature flag resolver. Single source of truth — called from
// lib/auth.ts (jwt callback), super-admin API, and ad-hoc server code.
// Resolution rule: per-tenant override wins over global default when present.
// Unknown flags default to true (permissive) so a missing seed never hides a
// feature.

/** All resolved flag keys for a tenant: { website: true, inventory: false, ... }. */
export async function resolveAllFlags(
  tenantId: string,
): Promise<Record<string, boolean>> {
  const flags = await prisma.featureFlag.findMany({
    include: { overrides: { where: { tenantId } } },
  });
  const out: Record<string, boolean> = {};
  for (const f of flags) {
    const override = f.overrides[0];
    out[f.key] = override ? override.enabled : f.enabled;
  }
  return out;
}

/** Resolve a single flag for a tenant. Unknown flag → true (permissive). */
export async function resolveFlag(
  key: string,
  tenantId: string,
): Promise<boolean> {
  const flag = await prisma.featureFlag.findUnique({
    where: { key },
    include: { overrides: { where: { tenantId } } },
  });
  if (!flag) return true;
  const override = flag.overrides[0];
  return override ? override.enabled : flag.enabled;
}

/** Catalog of all flag keys referenced in code. Keeps the seed + sidebar in sync. */
export const FLAG_KEYS = [
  "dashboard",
  "orders",
  "customers",
  "services",
  "inventory",
  "expenses",
  "deposits",
  "pickupRequests",
  "reports",
  "branches",
  "users",
  "roles",
  "billing",
  "website",
  "tickets",
] as const;

export type FlagKey = (typeof FLAG_KEYS)[number];
