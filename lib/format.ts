import { endOfDay } from "./dates";

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatCompactCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num) || num === 0) return "Rp 0";
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}jt`;
  if (abs >= 1_000) return `${sign}Rp ${(abs / 1_000).toFixed(0)}rb`;
  return `${sign}Rp ${abs.toLocaleString("id-ID")}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return formatDate(d);
}

/**
 * Builds a Prisma date filter object from optional date strings.
 * @returns { where: Prisma date filter, hasFilter: true if dates were provided, dateFilter: raw date object for nesting }
 */
export function buildDateFilter(fromStr: string | null, toStr: string | null): {
  where: Record<string, unknown>;
  hasFilter: boolean;
  dateFilter: { gte?: Date; lte?: Date };
} {
  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (fromStr) dateFilter.gte = new Date(fromStr);
  if (toStr) {
    const to = endOfDay(new Date(toStr));
    dateFilter.lte = to;
  }
  const hasFilter = Object.keys(dateFilter).length > 0;
  return {
    where: hasFilter
      ? { OR: [{ receivedAt: dateFilter }, { receivedAt: null, createdAt: dateFilter }] }
      : {},
    hasFilter,
    dateFilter,
  };
}
