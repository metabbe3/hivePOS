"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRole } from "@/hooks/use-role";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";
import { apiFetch, ApiClientError } from "@/modules/shared";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calendar, Activity, Wallet, Users } from "lucide-react";
import { DashboardSkeleton } from "@/components/shared/loading";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

import { StatsCards } from "@/components/dashboard/stats-cards";
import { CashFlowCard } from "@/components/dashboard/cash-flow-card";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { SLATracker } from "@/components/dashboard/sla-tracker";
import { UnpaidOrdersCard } from "@/components/dashboard/unpaid-orders-card";
import { OrderPipelineCard } from "@/components/dashboard/order-pipeline-card";
import { PaymentMethodsCard } from "@/components/dashboard/payment-methods-card";
import { RecentOrdersCard } from "@/components/dashboard/recent-orders-card";
import { AlertSummary } from "@/components/dashboard/alert-summary";
import { CollapsibleSection } from "@/components/dashboard/collapsible-section";

// ponytail: dynamic-import the two Recharts-bound cards so recharts stays
// out of the dashboard's initial JS bundle. Loads after hydration.
const RevenueTrendCard = dynamic(
  () => import("@/components/dashboard/revenue-trend-card").then(m => ({ default: m.RevenueTrendCard })),
  { ssr: false },
);
const ServiceCompositionCard = dynamic(
  () => import("@/components/dashboard/service-composition-card").then(m => ({ default: m.ServiceCompositionCard })),
  { ssr: false },
);
// Collapsed "customers" section (defaultOpen=false) — defer these so they stay
// out of the initial bundle/hydration; they load when the section opens.
const TopCustomersCard = dynamic(
  () => import("@/components/dashboard/top-customers-card").then(m => ({ default: m.TopCustomersCard })),
  { ssr: false },
);
const CustomerInsightsCard = dynamic(
  () => import("@/components/dashboard/customer-insights-card").then(m => ({ default: m.CustomerInsightsCard })),
  { ssr: false },
);
const LowStockCard = dynamic(
  () => import("@/components/dashboard/low-stock-card").then(m => ({ default: m.LowStockCard })),
  { ssr: false },
);
const HeatmapCard = dynamic(
  () => import("@/components/dashboard/heatmap-card").then(m => ({ default: m.HeatmapCard })),
  { ssr: false },
);
import { QuickActionsBar } from "@/components/dashboard/quick-actions-bar";
import { TurnaroundCard } from "@/components/dashboard/turnaround-card";

import type { Stats, HeatmapData } from "@/components/dashboard/dashboard-types";

function getGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t("dashboard.goodMorning");
  if (hour < 17) return t("dashboard.goodAfternoon");
  return t("dashboard.goodEvening");
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [granularity, setGranularity] = useState<"daily" | "weekly" | "monthly">("daily");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const router = useRouter();
  const { isEmployee, isSuperAdmin, isLoading: roleLoading } = useRole();
  const { data: session } = useSession();
  const { t } = useTranslation();

  useEffect(() => {
    if (roleLoading) return;
    if (isSuperAdmin) router.replace("/super-admin");
    else if (isEmployee) router.replace("/laundry/orders");
  }, [isEmployee, isSuperAdmin, roleLoading, router]);

  // ponytail: skip fetches until role resolves — super-admins/employees get
  // redirected by the effect above, and firing these with their null-tenantId
  // session surfaces as 5xx Prisma rejections in ErrorLog.
  useEffect(() => {
    if (roleLoading || isSuperAdmin || isEmployee) return;
    let cancelled = false;
    apiFetch<Stats>(`/api/dashboard/stats?from=${dateFrom}&to=${dateTo}`)
      .then((r) => {
        if (!cancelled) setStats(r.data);
      })
      .catch((err) => {
        if (err instanceof ApiClientError) toast.error(err.message);
      });
    return () => { cancelled = true; };
  }, [dateFrom, dateTo, roleLoading, isSuperAdmin, isEmployee]);

  useEffect(() => {
    if (roleLoading || isSuperAdmin || isEmployee) return;
    let cancelled = false;
    apiFetch<HeatmapData>(`/api/dashboard/heatmap?from=${dateFrom}&to=${dateTo}&granularity=${granularity}`)
      .then((r) => { if (!cancelled) setHeatmap(r.data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [dateFrom, dateTo, granularity, roleLoading, isSuperAdmin, isEmployee]);

  const refresh = useCallback(() => {
    setSpinning(true);
    Promise.all([
      apiFetch<Stats>(`/api/dashboard/stats?from=${dateFrom}&to=${dateTo}`),
      apiFetch<HeatmapData>(`/api/dashboard/heatmap?from=${dateFrom}&to=${dateTo}&granularity=${granularity}`),
    ])
      .then(([statsRes, heatmapRes]) => {
        setStats(statsRes.data);
        setHeatmap(heatmapRes.data);
      })
      .catch((err) => {
        toast.error(err instanceof ApiClientError ? err.message : t("dashboard.failedLoadStats"));
      })
      .finally(() => setSpinning(false));
  }, [dateFrom, dateTo, granularity, t]);

  if (roleLoading || isEmployee || isSuperAdmin) return null;
  if (!stats) return <DashboardSkeleton />;

  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "there";

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header with date filter */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">{t("dashboard.title")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {getGreeting(t)}, {userName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile filter toggle */}
            <Button
              variant="outline"
              size="sm"
              className="sm:hidden"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <Calendar className="h-4 w-4 mr-1" />
              {t("common.date")}
            </Button>
            {/* Refresh button with tooltip */}
            <Tooltip>
              <TooltipTrigger render={
                <Button variant="outline" size="icon" onClick={refresh} className="h-9 w-9 shrink-0" />
              }>
                <RefreshCw className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} />
              </TooltipTrigger>
              <TooltipContent>{t("dashboard.refresh")}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Date range picker - collapsible on mobile */}
        <div className={`${filtersOpen ? 'block' : 'hidden'} sm:block`}>
          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
          />
        </div>

        {/* Always visible: alerts + hero metrics + quick actions */}
        <AlertSummary
          unpaidOrders={stats.unpaidOrders}
          lowStock={stats.lowStock}
        />
        <StatsCards stats={stats} />
        <QuickActionsBar />

        {/* Operations: live order flow */}
        <CollapsibleSection
          id="operations"
          title={t("dashboard.sections.operations")}
          icon={Activity}
          defaultOpen={true}
        >
          <OrderPipelineCard pipeline={stats.orderPipeline} />
          <TurnaroundCard data={stats.turnaround} />
          <SLATracker />
          <KanbanBoard />
        </CollapsibleSection>

        {/* Financials: revenue + payment + outstanding */}
        <CollapsibleSection
          id="financials"
          title={t("dashboard.sections.financials")}
          icon={Wallet}
          defaultOpen={true}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <RevenueTrendCard
              data={heatmap?.revenueTrend ?? []}
              granularity={granularity}
              onGranularityChange={setGranularity}
            />
            <CashFlowCard cashFlow={stats.cashFlow} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ServiceCompositionCard services={stats.serviceBreakdown} />
            <PaymentMethodsCard breakdown={stats.paymentMethodBreakdown} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <UnpaidOrdersCard orders={stats.unpaidOrders} />
            <RecentOrdersCard
              orders={stats.recentOrders}
              onCreateOrder={() => router.push("/laundry/orders/new")}
            />
          </div>
        </CollapsibleSection>

        {/* Customers & Stock: insights + low stock + activity heatmap */}
        <CollapsibleSection
          id="customers"
          title={t("dashboard.sections.customers")}
          icon={Users}
          defaultOpen={false}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <TopCustomersCard customers={stats.topCustomers} />
            <CustomerInsightsCard insights={stats.customerInsights} />
          </div>
          <LowStockCard lowStock={stats.lowStock} />
          {heatmap && <HeatmapCard heatmap={heatmap} />}
        </CollapsibleSection>
      </div>
    </TooltipProvider>
  );
}
