import { useMemo, useState, useCallback } from "react";
import type { EarthquakeFeature } from "../types/earthquake";
import { formatMagnitude, getMagnitudeColor } from "../utils/magnitude";
import { getTimeAgo } from "../utils/time";

type SortField = "magnitude" | "time" | "location";
type SortDirection = "asc" | "desc";

interface EarthquakeListProps {
  earthquakes: EarthquakeFeature[];
  selectedId: string | null;
  onSelect: (earthquake: EarthquakeFeature) => void;
  onClose: () => void;
}

function EarthquakeList({
  earthquakes,
  selectedId,
  onSelect,
  onClose,
}: EarthquakeListProps): React.JSX.Element {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("time");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const handleSortToggle = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir(field === "time" ? "desc" : "desc");
      }
    },
    [sortField],
  );

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    let result = earthquakes;

    if (query) {
      result = result.filter(
        (eq) =>
          eq.properties.place?.toLowerCase().includes(query) ??
          false,
      );
    }

    return [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "magnitude":
          cmp = (a.properties.mag ?? 0) - (b.properties.mag ?? 0);
          break;
        case "time":
          cmp = a.properties.time - b.properties.time;
          break;
        case "location":
          cmp = (a.properties.place ?? "").localeCompare(
            b.properties.place ?? "",
          );
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [earthquakes, search, sortField, sortDir]);

  const sortIndicator = (field: SortField): string => {
    if (sortField !== field) return "";
    return sortDir === "asc" ? " \u25B2" : " \u25BC";
  };

  return (
    <div className="earthquake-list">
      <div className="list-header">
        <h3>Earthquakes</h3>
        <button type="button" className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="list-search">
        <input
          type="text"
          placeholder="Search by location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="list-sort-bar">
        <button
          type="button"
          className={`sort-btn ${sortField === "magnitude" ? "active" : ""}`}
          onClick={() => handleSortToggle("magnitude")}
        >
          Mag{sortIndicator("magnitude")}
        </button>
        <button
          type="button"
          className={`sort-btn ${sortField === "time" ? "active" : ""}`}
          onClick={() => handleSortToggle("time")}
        >
          Time{sortIndicator("time")}
        </button>
        <button
          type="button"
          className={`sort-btn ${sortField === "location" ? "active" : ""}`}
          onClick={() => handleSortToggle("location")}
        >
          Location{sortIndicator("location")}
        </button>
      </div>

      <div className="list-body">
        {filtered.length === 0 && (
          <p className="list-empty">No earthquakes match your search.</p>
        )}
        {filtered.map((eq) => {
          const mag = eq.properties.mag ?? 0;
          return (
            <button
              key={eq.id}
              type="button"
              className={`list-item ${eq.id === selectedId ? "selected" : ""}`}
              onClick={() => onSelect(eq)}
            >
              <span
                className="list-mag"
                style={{ color: getMagnitudeColor(mag) }}
              >
                {formatMagnitude(eq.properties.mag)}
              </span>
              <span className="list-info">
                <span className="list-place">
                  {eq.properties.place ?? "Unknown"}
                </span>
                <span className="list-time">
                  {getTimeAgo(eq.properties.time)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default EarthquakeList;
