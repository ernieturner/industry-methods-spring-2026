import { GeoJSON } from "react-leaflet";
import { useTectonicPlates } from "../hooks/useTectonicPlates";
import type { PlateCollection } from "../hooks/useTectonicPlates";

interface TectonicPlatesProps {
  visible: boolean;
}

function TectonicPlatesLayer({
  data,
}: {
  data: PlateCollection;
}): React.JSX.Element {
  return (
    <GeoJSON
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- GeoJSON data typing from Leaflet is loosely typed
      data={data as never}
      style={{
        color: "#ff6600",
        weight: 1.5,
        opacity: 0.6,
        fillOpacity: 0,
      }}
    />
  );
}

function TectonicPlates({ visible }: TectonicPlatesProps): React.JSX.Element | null {
  const { data, loading, error } = useTectonicPlates(visible);

  if (!visible) return null;
  if (loading) return null;
  if (error !== null) return null;
  if (data === null) return null;

  return <TectonicPlatesLayer data={data} />;
}

export default TectonicPlates;
