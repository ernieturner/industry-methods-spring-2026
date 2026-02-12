export type MapDisplayMode = "markers" | "clusters" | "heatmap";

interface ToolbarProps {
  displayMode: MapDisplayMode;
  onDisplayModeChange: (mode: MapDisplayMode) => void;
  showPlates: boolean;
  onTogglePlates: () => void;
}

function Toolbar({
  displayMode,
  onDisplayModeChange,
  showPlates,
  onTogglePlates,
}: ToolbarProps): React.JSX.Element {
  return (
    <div className="map-toolbar">
      <div className="toolbar-group">
        <span className="toolbar-label">View</span>
        <button
          type="button"
          className={`toolbar-btn ${displayMode === "markers" ? "active" : ""}`}
          onClick={() => onDisplayModeChange("markers")}
          title="Individual markers"
        >
          Markers
        </button>
        <button
          type="button"
          className={`toolbar-btn ${displayMode === "clusters" ? "active" : ""}`}
          onClick={() => onDisplayModeChange("clusters")}
          title="Clustered markers"
        >
          Clusters
        </button>
        <button
          type="button"
          className={`toolbar-btn ${displayMode === "heatmap" ? "active" : ""}`}
          onClick={() => onDisplayModeChange("heatmap")}
          title="Heatmap overlay"
        >
          Heatmap
        </button>
      </div>
      <div className="toolbar-divider" />
      <button
        type="button"
        className={`toolbar-btn ${showPlates ? "active" : ""}`}
        onClick={onTogglePlates}
        title="Toggle tectonic plate boundaries"
      >
        Plates
      </button>
    </div>
  );
}

export default Toolbar;
