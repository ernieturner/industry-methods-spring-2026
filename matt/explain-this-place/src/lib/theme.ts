export type Theme = "light" | "dark";

const KEY = "explain_this_place_theme_v1";

export function getInitialTheme(): Theme {
  const saved = localStorage.getItem(KEY);
  if (saved === "light" || saved === "dark") return saved;

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  return prefersDark ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement; // ✅ html element
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  localStorage.setItem(KEY, theme);
}

export function toggleTheme(current: Theme): Theme {
  return current === "dark" ? "light" : "dark";
}
