"use client";

import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/shared/hooks/useAuth";

type RequiredRole = "admin" | "chairman" | "officer" | "marshal" | "taxpayer";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: RequiredRole[];
  fallbackPath?: string;
  loadingComponent?: React.ReactNode;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallbackPath = "/auth/login",
  loadingComponent,
}: RoleGuardProps) {
  const navigate = useNavigate();
  const { user, isAdmin, loading, roles } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate({ to: fallbackPath });
      return;
    }

    // Admin has access to everything
    if (isAdmin) return;

    // Check if any of the user's roles is in the allowed set
    const hasAccess = allowedRoles.some((role) => {
      if (role === "admin") return isAdmin;
      return roles.includes(role);
    });

    if (!hasAccess) {
      // Only redirect when we actually have roles loaded.
      // If roles is empty and loading is false it means the user
      // genuinely has no roles — send them to the fallback.
      if (roles.length === 0) {
        navigate({ to: fallbackPath });
        return;
      }
      // Redirect to the appropriate dashboard based on the user's actual role
      if (roles.includes("chairman")) {
        navigate({ to: "/executive" });
      } else if (roles.includes("marshal")) {
        navigate({ to: "/marshal" });
      } else if (roles.includes("officer")) {
        navigate({ to: "/officer" });
      } else if (roles.includes("taxpayer")) {
        navigate({ to: "/portal" });
      } else {
        navigate({ to: fallbackPath });
      }
    }
  }, [user, isAdmin, loading, roles, allowedRoles, navigate, fallbackPath]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Checking access…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  // Show loading component or children
  if (loading) {
    return (
      loadingComponent || (
        <div className="flex min-h-screen items-center justify-center bg-surface">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Checking access…</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}

// Specific guard components for convenience
export function AdminGuard({
  children,
  fallbackPath = "/portal",
}: {
  children: React.ReactNode;
  fallbackPath?: string;
}) {
  return (
    <RoleGuard allowedRoles={["admin"]} fallbackPath={fallbackPath}>
      {children}
    </RoleGuard>
  );
}

export function ChairmanGuard({
  children,
  fallbackPath = "/portal",
}: {
  children: React.ReactNode;
  fallbackPath?: string;
}) {
  return (
    <RoleGuard allowedRoles={["chairman", "admin"]} fallbackPath={fallbackPath}>
      {children}
    </RoleGuard>
  );
}

export function OfficerGuard({
  children,
  fallbackPath = "/portal",
}: {
  children: React.ReactNode;
  fallbackPath?: string;
}) {
  return (
    <RoleGuard allowedRoles={["admin", "officer"]} fallbackPath={fallbackPath}>
      {children}
    </RoleGuard>
  );
}

export function MarshalGuard({
  children,
  fallbackPath = "/portal",
}: {
  children: React.ReactNode;
  fallbackPath?: string;
}) {
  return (
    <RoleGuard allowedRoles={["admin", "marshal"]} fallbackPath={fallbackPath}>
      {children}
    </RoleGuard>
  );
}

export function TaxpayerGuard({
  children,
  fallbackPath = "/auth/login",
}: {
  children: React.ReactNode;
  fallbackPath?: string;
}) {
  return (
    <RoleGuard
      allowedRoles={["admin", "officer", "marshal", "taxpayer"]}
      fallbackPath={fallbackPath}
    >
      {children}
    </RoleGuard>
  );
}
