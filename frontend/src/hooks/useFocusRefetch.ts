import { useEffect, useRef } from "react";

/**
 * Calls `refetch` when the window regains focus, with two guards:
 * 1. Debounce — waits `debounceMs` after focus before firing (avoids stampede).
 * 2. Stale check — skips the refetch if the last one was less than `staleAfterMs` ago
 *    (avoids pointless round-trips when the user briefly switches tabs).
 */
export function useFocusRefetch(
  refetch: () => void,
  debounceMs = 2000,
  staleAfterMs = 2 * 60 * 1000, // 2 minutes
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRefetchRef = useRef<number>(0);

  useEffect(() => {
    const handleFocus = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (Date.now() - lastRefetchRef.current < staleAfterMs) return;
        lastRefetchRef.current = Date.now();
        refetch();
      }, debounceMs);
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [refetch, debounceMs, staleAfterMs]);
}
