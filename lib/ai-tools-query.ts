import { prisma } from "@/lib/prisma";

// Safe, structured query executor for AI tools
// Allows read-only Prisma queries against allowlisted models with branch isolation

const ALLOWED_MODELS = new Set([
  "order",
  "orderItem",
  "customer",
  "service",
  "payment",
  "expense",
  "expenseCategory",
  "stockItem",
  "stockMovement",
  "depositTransaction",
  "serviceGroup",
  "branch",
]);

const ALLOWED_OPERATIONS = new Set([
  "findMany",
  "aggregate",
  "groupBy",
  "count",
]);

// Models that have branchId for filtering
const BRANCH_FILTERED_MODELS = new Set([
  "order",
  "orderItem",
  "customer",
  "service",
  "expense",
  "expenseCategory",
  "stockItem",
  "depositTransaction",
  "serviceGroup",
  "branch",
]);

// Fields to always exclude from results
const EXCLUDED_FIELDS: Record<string, string[]> = {
  user: ["passwordHash"],
  tenant: ["settings"],
};

// Max rows returned per query
const MAX_TAKE = 100;

interface SafeQuery {
  model: string;
  operation: "findMany" | "aggregate" | "groupBy" | "count";
  where?: Record<string, unknown>;
  select?: Record<string, boolean>;
  orderBy?: Record<string, string>;
  take?: number;
  skip?: number;
  _sum?: string[];
  _count?: boolean;
  _avg?: string[];
  by?: string[];
}

// Map model names to Prisma delegate names
const MODEL_DELEGATE: Record<string, string> = {
  order: "order",
  orderItem: "orderItem",
  customer: "customer",
  service: "service",
  payment: "payment",
  expense: "expense",
  expenseCategory: "expenseCategory",
  stockItem: "stockItem",
  stockMovement: "stockMovement",
  depositTransaction: "depositTransaction",
  serviceGroup: "serviceGroup",
  branch: "branch",
};

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

export async function executeDatabaseQuery(
  query: SafeQuery,
  branchId: string
): Promise<string> {
  // Validate model
  const modelName = query.model?.toLowerCase();
  if (!modelName || !ALLOWED_MODELS.has(modelName)) {
    return JSON.stringify({ error: `Model "${query.model}" is not allowed. Allowed: ${[...ALLOWED_MODELS].join(", ")}` });
  }

  // Validate operation
  if (!ALLOWED_OPERATIONS.has(query.operation)) {
    return JSON.stringify({ error: `Operation "${query.operation}" is not allowed. Allowed: ${[...ALLOWED_OPERATIONS].join(", ")}` });
  }

  // Build where clause with branch isolation
  const userWhere = { ...(query.where || {}) };
  if (BRANCH_FILTERED_MODELS.has(modelName)) {
    // For orderItem, filter through order relation
    if (modelName === "orderItem") {
      if (!userWhere.order) {
        (userWhere as Record<string, unknown>).order = { branchId };
      } else {
        (userWhere.order as Record<string, unknown>).branchId = branchId;
      }
    } else {
      // Force branchId — cannot be overridden
      userWhere.branchId = branchId;
    }
  }

  // Cap take
  const take = query.take ? Math.min(query.take, MAX_TAKE) : MAX_TAKE;

  // Exclude sensitive fields
  const excluded = EXCLUDED_FIELDS[modelName] || [];
  const select = query.select
    ? { ...query.select, ...Object.fromEntries(excluded.map((f) => [f, false])) }
    : undefined;

  try {
    const delegate = (prisma as unknown as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>)[MODEL_DELEGATE[modelName]];

    if (!delegate || typeof delegate[query.operation] !== "function") {
      return JSON.stringify({ error: `Model "${modelName}" does not support operation "${query.operation}"` });
    }

    let args: Record<string, unknown> = {};

    switch (query.operation) {
      case "findMany":
        args = { where: userWhere, take };
        if (select) args.select = select;
        if (query.orderBy) args.orderBy = query.orderBy;
        if (query.skip) args.skip = query.skip;
        break;

      case "count":
        args = { where: userWhere };
        break;

      case "aggregate": {
        const aggregations: Record<string, unknown> = {};
        if (query._sum && query._sum.length > 0) aggregations._sum = Object.fromEntries(query._sum.map((f) => [f, true]));
        if (query._count) aggregations._count = true;
        if (query._avg && query._avg.length > 0) aggregations._avg = Object.fromEntries(query._avg.map((f) => [f, true]));
        args = { where: userWhere, ...aggregations };
        break;
      }

      case "groupBy": {
        if (!query.by || query.by.length === 0) {
          return JSON.stringify({ error: "groupBy requires 'by' field with at least one column name" });
        }
        args = { by: query.by, where: userWhere, take };
        if (query._sum && query._sum.length > 0) args._sum = Object.fromEntries(query._sum.map((f) => [f, true]));
        if (query._count) args._count = true;
        if (query._avg && query._avg.length > 0) args._avg = Object.fromEntries(query._avg.map((f) => [f, true]));
        if (query.orderBy) args.orderBy = query.orderBy;
        break;
      }
    }

    const result = await delegate[query.operation](args);
    return JSON.stringify(convertDecimals(result));
  } catch (err) {
    return JSON.stringify({ error: sanitizeQueryError(err) });
  }
}

/** Translate raw Prisma/query errors into user-safe messages */
function sanitizeQueryError(err: unknown): string {
  const msg = (err as Error).message || "";
  const lower = msg.toLowerCase();
  if (lower.includes("timeout") || lower.includes("timed out")) return "Proses terlalu lama, coba lagi";
  if (lower.includes("prisma") || lower.includes("aggregate") || lower.includes("select") || lower.includes("where")) return "Tidak bisa mengambil data saat ini";
  if (lower.includes("connect") || lower.includes("econnrefused")) return "Server sedang sibuk, coba lagi nanti";
  return "Tidak bisa mengambil data saat ini, coba lagi nanti";
}
