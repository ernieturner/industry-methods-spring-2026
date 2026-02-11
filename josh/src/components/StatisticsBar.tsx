import type { EarthquakeStats } from "../utils/statistics";
import { getTimeAgo } from "../utils/time";
import { formatMagnitude } from "../utils/magnitude";

interface StatisticsBarProps {
  stats: EarthquakeStats;
  filteredCount: number;
}

function StatisticsBar({
  stats,
  filteredCount,
}: StatisticsBarProps): React.JSX.Element {
  return (
    <div className="statistics-bar">
      <div className="stat-item">
        <span className="stat-value">{filteredCount}</span>
        <span className="stat-label">
          {filteredCount !== stats.count ? `of ${stats.count} ` : ""}shown
        </span>
      </div>
      <div className="stat-item">
        <span className="stat-value stat-max">
          {formatMagnitude(stats.maxMagnitude)}
        </span>
        <span className="stat-label">max mag</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">
          {stats.avgMagnitude.toFixed(1)}
        </span>
        <span className="stat-label">avg mag</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">
          {stats.mostRecent ? getTimeAgo(stats.mostRecent.properties.time) : "—"}
        </span>
        <span className="stat-label">most recent</span>
      </div>
      {stats.tsunamiCount > 0 && (
        <div className="stat-item stat-tsunami">
          <span className="stat-value">{stats.tsunamiCount}</span>
          <span className="stat-label">tsunami alerts</span>
        </div>
      )}
    </div>
  );
}

export default StatisticsBar;
