import { useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import type { EarthquakeFeature } from "../types/earthquake";
import type { MapDisplayMode } from "./Toolbar";
import EarthquakeMarker from "./EarthquakeMarker";
import ClusterLayer from "./ClusterLayer";
import HeatmapLayer from "./HeatmapLayer";
import TectonicPlates from "./TectonicPlates";
import MapController from "./MapController";
import Legend from "./Legend";
import MagnitudeSlider from "./MagnitudeSlider";
import Toolbar from "./Toolbar";
import TimeLapseControls from "./TimeLapseControls";
import "leaflet/dist/leaflet.css";

interface EarthquakeMapProps {
  earthquakes: EarthquakeFeature[];
  selectedId: string | null;
  onSelect: (earthquake: EarthquakeFeature) => void;
  displayMode: MapDisplayMode;
  onDisplayModeChange: (mode: MapDisplayMode) => void;
  showPlates: boolean;
  onTogglePlates: () => void;
  flyToPosition: [number, number] | null;
  magnitudeMin: number;
  magnitudeMax: number;
  onMagnitudeChange: (min: number, max: number) => void;
  timeLapsePlaying: boolean;
  timeLapseProgress: number;
  timeLapseVisibleCount: number;
  onToggleTimeLapse: () => void;
  onResetTimeLapse: () => void;
  onSeekTimeLapse: (progress: number) => void;
}

function EarthquakeMap({
  earthquakes,
  selectedId,
  onSelect,
  displayMode,
  onDisplayModeChange,
  showPlates,
  onTogglePlates,
  flyToPosition,
  magnitudeMin,
  magnitudeMax,
  onMagnitudeChange,
  timeLapsePlaying,
  timeLapseProgress,
  timeLapseVisibleCount,
  onToggleTimeLapse,
  onResetTimeLapse,
  onSeekTimeLapse,
}: EarthquakeMapProps): React.JSX.Element {
  const markers = useMemo(() => {
    if (displayMode !== "markers") return null;
    return earthquakes.map((eq) => (
      <EarthquakeMarker
        key={eq.id}
        earthquake={eq}
        isSelected={eq.id === selectedId}
        onSelect={onSelect}
      />
    ));
  }, [earthquakes, selectedId, onSelect, displayMode]);

  return (
    <div className="map-wrapper">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={18}
        scrollWheelZoom={true}
        className="map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <TectonicPlates visible={showPlates} />
        <MapController flyToPosition={flyToPosition} />

        {displayMode === "markers" && markers}
        {displayMode === "clusters" && (
          <ClusterLayer
            earthquakes={earthquakes}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        )}
        {displayMode === "heatmap" && (
          <HeatmapLayer earthquakes={earthquakes} />
        )}
      </MapContainer>

      <Toolbar
        displayMode={displayMode}
        onDisplayModeChange={onDisplayModeChange}
        showPlates={showPlates}
        onTogglePlates={onTogglePlates}
      />

      <Legend />

      <div className="map-bottom-controls">
        <MagnitudeSlider
          min={magnitudeMin}
          max={magnitudeMax}
          onChange={onMagnitudeChange}
        />
        <TimeLapseControls
          playing={timeLapsePlaying}
          progress={timeLapseProgress}
          visibleCount={timeLapseVisibleCount}
          totalCount={earthquakes.length}
          onTogglePlay={onToggleTimeLapse}
          onReset={onResetTimeLapse}
          onSeek={onSeekTimeLapse}
        />
      </div>
    </div>
  );
}

export default EarthquakeMap;
