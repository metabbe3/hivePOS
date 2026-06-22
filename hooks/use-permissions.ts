"use client";

import { useSession } from "next-auth/react";
import { hasPermission, type Resource, type Action } from "@/lib/permissions/definitions";

/**
 * React hook for checking RBAC permissions on the client.
 *
 * Usage:
 *   const { can, permissions, isLoading } = usePermissions();
 *   if (can("orders", "create")) { ... }
 */
export function usePermissions() {
  const { data: session, status } = useSession();
  const permissions = session?.user?.permissions ?? [];
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const isLoading = status === "loading";

  const can = (resource: Resource, action: Action): boolean => {
    if (isSuperAdmin) return true;
    return hasPermission(permissions, resource, action);
  };

  return { can, permissions, isLoading, isSuperAdmin };
}
