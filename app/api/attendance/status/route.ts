import { withErrorHandler, apiSuccess } from "@/modules/shared";
import { requireWithBranchOrThrow } from "@/lib/permissions/check";
import { prisma } from "@/lib/prisma";

// Who is currently clocked in (last event = CLOCK_IN) at the active branch(es).
export const GET = withErrorHandler(async () => {
  const ctx = await requireWithBranchOrThrow("attendance", "read");
  const users = await prisma.user.findMany({
    where: { tenantId: ctx.tenantId, isActive: true, pinHash: { not: null } },
    select: {
      id: true,
      name: true,
      clockEvents: {
        where: { branchId: { in: ctx.branchIds } },
        orderBy: { timestamp: "desc" },
        take: 1,
      },
    },
  });
  const inNow = users
    .filter((u) => u.clockEvents[0]?.type === "CLOCK_IN")
    .map((u) => ({ id: u.id, name: u.name, since: u.clockEvents[0]!.timestamp }));
  return apiSuccess(inNow);
});
