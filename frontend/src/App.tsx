import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import { Toaster } from "sonner";
import { apolloClient } from "@/lib/apollo";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { SlowLoadProvider } from "@/context/SlowLoadContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { Layout } from "@/components/Layout";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { StatsPage } from "@/pages/StatsPage";
import { FlagsPage } from "@/pages/FlagsPage";
import { AdminPage } from "@/pages/AdminPage";

function AppContent() {
  const { theme } = useTheme();

  return (
    <ApolloProvider client={apolloClient}>
      <SlowLoadProvider>
      <AuthProvider>
        <BrowserRouter>
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
