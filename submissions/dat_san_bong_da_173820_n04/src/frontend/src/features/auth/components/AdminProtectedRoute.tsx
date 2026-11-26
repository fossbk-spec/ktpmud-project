import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";

interface AdminProtectedRouteProps {
  children?: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthContext();

  if (!isAuthenticated || !user?.token) {
    return <Navigate to="/login" replace />;
  }

  const roles = (user as unknown as { roles?: string[] })?.roles;
  const isOwner =
    user.role === "ADMIN" ||
    (user.role as string) === "PITCH_OWNER" ||
    (Array.isArray(roles) && roles.includes("PITCH_OWNER"));

  if (!isOwner) {
    return <Navigate to="/403" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
