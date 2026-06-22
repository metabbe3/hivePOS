"use client";

import { useSession } from "next-auth/react";
import type { UserRole } from "@/app/generated/prisma/enums";
import { hasPermission } from "@/lib/permissions/definitions";

export function useRole() {
  const { data: session, status, update } = useSession();
  const isLoading = status === "loading";
  const role = isLoading ? null : (session?.user?.role ?? "EMPLOYEE" as UserRole);
  const permissions = session?.user?.permissions ?? [];
  const hasWildcard = permissions.includes("*");

  // Derive legacy flags from RBAC permissions for backward compatibility.
  // - isOwner: user has the wildcard (all permissions)
  // - isEmployee: user has no wildcard AND cannot read reports (limited access)
  return {
    role,
    isOwner: hasWildcard,
    isEmployee: !hasWildcard && !hasPermission(permissions, "reports", "read"),
    isSuperAdmin: role === "SUPER_ADMIN",
    isLoading,
    branchId: session?.user?.branchId ?? "",
    branchName: session?.user?.branchName ?? "",
    tenantId: session?.user?.tenantId ?? "",
    tenantName: session?.user?.tenantName ?? "",
    activeModule: session?.user?.activeModule ?? "laundry",
    activeModules: session?.user?.activeModules ?? ["laundry"],
    permissions,
    roleName: session?.user?.roleName ?? "",
    updateSession: update,
  };
}
