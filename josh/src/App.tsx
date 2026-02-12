import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { EarthquakeTimePeriod } from "./api/earthquakes";
import type { EarthquakeFeature } from "./types/earthquake";
import type { MapDisplayMode } from "./components/Toolbar";
import { useEarthquakes } from "./hooks/useEarthquakes";
import { useAutoRefresh } from "./hooks/useAutoRefresh";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { useUrlStateInit, useUrlStateSync } from "./hooks/useUrlState";
import { useTheme } from "./context/ThemeContext";
import { computeStatistics } from "./utils/statistics";
import Header from "./components/Header";
import StatisticsBar from "./components/StatisticsBar";
import EarthquakeMap from "./components/EarthquakeMap";
import EarthquakeList from "./components/EarthquakeList";
import DetailPanel from "./components/DetailPanel";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorMessage from "./components/ErrorMessage";
import "./App.css";

const AUTO_REFRESH_INTERVAL = 60_000;
const TIMELAPSE_INTERVAL = 80;

function App(): React.JSX.Element {
  const { toggleTheme } = useTheme();
  const urlState = useUrlStateInit();

  // --- Core state ---
  const [period, setPeriod] = useState<EarthquakeTimePeriod>(urlState.initialPeriod);
  const [selectedEarthquake, setSelectedEarthquake] =
    useState<EarthquakeFeature | null>(null);
  const pendingEqId = useRef<string | null>(urlState.initialEarthquakeId);

  // --- Feature state ---
  const [displayMode, setDisplayMode] = useState<MapDisplayMode>("markers");
  const [showPlates, setShowPlates] = useState(false);
  const [showList, setShowList] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [magnitudeMin, setMagnitudeMin] = useState(urlState.initialMinMag);
  const [magnitudeMax, setMagnitudeMax] = useState(urlState.initialMaxMag);

  // --- Time-lapse state ---
  const [timeLapsePlaying, setTimeLapsePlaying] = useState(false);
  const [timeLapseIndex, setTimeLapseIndex] = useState<number | null>(null);

  // --- Fly-to state ---
  const [flyToPosition, setFlyToPosition] = useState<[number, number] | null>(null);

  // --- Data ---
  const { earthquakes, loading, error, totalCount, title, refetch } =
    useEarthquakes(period);

  // Restore selection from URL on initial load
  useEffect(() => {
    if (pendingEqId.current && earthquakes.length > 0) {
      const found = earthquakes.find((eq) => eq.id === pendingEqId.current);
      if (found) {
        setSelectedEarthquake(found);
        const [lng, lat] = found.geometry.coordinates;
        setFlyToPosition([lat ?? 0, lng ?? 0]);
      }
      pendingEqId.current = null;
    }
  }, [earthquakes]);

  // --- Filtered & sorted earthquakes ---
  const filteredEarthquakes = useMemo(() => {
    return earthquakes.filter((eq) => {
      const mag = eq.properties.mag ?? 0;
      return mag >= magnitudeMin && mag <= magnitudeMax;
    });
  }, [earthquakes, magnitudeMin, magnitudeMax]);

  // --- Time-lapse: sort by time and slice ---
  const timeSorted = useMemo(() => {
    return [...filteredEarthquakes].sort(
      (a, b) => a.properties.time - b.properties.time,
    );
  }, [filteredEarthquakes]);

  const visibleEarthquakes = useMemo(() => {
    if (timeLapseIndex === null) return filteredEarthquakes;
    return timeSorted.slice(0, timeLapseIndex + 1);
  }, [filteredEarthquakes, timeSorted, timeLapseIndex]);

  const timeLapseProgress =
    timeSorted.length > 0 && timeLapseIndex !== null
      ? (timeLapseIndex + 1) / timeSorted.length
      : 1;

  // Time-lapse interval
  useEffect(() => {
    if (!timeLapsePlaying) return;

    const id = setInterval(() => {
      setTimeLapseIndex((prev) => {
        const current = prev ?? 0;
        if (current >= timeSorted.length - 1) {
          setTimeLapsePlaying(false);
          return timeSorted.length - 1;
        }
        return current + 1;
      });
    }, TIMELAPSE_INTERVAL);

    return () => clearInterval(id);
  }, [timeLapsePlaying, timeSorted.length]);

  // --- Statistics ---
  const stats = useMemo(
    () => computeStatistics(filteredEarthquakes),
    [filteredEarthquakes],
  );

  // --- Auto-refresh ---
  useAutoRefresh(autoRefresh, AUTO_REFRESH_INTERVAL, refetch);

  // --- URL sync ---
  useUrlStateSync({
    selectedId: selectedEarthquake?.id ?? null,
    period,
    minMag: magnitudeMin,
    maxMag: magnitudeMax,
  });

  // --- Handlers ---
  const handleSelect = useCallback((earthquake: EarthquakeFeature) => {
    setSelectedEarthquake(earthquake);
    const [lng, lat] = earthquake.geometry.coordinates;
    setFlyToPosition([lat ?? 0, lng ?? 0]);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedEarthquake(null);
    setFlyToPosition(null);
  }, []);

  const handleTogglePlates = useCallback(() => {
    setShowPlates((p) => !p);
  }, []);

  const handleToggleAutoRefresh = useCallback(() => {
    setAutoRefresh((p) => !p);
  }, []);

  const handleToggleList = useCallback(() => {
    setShowList((p) => !p);
  }, []);

  const handleMagnitudeChange = useCallback((min: number, max: number) => {
    setMagnitudeMin(min);
    setMagnitudeMax(max);
  }, []);

  const handleToggleTimeLapse = useCallback(() => {
    setTimeLapsePlaying((p) => {
      if (!p && timeLapseIndex === null) {
        setTimeLapseIndex(0);
      }
      return !p;
    });
  }, [timeLapseIndex]);

  const handleResetTimeLapse = useCallback(() => {
    setTimeLapsePlaying(false);
    setTimeLapseIndex(null);
  }, []);

  const handleSeekTimeLapse = useCallback(
    (progress: number) => {
      const idx = Math.round(progress * (timeSorted.length - 1));
      setTimeLapseIndex(idx);
    },
    [timeSorted.length],
  );

  // --- Keyboard navigation ---
  useKeyboardNavigation({
    earthquakes: visibleEarthquakes,
    selectedId: selectedEarthquake?.id ?? null,
    onSelect: handleSelect,
    onClose: handleClose,
    onToggleTimeLapse: handleToggleTimeLapse,
    onToggleTheme: toggleTheme,
    onToggleList: handleToggleList,
  });

  return (
    <div className="app">
      <Header
        title={title}
        totalCount={totalCount}
        period={period}
        onPeriodChange={setPeriod}
        onRefresh={refetch}
        loading={loading}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={handleToggleAutoRefresh}
        showList={showList}
        onToggleList={handleToggleList}
      />

      <StatisticsBar stats={stats} filteredCount={visibleEarthquakes.length} />

      <main className="app-main">
        {loading && earthquakes.length === 0 && (
          <LoadingSpinner message="Fetching earthquake data..." />
        )}

        {error !== null && earthquakes.length === 0 && (
          <ErrorMessage message={error} onRetry={refetch} />
        )}

        {showList && (
          <EarthquakeList
            earthquakes={visibleEarthquakes}
            selectedId={selectedEarthquake?.id ?? null}
            onSelect={handleSelect}
            onClose={handleToggleList}
          />
        )}

        {earthquakes.length > 0 && (
          <EarthquakeMap
            earthquakes={visibleEarthquakes}
            selectedId={selectedEarthquake?.id ?? null}
            onSelect={handleSelect}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            showPlates={showPlates}
            onTogglePlates={handleTogglePlates}
            flyToPosition={flyToPosition}
            magnitudeMin={magnitudeMin}
            magnitudeMax={magnitudeMax}
            onMagnitudeChange={handleMagnitudeChange}
            timeLapsePlaying={timeLapsePlaying}
            timeLapseProgress={timeLapseProgress}
            timeLapseVisibleCount={visibleEarthquakes.length}
            onToggleTimeLapse={handleToggleTimeLapse}
            onResetTimeLapse={handleResetTimeLapse}
            onSeekTimeLapse={handleSeekTimeLapse}
          />
        )}

        {selectedEarthquake !== null && (
          <DetailPanel
            earthquake={selectedEarthquake}
            allEarthquakes={filteredEarthquakes}
            onClose={handleClose}
            onSelect={handleSelect}
          />
        )}
      </main>
    </div>
  );
}

export default App;
