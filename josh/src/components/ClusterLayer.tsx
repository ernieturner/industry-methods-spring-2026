import { useMemo, useState } from "react";
import { CircleMarker, Marker, Tooltip, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { EarthquakeFeature } from "../types/earthquake";
import { clusterEarthquakes } from "../utils/cluster";
import { getMagnitudeColor, getMagnitudeRadius } from "../utils/magnitude";

interface ClusterLayerProps {
  earthquakes: EarthquakeFeature[];
  selectedId: string | null;
  onSelect: (earthquake: EarthquakeFeature) => void;
}

function ClusterLayer({
  earthquakes,
  selectedId,
  onSelect,
}: ClusterLayerProps): React.JSX.Element {
  const [zoom, setZoom] = useState(2);

  useMapEvents({
    zoomend: (e) => {
      setZoom(e.target.getZoom() as number);
    },
  });

  const clusters = useMemo(
    () => clusterEarthquakes(earthquakes, zoom),
    [earthquakes, zoom],
  );

  return (
    <>
      {clusters.map((cluster) => {
        if (cluster.earthquakes.length === 1) {
          const eq = cluster.earthquakes[0];
          if (!eq) return null;
          const [lng, lat] = eq.geometry.coordinates;
          const mag = eq.properties.mag ?? 0;
          const color = getMagnitudeColor(mag);
          const radius = getMagnitudeRadius(mag);

          return (
            <CircleMarker
              key={eq.id}
              center={[lat ?? 0, lng ?? 0]}
              radius={radius}
              pathOptions={{
                color: eq.id === selectedId ? "#ffffff" : color,
                fillColor: color,
                fillOpacity: 0.7,
                weight: eq.id === selectedId ? 3 : 1.5,
              }}
              eventHandlers={{ click: () => onSelect(eq) }}
            >
              <Tooltip direction="top" offset={[0, -radius]}>
                <strong>M {(eq.properties.mag ?? 0).toFixed(1)}</strong>
                <br />
                {eq.properties.place ?? "Unknown"}
              </Tooltip>
            </CircleMarker>
          );
        }

        const color = getMagnitudeColor(cluster.maxMagnitude);
        const size = Math.min(50, 24 + cluster.earthquakes.length * 2);

        const icon = L.divIcon({
          className: "cluster-icon",
          html: `<div class="cluster-circle" style="background:${color}">${cluster.earthquakes.length}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const first = cluster.earthquakes[0];

        return (
          <Marker
            key={cluster.id}
            position={[cluster.lat, cluster.lng]}
            icon={icon}
            eventHandlers={{
              click: () => {
                if (first) onSelect(first);
              },
            }}
          >
            <Tooltip direction="top">
              <strong>{cluster.earthquakes.length} earthquakes</strong>
              <br />
              Max M {cluster.maxMagnitude.toFixed(1)}
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}

export default ClusterLayer;
