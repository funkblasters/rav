import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ReactNode } from "react";

/**
 * Route for pages that should only be accessible when NOT logged in
 * (e.g., login and register pages)
 *
 * If user is already logged in, redirects to home
 */
export function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  // If already logged in, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Otherwise, show the page
  return <>{children}</>;
}
