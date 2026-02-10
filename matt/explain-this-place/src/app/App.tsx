import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import HomePage from "../pages/HomePage";
import PlacePage from "../pages/PlacePage";
import { applyTheme, toggleTheme, type Theme } from "../lib/theme";
import { Button } from "../components/ui";

export default function App({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-[var(--glow-1)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[var(--glow-2)] blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-[color:var(--card-border)] bg-[var(--app-bg)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight hover:text-[var(--accent)] transition"
          >
            Explain This Place
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                const next = toggleTheme(theme);
                setTheme(next);
              }}
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/place" element={<PlacePage />} />
        </Routes>
      </main>

      <footer className="py-8 text-sm text-[var(--muted)]">
        <div className="mx-auto max-w-6xl px-6">
          Built with free public data · client-only · estimates labeled
        </div>
      </footer>
    </div>
  );
}
