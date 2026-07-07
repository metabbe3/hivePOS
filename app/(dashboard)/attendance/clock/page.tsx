"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, ApiClientError } from "@/modules/shared";
import { useTranslation } from "@/hooks/use-translation";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { toast } from "sonner";
import { Clock3, Delete, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDuration } from "@/lib/format";

// Kiosk clock page: tap name → PIN → clocked in/out. Shows today's worked hours
// per staff + live elapsed for clocked-in. Undo on accidental clock-out.

type StaffStatus = { id: string; name: string; since: string | null; todayMs: number };
type ClockResult = { type: "CLOCK_IN" | "CLOCK_OUT"; userName: string; sessionMs?: number };

const PIN_PAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function AttendanceClockPage() {
  const enabled = useFeatureFlag("staffAttendance");
  const { t, lang } = useTranslation();
  const [status, setStatus] = useState<StaffStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StaffStatus | null>(null);
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const lastActionRef = useRef<{ userId: string; pin: string } | null>(null);

  // Tick once a minute so elapsed durations stay fresh.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const r = await apiFetch<StaffStatus[]>("/api/attendance/status");
      setStatus(r.data ?? []);
    } catch { /* session/flag issue */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (enabled) void refresh();
    else setLoading(false);
  }, [enabled, refresh]);

  // Keyboard input on the PIN pad (0-9 + backspace; no Enter-submit → prevents accidental clock-out).
  useEffect(() => {
    if (!selected) return;
    const handler = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) setPin((p) => (p.length < 8 ? p + e.key : p));
      else if (e.key === "Backspace") { e.preventDefault(); setPin((p) => p.slice(0, -1)); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected]);

  const timeFmt = (iso: string) =>
    new Date(iso).toLocaleTimeString(lang === "id" ? "id-ID" : "en-US", { hour: "2-digit", minute: "2-digit" });

  const press = (d: string) => {
    if (d === "del") setPin((p) => p.slice(0, -1));
    else if (d && pin.length < 8) setPin((p) => p + d);
  };

  const submit = async () => {
    if (!selected || pin.length < 4) return;
    setSubmitting(true);
    try {
      const r = await apiFetch<ClockResult>("/api/attendance/clock", {
        method: "POST",
        body: { userId: selected.id, pin },
      });
      const label = r.data.type === "CLOCK_IN" ? t("attendance.clockIn") : t("attendance.clockOut");
      const dur = r.data.type === "CLOCK_OUT" && r.data.sessionMs ? ` (${formatDuration(r.data.sessionMs, lang)})` : "";
      // Undo for clock-out: store the pin so the undo action can re-clock-in.
      if (r.data.type === "CLOCK_OUT") lastActionRef.current = { userId: selected.id, pin };
      toast.success(`${label} — ${r.data.userName}${dur}`, {
        duration: 8000,
        action: r.data.type === "CLOCK_OUT" ? {
          label: lang === "id" ? "Urungkan" : "Undo",
          onClick: () => {
            if (!lastActionRef.current) return;
            apiFetch<ClockResult>("/api/attendance/clock", { method: "POST", body: lastActionRef.current })
              .then(() => { toast.success(t("attendance.clockIn")); void refresh(); })
              .catch(() => {});
            lastActionRef.current = null;
          },
        } : undefined,
      });
      setSelected(null);
      setPin("");
      void refresh();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : t("attendance.wrongPin"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!enabled) return null;

  // Sort: clocked-in first, then alphabetical.
  const sorted = [...status].sort((a, b) => {
    if (a.since && !b.since) return -1;
    if (!a.since && b.since) return 1;
    return a.name.localeCompare(b.name);
  });
  const inNow = sorted.filter((s) => s.since !== null);

  return (
    <div className="space-y-6">
      <PageHeader title={t("attendance.title")} />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Clocked in now */}
          {inNow.length > 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {t("attendance.whoIn")}
              </p>
              <div className="flex flex-wrap gap-2">
                {inNow.map((s) => (
                  <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {s.name}
                    <span className="sa-tnum text-xs text-emerald-600">
                      {timeFmt(s.since!)} · {formatDuration(now - new Date(s.since!).getTime(), lang)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Staff grid */}
          {sorted.length === 0 ? (
            <EmptyState icon={Clock3} title={t("attendance.title")} description={t("attendance.noStaff")} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {sorted.map((s) => {
                const in_ = s.since !== null;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setSelected(s); setPin(""); }}
                    className={`flex h-20 flex-col items-center justify-center rounded-xl border-2 text-center transition-all active:scale-95 ${
                      in_
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/40"
                    }`}
                  >
                    <span className="px-2 text-sm font-semibold leading-tight">{s.name}</span>
                    {in_ ? (
                      <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        {formatDuration(s.todayMs, lang)}
                      </span>
                    ) : (
                      <span className="mt-1 sa-tnum text-[11px] text-muted-foreground">
                        {s.todayMs > 0 ? formatDuration(s.todayMs, lang) : "—"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* PIN pad dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setPin(""); } }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>{selected?.name} — {t("attendance.enterPin")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* PIN dots — fixed 4 (don't reveal PIN length to shoulder-surfers) */}
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`h-3 w-3 rounded-full ${i < pin.length ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {PIN_PAD.map((d, i) =>
                d === "" ? (
                  <span key={i} />
                ) : (
                  <button
                    key={i}
                    type="button"
                    onClick={() => press(d)}
                    className="flex h-14 items-center justify-center rounded-lg border border-border bg-card text-lg font-bold transition-colors hover:bg-accent/60 active:scale-95"
                  >
                    {d === "del" ? <Delete className="h-5 w-5" /> : d}
                  </button>
                ),
              )}
            </div>
            <Button onClick={submit} disabled={pin.length < 4 || submitting} className="w-full" size="lg">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t("common.confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
