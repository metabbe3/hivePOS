import { withErrorHandler, apiSuccess, ValidationError, ConflictError } from "@/modules/shared";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { seedDefaultRoles, backfillUserRoles } from "@/lib/permissions/seed";
import { rateLimit } from "@/lib/rate-limit";
import { TRIAL_DAYS } from "@/lib/billing";

const registerSchema = z.object({
  businessName: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  branchName: z.string().min(1),
  ownerName: z.string().min(2),
  ownerPhone: z.string().min(8),
  email: z.string().email(),
  password: z.string().min(8).optional().or(z.literal("")),
  googleId: z.string().optional(),
  /// Which tier to trial: "PRO" (default — full features for 14 days) or "GROWTH".
  trialTier: z.enum(["GROWTH", "PRO"]).optional(),
});

export const POST = withErrorHandler(async (req) => {
  rateLimit(req, { limit: 5, windowSeconds: 60 });

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "Data tidak valid",
      { details: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })) },
    );
  }
  const data = parsed.data;

  // Check if slug is taken
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: data.slug },
  });
  if (existingTenant) {
    throw new ConflictError("Subdomain sudah digunakan. Pilih yang lain.");
  }

  // Check if email is taken
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingUser) {
    throw new ConflictError("Email sudah terdaftar. Gunakan email lain.");
  }

  // Get the Free plan
  const freePlan = await prisma.plan.findFirst({
    where: { name: "Free" },
  });

  // Create tenant + branch + owner + subscription in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 86_400_000);
    // Auto-activated at signup — no admin approval. Honors the landing "Live dalam
    // 2 menit / langsung jalan" claim and grants the 14-day Growth/Pro trial now.
    const tenant = await tx.tenant.create({
      data: {
        name: data.businessName,
        slug: data.slug,
        ownerEmail: data.email,
        ownerName: data.ownerName,
        ownerPhone: data.ownerPhone,
        activeModules: ["laundry"],
        isActive: true,
        approvedAt: now,
        trialEndsAt,
        trialTier: data.trialTier ?? "PRO",
      },
    });

    // Create default branch
    // ponytail: isFreeTier=true so the order guard doesn't block newly-approved
    // free-tier tenants (branch with isFreeTier=false + coverageEnd=null is treated
    // as LOCKED by create-order.service.ts). Flipped to false + coverageEnd set on
    // first payment via extendOutletCoverage().
    const branch = await tx.branch.create({
      data: {
        name: data.branchName,
        tenantId: tenant.id,
        isFreeTier: true,
      },
    });

    // Create owner user
    // Google OAuth users get a random password (they login via Google)
    const rawPassword = data.password || Math.random().toString(36).slice(2) + Date.now().toString(36);
    const passwordHash = await bcrypt.hash(rawPassword, 12);
    await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.ownerName,
        phone: data.ownerPhone,
        role: "OWNER",
        tenantId: tenant.id,
        branchId: branch.id,
        ...(data.googleId ? { googleId: data.googleId } : {}),
      },
    });

    // Seed the 4 default system roles + link the owner to the Owner role.
    const roleMap = await seedDefaultRoles(tx, tenant.id);
    await backfillUserRoles(tx, tenant.id, roleMap);

    // Create subscription (status TRIAL for the 14-day window; the effective tier
    // derives from tenant.trialTier + trialEndsAt in lib/billing.ts getTenantPlan).
    if (freePlan) {
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: freePlan.id,
          status: "TRIAL",
          currentPeriodEnd: trialEndsAt,
        },
      });
    }

    // Seed default laundry services for the branch
    const defaultServices = [
      { name: "Cuci Kering", pricingType: "PER_KG" as const, basePrice: 7000 },
      { name: "Cuci Setrika", pricingType: "PER_KG" as const, basePrice: 10000 },
      { name: "Cuci Setrika Express", pricingType: "PER_KG" as const, basePrice: 15000 },
      { name: "Cuci Sepatu", pricingType: "PER_ITEM" as const, basePrice: 25000 },
      { name: "Cuci Bedcover", pricingType: "PER_ITEM" as const, basePrice: 30000 },
    ];

    await tx.service.createMany({
      data: defaultServices.map((s) => ({
        ...s,
        branchId: branch.id,
      })),
    });

    return tenant;
  });

  return apiSuccess({
    slug: result.slug,
    message: "Bisnis berhasil dibuat",
  });
});
