import { withErrorHandler, apiSuccess } from "@/modules/shared";
import { UNPAID_PAYMENT_STATUSES } from "@/lib/constants";
import { requireWithBranchOrThrow } from "@/lib/permissions/check";
import { prisma } from "@/lib/prisma";

// Piutang Tracker — AR aging + monthly timeline + per-order payment history.
// Fetches ALL orders (no date filter) so the monthly timeline is automatic — every month.
// The client-side date picker narrows the per-order detail table only.

export const GET = withErrorHandler(async (req) => {
  const ctx = await requireWithBranchOrThrow("reports", "read");
  const { branchIds } = ctx;

  // ALL orders (no date filter) — monthly timeline covers every month automatically.
  const ordersInRange = await prisma.order.findMany({
    where: { branchId: { in: branchIds } },
    include: {
      payments: { orderBy: { paidAt: "asc" } },
      customer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Currently outstanding orders (no date filter — aging is a current snapshot).
  const outstandingOrders = await prisma.order.findMany({
    where: {
      branchId: { in: branchIds },
      paymentStatus: { in: UNPAID_PAYMENT_STATUSES },
    },
    select: { totalAmount: true, paidAmount: true, receivedAt: true, createdAt: true },
  });

  const now = new Date();
  const DAY_MS = 86_400_000;

  // ── Monthly summary (by order creation month) ──
  const monthMap = new Map<string, { newOrders: number; newPiutang: number; paidSoFar: number; fullyPaidCount: number }>();
  for (const o of ordersInRange) {
    const monthKey = o.createdAt.toISOString().slice(0, 7);
    const total = Number(o.totalAmount);
    const paid = Number(o.paidAmount);
    const entry = monthMap.get(monthKey) ?? { newOrders: 0, newPiutang: 0, paidSoFar: 0, fullyPaidCount: 0 };
    entry.newOrders++;
    entry.newPiutang += total;
    entry.paidSoFar += paid;
    if (o.paymentStatus === "PAID") entry.fullyPaidCount++;
    monthMap.set(monthKey, entry);
  }
  const monthlySummary = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({ month, ...d, stillOutstanding: d.newPiutang - d.paidSoFar }));

  // ── Aging buckets (current snapshot) ──
  const buckets: Record<string, { amount: number; count: number }> = {
    "0-30": { amount: 0, count: 0 },
    "31-60": { amount: 0, count: 0 },
    "61-90": { amount: 0, count: 0 },
    "90+": { amount: 0, count: 0 },
  };
  let totalOutstanding = 0;
  for (const o of outstandingOrders) {
    const refDate = o.receivedAt ?? o.createdAt;
    const ageDays = Math.floor((now.getTime() - refDate.getTime()) / DAY_MS);
    const outstanding = Number(o.totalAmount) - Number(o.paidAmount);
    totalOutstanding += outstanding;
    const bucket = ageDays <= 30 ? "0-30" : ageDays <= 60 ? "31-60" : ageDays <= 90 ? "61-90" : "90+";
    buckets[bucket].amount += outstanding;
    buckets[bucket].count++;
  }

  // ── Per-order detail (with payment history) ──
  const orders = ordersInRange.map((o) => {
    const refDate = o.receivedAt ?? o.createdAt;
    const ageDays = Math.floor((now.getTime() - refDate.getTime()) / DAY_MS);
    const outstanding = Number(o.totalAmount) - Number(o.paidAmount);
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      customer: o.customer?.name ?? "-",
      createdAt: o.createdAt.toISOString().slice(0, 10),
      totalAmount: Number(o.totalAmount),
      paidAmount: Number(o.paidAmount),
      outstanding,
      ageDays,
      bucket: ageDays <= 30 ? "0-30" : ageDays <= 60 ? "31-60" : ageDays <= 90 ? "61-90" : "90+",
      status: o.paymentStatus,
      payments: o.payments.map((p) => ({
        amount: Number(p.amount),
        paidAt: (p.paidAt ?? p.createdAt).toISOString().slice(0, 10),
        method: p.paymentMethod,
      })),
    };
  });

  return apiSuccess({
    monthlySummary,
    agingBuckets: buckets,
    totalOutstanding,
    outstandingOrderCount: outstandingOrders.length,
    orders,
  });
});
