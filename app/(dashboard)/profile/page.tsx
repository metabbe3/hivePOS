"use client";

import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/hooks/use-translation";
import { useRole } from "@/hooks/use-role";
import { apiFetch, ApiClientError } from "@/modules/shared";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileHero } from "@/components/profile/profile-hero";
import { AccountContextCard } from "@/components/profile/account-context-card";
import { PersonalInfoCard } from "@/components/profile/personal-info-card";
import { PasswordChangeCard } from "@/components/profile/password-change-card";
import { LinkedAccountsCard } from "@/components/profile/linked-accounts-card";
import { MyTicketsCard } from "@/components/profile/my-tickets-card";
import type { ProfileData } from "@/components/profile/types";

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const { t } = useTranslation();
  const {
    tenantName,
    branchName,
    activeModule,
    activeModules,
    roleName,
    permissions,
    role,
    updateSession,
  } = useRole();
  const hasWildcard = permissions.includes("*");

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    apiFetch<ProfileData>("/api/user/profile")
      .then((r) => setProfile(r.data))
      .catch((err) => {
        if (err instanceof ApiClientError) toast.error(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  // Success toast after returning from Google OAuth linking flow.
  useEffect(() => {
    if (searchParams.get("linked") === "google") {
      toast.success(t("profile.googleLinkSuccess"));
      // Strip the param so a refresh doesn't re-toast.
      const url = new URL(window.location.href);
      url.searchParams.delete("linked");
      window.history.replaceState(null, "", url.toString());
    }
  }, [searchParams, t]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t("profile.title")} description={t("profile.description")} />

      <ProfileHero
        name={profile.name ?? ""}
        email={profile.email}
        phone={profile.phone}
        createdAt={profile.createdAt}
        roleName={roleName}
        role={role ?? profile.role}
        hasWildcard={hasWildcard}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left column: forms stack */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          <PersonalInfoCard
            name={profile.name ?? ""}
            phone={profile.phone ?? ""}
            email={profile.email ?? ""}
            onSaved={(name, phone) => {
              setProfile({ ...profile, name, phone });
              updateSession();
            }}
          />
          <LinkedAccountsCard
            googleId={profile.googleId ?? null}
            avatar={profile.avatar ?? null}
            email={profile.email ?? null}
            onChanged={({ googleId }) => setProfile({ ...profile, googleId })}
          />
          <PasswordChangeCard />
          <MyTicketsCard />
        </div>

        {/* Right column: account sidebar spans both rows */}
        <div className="lg:row-span-2">
          <AccountContextCard
            tenantName={tenantName}
            branchName={branchName}
            activeModule={activeModule}
            activeModules={activeModules}
            roleName={roleName}
            permissionsCount={permissions.length}
            hasWildcard={hasWildcard}
          />
        </div>
      </div>
    </div>
  );
}
