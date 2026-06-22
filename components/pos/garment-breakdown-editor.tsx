"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { DEFAULT_GARMENT_CATEGORIES } from "@/lib/constants";
import { ChevronDown, ChevronUp, Plus, Minus, X, Search, Shirt } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface GarmentDetail {
  name: string;
  qty: number;
}

interface GarmentBreakdownEditorProps {
  value: GarmentDetail[];
  onChange: (items: GarmentDetail[]) => void;
}

export function GarmentBreakdownEditor({ value, onChange }: GarmentBreakdownEditorProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(value.length > 0);
  const [customName, setCustomName] = useState("");
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const totalCount = value.reduce((sum, g) => sum + g.qty, 0);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return DEFAULT_GARMENT_CATEGORIES;
    const q = searchQuery.toLowerCase().trim();
    return DEFAULT_GARMENT_CATEGORIES.filter((cat) => {
      const label = t(cat.labelKey).toLowerCase();
      const keywordMatch = cat.keywords.some((kw) => kw.includes(q));
      return label.includes(q) || keywordMatch || cat.id.toLowerCase().includes(q);
    });
  }, [searchQuery, t]);

  const addItem = (name: string) => {
    const existing = value.find((g) => g.name === name);
    if (existing) {
      onChange(value.map((g) => g.name === name ? { ...g, qty: g.qty + 1 } : g));
    } else {
      onChange([...value, { name, qty: 1 }]);
      if (!expanded) setExpanded(true);
    }
  };

  const updateQty = (name: string, delta: number) => {
    onChange(
      value
        .map((g) => g.name === name ? { ...g, qty: Math.max(0, g.qty + delta) } : g)
        .filter((g) => g.qty > 0)
    );
  };

  const setQtyDirect = (name: string, raw: string) => {
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed <= 0) {
      onChange(value.filter((g) => g.name !== name));
    } else {
      onChange(value.map((g) => g.name === name ? { ...g, qty: parsed } : g));
    }
  };

  const removeItem = (name: string) => {
    onChange(value.filter((g) => g.name !== name));
  };

  const addCustomItem = () => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    addItem(trimmed);
    setCustomName("");
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomItem();
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
      >
        <Shirt className="h-4 w-4" />
        {expanded ? (
          <>
            <ChevronUp className="h-4 w-4" />
            <span>{t("garment.collapse")}</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            <span>{t("garment.expand")}</span>
            {value.length > 0 && (
              <span className="ml-1 rounded-full bg-sky-100 dark:bg-sky-900/40 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-300">
                {totalCount}
              </span>
            )}
          </>
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 rounded-xl border border-border/50 bg-muted/30 p-3">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("garment.searchPlaceholder")}
              className="w-full rounded-lg border border-border/40 bg-background pl-8 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Quick-add buttons */}
          <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => addItem(t(cat.labelKey))}
                  className="rounded-full border border-border/40 bg-background px-3.5 py-1.5 text-xs font-medium hover:bg-accent/50 active:bg-accent/70 transition-colors whitespace-nowrap min-h-[36px]"
                >
                  + {t(cat.labelKey)}
                </button>
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-1">{t("garment.noMatch")}</p>
            )}
          </div>

          {/* Custom item input */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={handleCustomKeyDown}
                placeholder={t("garment.customName")}
                className="h-9"
              />
            </div>
            <button
              type="button"
              onClick={addCustomItem}
              disabled={!customName.trim()}
              className="h-9 w-9 rounded-full border border-border/40 bg-background flex items-center justify-center hover:bg-accent/50 transition-colors disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Added items list */}
          {value.length > 0 ? (
            <div className="space-y-2">
              {value.map((g) => (
                <div
                  key={g.name}
                  className="flex items-center gap-2 rounded-lg bg-background px-3 py-2 border border-border/30"
                >
                  <span className="text-sm font-medium flex-1 truncate">{g.name}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateQty(g.name, -1)}
                      className="h-9 w-9 rounded-full border border-border/30 flex items-center justify-center hover:bg-accent/60 transition-colors shrink-0"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={qtyInputs[g.name] ?? (g.qty === 0 ? "" : String(g.qty))}
                      onChange={(e) => {
                        setQtyInputs({ ...qtyInputs, [g.name]: e.target.value });
                      }}
                      onBlur={() => {
                        const raw = qtyInputs[g.name] ?? String(g.qty);
                        const next = { ...qtyInputs };
                        delete next[g.name];
                        setQtyInputs(next);
                        setQtyDirect(g.name, raw);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                      placeholder="0"
                      className="w-16 rounded-lg border border-border/30 bg-transparent px-2 py-1.5 text-sm text-center font-semibold outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateQty(g.name, 1)}
                      className="h-9 w-9 rounded-full border border-border/30 flex items-center justify-center hover:bg-accent/60 transition-colors shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(g.name)}
                      className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Total count */}
              <div className="flex items-center justify-between px-3 pt-1 text-xs text-muted-foreground">
                <span>{totalCount} {t("garment.quantity").toLowerCase()}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-1">{t("garment.noDetails")}</p>
          )}
        </div>
      )}
    </div>
  );
}
