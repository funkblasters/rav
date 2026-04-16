import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useRef } from "react";
import { BarChart2, Flag, Settings } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useSlowLoad } from "@/context/SlowLoadContext";
import { UserPanel } from "@/components/UserPanel";
import { AddFlagButton } from "@/components/AddFlagButton";
import { MaritimeFlags } from "@/components/MaritimeFlags";

export function Layout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const isSlow = useSlowLoad();
  const toastId = useRef<string | number | null>(null);

  useEffect(() => {
    if (isSlow && toastId.current === null) {
      toastId.current = toast.loading(t("common.serverWakingUp"));
    } else if (toastId.current !== null) {
      toast.dismiss(toastId.current);
      toastId.current = null;
    }
  }, [isSlow, t]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-40 border-b bg-card">
        <div className="container flex h-14 items-center justify-between">
          <nav className="flex items-center gap-1 text-sm font-medium">
            {/* RAV Brand */}
            <Link to="/" className="font-bold hover:opacity-80 transition-opacity px-2">
              RAV
            </Link>

            {/* Global Stats Nav Item */}
            <Link
              to="/global"
              className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${
                isActive("/global")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <BarChart2 size={18} className="flex-shrink-0" />
              <span className="hidden md:inline">{t("global.title")}</span>
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

            {/* Admin Nav Item - only visible for admins */}
            {user?.role === "ADMIN" && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${
                  isActive("/admin")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <Settings size={18} className="flex-shrink-0" />
                <span className="hidden md:inline">Admin</span>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex">
              <MaritimeFlags text="GRAZIEAAL" size="sm" />
            </div>
            {user && <UserPanel />}
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col container py-8 mt-14 overflow-y-auto">
        <Outlet />
      </main>
      {user && !isActive("/admin") && <AddFlagButton />}
    </div>
  );
}
