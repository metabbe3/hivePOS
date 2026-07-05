"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Tag, Store, Users, ShoppingBag, ArrowRight, Sparkles, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { apiFetch, ApiClientError } from "@/modules/shared";
import { toast } from "sonner";

const STEPS: { icon: LucideIcon; titleKey: string; descKey: string; href: string }[] = [
  { icon: Tag, titleKey: "onboarding.stepServices", descKey: "onboarding.stepServicesDesc", href: "/services" },
  { icon: Store, titleKey: "onboarding.stepOutlet", descKey: "onboarding.stepOutletDesc", href: "/branches" },
  { icon: Users, titleKey: "onboarding.stepCustomers", descKey: "onboarding.stepCustomersDesc", href: "/customers" },
  { icon: ShoppingBag, titleKey: "onboarding.stepFirstOrder", descKey: "onboarding.stepFirstOrderDesc", href: "/laundry/orders/new" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    try {
      await apiFetch("/api/tenant/onboarding", { method: "PATCH" });
      // Refresh the JWT so /dashboard's redirect check sees the new timestamp
      // and doesn't bounce back here (loop). See lib/auth.ts refreshOnboarding.
      await update({ refreshOnboarding: true } as any);
      router.replace("/dashboard");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : t("onboarding.failed"));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t("onboarding.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("onboarding.subtitle")}</p>
      </div>

      <div className="space-y-3">
        {STEPS.map((step, i) => (
          <Link
            key={step.href}
            href={step.href}
            className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-border hover:shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <step.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                {t(step.titleKey)}
              </p>
              <p className="text-sm text-muted-foreground">{t(step.descKey)}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={finish} disabled={busy}>
          {t("onboarding.skip")}
        </Button>
        <Button
          onClick={finish}
          disabled={busy}
          className="bg-gradient-to-r from-brand-600 to-brand-700 text-white"
        >
          {t("onboarding.done")}
        </Button>
      </div>
    </div>
  );
}
