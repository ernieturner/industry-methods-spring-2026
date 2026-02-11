import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface MapControllerProps {
  flyToPosition: [number, number] | null;
  flyToZoom?: number;
}

function MapController({
  flyToPosition,
  flyToZoom,
}: MapControllerProps): null {
  const map = useMap();

  useEffect(() => {
    if (flyToPosition) {
      map.flyTo(flyToPosition, flyToZoom ?? Math.max(map.getZoom(), 6), {
        duration: 1,
      });
    }
  }, [map, flyToPosition, flyToZoom]);

  return null;
}

export default MapController;
