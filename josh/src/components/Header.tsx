import type { EarthquakeTimePeriod } from "../api/earthquakes";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  title: string;
  totalCount: number;
  period: EarthquakeTimePeriod;
  onPeriodChange: (period: EarthquakeTimePeriod) => void;
  onRefresh: () => void;
  loading: boolean;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  showList: boolean;
  onToggleList: () => void;
}

const PERIOD_OPTIONS: { value: EarthquakeTimePeriod; label: string }[] = [
  { value: "hour", label: "Past Hour" },
  { value: "day", label: "Past Day" },
  { value: "week", label: "Past Week" },
  { value: "month", label: "Past Month" },
];

function Header({
  title,
  totalCount,
  period,
  onPeriodChange,
  onRefresh,
  loading,
  autoRefresh,
  onToggleAutoRefresh,
  showList,
  onToggleList,
}: HeaderProps): React.JSX.Element {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1>What's Happening Right Now?</h1>
        <p className="header-subtitle">
          {title} &mdash; {totalCount} earthquakes
          {autoRefresh && <span className="auto-refresh-badge">AUTO</span>}
        </p>
      </div>
      <div className="header-controls">
        <button
          type="button"
          className={`list-toggle-btn ${showList ? "active" : ""}`}
          onClick={onToggleList}
          title="Toggle earthquake list (L)"
        >
          {"\u2630"}
        </button>
        <select
          value={period}
          onChange={(e) => {
            onPeriodChange(e.target.value as EarthquakeTimePeriod);
          }}
          className="period-select"
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="refresh-btn"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
        <button
          type="button"
          className={`auto-refresh-btn ${autoRefresh ? "active" : ""}`}
          onClick={onToggleAutoRefresh}
          title={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh (60s)"}
        >
          {autoRefresh ? "\u23F8 Auto" : "\u25B6 Auto"}
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}

export default Header;
