import { getMagnitudeColor } from "../utils/magnitude";

const LEGEND_ITEMS: { label: string; mag: number }[] = [
  { label: "7+", mag: 7 },
  { label: "6+", mag: 6 },
  { label: "5+", mag: 5 },
  { label: "4+", mag: 4 },
  { label: "3+", mag: 3 },
  { label: "2+", mag: 2 },
  { label: "<2", mag: 1 },
];

function Legend(): React.JSX.Element {
  return (
    <div className="legend">
      <h4>Magnitude</h4>
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="legend-item">
          <span
            className="legend-dot"
            style={{ backgroundColor: getMagnitudeColor(item.mag) }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default Legend;
