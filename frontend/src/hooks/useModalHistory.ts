import { useEffect, useRef } from "react";

/**
 * Pushes a history entry when a modal/drawer opens so that pressing the
 * browser/Android back button closes it instead of navigating away.
 *
 * Two scenarios handled:
 *  - Back button pressed  → popstate fires → onClose() called, state popped automatically.
 *  - Closed programmatically (X / backdrop) → effect detects open→false, calls
 *    history.back() to pop the entry we pushed, suppresses the resulting popstate.
 */
export function useModalHistory(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const pushedRef = useRef(false);   // did WE push a history entry?
  const byBackRef = useRef(false);   // was the close initiated by popstate?

  // Register popstate listener once.
  useEffect(() => {
    const handlePopState = () => {
      if (!pushedRef.current) return;
      pushedRef.current = false;
      byBackRef.current = true;
      onCloseRef.current();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Push / pop history in sync with open state.
  useEffect(() => {
    if (open) {
      history.pushState({ modal: true }, "");
      pushedRef.current = true;
    } else {
      if (pushedRef.current && !byBackRef.current) {
        // Closed programmatically — pop the entry we pushed.
        pushedRef.current = false;
        history.back();
      }
      byBackRef.current = false;
    }
  }, [open]);
}
