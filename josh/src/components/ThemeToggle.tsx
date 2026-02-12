import { useTheme } from "../context/ThemeContext";

function ThemeToggle(): React.JSX.Element {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode (T)`}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? "\u2600" : "\u263E"}
    </button>
  );
}

export default ThemeToggle;
