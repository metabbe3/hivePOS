import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { executeDatabaseQuery } from "@/lib/ai-tools-query";
import { executeReportQuery } from "@/lib/ai-tools-report";
import { executeWebSearch, isWebSearchEnabled } from "@/lib/ai-tools-web";

// Display names for loading states in the chat widget
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  get_daily_summary: "Ringkasan Harian",
  get_revenue_summary: "Data Pendapatan",
  get_orders_summary: "Data Pesanan",
  get_outstanding_payments: "Piutang",
  get_top_customers: "Top Pelanggan",
  get_customer_detail: "Detail Pelanggan",
  get_inventory_status: "Stok",
  get_recent_orders: "Pesanan Terbaru",
  get_service_performance: "Performa Layanan",
  get_expense_summary: "Pengeluaran",
  get_profit_summary: "Laba Rugi",
  report_revenue: "Laporan Pendapatan",
  report_profit: "Laporan Laba Rugi",
  report_orders: "Laporan Pesanan",
  report_services: "Laporan Layanan",
  report_customers: "Laporan Pelanggan",
  report_expenses: "Laporan Pengeluaran",
  report_outstanding: "Laporan Piutang",
  report_inventory: "Laporan Stok",
  report_commission: "Laporan Komisi",
  report_financial_statement: "Laporan Keuangan",
  report_payment_collection: "Penagihan",
  report_monthly_pnl: "P&L Bulanan",
  report_dashboard_stats: "Dashboard Stats",
  report_dashboard_heatmap: "Analisis Pola",
  report_dashboard_kanban: "Kanban Pesanan",
  query_database: "Database Query",
  web_search: "Pencarian Web",
};

// Unified tool executor — routes to fast tools, report proxy, query tool, or web search
// Fast tools are defined below; report/query/web tools delegate to their modules

const MAX_TOOL_CHARS = 4000;

function truncateToolResult(jsonStr: string, maxChars: number = MAX_TOOL_CHARS): string {
  if (jsonStr.length <= maxChars) return jsonStr;
  try {
    const data = JSON.parse(jsonStr);
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key]) && data[key].length > 10) {
        const total = data[key].length;
        data[key] = data[key].slice(0, 10);
        data[key].push({ _note: `… dan ${total - 10} item lainnya` });
      }
    }
    const truncated = JSON.stringify(data);
    if (truncated.length <= maxChars) return truncated;
    return truncated.slice(0, maxChars) + "\n... (data dipotong karena terlalu panjang)";
  } catch {
    return jsonStr.slice(0, maxChars) + "\n... (data dipotong)";
  }
}

