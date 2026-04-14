import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, type ReactNode } from "react";
import { Progress } from "@/components/ui/progress";
import { MaritimeFlags } from "@/components/MaritimeFlags";

const COLD_START_MS = 30_000;
const SHOW_AFTER_MS = 1_000;

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [slowLoad, setSlowLoad] = useState(false);
  const [progress, setProgress] = useState(0);
  const [letterCount, setLetterCount] = useState(1);

  useEffect(() => {
    if (!isLoading) return;

    let letterInterval: ReturnType<typeof setInterval>;
    const showTimer = setTimeout(() => {
      setSlowLoad(true);
      letterInterval = setInterval(() => {
        setLetterCount((c) => (c % 7) + 1);
      }, 1000);
    }, SHOW_AFTER_MS);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / COLD_START_MS) * 100, 95);
      setProgress(pct);
    }, 200);

    return () => {
      clearTimeout(showTimer);
      clearInterval(interval);
      clearInterval(letterInterval);
    };
  }, [isLoading]);

  if (isLoading) {
    if (!slowLoad) return null;
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Il server si sta avviando, attendere...
          </p>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-center">
            <MaritimeFlags text={"LOADING".slice(0, letterCount)} size="md" />
          </div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}
