import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BarChart2, Flag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserPanel } from "@/components/UserPanel";
import { AddFlagButton } from "@/components/AddFlagButton";

export function Layout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card">
        <div className="container flex h-14 items-center justify-between">
          <nav className="flex items-center gap-1 text-sm font-medium">
            {/* RAV Brand */}
            <Link to="/" className="font-bold hover:opacity-80 transition-opacity px-2">
              RAV
            </Link>

            {/* Stats Nav Item */}
            <Link
              to="/stats"
              className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${
                isActive("/stats")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <BarChart2 size={18} className="flex-shrink-0" />
              <span className="hidden md:inline">{t("nav.ranking")}</span>
            </Link>

            {/* Flags Nav Item */}
            <Link
              to="/flags"
              className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${
                isActive("/flags")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <Flag size={18} className="flex-shrink-0" />
              <span className="hidden md:inline">Flags</span>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {user && <UserPanel />}
          </div>
        </div>
      </header>
      <main className="flex-1 container py-8">
        <Outlet />
      </main>
      {user && !isActive("/admin") && <AddFlagButton />}
    </div>
  );
}
