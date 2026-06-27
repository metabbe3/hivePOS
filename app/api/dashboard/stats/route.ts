import { withErrorHandler, apiSuccess } from "@/modules/shared";
import { UNPAID_PAYMENT_STATUSES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireWithBranchOrThrow } from "@/lib/permissions/check";
import { endOfDay } from "@/lib/dates";

export const GET = withErrorHandler(async (req) => {
  const ctx = await requireWithBranchOrThrow("dashboard", "read");
  const { branchIds, activeModule: moduleFilter } = ctx;
  // Orders + revenue are scoped per-module. Customers/Stock/Expenses stay
  // branch-shared (see plan: those models are not module-discriminated).

  const { searchParams } = new URL(req.url);

  // Parse date range, default to today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const fromStr = searchParams.get("from") || todayStr;
  const toStr = searchParams.get("to") || todayStr;

  const from = new Date(fromStr);
  from.setHours(0, 0, 0, 0);

  const to = endOfDay(new Date(toStr));

  // Calculate previous period for comparison
  const periodMs = to.getTime() - from.getTime() + 1; // +1 to include full day
  const previousTo = endOfDay(new Date(from.getTime() - 1));
  const previousFrom = new Date(previousTo.getTime() - periodMs + 1);
  previousFrom.setHours(0, 0, 0, 0);

  // Date filter helper: receivedAt with createdAt fallback
  const receivedAtFilter = { OR: [{ receivedAt: { gte: from, lte: to } }, { receivedAt: null, createdAt: { gte: from, lte: to } }] };
  const prevReceivedAtFilter = { OR: [{ receivedAt: { gte: previousFrom, lte: previousTo } }, { receivedAt: null, createdAt: { gte: previousFrom, lte: previousTo } }] };

  // Week start for "new this week" customer count
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const [
    todayOrders,
    inProgress,
    readyForPickup,
    revenueResult,
    previousRevenueResult,
    recentOrders,
    topCustomersGrouped,
    serviceBreakdownGrouped,
    paymentBreakdown,
    // New widget data
    expenseResult,
    depositTopUpResult,
    pipelineReceived,
    pipelineInProgress,
    pipelineReady,
    pipelineDelivered,
    lowStockItems,
    totalCustomerCount,
    newCustomerCount,
    allCustomers,
    // Period comparison
    previousOrderCount,
    previousExpenseResult,
    // Omset (total order value)
    omsetResult,
    previousOmsetResult,
    // Unpaid delivered count (piutang)
    unpaidDelivered,
    // Unpaid orders list
    unpaidOrdersRaw,
    // Turnaround data
    turnaroundOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { branchId: { in: branchIds },module: moduleFilter, ...receivedAtFilter } }),
    prisma.order.count({ where: { branchId: { in: branchIds },module: moduleFilter, status: "IN_PROGRESS" } }),
    prisma.order.count({ where: { branchId: { in: branchIds },module: moduleFilter, status: "READY" } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { order: { branchId: { in: branchIds },module: moduleFilter }, createdAt: { gte: from, lte: to } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { order: { branchId: { in: branchIds },module: moduleFilter }, createdAt: { gte: previousFrom, lte: previousTo } },
    }),
    prisma.order.findMany({
      where: { branchId: { in: branchIds },module: moduleFilter },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true } } },
    }),
    prisma.order.groupBy({
      by: ["customerId"],
      where: { branchId: { in: branchIds },module: moduleFilter, ...receivedAtFilter },
      _sum: { totalAmount: true },
      _count: true,
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 5,
    }),
    prisma.orderItem.groupBy({
      by: ["serviceId"],
      where: { order: { branchId: { in: branchIds },module: moduleFilter, ...receivedAtFilter } },
      _sum: { subtotal: true },
      _count: true,
      orderBy: { _sum: { subtotal: "desc" } },
    }),
    prisma.payment.groupBy({
      by: ["paymentMethod"],
      where: { order: { branchId: { in: branchIds },module: moduleFilter }, createdAt: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: true,
    }),
    // Cash flow: expenses in period (branch-shared — NOT module-filtered)
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { branchId: { in: branchIds },date: { gte: from, lte: to } },
    }),
    // Cash flow: wallet deposits (top-ups) in period (branch-shared)
    prisma.depositTransaction.aggregate({
      _sum: { amount: true },
      where: { branchId: { in: branchIds },type: "TOP_UP", createdAt: { gte: from, lte: to } },
    }),
    // Order pipeline counts for period
    prisma.order.count({ where: { branchId: { in: branchIds },module: moduleFilter, status: "RECEIVED", ...receivedAtFilter } }),
    prisma.order.count({ where: { branchId: { in: branchIds },module: moduleFilter, status: "IN_PROGRESS", ...receivedAtFilter } }),
    prisma.order.count({ where: { branchId: { in: branchIds },module: moduleFilter, status: "READY", ...receivedAtFilter } }),
    prisma.order.count({ where: { branchId: { in: branchIds },module: moduleFilter, status: "DELIVERED", ...receivedAtFilter } }),
    // Low stock items (branch-shared — NOT module-filtered)
    prisma.stockItem.findMany({
      where: { branchId: { in: branchIds },isActive: true },
      select: {
        id: true,
        name: true,
        unit: true,
        currentQuantity: true,
        lowStockThreshold: true,
      },
    }),
    // Customer insights (branch-shared — NOT module-filtered)
    prisma.customer.count({ where: { branchId: { in: branchIds } } }),
    prisma.customer.count({ where: { branchId: { in: branchIds },createdAt: { gte: weekStart } } }),
    prisma.customer.findMany({
      where: { branchId: { in: branchIds } },
      select: { id: true, createdAt: true, orders: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    // Period comparison: previous period orders
    prisma.order.count({ where: { branchId: { in: branchIds },module: moduleFilter, ...prevReceivedAtFilter } }),
    // Period comparison: previous period expenses (branch-shared)
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { branchId: { in: branchIds },date: { gte: previousFrom, lte: previousTo } },
    }),
    // Omset: total order value
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { branchId: { in: branchIds },module: moduleFilter, ...receivedAtFilter },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { branchId: { in: branchIds },module: moduleFilter, ...prevReceivedAtFilter },
    }),
    // Unpaid delivered count
    prisma.order.count({
      where: { branchId: { in: branchIds },module: moduleFilter, status: "DELIVERED", paymentStatus: { in: UNPAID_PAYMENT_STATUSES } },
    }),
    // Unpaid orders list (piutang)
    prisma.order.findMany({
      where: { branchId: { in: branchIds },module: moduleFilter, paymentStatus: { in: UNPAID_PAYMENT_STATUSES } },
      orderBy: { createdAt: "asc" },
      take: 20,
      include: {
        customer: { select: { name: true, phone: true } },
      },
    }),
    // Turnaround: delivered orders with timestamps
    prisma.order.findMany({
      where: {
        branchId: { in: branchIds },
        module: moduleFilter,
        status: "DELIVERED",
        deliveredAt: { not: null },
        receivedAt: { not: null },
      },
      orderBy: { deliveredAt: "desc" },
      take: 50,
      select: { id: true, receivedAt: true, deliveredAt: true },
    }),
  ]);

  // Resolve top-customer + service names in parallel (was two sequential awaits).
  const customerIds = topCustomersGrouped.map((tc) => tc.customerId);
  const serviceIds = serviceBreakdownGrouped.map((sb) => sb.serviceId);
  const [customers, services] = await Promise.all([
    customerIds.length > 0
      ? prisma.customer.findMany({
          where: { branchId: { in: branchIds }, id: { in: customerIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
    serviceIds.length > 0
      ? prisma.service.findMany({
          where: { branchId: { in: branchIds }, id: { in: serviceIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([] as { id: string; name: string }[]),
  ]);
  const customerMap = new Map(customers.map((c) => [c.id, c.name]));
  const serviceMap = new Map(services.map((s) => [s.id, s.name]));

  const topCustomers = topCustomersGrouped.map((tc) => ({
    customerId: tc.customerId,
    name: customerMap.get(tc.customerId) ?? "Unknown",
    orders: tc._count,
    totalSpent: Number(tc._sum.totalAmount ?? 0),
  }));

  const serviceBreakdown = serviceBreakdownGrouped.map((sb) => ({
    serviceId: sb.serviceId,
    name: serviceMap.get(sb.serviceId) ?? "Unknown",
    orders: sb._count,
    revenue: Number(sb._sum.subtotal ?? 0),
  }));

  const paymentMethodBreakdown = paymentBreakdown.map((pb) => ({
    method: pb.paymentMethod,
    count: pb._count,
    total: Number(pb._sum.amount ?? 0),
  }));

  const currentRevenue = Number(revenueResult._sum.amount ?? 0);
  const previousRevenue = Number(previousRevenueResult._sum.amount ?? 0);
  const revenueChange = previousRevenue === 0 ? null : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

  const currentOmset = Number(omsetResult._sum.totalAmount ?? 0);
  const previousOmset = Number(previousOmsetResult._sum.totalAmount ?? 0);
  const omsetChange = previousOmset === 0 ? null : ((currentOmset - previousOmset) / previousOmset) * 100;

  // Cash flow data
  const todayExpenses = Number(expenseResult._sum.amount ?? 0);
  const walletDeposits = Number(depositTopUpResult._sum.amount ?? 0);

  // Period comparison data
  const prevExpenses = Number(previousExpenseResult._sum.amount ?? 0);
  const calcChange = (current: number, previous: number): number | null =>
    previous === 0 ? null : ((current - previous) / previous) * 100;

  const comparison = {
    revenue: { current: currentRevenue, previous: previousRevenue, changePercent: revenueChange },
    orders: { current: todayOrders, previous: previousOrderCount, changePercent: calcChange(todayOrders, previousOrderCount) },
    expenses: { current: todayExpenses, previous: prevExpenses, changePercent: calcChange(todayExpenses, prevExpenses) },
    netCashFlow: {
      current: currentRevenue - todayExpenses,
      previous: previousRevenue - prevExpenses,
      changePercent: calcChange(currentRevenue - todayExpenses, previousRevenue - prevExpenses),
    },
  };

  // Low stock filtering (currentQuantity <= lowStockThreshold)
  const lowStock = lowStockItems
    .filter((item) => Number(item.currentQuantity) <= Number(item.lowStockThreshold))
    .map((item) => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      currentQuantity: Number(item.currentQuantity),
      lowStockThreshold: Number(item.lowStockThreshold),
    }));

  // Customer insights: classify active/at-risk/lapsed
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;
  let activeCount = 0;
  let atRiskCount = 0;
  let lapsedCount = 0;

  for (const c of allCustomers) {
    const lastOrderDate = c.orders.length > 0 ? c.orders[0].createdAt : null;
    if (!lastOrderDate) {
      if (now - c.createdAt.getTime() < thirtyDays) {
        // new customer, no orders yet — skip from active/at-risk/lapsed
      } else {
        lapsedCount++;
      }
    } else {
      const daysSince = now - lastOrderDate.getTime();
      if (daysSince <= thirtyDays) activeCount++;
      else if (daysSince <= ninetyDays) atRiskCount++;
      else lapsedCount++;
    }
  }

  return apiSuccess({
    todayOrders,
    inProgress,
    readyForPickup,
    todayRevenue: currentRevenue,
    todayOmset: currentOmset,
    omsetChange,
    previousRevenue,
    revenueChange,
    topCustomers,
    serviceBreakdown,
    paymentMethodBreakdown,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customer.name,
      status: o.status,
      totalAmount: Number(o.totalAmount),
      createdAt: o.createdAt.toISOString(),
    })),
    // New widget data
    cashFlow: {
      income: currentRevenue,
      expenses: todayExpenses,
      net: currentRevenue - todayExpenses,
      walletDeposits,
    },
    orderPipeline: {
      RECEIVED: pipelineReceived,
      IN_PROGRESS: pipelineInProgress,
      READY: pipelineReady,
      DELIVERED: pipelineDelivered,
    },
    lowStock,
    customerInsights: {
      total: totalCustomerCount,
      newThisWeek: newCustomerCount,
      active: activeCount,
      atRisk: atRiskCount,
      lapsed: lapsedCount,
    },
    comparison,
    unpaidDelivered,
    unpaidOrders: unpaidOrdersRaw.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customer.name,
      customerPhone: o.customer.phone,
      totalAmount: Number(o.totalAmount),
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt.toISOString(),
    })),
    turnaround: (() => {
      const hours = turnaroundOrders
        .filter((o) => o.receivedAt && o.deliveredAt)
        .map((o) => (o.deliveredAt!.getTime() - o.receivedAt!.getTime()) / (1000 * 60 * 60));
      if (hours.length === 0) return { avgHours: null, fastestHours: null, slowestHours: null, completedCount: 0 };
      return {
        avgHours: hours.reduce((a, b) => a + b, 0) / hours.length,
        fastestHours: Math.min(...hours),
        slowestHours: Math.max(...hours),
        completedCount: hours.length,
      };
    })(),
    sparkline: await (async () => {
      // Compute the 7 day-ranges, then fire all counts in parallel (was a
      // sequential for-loop with await — 7 serial DB round-trips).
      const ranges: { from: Date; to: Date }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        ranges.push({ from: d, to: endOfDay(new Date(d)) });
      }
      return Promise.all(
        ranges.map(({ from, to }) =>
          prisma.order.count({
            where: {
              branchId: { in: branchIds },
              module: moduleFilter,
              OR: [
                { receivedAt: { gte: from, lte: to } },
                { receivedAt: null, createdAt: { gte: from, lte: to } },
              ],
            },
          }),
        ),
      );
    })(),
  });
});
