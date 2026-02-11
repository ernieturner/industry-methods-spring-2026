import { useEffect } from "react";
import type { EarthquakeFeature } from "../types/earthquake";

interface KeyboardNavigationOptions {
  earthquakes: EarthquakeFeature[];
  selectedId: string | null;
  onSelect: (earthquake: EarthquakeFeature) => void;
  onClose: () => void;
  onToggleTimeLapse: () => void;
  onToggleTheme: () => void;
  onToggleList: () => void;
}

export function useKeyboardNavigation({
  earthquakes,
  selectedId,
  onSelect,
  onClose,
  onToggleTimeLapse,
  onToggleTheme,
  onToggleList,
}: KeyboardNavigationOptions): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "Escape":
          onClose();
          break;

        case "ArrowDown":
        case "ArrowRight": {
          e.preventDefault();
          if (earthquakes.length === 0) break;
          const currentIdx = selectedId
            ? earthquakes.findIndex((eq) => eq.id === selectedId)
            : -1;
          const nextIdx = (currentIdx + 1) % earthquakes.length;
          const next = earthquakes[nextIdx];
          if (next) onSelect(next);
          break;
        }

        case "ArrowUp":
        case "ArrowLeft": {
          e.preventDefault();
          if (earthquakes.length === 0) break;
          const curIdx = selectedId
            ? earthquakes.findIndex((eq) => eq.id === selectedId)
            : 0;
          const prevIdx =
            curIdx <= 0 ? earthquakes.length - 1 : curIdx - 1;
          const prev = earthquakes[prevIdx];
          if (prev) onSelect(prev);
          break;
        }

        case " ":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onToggleTimeLapse();
          }
          break;

        case "t":
        case "T":
          if (!e.ctrlKey && !e.metaKey) {
            onToggleTheme();
          }
          break;

        case "l":
        case "L":
          if (!e.ctrlKey && !e.metaKey) {
            onToggleList();
          }
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    earthquakes,
    selectedId,
    onSelect,
    onClose,
    onToggleTimeLapse,
    onToggleTheme,
    onToggleList,
  ]);
}
