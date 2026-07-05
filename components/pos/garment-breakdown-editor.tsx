"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { DEFAULT_GARMENT_CATEGORIES, GARMENT_GROUPS } from "@/lib/constants";
import { ChevronDown, ChevronUp, Plus, Minus, X, Search, Shirt } from "lucide-react";
import { Input } from "@/components/ui/input";

// ponytail: the PER_KG garment picker. Curated categories only (no auto-save —
// that cluttered the list). Grouped under sticky headers for fast scanning,
// with selected-state chips (+ count badges) so the kasir sees what's in the
// bag at a glance, and a sticky live search that collapses to a flat list.

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
  const countFor = (name: string) => value.find((g) => g.name === name)?.qty ?? 0;

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return DEFAULT_GARMENT_CATEGORIES;
    return DEFAULT_GARMENT_CATEGORIES.filter((cat) => {
      const label = t(cat.labelKey).toLowerCase();
      return (
        label.includes(q) ||
        cat.id.toLowerCase().includes(q) ||
        cat.keywords.some((kw) => kw.includes(q))
      );
    });
  }, [searchQuery, t]);

  // When searching, render one flat section (no headers); otherwise group.
  const sections = useMemo(() => {
    if (searchQuery.trim()) return [{ labelKey: null as string | null, items: filtered }];
    return GARMENT_GROUPS.map((g) => ({
      labelKey: g.labelKey,
      items: filtered.filter((c) => c.group === g.id),
    })).filter((s) => s.items.length > 0);
  }, [filtered, searchQuery]);

  const addItem = (name: string) => {
    const existing = value.find((g) => g.name === name);
    if (existing) {
      onChange(value.map((g) => (g.name === name ? { ...g, qty: g.qty + 1 } : g)));
    } else {
      onChange([...value, { name, qty: 1 }]);
      if (!expanded) setExpanded(true);
    }
  };

  const updateQty = (name: string, delta: number) => {
    onChange(
      value
        .map((g) => (g.name === name ? { ...g, qty: Math.max(0, g.qty + delta) } : g))
        .filter((g) => g.qty > 0),
    );
  };

  const setQtyDirect = (name: string, raw: string) => {
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed <= 0) {
      onChange(value.filter((g) => g.name !== name));
    } else {
      onChange(value.map((g) => (g.name === name ? { ...g, qty: parsed } : g)));
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
        <div className="mt-3 animate-in fade-in-0 slide-in-from-bottom-2 space-y-3 rounded-xl border border-border/50 bg-muted/20 p-3">
          {/* Sticky live search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("garment.searchPlaceholder")}
              className="w-full rounded-lg border border-border/40 bg-background py-2 pl-8 pr-8 text-sm outline-none focus:ring-2 focus:ring-ring/30"
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

          {/* Grouped, scrollable chip area */}
          <div className="max-h-64 overflow-y-auto scroll-smooth rounded-lg">
            {filtered.length === 0 ? (
              <p className="px-1 py-2 text-xs text-muted-foreground">{t("garment.noMatch")}</p>
            ) : (
              sections.map((section, si) => (
                <div key={si} className={si > 0 ? "mt-1" : ""}>
                  {section.labelKey && (
                    <div className="sticky top-0 z-10 bg-muted/70 px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                      {t(section.labelKey)}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-1.5 p-1 sm:grid-cols-3">
                    {section.items.map((cat) => {
                      const label = t(cat.labelKey);
                      const count = countFor(label);
                      const selected = count > 0;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => addItem(label)}
                          aria-label={selected ? `${label}, ${count}` : label}
                          className={`flex min-h-[40px] items-center justify-between gap-2 rounded-lg border px-2.5 text-sm font-medium transition-all active:scale-95 ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/40 bg-background hover:bg-accent/50"
                          }`}
                        >
                          <span className="truncate">{label}</span>
                          {selected && (
                            <span className="min-w-[20px] shrink-0 rounded-full bg-primary px-1.5 text-center text-[11px] font-bold leading-5 text-primary-foreground">
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Custom one-off item (de-emphasized fallback) */}
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={handleCustomKeyDown}
              placeholder={t("garment.customName")}
              className="h-9"
            />
            <button
              type="button"
              onClick={addCustomItem}
              disabled={!customName.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/40 bg-background transition-colors hover:bg-accent/50 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Added items — precise qty edit / remove */}
          {value.length > 0 ? (
            <div className="space-y-2">
              {value.map((g) => (
                <div
                  key={g.name}
                  className="flex items-center gap-2 rounded-lg border border-border/30 bg-background px-3 py-2"
                >
                  <span className="flex-1 truncate text-sm font-medium">{g.name}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateQty(g.name, -1)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/30 transition-colors hover:bg-accent/60"
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
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                      placeholder="0"
                      className="w-16 rounded-lg border border-border/30 bg-transparent px-2 py-1.5 text-center text-sm font-semibold outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateQty(g.name, 1)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/30 transition-colors hover:bg-accent/60"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(g.name)}
                      className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 pt-1 text-xs text-muted-foreground">
                <span>
                  {totalCount} {t("garment.quantity").toLowerCase()}
                </span>
              </div>
            </div>
          ) : (
            <p className="py-1 text-xs text-muted-foreground">{t("garment.noDetails")}</p>
          )}
        </div>
      )}
    </div>
  );
}
