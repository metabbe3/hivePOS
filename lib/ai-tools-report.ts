import { prisma } from "@/lib/prisma";

// Report data proxy — fetches data from existing report logic
// Instead of extracting pure functions from every route, we call them via internal fetch
// This avoids modifying 17 existing route files

const APP_BASE_URL = process.env.INTERNAL_APP_URL || "http://localhost:3000";

interface ReportQuery {
  report: string;
  params?: Record<string, string>;
}

const AVAILABLE_REPORTS: Record<string, { path: string; description: string }> = {
  revenue: {
    path: "/api/reports/revenue",
    description: "Gross/net revenue, payment method breakdown, daily trend, payment status breakdown",
  },
  profit: {
    path: "/api/reports/profit",
    description: "Revenue vs expenses, daily comparison trend, profit margin",
  },
  orders: {
    path: "/api/reports/orders",
    description: "Order status distribution, turnaround time (avg + distribution), daily volume, service breakdown",
  },
  services: {
    path: "/api/reports/services",
    description: "Per-service revenue, quantity, weight, breakdown by PER_KG vs PER_ITEM",
  },
  customers: {
    path: "/api/reports/customers",
    description: "New vs returning analysis, top spenders, outstanding balances by customer",
  },
  expenses: {
    path: "/api/reports/expenses",
    description: "Expense summary by category, daily trend",
  },
  outstanding: {
    path: "/api/reports/outstanding",
    description: "Unpaid orders list with aging, grouped by customer",
  },
  inventory: {
    path: "/api/reports/inventory",
    description: "Current stock levels, values, low stock alerts, recent movements",
  },
  commission: {
    path: "/api/reports/commission",
    description: "Per-service commission calculation (FLAT/PERCENTAGE), total commission",
  },
  financial_statement: {
    path: "/api/reports/financial-statement",
    description: "Full financial overview: P&L, daily breakdown, top services, turnaround, payment methods, inventory",
  },
  payment_collection: {
    path: "/api/reports/payment-collection",
    description: "Collections from old orders, unpaid grouped by month",
  },
  monthly_pnl: {
    path: "/api/reports/monthly-pnl",
    description: "Monthly P&L with daily transactions, annual comparison, per-KG vs per-item income",
  },
  dashboard_stats: {
    path: "/api/dashboard/stats",
    description: "Real-time KPIs: revenue, orders, cash flow, order pipeline, customer insights (active/at-risk/lapsed)",
  },
  dashboard_heatmap: {
    path: "/api/dashboard/heatmap",
    description: "Hourly patterns by day-of-week, revenue trends, customer visit patterns",
  },
  dashboard_kanban: {
    path: "/api/dashboard/kanban",
    description: "Active orders tracking with express identification, status, items",
  },
};

export function getReportList(): { name: string; description: string }[] {
  return Object.entries(AVAILABLE_REPORTS).map(([name, info]) => ({
    name,
    description: info.description,
  }));
}

export async function executeReportQuery(
  query: ReportQuery,
  sessionCookie?: string,
): Promise<string> {
  const reportInfo = AVAILABLE_REPORTS[query.report];
  if (!reportInfo) {
    return JSON.stringify({
      error: `Unknown report: "${query.report}". Available: ${Object.keys(AVAILABLE_REPORTS).join(", ")}`,
    });
  }

  try {
    // Build URL with params
    const url = new URL(reportInfo.path, APP_BASE_URL);
    if (query.params) {
      for (const [key, value] of Object.entries(query.params)) {
        url.searchParams.set(key, value);
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (sessionCookie) {
      headers["Cookie"] = sessionCookie;
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return JSON.stringify({ error: "Laporan tidak tersedia saat ini" });
    }

    const data = await response.json();

    // Convert Decimal values
    return JSON.stringify(convertDecimals(data));
  } catch (err) {
    const msg = (err as Error).message || "";
    const lower = msg.toLowerCase();
    if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("abort")) {
      return JSON.stringify({ error: "Laporan terlalu lama dimuat, coba lagi" });
    }
    return JSON.stringify({ error: "Laporan tidak tersedia saat ini" });
  }
}

function convertDecimals(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "object" && obj !== null && "toFixed" in obj && typeof (obj as { toFixed?: unknown }).toFixed === "function") {
    return Number(obj);
  }
  if (Array.isArray(obj)) return obj.map(convertDecimals);
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = convertDecimals(value);
    }
    return result;
  }
  return obj;
}
