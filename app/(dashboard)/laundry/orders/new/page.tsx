"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, X, Loader2, Search, Plus, Minus, Clock, Trash2, UserPlus, User, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { PageLoading } from "@/components/shared/loading";
import { PRICING_TYPE_LABELS, SERVICE_CATEGORIES } from "@/lib/constants";
import { useTranslation } from "@/hooks/use-translation";
import { transformServices, filterBaseItems } from "@/lib/service-transformer";
import type { BaseItem } from "@/lib/service-transformer";
import { SpeedModal } from "@/components/pos/speed-modal";
import { GarmentBreakdownEditor, type GarmentDetail } from "@/components/pos/garment-breakdown-editor";
import { generateFastCashOptions } from "@/lib/fast-cash";
import { apiFetch, ApiClientError } from "@/modules/shared";

interface Service {
  id: string;
  name: string;
  pricingType: "PER_KG" | "PER_ITEM";
  basePrice: number;
  isActive: boolean;
  groupId: string | null;
  group: { id: string; name: string } | null;
}

interface ServiceGroup {
  id: string;
  name: string;
  sortOrder: number;
  _count?: { services: number };
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number;
}

interface LineItem {
  serviceId: string;
  quantity: string;
  weightKg: string;
  garmentBreakdown: GarmentDetail[];
}