export async function executeAITool(
  name: string,
  args: Record<string, unknown>,
  branchId: string,
  sessionCookie?: string,
): Promise<string> {
  try {
    // Report tools
    if (name.startsWith("report_")) {
      const reportName = name.replace("report_", "");
      const params: Record<string, string> = {};
      if (args.from) params.from = String(args.from);
      if (args.to) params.to = String(args.to);
      if (args.month) params.month = String(args.month);
      if (args.year) params.year = String(args.year);
      if (args.granularity) params.granularity = String(args.granularity);
      return await executeReportQuery({ report: reportName, params }, sessionCookie);
    }

    // Database query tool
    if (name === "query_database") {
      return await executeDatabaseQuery(args as unknown as Parameters<typeof executeDatabaseQuery>[0], branchId);
    }

    // Web search tool
    if (name === "web_search") {
      if (!isWebSearchEnabled()) {
        return JSON.stringify({ error: "Web search is not enabled." });
      }
      return await executeWebSearch(
        (args.query as string) || "",
        (args.maxResults as number) || 5,
      );
    }

    // Fast tools (existing)
    switch (name) {
      case "get_revenue_summary":
        return await getRevenueSummary(branchId, args.from as string | undefined, args.to as string | undefined);
      case "get_orders_summary":
        return await getOrdersSummary(branchId, args.status as string | undefined);
      case "get_top_customers":
        return await getTopCustomers(branchId, (args.limit as number) || 5);
      case "get_outstanding_payments":
        return await getOutstandingPayments(branchId);
      case "get_inventory_status":
        return await getInventoryStatus(branchId);
      case "get_recent_orders":
        return await getRecentOrders(branchId, (args.limit as number) || 10);
      case "get_customer_detail":
        return await getCustomerDetail(branchId, (args.query as string) || "");
      case "get_service_performance":
        return await getServicePerformance(branchId, args.from as string | undefined, args.to as string | undefined);
      case "get_expense_summary":
        return await getExpenseSummary(branchId, args.from as string | undefined, args.to as string | undefined);
      case "get_profit_summary":
        return await getProfitSummary(branchId, args.from as string | undefined, args.to as string | undefined);
      case "get_daily_summary":
        return await getDailySummary(branchId);
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    return JSON.stringify({ error: sanitizeToolError(err) });
  }
}

/** Translate raw errors into user-safe messages — never leak Prisma/query internals */
function sanitizeToolError(err: unknown): string {
  const msg = (err as Error).message || "";
  const lower = msg.toLowerCase();
  if (lower.includes("timeout") || lower.includes("timed out")) return "Proses terlalu lama, coba lagi";
  if (lower.includes("econnrefused") || lower.includes("fetch") || lower.includes("network")) return "Server sedang sibuk, coba lagi nanti";
  if (lower.includes("prisma") || lower.includes("query") || lower.includes("aggregate") || lower.includes("select")) return "Data tidak ditemukan";
  if (lower.includes("not found") || lower.includes("does not exist")) return "Data tidak ditemukan";
  return "Terjadi kesalahan saat mengambil data, coba lagi nanti";
}

// Wrapper that applies truncation to all tool results
export async function executeAIToolTruncated(
  name: string,
  args: Record<string, unknown>,
  branchId: string,
  sessionCookie?: string,
): Promise<string> {
  const result = await executeAITool(name, args, branchId, sessionCookie);
  return truncateToolResult(result);
}

async function getRevenueSummary(branchId: string, from?: string, to?: string) {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const dateFrom = from || firstOfMonth;
  const dateTo = to || today;

  const [agg, prevAgg] = await Promise.all([
    prisma.order.aggregate({
      where: {
        branchId,
        createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo + "T23:59:59") },
      },
      _sum: { totalAmount: true, discountAmount: true, paidAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: {
        branchId,
        createdAt: {
          gte: new Date(new Date(dateFrom).getTime() - (new Date(dateTo).getTime() - new Date(dateFrom).getTime())),
          lt: new Date(dateFrom),
        },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
  ]);

  const totalRevenue = Number(agg._sum.totalAmount ?? 0);
  const totalDiscount = Number(agg._sum.discountAmount ?? 0);
  const totalPaid = Number(agg._sum.paidAmount ?? 0);
  const orderCount = agg._count;
  const avgOrder = orderCount > 0 ? totalRevenue / orderCount : 0;
  const prevRevenue = Number(prevAgg._sum.totalAmount ?? 0);
  const growth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  return JSON.stringify({
    period: { from: dateFrom, to: dateTo },
    pendapatanBersih: formatCurrency(totalRevenue),
    pendapatanBersihRaw: totalRevenue,
    diskon: formatCurrency(totalDiscount),
    totalDibayar: formatCurrency(totalPaid),
    belumDibayar: formatCurrency(totalRevenue - totalPaid),
    jumlahPesanan: orderCount,
    rataRataPerPesanan: formatCurrency(avgOrder),
    pertumbuhan: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}% dari periode sebelumnya`,
  });
}

async function getOrdersSummary(branchId: string, status?: string) {
  const where: Record<string, unknown> = { branchId };
  if (status) where.status = status;

  const [byStatus, byPayment] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      where,
      _count: true,
      _sum: { totalAmount: true },
    }),
    prisma.order.groupBy({
      by: ["paymentStatus"],
      where,
      _count: true,
      _sum: { totalAmount: true, paidAmount: true },
    }),
  ]);

  const statusMap: Record<string, string> = {
    RECEIVED: "Diterima",
    IN_PROGRESS: "Diproses",
    READY: "Siap Diambil",
    DELIVERED: "Selesai",
  };

  const paymentMap: Record<string, string> = {
    PENDING: "Belum Dibayar",
    PARTIAL: "Dibayar Sebagian",
    PAID: "Lunas",
  };

  return JSON.stringify({
    byStatus: byStatus.map((s) => ({
      status: statusMap[s.status] || s.status,
      jumlah: s._count,
      total: formatCurrency(Number(s._sum.totalAmount ?? 0)),
    })),
    byPayment: byPayment.map((p) => ({
      status: paymentMap[p.paymentStatus] || p.paymentStatus,
      jumlah: p._count,
      total: formatCurrency(Number(p._sum.totalAmount ?? 0)),
      dibayar: formatCurrency(Number(p._sum.paidAmount ?? 0)),
    })),
  });
}

async function getTopCustomers(branchId: string, limit: number) {
  const customers = await prisma.order.groupBy({
    by: ["customerId"],
    where: { branchId },
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: "desc" } },
    take: limit,
  });

  const ids = customers.map((c) => c.customerId);
  const names = await prisma.customer.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, phone: true },
  });
  const nameMap = new Map(names.map((n) => [n.id, n]));

  return JSON.stringify(
    customers.map((c) => ({
      nama: nameMap.get(c.customerId)?.name || "Unknown",
      telepon: nameMap.get(c.customerId)?.phone || "-",
      totalPesanan: c._count,
      totalBelanja: formatCurrency(Number(c._sum.totalAmount ?? 0)),
    }))
  );
}

async function getOutstandingPayments(branchId: string) {
  const orders = await prisma.order.findMany({
    where: { branchId, paymentStatus: { in: ["PENDING", "PARTIAL"] } },
    select: {
      orderNumber: true,
      customer: { select: { name: true } },
      totalAmount: true,
      paidAmount: true,
      paymentStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const totalOutstanding = orders.reduce((sum, o) => sum + Number(o.totalAmount) - Number(o.paidAmount), 0);

  return JSON.stringify({
    totalBelumDibayar: formatCurrency(totalOutstanding),
    jumlahPesanan: orders.length,
    pesanan: orders.map((o) => ({
      nomor: o.orderNumber,
      pelanggan: o.customer.name,
      total: formatCurrency(Number(o.totalAmount)),
      dibayar: formatCurrency(Number(o.paidAmount)),
      sisa: formatCurrency(Number(o.totalAmount) - Number(o.paidAmount)),
      status: o.paymentStatus,
      tanggal: o.createdAt.toISOString().slice(0, 10),
    })),
  });
}

async function getInventoryStatus(branchId: string) {
  const items = await prisma.stockItem.findMany({
    where: { branchId, isActive: true },
    select: {
      name: true,
      currentQuantity: true,
      unit: true,
      lowStockThreshold: true,
      purchasePricePerUnit: true,
    },
  });

  const lowStock = items.filter((i) => Number(i.currentQuantity) <= Number(i.lowStockThreshold));
  const totalValue = items.reduce((sum, i) => sum + Number(i.currentQuantity) * Number(i.purchasePricePerUnit), 0);

  return JSON.stringify({
    totalItem: items.length,
    totalNilaiStok: formatCurrency(totalValue),
    stokRendah: lowStock.length,
    detailStokRendah: lowStock.map((i) => ({
      nama: i.name,
      stokSaatIni: `${i.currentQuantity} ${i.unit}`,
      batasMinimum: `${i.lowStockThreshold} ${i.unit}`,
    })),
  });
}

async function getRecentOrders(branchId: string, limit: number) {
  const orders = await prisma.order.findMany({
    where: { branchId },
    select: {
      orderNumber: true,
      customer: { select: { name: true, phone: true } },
      status: true,
      totalAmount: true,
      paidAmount: true,
      paymentStatus: true,
      createdAt: true,
      orderItems: {
        select: {
          service: { select: { name: true } },
          quantity: true,
          weightKg: true,
          subtotal: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const statusMap: Record<string, string> = {
    RECEIVED: "Diterima",
    IN_PROGRESS: "Diproses",
    READY: "Siap Diambil",
    DELIVERED: "Selesai",
  };

  return JSON.stringify({
    jumlah: orders.length,
    pesanan: orders.map((o) => ({
      nomor: o.orderNumber,
      pelanggan: o.customer.name,
      telepon: o.customer.phone,
      status: statusMap[o.status] || o.status,
      total: formatCurrency(Number(o.totalAmount)),
      dibayar: formatCurrency(Number(o.paidAmount)),
      statusPembayaran: o.paymentStatus,
      tanggal: o.createdAt.toISOString().slice(0, 10),
      layanan: o.orderItems.map((i) => ({
        nama: i.service.name,
        qty: Number(i.quantity),
        berat: i.weightKg ? `${i.weightKg} kg` : "-",
        subtotal: formatCurrency(Number(i.subtotal)),
      })),
    })),
  });
}

async function getCustomerDetail(branchId: string, query: string) {
  if (!query.trim()) {
    return JSON.stringify({ error: "Parameter query (nama/telepon) diperlukan" });
  }

  const customers = await prisma.customer.findMany({
    where: {
      branchId,
      OR: [
        { name: { contains: query } },
        { phone: { contains: query } },
      ],
    },
    select: {
      name: true,
      phone: true,
      email: true,
      balance: true,
      orders: {
        select: {
          orderNumber: true,
          status: true,
          totalAmount: true,
          paidAmount: true,
          paymentStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { orders: true } },
    },
    take: 5,
  });

  if (customers.length === 0) {
    return JSON.stringify({ hasil: "Tidak ditemukan pelanggan dengan kata kunci tersebut" });
  }

  const statusMap: Record<string, string> = {
    RECEIVED: "Diterima",
    IN_PROGRESS: "Diproses",
    READY: "Siap Diambil",
    DELIVERED: "Selesai",
  };

  return JSON.stringify(
    customers.map((c) => {
      const totalBelanja = c.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      return {
        nama: c.name,
        telepon: c.phone,
        email: c.email || "-",
        saldoDeposit: formatCurrency(Number(c.balance)),
        totalPesanan: c._count.orders,
        totalBelanja: formatCurrency(totalBelanja),
        pesananTerbaru: c.orders.map((o) => ({
          nomor: o.orderNumber,
          status: statusMap[o.status] || o.status,
          total: formatCurrency(Number(o.totalAmount)),
          dibayar: formatCurrency(Number(o.paidAmount)),
          statusPembayaran: o.paymentStatus,
          tanggal: o.createdAt.toISOString().slice(0, 10),
        })),
      };
    })
  );
}

async function getServicePerformance(branchId: string, from?: string, to?: string) {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const dateFrom = from || firstOfMonth;
  const dateTo = to || today;

  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        branchId,
        createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo + "T23:59:59") },
      },
    },
    select: {
      service: { select: { name: true, pricingType: true, basePrice: true } },
      quantity: true,
      weightKg: true,
      subtotal: true,
    },
  });

  // Group by service
  const serviceMap = new Map<string, { nama: string; tipe: string; hargaDasar: number; totalQty: number; totalBerat: number; totalSubtotal: number; jumlahPesanan: number }>();
  for (const item of items) {
    const key = item.service.name;
    const existing = serviceMap.get(key) || {
      nama: item.service.name,
      tipe: item.service.pricingType,
      hargaDasar: Number(item.service.basePrice),
      totalQty: 0,
      totalBerat: 0,
      totalSubtotal: 0,
      jumlahPesanan: 0,
    };
    existing.totalQty += Number(item.quantity);
    existing.totalBerat += Number(item.weightKg ?? 0);
    existing.totalSubtotal += Number(item.subtotal);
    existing.jumlahPesanan += 1;
    serviceMap.set(key, existing);
  }

  const services = [...serviceMap.values()].sort((a, b) => b.totalSubtotal - a.totalSubtotal);
  const topByQty = [...serviceMap.values()].sort((a, b) => b.totalQty - a.totalQty).slice(0, 3);

  return JSON.stringify({
    period: { from: dateFrom, to: dateTo },
    totalLayanan: services.length,
    semuaLayanan: services.map((s) => ({
      nama: s.nama,
      tipeHarga: s.tipe === "PER_KG" ? "Per KG" : "Per Item",
      hargaDasar: formatCurrency(s.hargaDasar),
      jumlahPesanan: s.jumlahPesanan,
      totalQty: s.tipe === "PER_KG" ? `${s.totalBerat.toFixed(1)} kg` : `${s.totalQty} item`,
      pendapatan: formatCurrency(s.totalSubtotal),
    })),
    layananTerpopuler: topByQty.map((s) => ({
      nama: s.nama,
      jumlah: s.tipe === "PER_KG" ? `${s.totalBerat.toFixed(1)} kg` : `${s.totalQty} item`,
      pendapatan: formatCurrency(s.totalSubtotal),
    })),
  });
}

async function getExpenseSummary(branchId: string, from?: string, to?: string) {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const dateFrom = from || firstOfMonth;
  const dateTo = to || today;

  const [expenses, byCategory] = await Promise.all([
    prisma.expense.aggregate({
      where: {
        branchId,
        date: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: {
        branchId,
        date: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: "desc" } },
    }),
  ]);

  const categoryIds = (byCategory.map((c) => c.categoryId).filter(Boolean) as string[]);
  const categories = await prisma.expenseCategory.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  return JSON.stringify({
    period: { from: dateFrom, to: dateTo },
    totalPengeluaran: formatCurrency(Number(expenses._sum.amount ?? 0)),
    jumlahTransaksi: expenses._count,
    perKategori: byCategory.map((c) => ({
      kategori: catMap.get(c.categoryId!) || "Unknown",
      total: formatCurrency(Number(c._sum.amount ?? 0)),
      jumlah: c._count,
    })),
  });
}

async function getProfitSummary(branchId: string, from?: string, to?: string) {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const dateFrom = from || firstOfMonth;
  const dateTo = to || today;

  const [revenue, expenses] = await Promise.all([
    prisma.order.aggregate({
      where: {
        branchId,
        createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo + "T23:59:59") },
      },
      _sum: { totalAmount: true, paidAmount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: {
        branchId,
        date: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      },
      _sum: { amount: true },
    }),
  ]);

  const totalRevenue = Number(revenue._sum.totalAmount ?? 0);
  const totalExpenses = Number(expenses._sum.amount ?? 0);
  const totalPaid = Number(revenue._sum.paidAmount ?? 0);
  const profit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  return JSON.stringify({
    period: { from: dateFrom, to: dateTo },
    pendapatan: formatCurrency(totalRevenue),
    pengeluaran: formatCurrency(totalExpenses),
    labaRugi: formatCurrency(profit),
    margin: `${margin.toFixed(1)}%`,
    totalDibayar: formatCurrency(totalPaid),
    belumDibayar: formatCurrency(totalRevenue - totalPaid),
    jumlahPesanan: revenue._count,
  });
}

async function getDailySummary(branchId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(new Date().getTime() + 86400000).toISOString().slice(0, 10);

  const [orders, expenses, orderCount, unpaidCount] = await Promise.all([
    prisma.order.aggregate({
      where: {
        branchId,
        createdAt: { gte: new Date(today), lt: new Date(tomorrow) },
      },
      _sum: { totalAmount: true, paidAmount: true, discountAmount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: {
        branchId,
        date: { gte: new Date(today), lt: new Date(tomorrow) },
      },
      _sum: { amount: true },
    }),
    prisma.order.count({
      where: {
        branchId,
        status: { in: ["RECEIVED", "IN_PROGRESS"] },
      },
    }),
    prisma.order.count({
      where: {
        branchId,
        paymentStatus: { in: ["PENDING", "PARTIAL"] },
      },
    }),
  ]);

  const revenue = Number(orders._sum.totalAmount ?? 0);
  const expenseTotal = Number(expenses._sum.amount ?? 0);

  return JSON.stringify({
    tanggal: today,
    pendapatanHariIni: formatCurrency(revenue),
    pengeluaranHariIni: formatCurrency(expenseTotal),
    labaHariIni: formatCurrency(revenue - expenseTotal),
    pesananBaru: orders._count,
    dibayar: formatCurrency(Number(orders._sum.paidAmount ?? 0)),
    belumDibayar: formatCurrency(revenue - Number(orders._sum.paidAmount ?? 0)),
    diskon: formatCurrency(Number(orders._sum.discountAmount ?? 0)),
    pesananAktif: orderCount,
    pesananBelumLunas: unpaidCount,
  });
}
