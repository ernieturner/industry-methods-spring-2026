interface TimeLapseControlsProps {
  playing: boolean;
  progress: number;
  visibleCount: number;
  totalCount: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onSeek: (progress: number) => void;
}

function TimeLapseControls({
  playing,
  progress,
  visibleCount,
  totalCount,
  onTogglePlay,
  onReset,
  onSeek,
}: TimeLapseControlsProps): React.JSX.Element {
  return (
    <div className="timelapse-controls">
      <button
        type="button"
        className="timelapse-btn"
        onClick={onTogglePlay}
        title={playing ? "Pause (Space)" : "Play (Space)"}
      >
        {playing ? "\u23F8" : "\u25B6"}
      </button>
      <button
        type="button"
        className="timelapse-btn"
        onClick={onReset}
        title="Reset"
      >
        {"\u23EE"}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(progress * 100)}
        onChange={(e) => onSeek(parseInt(e.target.value, 10) / 100)}
        className="timelapse-slider"
        aria-label="Time-lapse progress"
      />
      <span className="timelapse-count">
        {visibleCount} / {totalCount}
      </span>
    </div>
  );
}

export default TimeLapseControls;
