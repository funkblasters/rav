import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import { Toaster } from "sonner";
import { lazy, Suspense } from "react";
import { apolloClient } from "@/lib/apollo";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { SlowLoadProvider } from "@/context/SlowLoadContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { Layout } from "@/components/Layout";

const LoginPage = lazy(() => import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("@/pages/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const StatsPage = lazy(() => import("@/pages/StatsPage").then((m) => ({ default: m.StatsPage })));
const GlobalStatsPage = lazy(() => import("@/pages/GlobalStatsPage").then((m) => ({ default: m.GlobalStatsPage })));
const FlagsPage = lazy(() => import("@/pages/FlagsPage").then((m) => ({ default: m.FlagsPage })));
const AdminPage = lazy(() => import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage })));

function AppContent() {
  const { theme } = useTheme();

  return (
    <ApolloProvider client={apolloClient}>
      <SlowLoadProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={
            <div className="fixed inset-0 flex items-center justify-center bg-background">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="stats/:userId" element={<StatsPage />} />
              <Route path="global" element={<GlobalStatsPage />} />
              <Route path="flags" element={<FlagsPage />} />
              {/* TODO: add more routes (events, members) */}
            </Route>
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Layout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
          <Toaster
            position="top-center"
            duration={6000}
            theme={theme === "dark" ? "light" : "dark"}
          />
        </BrowserRouter>
      </AuthProvider>
      </SlowLoadProvider>
    </ApolloProvider>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
