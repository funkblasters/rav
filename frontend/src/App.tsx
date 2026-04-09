import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/lib/apollo";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { Layout } from "@/components/Layout";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { StatsPage } from "@/pages/StatsPage";
import { FlagsPage } from "@/pages/FlagsPage";
import { AdminPage } from "@/pages/AdminPage";

export function App() {
  return (
    <ThemeProvider>
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
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
        </BrowserRouter>
      </AuthProvider>
    </ApolloProvider>
    </ThemeProvider>
  );
}
