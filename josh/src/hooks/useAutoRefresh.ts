import { useEffect, useRef } from "react";

export function useAutoRefresh(
  enabled: boolean,
  intervalMs: number,
  callback: () => void,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(() => {
      callbackRef.current();
    }, intervalMs);

    return () => {
      clearInterval(id);
    };
  }, [enabled, intervalMs]);
}
