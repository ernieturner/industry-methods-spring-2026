import { useMemo } from "react";
import type { EarthquakeFeature } from "../types/earthquake";
import { WEATHER_CODES } from "../types/weather";
import { useWeather } from "../hooks/useWeather";
import { formatMagnitude, getMagnitudeColor } from "../utils/magnitude";
import { formatTimestamp, formatLocalTime, getTimeAgo } from "../utils/time";
import { haversineDistance, formatDistance } from "../utils/geo";
import LoadingSpinner from "./LoadingSpinner";

interface DetailPanelProps {
  earthquake: EarthquakeFeature;
  allEarthquakes: EarthquakeFeature[];
  onClose: () => void;
  onSelect: (earthquake: EarthquakeFeature) => void;
}

const NEARBY_RADIUS_KM = 500;
const NEARBY_LIMIT = 5;

function DetailPanel({
  earthquake,
  allEarthquakes,
  onClose,
  onSelect,
}: DetailPanelProps): React.JSX.Element {
  const { properties, geometry } = earthquake;
  const [longitude, latitude] = geometry.coordinates;
  const depth = geometry.coordinates[2];

  const { weather, loading: weatherLoading, error: weatherError } = useWeather(
    latitude ?? null,
    longitude ?? null,
  );

  const mag = properties.mag ?? 0;
  const magnitudeColor = getMagnitudeColor(mag);

  const weatherInfo = weather?.current_weather;
  const weatherDesc =
    weatherInfo !== undefined
      ? WEATHER_CODES[weatherInfo.weathercode] ?? null
      : null;

  // --- Nearby earthquakes ---
  const nearby = useMemo(() => {
    const lat = latitude ?? 0;
    const lng = longitude ?? 0;
    return allEarthquakes
      .filter((eq) => eq.id !== earthquake.id)
      .map((eq) => {
        const [eLng, eLat] = eq.geometry.coordinates;
        const dist = haversineDistance(lat, lng, eLat ?? 0, eLng ?? 0);
        return { earthquake: eq, distance: dist };
      })
      .filter((item) => item.distance <= NEARBY_RADIUS_KM)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, NEARBY_LIMIT);
  }, [allEarthquakes, earthquake.id, latitude, longitude]);

  // --- Historical context ---
  const areaContext = useMemo(() => {
    const lat = latitude ?? 0;
    const lng = longitude ?? 0;
    const areaQuakes = allEarthquakes.filter((eq) => {
      const [eLng, eLat] = eq.geometry.coordinates;
      const dist = haversineDistance(lat, lng, eLat ?? 0, eLng ?? 0);
      return dist <= 1000;
    });
    if (areaQuakes.length < 2) return null;

    let sum = 0;
    let count = 0;
    for (const eq of areaQuakes) {
      if (eq.properties.mag !== null) {
        sum += eq.properties.mag;
        count++;
      }
    }
    const avg = count > 0 ? sum / count : 0;
    return { avgMagnitude: avg, totalInArea: areaQuakes.length };
  }, [allEarthquakes, latitude, longitude]);

  // --- "Did You Feel It?" ---
  const feltData = properties.felt;
  const cdiValue = properties.cdi;

  return (
    <div className="detail-panel">
      <div className="detail-panel-header">
        <h2>Earthquake Details</h2>
        <button type="button" className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="detail-panel-content">
        {/* Magnitude */}
        <div className="magnitude-display" style={{ borderColor: magnitudeColor }}>
          <span className="magnitude-value" style={{ color: magnitudeColor }}>
            {formatMagnitude(properties.mag)}
          </span>
          <span className="magnitude-label">
            {properties.magType ?? "magnitude"}
          </span>
        </div>

        {/* Location */}
        <div className="detail-section">
          <h3>Location</h3>
          <p className="location-name">{properties.place ?? "Unknown location"}</p>
          <p className="coordinates">
            {(latitude ?? 0).toFixed(4)}&deg;, {(longitude ?? 0).toFixed(4)}&deg;
          </p>
          {depth !== undefined && (
            <p className="depth">Depth: {depth.toFixed(1)} km</p>
          )}
        </div>

        {/* Time */}
        <div className="detail-section">
          <h3>Time</h3>
          <p>{formatTimestamp(properties.time)}</p>
          <p className="local-time">
            Local: {formatLocalTime(properties.time, properties.tz)}
          </p>
          <p className="time-ago">{getTimeAgo(properties.time)}</p>
        </div>

        {/* Did You Feel It? */}
        {(feltData !== null || cdiValue !== null) && (
          <div className="detail-section felt-section">
            <h3>Did You Feel It?</h3>
            {feltData !== null && (
              <p>{feltData} felt {feltData === 1 ? "report" : "reports"}</p>
            )}
            {cdiValue !== null && (
              <p>Community Intensity: {cdiValue.toFixed(1)} CDI</p>
            )}
          </div>
        )}

        {/* Weather */}
        <div className="detail-section">
          <h3>Current Weather at Location</h3>
          {weatherLoading && <LoadingSpinner message="Fetching weather..." />}
          {weatherError !== null && (
            <p className="weather-error">Could not load weather: {weatherError}</p>
          )}
          {weatherInfo !== undefined && !weatherLoading && weatherError === null && (
            <div className="weather-info">
              <p className="weather-temp">
                {weatherDesc !== null ? weatherDesc.icon : ""}{" "}
                {weatherInfo.temperature}&deg;C
              </p>
              <p className="weather-desc">
                {weatherDesc !== null ? weatherDesc.label : `Code: ${weatherInfo.weathercode}`}
              </p>
              <p className="weather-wind">
                Wind: {weatherInfo.windspeed} km/h
              </p>
              {weather?.timezone !== undefined && (
                <p className="weather-tz">Timezone: {weather.timezone}</p>
              )}
            </div>
          )}
        </div>

        {/* Historical context */}
        {areaContext !== null && (
          <div className="detail-section">
            <h3>Historical Context</h3>
            <p>
              {areaContext.totalInArea} earthquakes within 1,000 km in this period
            </p>
            <p>
              Area average: M {areaContext.avgMagnitude.toFixed(1)}
              {mag > areaContext.avgMagnitude
                ? ` — this is ${((mag / areaContext.avgMagnitude - 1) * 100).toFixed(0)}% above average`
                : ` — this is below the area average`}
            </p>
          </div>
        )}

        {/* Nearby quakes */}
        {nearby.length > 0 && (
          <div className="detail-section">
            <h3>Nearby Recent Earthquakes</h3>
            <div className="nearby-list">
              {nearby.map((item) => (
                <button
                  type="button"
                  key={item.earthquake.id}
                  className="nearby-item"
                  onClick={() => onSelect(item.earthquake)}
                >
                  <span
                    className="nearby-mag"
                    style={{
                      color: getMagnitudeColor(item.earthquake.properties.mag ?? 0),
                    }}
                  >
                    M {formatMagnitude(item.earthquake.properties.mag)}
                  </span>
                  <span className="nearby-dist">
                    {formatDistance(item.distance)}
                  </span>
                  <span className="nearby-place">
                    {item.earthquake.properties.place ?? "Unknown"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tsunami */}
        {properties.tsunami === 1 && (
          <div className="detail-section tsunami-warning">
            <h3>Tsunami Warning</h3>
            <p>A tsunami warning was issued for this earthquake.</p>
          </div>
        )}

        {/* USGS link */}
        <div className="detail-section">
          <a
            href={properties.url}
            target="_blank"
            rel="noopener noreferrer"
            className="usgs-link"
          >
            View on USGS &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}

export default DetailPanel;
