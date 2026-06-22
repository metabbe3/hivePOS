import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/get-session";
import {
  withErrorHandler,
  apiSuccess,
  ValidationError,
  ConflictError,
  ForbiddenError,
} from "@/modules/shared";

// ─── AUTH: Super admin only ───
async function assertSuperAdmin() {
  const session = (await getApiSession()) as any;
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return null;
  }
  return session;
}

// GET — list all promo codes
export const GET = withErrorHandler(async () => {
  const session = await assertSuperAdmin();
  if (!session) throw new ForbiddenError("Super admin access required");

  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { redemptions: true } },
    },
  });

  return apiSuccess({
    promoCodes: codes.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      type: c.type,
      value: Number(c.value),
      maxRedemptions: c.maxRedemptions,
      redemptionCount: c.redemptionCount,
      validFrom: c.validFrom?.toISOString() ?? null,
      validUntil: c.validUntil?.toISOString() ?? null,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
    })),
  });
});

// POST — create a new promo code
export const POST = withErrorHandler(async (req: Request) => {
  const session = await assertSuperAdmin();
  if (!session) throw new ForbiddenError("Super admin access required");

  const body = await req.json();

  // ── Validate required fields ──
  const code = (body?.code as string | undefined)?.trim().toUpperCase();
  if (!code) {
    throw new ValidationError("Code is required");
  }

  const type = body?.type as string | undefined;
  if (!["FREE_MONTH", "DISCOUNT_PERCENT", "DISCOUNT_FIXED"].includes(type ?? "")) {
    throw new ValidationError("Invalid type");
  }

  const value = Number(body?.value);
  if (!Number.isFinite(value) || value <= 0) {
    throw new ValidationError("Value must be a positive number");
  }
  if (type === "DISCOUNT_PERCENT" && value > 100) {
    throw new ValidationError("Percent discount cannot exceed 100");
  }

  const maxRedemptions =
    body?.maxRedemptions === null || body?.maxRedemptions === undefined || body?.maxRedemptions === ""
      ? null
      : Math.max(0, Math.floor(Number(body.maxRedemptions)));
  if (maxRedemptions !== null && (!Number.isFinite(maxRedemptions) || maxRedemptions < 0)) {
    throw new ValidationError("maxRedemptions must be a non-negative integer or null");
  }

  // ── Parse optional validity window ──
  let validFrom: Date | null = null;
  let validUntil: Date | null = null;
  if (body?.validFrom) {
    const d = new Date(body.validFrom);
    if (!isNaN(d.getTime())) validFrom = d;
  }
  if (body?.validUntil) {
    const d = new Date(body.validUntil);
    if (!isNaN(d.getTime())) validUntil = d;
  }

  // ── Enforce code uniqueness ──
  const existing = await prisma.promoCode.findUnique({ where: { code } });
  if (existing) {
    throw new ConflictError("Code already exists");
  }

  const created = await prisma.promoCode.create({
    data: {
      code,
      description: (body?.description as string | undefined)?.trim() || null,
      type: type as "FREE_MONTH" | "DISCOUNT_PERCENT" | "DISCOUNT_FIXED",
      value,
      maxRedemptions,
      validFrom,
      validUntil,
      isActive: body?.isActive !== false,
    },
  });

  return apiSuccess({
    promoCode: {
      id: created.id,
      code: created.code,
      type: created.type,
      value: Number(created.value),
    },
  });
});

// PATCH — toggle active state (deactivate / reactivate)
export const PATCH = withErrorHandler(async (req: Request) => {
  const session = await assertSuperAdmin();
  if (!session) throw new ForbiddenError("Super admin access required");

  const body = await req.json();
  const id = body?.id as string | undefined;
  if (!id) {
    throw new ValidationError("id is required");
  }

  const updated = await prisma.promoCode.update({
    where: { id },
    data: { isActive: Boolean(body?.isActive) },
    select: { id: true, code: true, isActive: true },
  });

  return apiSuccess({ promoCode: updated });
});
