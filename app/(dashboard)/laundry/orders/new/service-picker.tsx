"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { PRICING_TYPE_LABELS, SERVICE_CATEGORIES } from "@/lib/constants";
import { filterBaseItems } from "@/lib/service-transformer";
import type { BaseItem } from "@/lib/service-transformer";
import { SpeedModal } from "@/components/pos/speed-modal";
import { useTranslation } from "@/hooks/use-translation";
import { useNewOrder } from "./new-order-context";

export function ServicePicker() {
  const { baseItems, addServiceItem } = useNewOrder();
  const { t } = useTranslation();

  const [svcSearch, setSvcSearch] = useState("");
  const [showAllServices, setShowAllServices] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [speedModalItem, setSpeedModalItem] = useState<BaseItem | null>(null);
  const [speedModalOpen, setSpeedModalOpen] = useState(false);

  return (
    <>
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

      <SpeedModal
        baseItem={speedModalItem}
        open={speedModalOpen}
        onClose={() => { setSpeedModalOpen(false); setSpeedModalItem(null); }}
        onSelect={(serviceId) => addServiceItem(serviceId)}
      />
    </>
  );
}
