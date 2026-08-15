"use client";

import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/shared/hooks/useAuth";

type RequiredRole = "admin" | "officer" | "marshal" | "taxpayer";

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
  loadingComponent 
}: RoleGuardProps) {
  const navigate = useNavigate();
  const { user, isAdmin, loading, roles } = useAuth();

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate({ to: fallbackPath });
      return;
    }

    const userRole = user.user_metadata?.account_type || user.user_metadata?.role || roles[0];
    
    // Admin has access to everything
    if (isAdmin) return;

    // Check if user's role is in allowed roles
    const hasAccess = allowedRoles.some(role => {
      if (role === "admin") return isAdmin;
      if (role === "officer") return userRole === "officer";
      if (role === "marshal") return userRole === "marshal";
      if (role === "taxpayer") return userRole === "taxpayer";
      return false;
    });

    if (!hasAccess) {
      // Redirect to appropriate dashboard based on role
      if (userRole === "marshal") {
        navigate({ to: "/marshal" });
      } else if (userRole === "officer") {
        navigate({ to: "/officer" });
      } else if (userRole === "taxpayer") {
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
    return loadingComponent || (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Checking access…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Specific guard components for convenience
export function AdminGuard({ children, fallbackPath = "/portal" }: { children: React.ReactNode; fallbackPath?: string }) {
  return <RoleGuard allowedRoles={["admin"]} fallbackPath={fallbackPath}>{children}</RoleGuard>;
}

export function OfficerGuard({ children, fallbackPath = "/portal" }: { children: React.ReactNode; fallbackPath?: string }) {
  return <RoleGuard allowedRoles={["admin", "officer"]} fallbackPath={fallbackPath}>{children}</RoleGuard>;
}

export function MarshalGuard({ children, fallbackPath = "/portal" }: { children: React.ReactNode; fallbackPath?: string }) {
  return <RoleGuard allowedRoles={["admin", "marshal"]} fallbackPath={fallbackPath}>{children}</RoleGuard>;
}

export function TaxpayerGuard({ children, fallbackPath = "/auth/login" }: { children: React.ReactNode; fallbackPath?: string }) {
  return <RoleGuard allowedRoles={["admin", "officer", "marshal", "taxpayer"]} fallbackPath={fallbackPath}>{children}</RoleGuard>;
}