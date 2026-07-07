"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiClientError } from "@/modules/shared";
import { useTranslation } from "@/hooks/use-translation";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { toast } from "sonner";
import { Clock3, Delete } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDuration } from "@/lib/format";

// Simple kiosk page: the kasir opens this on the shared device, hands it to
// staff, who tap their name + enter a 4-6 digit PIN to clock in/out. One screen,
// big tap targets, instant feedback. The toggle (in/out) is resolved server-side.

type Staff = { id: string; name: string };
type InNow = { id: string; name: string; since: string };
type ClockResult = { type: "CLOCK_IN" | "CLOCK_OUT"; userName: string; sessionMs?: number };

const PIN_PAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function AttendanceClockPage() {
  const enabled = useFeatureFlag("staffAttendance");
  const { t, lang } = useTranslation();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [inNow, setInNow] = useState<InNow[]>([]);
  const [selected, setSelected] = useState<Staff | null>(null);
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Tick once a minute so elapsed-working durations on the chips stay fresh.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [s, st] = await Promise.all([
        apiFetch<Staff[]>("/api/attendance/staff"),
        apiFetch<InNow[]>("/api/attendance/status"),
      ]);
      setStaff(s.data ?? []);
      setInNow(st.data ?? []);
    } catch { /* session/flag issue — leave empty */ }
  }, []);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  const inNowIds = new Set(inNow.map((i) => i.id));
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
      toast.success(`${label} — ${r.data.userName}${dur}`);
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

  return (
    <div className="space-y-6">
      <PageHeader title={t("attendance.title")} />

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
                <span className="sa-tnum text-xs text-emerald-600">{timeFmt(s.since)} · {formatDuration(now - new Date(s.since).getTime(), lang)}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Staff name grid */}
      {staff.length === 0 ? (
        <EmptyState icon={Clock3} title={t("attendance.title")} description={t("attendance.noStaff")} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {staff.map((s) => {
            const in_ = inNowIds.has(s.id);
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
                    {t("attendance.clockedIn")}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {/* PIN pad dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setPin(""); } }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>{selected?.name} — {t("attendance.enterPin")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* PIN dots */}
            <div className="flex justify-center gap-3">
              {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
                <span
                  key={i}
                  className={`h-3 w-3 rounded-full ${i < pin.length ? "bg-primary" : "bg-muted"}`}
                />
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
              {t("common.confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
