"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/modules/shared";
import { useTranslation } from "@/hooks/use-translation";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoading } from "@/components/shared/loading";

type Row = { userId: string; name: string; hours: number; daysWorked: number; noShow: number };

export function AttendanceReport({ from, to }: { from: string; to: string }) {
  const enabled = useFeatureFlag("staffAttendance");
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    setLoading(true);
    apiFetch<Row[]>(`/api/reports/attendance?from=${from}&to=${to}`)
      .then((r) => setRows(r.data ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [enabled, from, to]);

  if (!enabled) return null;
  if (loading) return <PageLoading />;
  if (!rows.length) {
    return <EmptyState icon={Clock3} title={t("attendance.report")} description={t("attendance.noStaff")} />;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60">
            <tr className="text-left text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">{t("users.title")}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t("attendance.hoursWorked")}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t("attendance.daysWorked")}</th>
              <th className="px-4 py-2.5 text-right font-medium">{t("attendance.noShow")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId} className="border-b border-border/40 last:border-0">
                <td className="px-4 py-2.5 font-medium">{r.name}</td>
                <td className="sa-tnum px-4 py-2.5 text-right">{r.hours}</td>
                <td className="sa-tnum px-4 py-2.5 text-right">{r.daysWorked}</td>
                <td className={`sa-tnum px-4 py-2.5 text-right font-medium ${r.noShow > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {r.noShow}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
