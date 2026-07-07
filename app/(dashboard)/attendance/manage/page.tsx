"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/modules/shared";
import { useTranslation } from "@/hooks/use-translation";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { useGuardedPage } from "@/hooks/use-guarded-page";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoading } from "@/components/shared/loading";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDuration } from "@/lib/format";

type Event = {
  id: string; userId: string; userName: string;
  type: "CLOCK_IN" | "CLOCK_OUT"; timestamp: string;
  branchId: string; branchName: string;
};
type Session = {
  inEvent?: Event;
  outEvent?: Event;
  userId: string;
  userName: string;
  branchName: string;
};
type Staff = { id: string; name: string };

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Pair individual CLOCK_IN/CLOCK_OUT events into sessions (one row per shift).
function pairEvents(events: Event[]): Session[] {
  const byUser = new Map<string, Event[]>();
  for (const e of events) {
    const arr = byUser.get(e.userId) ?? [];
    arr.push(e);
    byUser.set(e.userId, arr);
  }
  const sessions: Session[] = [];
  for (const userEvents of byUser.values()) {
    userEvents.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    let openIn: Event | null = null;
    for (const e of userEvents) {
      if (e.type === "CLOCK_IN") {
        if (openIn) {
          // Previous IN without OUT — open session
          sessions.push({ inEvent: openIn, userId: openIn.userId, userName: openIn.userName, branchName: openIn.branchName });
        }
        openIn = e;
      } else if (e.type === "CLOCK_OUT") {
        sessions.push({
          inEvent: openIn ?? undefined,
          outEvent: e,
          userId: (openIn ?? e).userId,
          userName: (openIn ?? e).userName,
          branchName: (openIn ?? e).branchName,
        });
        openIn = null;
      }
    }
    if (openIn) {
      sessions.push({ inEvent: openIn, userId: openIn.userId, userName: openIn.userName, branchName: openIn.branchName });
    }
  }
  // Most recent first (by IN time, fallback to OUT).
  sessions.sort((a, b) => {
    const aT = a.inEvent?.timestamp ?? a.outEvent?.timestamp ?? "";
    const bT = b.inEvent?.timestamp ?? b.outEvent?.timestamp ?? "";
    return bT.localeCompare(aT);
  });
  return sessions;
}

