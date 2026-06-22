import { withErrorHandler, apiSuccess } from "@/modules/shared";
import { requirePermissionOrThrow } from "@/lib/permissions/check";
import { createCheckoutService } from "@/modules/billing/billing.module";

export const POST = withErrorHandler(async (req) => {
  const ctx = await requirePermissionOrThrow("billing", "read");

  const body = await req.json();
  const result = await createCheckoutService.execute(
    {
      months: Number(body?.months) || 1,
      branchIds: Array.isArray(body?.branchIds) ? body.branchIds : [],
      promoCode: body?.promoCode as string | undefined,
      planTier: body?.planTier === "PRO" ? "PRO" : "GROWTH",
    },
    ctx,
  );

  return apiSuccess(result);
});
