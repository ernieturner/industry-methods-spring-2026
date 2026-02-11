import { useCallback } from "react";

interface MagnitudeSliderProps {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}

function MagnitudeSlider({
  min,
  max,
  onChange,
}: MagnitudeSliderProps): React.JSX.Element {
  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      onChange(Math.min(value, max - 0.1), max);
    },
    [max, onChange],
  );

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      onChange(min, Math.max(value, min + 0.1));
    },
    [min, onChange],
  );

  return (
    <div className="magnitude-slider">
      <div className="slider-header">
        <span>Magnitude Filter</span>
        <span className="slider-values">
          {min.toFixed(1)} &ndash; {max.toFixed(1)}
        </span>
      </div>
      <div className="slider-track">
        <input
          type="range"
          min={0}
          max={10}
          step={0.1}
          value={min}
          onChange={handleMinChange}
          className="slider-input slider-min"
          aria-label="Minimum magnitude"
        />
        <input
          type="range"
          min={0}
          max={10}
          step={0.1}
          value={max}
          onChange={handleMaxChange}
          className="slider-input slider-max"
          aria-label="Maximum magnitude"
        />
      </div>
    </div>
  );
}

export default MagnitudeSlider;