export default function NewOrderPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Customer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [custSearch, setCustSearch] = useState("");
  const [showCustResults, setShowCustResults] = useState(false);
  const [showNewCust, setShowNewCust] = useState(false);
  const [custForm, setCustForm] = useState({ name: "", phone: "" });
  const [custModalOpen, setCustModalOpen] = useState(false);

  // Close customer dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-customer-search]")) {
        setShowCustResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Items
  const [items, setItems] = useState<LineItem[]>([]);
  const [orderNotes, setOrderNotes] = useState("");

  // Service search & show more
  const [svcSearch, setSvcSearch] = useState("");
  const [showAllServices, setShowAllServices] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Base items (transformed from flat services)
  const baseItems = useMemo(() => transformServices(services), [services]);

  // Speed modal
  const [speedModalItem, setSpeedModalItem] = useState<BaseItem | null>(null);
  const [speedModalOpen, setSpeedModalOpen] = useState(false);

  // Discount
  const [discountMode, setDiscountMode] = useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState("");

  // Custom date/time
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customDateTime, setCustomDateTime] = useState(""); // initialized on toggle

  // Payment (client-side only for fast cash change calculation)
  const [paymentMethod, setPaymentMethod] = useState<"PAY_LATER" | "CASH" | "DEPOSIT" | "QRIS" | "TRANSFER">("PAY_LATER");
  const [cashReceived, setCashReceived] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<Service[]>("/api/services"),
      apiFetch<Customer[]>("/api/customers"),
      apiFetch<ServiceGroup[]>("/api/service-groups"),
    ]).then(([svcs, custs, groups]) => {
      setServices(svcs.data.filter((s) => s.isActive));
      setCustomers(custs.data);
      setServiceGroups(groups.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  function getService(id: string) {
    return services.find((s) => s.id === id);
  }

  function calcSubtotal(item: LineItem) {
    const svc = getService(item.serviceId);
    if (!svc) return 0;
    return svc.pricingType === "PER_KG"
      ? svc.basePrice * (parseFloat(item.weightKg) || 0)
      : svc.basePrice * (parseFloat(item.quantity) || 0);
  }

  const subtotal = items.reduce((sum, i) => sum + calcSubtotal(i), 0);

  // Discount calculation
  let discountCalculated = 0;
  if (discountMode === "percentage") {
    const pct = parseFloat(discountValue) || 0;
    discountCalculated = subtotal * Math.min(pct, 100) / 100;
  } else if (discountMode === "fixed") {
    const fixed = parseFloat(discountValue) || 0;
    discountCalculated = Math.min(fixed, subtotal);
  }

  const total = subtotal - discountCalculated;

  const totalPcs = items.reduce((sum, item) => {
    const svc = getService(item.serviceId);
    if (!svc) return sum;
    if (svc.pricingType === "PER_ITEM") {
      return sum + (parseInt(item.quantity) || 0);
    }
    // PER_KG: count from garment breakdown
    return sum + (item.garmentBreakdown?.reduce((s, g) => s + g.qty, 0) || 0);
  }, 0);

  const filteredCustomers = custSearch
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
          c.phone.includes(custSearch)
      )
    : customers;

  // Fast cash options
  const fastCashOptions = useMemo(() => generateFastCashOptions(total), [total]);
  const changeAmount = cashReceived !== null && cashReceived >= total ? cashReceived - total : 0;

  function selectCustomer(c: Customer) {
    setSelectedCustomer(c);
    setCustSearch("");
    setShowCustResults(false);
  }

  function addServiceItem(serviceId: string) {
    const svc = getService(serviceId);
    if (!svc) return;
    setItems([
      ...items,
      {
        serviceId,
        quantity: "1",
        weightKg: svc.pricingType === "PER_KG" ? "" : "",
        garmentBreakdown: [],
      },
    ]);
  }

  function updateItem(index: number, field: keyof LineItem, value: string) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  async function handleCreateCustomer(e?: React.FormEvent) {
    if (e) e.preventDefault();
    try {
      const { data: customer } = await apiFetch<Customer>("/api/customers", {
        method: "POST",
        body: custForm,
      });
      setCustomers([...customers, customer]);
      setSelectedCustomer(customer);
      setShowNewCust(false);
      setCustModalOpen(false);
      setCustForm({ name: "", phone: "" });
      toast.success(t("newOrder.customerCreated"));
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : t("newOrder.failedCreateCustomer"));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer) { toast.error(t("orders.selectCustomer")); return; }
    if (items.length === 0) { toast.error(t("orders.addItem")); return; }
    if (paymentMethod === "DEPOSIT" && (selectedCustomer.balance || 0) < total) {
      toast.error(t("newOrder.insufficientBalance"));
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the order
      const { data: order } = await apiFetch<{ id: string }>("/api/orders", {
        method: "POST",
        body: {
          customerId: selectedCustomer.id,
          notes: orderNotes || undefined,
          items: items.map((i) => ({
            serviceId: i.serviceId,
            quantity: parseFloat(i.quantity),
            weightKg: i.weightKg ? parseFloat(i.weightKg) : undefined,
            garmentBreakdown: i.garmentBreakdown?.length ? i.garmentBreakdown : undefined,
          })),
          discountType: discountMode === "none" ? undefined : discountMode === "percentage" ? "PERCENTAGE" : "FIXED",
          discountAmount: discountMode === "none" ? undefined : parseFloat(discountValue) || 0,
          receivedAt: useCustomTime && customDateTime ? new Date(customDateTime).toISOString() : undefined,
        },
      });

      // 2. Auto-record payment if not "pay later"
      if (paymentMethod !== "PAY_LATER") {
        try {
          await apiFetch(`/api/orders/${order.id}/payments`, {
            method: "POST",
            body: {
              amount: total,
              paymentMethod: paymentMethod as "CASH" | "DEPOSIT" | "QRIS" | "TRANSFER",
            },
          });
        } catch (payErr) {
          toast.warning(payErr instanceof ApiClientError ? payErr.message : t("newOrder.payLaterNote"));
        }
      }

      toast.success(t("orders.orderCreated"));
      router.push("/laundry/orders");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : t("newOrder.failedCreate"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-lg hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link href="/laundry/orders" className="hover:text-foreground transition-colors">
              {t("orders.title")}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </nav>
          <h1 className="text-2xl font-bold tracking-tight">{t("newOrder.title")}</h1>
        </div>
      </div>

      {/* Custom Date/Time */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => {
            if (useCustomTime) {
              setUseCustomTime(false);
              setCustomDateTime("");
            } else {
              setUseCustomTime(true);
              const now = new Date();
              const offset = now.getTimezoneOffset();
              const local = new Date(now.getTime() - offset * 60000);
              setCustomDateTime(local.toISOString().slice(0, 16));
            }
          }}
          className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${
            useCustomTime
              ? "border-primary/40 bg-primary/8 text-primary"
              : "border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>{t("newOrder.customTime")}</span>
        </button>
        {useCustomTime && (
          <Input
            type="datetime-local"
            value={customDateTime}
            onChange={(e) => setCustomDateTime(e.target.value)}
            className="w-full sm:w-auto sm:min-w-[220px] h-9 text-sm bg-muted/30 border-border/60 rounded-lg"
          />
        )}
        {useCustomTime && !customDateTime && (
          <span className="text-xs text-muted-foreground">{t("newOrder.customTimeHint")}</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer */}
        <Card className="border border-border/40 bg-white shadow-sm dark:bg-gray-800/80 rounded-xl overflow-visible">
          <CardHeader><CardTitle className="text-base font-semibold">{t("common.customer")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100">
                    <User className="h-4 w-4 text-sky-600" />
                  </div>
                  <div>
                    <span className="font-medium text-sm">{selectedCustomer.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{selectedCustomer.phone}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50" onClick={() => setCustModalOpen(true)}>
                    {t("newOrder.changeCustomer")}
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedCustomer(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Search existing customer */}
                <div className="relative" data-customer-search>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9 pr-20 bg-muted/30 border-border/30"
                    placeholder={t("newOrder.searchPlaceholder")}
                    value={custSearch}
                    onChange={(e) => {
                      setCustSearch(e.target.value);
                      setShowCustResults(true);
                    }}
                    onFocus={() => setShowCustResults(true)}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => { setCustModalOpen(true); setShowCustResults(false); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-sky-600 hover:text-sky-700 px-1.5 py-1 rounded hover:bg-sky-50 transition-colors"
                  >
                    + Baru
                  </button>
                  {showCustResults && filteredCustomers.length > 0 && (
                    <div className="absolute top-full z-50 mt-1 w-full rounded-xl border border-border/30 bg-popover shadow-md max-h-48 overflow-y-auto">
                      {filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2.5 text-sm first:rounded-t-xl last:rounded-b-xl hover:bg-accent/60 transition-colors"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectCustomer(c)}
                        >
                          <span className="font-medium">{c.name}</span>
                          <span className="text-muted-foreground">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {showCustResults && custSearch && filteredCustomers.length === 0 && (
                    <div className="absolute top-full z-50 mt-1 w-full rounded-xl border border-border/30 bg-popover shadow-md p-3">
                      <p className="text-xs text-muted-foreground mb-2">{t("newOrder.noCustomerFound")}</p>
                      <button
                        type="button"
                        className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setShowCustResults(false); setCustModalOpen(true); }}
                      >
                        → {t("newOrder.newCustomer")}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Service Cards — Base Item + Speed Modifier Pattern */}
        <Card className="border border-border/40 bg-white shadow-sm dark:bg-gray-800/80 rounded-xl">
          <CardHeader><CardTitle className="text-base font-semibold">{t("newOrder.addServices")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 bg-muted/30 border-border/30"
                placeholder={t("newOrder.searchServicePlaceholder")}
                value={svcSearch}
                onChange={(e) => { setSvcSearch(e.target.value); setShowAllServices(false); }}
              />
            </div>
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {(() => {
                const tabs: { id: string; label: string; count: number }[] = [
                  { id: "all", label: t("serviceCategories.all"), count: filterBaseItems(baseItems, svcSearch, "all").length },
                ];
                for (const cat of SERVICE_CATEGORIES) {
                  if (cat.id === "all" || cat.fallback) continue;
                  const count = filterBaseItems(baseItems, svcSearch, cat.id).length;
                  if (count > 0) tabs.push({ id: cat.id, label: t(cat.labelKey), count });
                }
                const othersCount = filterBaseItems(baseItems, svcSearch, "others").length;
                if (othersCount > 0) tabs.push({ id: "others", label: t("serviceCategories.others"), count: othersCount });
                return tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
                      selectedCategory === tab.id
                        ? "bg-background text-foreground shadow-sm border border-border/40"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted border border-transparent"
                    }`}
                    onClick={() => { setSelectedCategory(tab.id); setShowAllServices(false); }}
                  >
                    {tab.label} {tab.count > 0 && <span className="opacity-70">({tab.count})</span>}
                  </button>
                ));
              })()}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-hidden">
              {(() => {
                const filtered = filterBaseItems(baseItems, svcSearch, selectedCategory);
                const displayed = showAllServices ? filtered : filtered.slice(0, 16);
                return displayed.map((item) => {
                  const hasVariants = item.variants.length > 1;
                  const priceDisplay = item.priceRange.min === item.priceRange.max
                    ? formatCurrency(item.priceRange.min)
                    : `${formatCurrency(item.priceRange.min)} — ${formatCurrency(item.priceRange.max)}`;

                  return (
                    <button
                      key={item.normalizedName}
                      type="button"
                      className={`flex flex-col items-start rounded-xl border border-border/40 p-3 text-left transition-all hover:shadow-md hover:border-border/80 min-w-0 overflow-hidden ${
                        item.pricingType === "PER_KG"
                          ? "hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
                          : "hover:bg-orange-50/50 dark:hover:bg-orange-950/20"
                      }`}
                      onClick={() => {
                        if (hasVariants) {
                          setSpeedModalItem(item);
                          setSpeedModalOpen(true);
                        } else {
                          addServiceItem(item.defaultServiceId);
                        }
                      }}
                    >
                      <div className="flex items-center gap-1.5 w-full mb-1">
                        <Badge variant="secondary" className={`text-[10px] rounded-full shrink-0 ${
                          item.pricingType === "PER_KG"
                            ? "bg-amber-100/80 text-amber-700 hover:bg-amber-100/80"
                            : "bg-orange-100/80 text-orange-700 hover:bg-orange-100/80"
                        }`}>
                          /{t(PRICING_TYPE_LABELS[item.pricingType])}
                        </Badge>
                        {hasVariants && (
                          <Badge variant="secondary" className="text-[10px] rounded-full bg-sky-100/80 text-sky-700 hover:bg-sky-100/80 shrink-0">
                            {item.variants.length} {t("pos.selectSpeed").toLowerCase()}
                          </Badge>
                        )}
                      </div>
                      <span className="font-medium text-sm break-words line-clamp-2">{item.baseName}</span>
                      <span className="text-lg font-bold mt-1">{priceDisplay}</span>
                    </button>
                  );
                });
              })()}
            </div>
            {(() => {
              const filtered = filterBaseItems(baseItems, svcSearch, selectedCategory);
              if (!showAllServices && filtered.length > 16) {
                return (
                  <Button type="button" variant="outline" size="sm" className="w-full border-dashed border-border/60 text-muted-foreground hover:text-foreground" onClick={() => setShowAllServices(true)}>
                    <Plus className="mr-1 h-3 w-3" />
                    {t("newOrder.showMoreServices")} ({filtered.length - 16})
                  </Button>
                );
              }
              if (showAllServices && filtered.length > 16) {
                return (
                  <Button type="button" variant="outline" size="sm" className="w-full border-dashed border-border/60 text-muted-foreground hover:text-foreground" onClick={() => setShowAllServices(false)}>
                    {t("newOrder.showLess")}
                  </Button>
                );
              }
              return null;
            })()}
          </CardContent>
        </Card>

        {/* Speed Modal */}
        <SpeedModal
          baseItem={speedModalItem}
          open={speedModalOpen}
          onClose={() => { setSpeedModalOpen(false); setSpeedModalItem(null); }}
          onSelect={(serviceId) => addServiceItem(serviceId)}
        />

        {/* Cart / Order Items */}
        {items.length > 0 && (
          <Card className="border border-border/40 bg-white shadow-sm dark:bg-gray-800/80 rounded-xl">
            <CardHeader><CardTitle className="text-base font-semibold">{t("newOrder.orderItems")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, idx) => {
                const svc = getService(item.serviceId);
                if (!svc) return null;
                return (
                  <div key={idx} className="flex items-start sm:items-center gap-3 rounded-xl border border-border/40 bg-muted/20 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{svc.name}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        {svc.pricingType === "PER_KG" ? (
                          <>
                            <button
                              type="button"
                              className="h-9 w-9 rounded-full border border-border/30 flex items-center justify-center hover:bg-accent/60 transition-colors"
                              onClick={() => {
                                const val = Math.max(0, (parseFloat(item.weightKg) || 0) - 0.5);
                                updateItem(idx, "weightKg", val > 0 ? val.toFixed(1) : "");
                              }}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              type="number"
                              step="0.1"
                              className="w-18 rounded-lg border border-border/30 px-2 py-1.5 text-sm text-center bg-transparent font-semibold"
                              value={item.weightKg}
                              onChange={(e) => updateItem(idx, "weightKg", e.target.value)}
                              placeholder="0.0"
                              autoFocus
                            />
                            <button
                              type="button"
                              className="h-9 w-9 rounded-full border border-border/30 flex items-center justify-center hover:bg-accent/60 transition-colors"
                              onClick={() => {
                                const val = (parseFloat(item.weightKg) || 0) + 0.5;
                                updateItem(idx, "weightKg", val.toFixed(1));
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <span className="text-xs text-muted-foreground ml-1">{t("newOrder.kg")}</span>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="h-9 w-9 rounded-full border border-border/30 flex items-center justify-center hover:bg-accent/60 transition-colors"
                              onClick={() => {
                                const val = Math.max(1, (parseInt(item.quantity) || 1) - 1);
                                updateItem(idx, "quantity", String(val));
                              }}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              type="number"
                              className="w-16 rounded-lg border border-border/30 px-2 py-1.5 text-sm text-center bg-transparent font-semibold"
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                            />
                            <button
                              type="button"
                              className="h-9 w-9 rounded-full border border-border/30 flex items-center justify-center hover:bg-accent/60 transition-colors"
                              onClick={() => {
                                const val = (parseInt(item.quantity) || 0) + 1;
                                updateItem(idx, "quantity", String(val));
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <span className="text-xs text-muted-foreground ml-1">{t("orders.items")}</span>
                          </>
                        )}
                      </div>
                      {svc.pricingType === "PER_KG" && (
                        <GarmentBreakdownEditor
                          value={items[idx].garmentBreakdown || []}
                          onChange={(newBreakdown) => {
                            const updated = [...items];
                            updated[idx] = { ...updated[idx], garmentBreakdown: newBreakdown };
                            setItems(updated);
                          }}
                        />
                      )}
                    </div>
                    <span className="font-bold text-sm whitespace-nowrap mt-1">
                      {formatCurrency(calcSubtotal(item))}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      onClick={() => removeItem(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}

              {/* Price Breakdown */}
              <div className="space-y-2 rounded-xl bg-gradient-to-r from-primary/8 to-primary/4 dark:from-primary/5 dark:to-primary/3 p-4 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("orderDetails.subtotal")}</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountCalculated > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("orderDetails.discount")}
                      {discountMode === "percentage" && discountValue ? ` (${discountValue}%)` : ""}
                      {discountMode === "fixed" ? ` ${t("orderDetails.fixed")}` : ""}
                    </span>
                    <span className="text-red-600">-{formatCurrency(discountCalculated)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-base">{t("common.total")}</span>
                  <span className="text-2xl font-bold">{formatCurrency(total)}</span>
                </div>
                {totalPcs > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t("garment.totalItems").replace("{count}", String(totalPcs))}</span>
                    <span />
                  </div>
                )}
              </div>

              {/* Payment Method Selector */}
              {selectedCustomer && (
                <div className="space-y-3 mt-2">
                  <span className="text-sm font-medium">{t("newOrder.payment")}</span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {([
                      { key: "PAY_LATER" as const, label: t("newOrder.payLater"), icon: <Clock className="h-4 w-4" /> },
                      { key: "CASH" as const, label: t("paymentMethod.cash"), icon: <span className="text-sm font-bold">Rp</span> },
                      { key: "DEPOSIT" as const, label: t("paymentMethod.deposit"), icon: <User className="h-4 w-4" /> },
                      { key: "QRIS" as const, label: t("paymentMethod.qris"), icon: <span className="text-sm font-bold">QR</span> },
                      { key: "TRANSFER" as const, label: t("paymentMethod.transfer"), icon: <span className="text-sm font-bold">TF</span> },
                    ]).map((pm) => (
                      <button
                        key={pm.key}
                        type="button"
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-2.5 text-xs font-semibold transition-all ${
                          paymentMethod === pm.key
                            ? "border-border bg-background text-foreground shadow-sm ring-1 ring-ring/20"
                            : "border-border/40 bg-white dark:bg-gray-800/80 hover:border-border/80 hover:bg-muted/30"
                        }`}
                        onClick={() => setPaymentMethod(pm.key)}
                      >
                        <span className="h-4 flex items-center justify-center">{pm.icon}</span>
                        <span>{pm.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* PAY_LATER note */}
                  {paymentMethod === "PAY_LATER" && (
                    <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                      {t("newOrder.payLaterNote")}
                    </p>
                  )}

                  {/* Cash: Fast Cash denomination buttons */}
                  {paymentMethod === "CASH" && fastCashOptions.length > 0 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {fastCashOptions.map((opt) => (
                          <button
                            key={opt.amount}
                            type="button"
                            className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all ${
                              cashReceived === opt.amount
                                ? "border-border bg-background text-foreground shadow-sm ring-1 ring-ring/20"
                                : "border-border/40 bg-white dark:bg-gray-800/80 hover:border-border/80"
                            }`}
                            onClick={() => setCashReceived(opt.amount)}
                          >
                            {opt.isExact ? t("newOrder.exactAmount") : opt.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">{t("newOrder.customAmount")}</Label>
                        <Input
                          type="number"
                          placeholder="Rp"
                          value={cashReceived && !fastCashOptions.some((o) => o.amount === cashReceived) ? cashReceived : ""}
                          onChange={(e) => setCashReceived(e.target.value ? parseFloat(e.target.value) : null)}
                          className="h-9 text-sm bg-muted/30 border-border/30 rounded-lg"
                        />
                      </div>
                      {cashReceived !== null && cashReceived >= total && (
                        <div className="flex justify-between items-center rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                          <span className="text-sm font-medium text-emerald-700">{t("newOrder.changeDue")}</span>
                          <span className="text-lg font-bold text-emerald-700">{formatCurrency(changeAmount)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Deposit: Wallet balance check */}
                  {paymentMethod === "DEPOSIT" && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center rounded-xl border px-4 py-3 bg-emerald-50/50 border-emerald-200">
                        <span className="text-sm text-emerald-700">{t("newOrder.depositBalance")}</span>
                        <span className="font-bold text-emerald-700">{formatCurrency(selectedCustomer.balance || 0)}</span>
                      </div>
                      {(selectedCustomer.balance || 0) >= total ? (
                        <div className="flex justify-between items-center rounded-xl border px-4 py-2.5 bg-sky-50/50 border-sky-200">
                          <span className="text-sm text-sky-700">{t("newOrder.balanceAfter")}</span>
                          <span className="font-semibold text-sky-700">{formatCurrency((selectedCustomer.balance || 0) - total)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-xl border px-4 py-3 bg-red-50 border-red-200">
                          <span className="text-sm font-medium text-red-600">{t("newOrder.insufficientBalance")}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* QRIS note */}
                  {paymentMethod === "QRIS" && (
                    <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                      {t("newOrder.qrisNote")}
                    </p>
                  )}

                  {/* Transfer note */}
                  {paymentMethod === "TRANSFER" && (
                    <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                      {t("newOrder.transferNote")}
                    </p>
                  )}
                </div>
              )}

              {/* No customer gate */}
              {items.length > 0 && !selectedCustomer && (
                <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/50 px-4 py-4 text-sm text-sky-700">
                  <UserPlus className="h-4 w-4" />
                  <span>{t("newOrder.assignCustomer")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Discount */}
        {items.length > 0 && (
          <Card className="border border-border/40 bg-white shadow-sm dark:bg-gray-800/80 rounded-xl">
            <CardHeader><CardTitle className="text-base font-semibold">{t("newOrder.discount")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    discountMode === "none"
                      ? "border-border bg-background text-foreground shadow-sm"
                      : "border-border/40 hover:bg-muted/30 text-muted-foreground"
                  }`}
                  onClick={() => { setDiscountMode("none"); setDiscountValue(""); }}
                >
                  {t("newOrder.noDiscount")}
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    discountMode === "percentage"
                      ? "border-border bg-background text-foreground shadow-sm"
                      : "border-border/40 hover:bg-muted/30 text-muted-foreground"
                  }`}
                  onClick={() => { setDiscountMode("percentage"); setDiscountValue(""); }}
                >
                  {t("newOrder.percentage")}
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    discountMode === "fixed"
                      ? "border-border bg-background text-foreground shadow-sm"
                      : "border-border/40 hover:bg-muted/30 text-muted-foreground"
                  }`}
                  onClick={() => { setDiscountMode("fixed"); setDiscountValue(""); }}
                >
                  {t("newOrder.fixedAmount")}
                </button>
              </div>
              {discountMode === "percentage" && (
                <div className="space-y-1">
                  <Label className="text-xs">{t("newOrder.discountPercentage")}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="max-w-full sm:max-w-[120px] bg-muted/30 border-border/30 rounded-lg"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              )}
              {discountMode === "fixed" && (
                <div className="space-y-1">
                  <Label className="text-xs">{t("newOrder.discountAmount")}</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rp</span>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="max-w-full sm:max-w-[200px] bg-muted/30 border-border/30 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes & Submit */}
        <Card className="border border-border/40 bg-white shadow-sm dark:bg-gray-800/80 rounded-xl">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>{t("common.notes")}</Label>
              <Textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder={t("newOrder.anyNotes")} className="bg-muted/30 border-border/30 rounded-xl" />
            </div>

            <Button type="submit" className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 shadow-md shadow-brand-600/15 transition-all hover:shadow-lg hover:brightness-105 text-white font-semibold" size="lg" disabled={submitting || !selectedCustomer || items.length === 0 || (paymentMethod === "DEPOSIT" && (selectedCustomer?.balance || 0) < total)}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {selectedCustomer ? `${t("newOrder.completePayment")} — ${formatCurrency(total)}` : `${t("orders.createOrder")} — ${formatCurrency(total)}`}
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* Customer Quick-Add Modal */}
      <Dialog open={custModalOpen} onOpenChange={setCustModalOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-sky-600" />
              {t("newOrder.newCustomer")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("common.name")}</Label>
              <Input
                placeholder={t("newOrder.namePlaceholder")}
                value={custForm.name}
                onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                className="bg-muted/30 border-border/30"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common.phone")}</Label>
              <Input
                placeholder={t("newOrder.phonePlaceholder")}
                value={custForm.phone}
                onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                className="bg-muted/30 border-border/30"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full bg-gradient-to-r from-brand-600 to-brand-700 shadow-md shadow-brand-600/15 transition-all hover:shadow-lg hover:brightness-105 text-white font-semibold" disabled={!custForm.name || !custForm.phone}>
                {t("newOrder.createAndSelect")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
