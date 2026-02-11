import { CircleMarker, Tooltip } from "react-leaflet";
import type { EarthquakeFeature } from "../types/earthquake";
import {
  formatMagnitude,
  getMagnitudeColor,
  getMagnitudeRadius,
} from "../utils/magnitude";
import { getTimeAgo } from "../utils/time";

interface EarthquakeMarkerProps {
  earthquake: EarthquakeFeature;
  isSelected: boolean;
  onSelect: (earthquake: EarthquakeFeature) => void;
}

function EarthquakeMarker({
  earthquake,
  isSelected,
  onSelect,
}: EarthquakeMarkerProps): React.JSX.Element {
  const { properties, geometry } = earthquake;
  const [longitude, latitude] = geometry.coordinates;
  const mag = properties.mag ?? 0;

  const color = getMagnitudeColor(mag);
  const radius = getMagnitudeRadius(mag);

  return (
    <CircleMarker
      center={[latitude ?? 0, longitude ?? 0]}
      radius={radius}
      pathOptions={{
        color: isSelected ? "#ffffff" : color,
        fillColor: color,
        fillOpacity: 0.7,
        weight: isSelected ? 3 : 1.5,
      }}
      eventHandlers={{
        click: () => {
          onSelect(earthquake);
        },
      }}
    >
      <Tooltip direction="top" offset={[0, -radius]}>
        <strong>M {formatMagnitude(properties.mag)}</strong>
        <br />
        {properties.place ?? "Unknown"}
        <br />
        {getTimeAgo(properties.time)}
      </Tooltip>
    </CircleMarker>
  );
}

export default EarthquakeMarker;
