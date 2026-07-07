import { withErrorHandler, apiSuccess } from "@/modules/shared";
import { requireWithBranchOrThrow } from "@/lib/permissions/check";
import { prisma } from "@/lib/prisma";

// Per-staff attendance aggregation: hours worked (sum of IN→OUT pairs), days
// worked, no-show days (work-days in range with 0 hours).
export const GET = withErrorHandler(async (req) => {
  const ctx = await requireWithBranchOrThrow("attendance", "read");
  const url = new URL(req.url);
  const to = url.searchParams.get("to") ? new Date(url.searchParams.get("to")!) : new Date();
  const from = url.searchParams.get("from")
    ? new Date(url.searchParams.get("from")!)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Work days from the first active branch (default Mon-Sat). 1=Mon…7=Sun.
  const branch = await prisma.branch.findFirst({
    where: { tenantId: ctx.tenantId, isActive: true },
    select: { workDays: true },
  });
  const workDays: number[] = branch?.workDays?.length ? branch.workDays : [1, 2, 3, 4, 5, 6];

  const staff = await prisma.user.findMany({
    where: { tenantId: ctx.tenantId, isActive: true, pinHash: { not: null } },
    select: {
      id: true,
      name: true,
      clockEvents: {
        where: { timestamp: { gte: from, lte: to }, branchId: { in: ctx.branchIds } },
        orderBy: { timestamp: "asc" },
      },
    },
  });

  // Count total work-days in [from, to] for the no-show denominator.
  let totalWorkDays = 0;
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const jsDay = d.getDay();
    const wd = jsDay === 0 ? 7 : jsDay; // Sun(0)→7, else jsDay
    if (workDays.includes(wd)) totalWorkDays++;
  }

  const now = new Date();
  const rows = staff.map((s) => {
    let hoursMs = 0;
    const daysWorkedSet = new Set<string>();
    let openIn: Date | null = null;
    for (const ev of s.clockEvents) {
      if (ev.type === "CLOCK_IN") {
        openIn = ev.timestamp;
        daysWorkedSet.add(ev.timestamp.toDateString());
      } else if (ev.type === "CLOCK_OUT" && openIn) {
        hoursMs += ev.timestamp.getTime() - openIn.getTime();
        openIn = null;
      }
    }
    // Count the OPEN session (clocked in but not out yet) up to now.
    if (openIn) {
      hoursMs += now.getTime() - openIn.getTime();
    }
    const daysWorked = daysWorkedSet.size;
    const noShow = Math.max(0, totalWorkDays - daysWorked);
    return {
      userId: s.id,
      name: s.name,
      hoursMs,
      hours: +(hoursMs / 3_600_000).toFixed(1),
      daysWorked,
      noShow,
    };
  });

  return apiSuccess(rows, { from: from.toISOString(), to: to.toISOString(), totalWorkDays });
});