export default function AttendanceManagePage() {
  const enabled = useFeatureFlag("staffAttendance");
  const { shouldRender } = useGuardedPage("attendance", "edit");
  const { t, lang } = useTranslation();
  const confirm = useConfirm();
  const [events, setEvents] = useState<Event[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [addOpen, setAddOpen] = useState(false);
  const [addUserId, setAddUserId] = useState("");
  const [addType, setAddType] = useState<"CLOCK_IN" | "CLOCK_OUT">("CLOCK_IN");
  const [addTime, setAddTime] = useState(toLocalInput(new Date().toISOString()));
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch<Event[]>(`/api/attendance/events?from=${from}&to=${to}`);
      setEvents(r.data ?? []);
    } catch { setEvents([]); } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => {
    if (shouldRender && enabled) {
      void refresh();
      apiFetch<Staff[]>("/api/attendance/staff").then((r) => setStaff(r.data ?? [])).catch(() => {});
    } else { setLoading(false); }
  }, [shouldRender, enabled, refresh]);

  const saveTimestamp = async (id: string, value: string) => {
    try {
      await apiFetch(`/api/attendance/events/${id}`, {
        method: "PATCH",
        body: { timestamp: new Date(value).toISOString() },
      });
      toast.success(t("attendance.eventSaved"));
    } catch { toast.error(t("common.networkError")); }
  };

  const deleteSession = async (s: Session) => {
    const ok = await confirm({
      title: t("attendance.confirmDeleteEvent"),
      destructive: true,
      confirmLabel: t("common.delete"),
    });
    if (!ok) return;
    if (s.inEvent) await apiFetch(`/api/attendance/events/${s.inEvent.id}`, { method: "DELETE" }).catch(() => {});
    if (s.outEvent) await apiFetch(`/api/attendance/events/${s.outEvent.id}`, { method: "DELETE" }).catch(() => {});
    toast.success(t("attendance.eventDeleted"));
    void refresh();
  };

  const addManual = async () => {
    if (!addUserId || !addTime) return;
    setSaving(true);
    try {
      await apiFetch("/api/attendance/events", {
        method: "POST",
        body: { userId: addUserId, type: addType, timestamp: new Date(addTime).toISOString() },
      });
      toast.success(t("attendance.manualAdded"));
      setAddOpen(false);
      void refresh();
    } catch { toast.error(t("common.networkError")); }
    finally { setSaving(false); }
  };

  if (!enabled || !shouldRender) return null;
  if (loading) return <PageLoading />;

  const sessions = pairEvents(events);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("attendance.manage")}
        action={{ label: t("attendance.addManual"), onClick: () => { setAddUserId(staff[0]?.id ?? ""); setAddOpen(true); } }}
      />

      {/* Date filter */}
      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
        </div>
        <Button variant="outline" size="sm" onClick={() => void refresh()}>Refresh</Button>
      </div>

      {/* Sessions table — one row per IN→OUT shift */}
      {sessions.length === 0 ? (
        <EmptyState title={t("attendance.manage")} description={t("attendance.noEvents")} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Staff</th>
                    <th className="px-4 py-2.5 font-medium">{t("attendance.clockIn")}</th>
                    <th className="px-4 py-2.5 font-medium">{t("attendance.clockOut")}</th>
                    <th className="px-4 py-2.5 font-medium">{t("attendance.hoursWorked")}</th>
                    <th className="px-4 py-2.5 font-medium">Outlet</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, i) => {
                    const inTime = s.inEvent ? toLocalInput(s.inEvent.timestamp) : "";
                    const outTime = s.outEvent ? toLocalInput(s.outEvent.timestamp) : "";
                    const isOpen = !s.outEvent;
                    const duration = s.inEvent && s.outEvent
                      ? formatDuration(new Date(s.outEvent.timestamp).getTime() - new Date(s.inEvent.timestamp).getTime(), lang)
                      : null;
                    return (
                      <tr key={`${s.userId}-${i}`} className="border-b border-border/40 last:border-0">
                        <td className="px-4 py-2 font-medium">{s.userName}</td>
                        <td className="px-4 py-2">
                          {s.inEvent ? (
                            <input
                              type="datetime-local"
                              defaultValue={inTime}
                              onBlur={(e) => {
                                if (e.target.value && e.target.value !== inTime) void saveTimestamp(s.inEvent!.id, e.target.value);
                              }}
                              className="rounded-lg border border-border/60 bg-transparent px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {s.outEvent ? (
                            <input
                              type="datetime-local"
                              defaultValue={outTime}
                              onBlur={(e) => {
                                if (e.target.value && e.target.value !== outTime) void saveTimestamp(s.outEvent!.id, e.target.value);
                              }}
                              className="rounded-lg border border-border/60 bg-transparent px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          ) : isOpen ? (
                            <Badge variant="outline" className="border-emerald-300 text-emerald-600">Active</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {duration ? (
                            <span className="sa-tnum font-medium">{duration}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{s.branchName}</td>
                        <td className="px-4 py-2 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSession(s)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("attendance.addManual")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Staff</Label>
              <select
                value={addUserId}
                onChange={(e) => setAddUserId(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
              >
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select
                value={addType}
                onChange={(e) => setAddType(e.target.value as "CLOCK_IN" | "CLOCK_OUT")}
                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
              >
                <option value="CLOCK_IN">{t("attendance.clockIn")}</option>
                <option value="CLOCK_OUT">{t("attendance.clockOut")}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("attendance.dateTime")}</Label>
              <Input type="datetime-local" value={addTime} onChange={(e) => setAddTime(e.target.value)} />
            </div>
            <Button onClick={addManual} disabled={!addUserId || !addTime || saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {t("common.confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
