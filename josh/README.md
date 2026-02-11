# What's Happening Right Now?

An interactive world map that visualizes recent earthquakes in real time, with weather data, tectonic plate overlays, and time-lapse playback.

## Features

### Core
- Interactive Leaflet map with OpenStreetMap tiles
- Real-time earthquake data from the USGS Earthquake API
- Markers sized and colored by earthquake magnitude
- Click any marker for full details with weather at the location

### Visualization Modes
- **Markers** — individual circle markers scaled by magnitude
- **Clusters** — nearby earthquakes grouped with counts at low zoom
- **Heatmap** — canvas-rendered heat overlay showing earthquake density
- **Tectonic Plates** — toggle GeoJSON plate boundary overlay

### Detail Panel
- Magnitude, depth, location, and coordinates
- Event timestamp and computed local time
- "Did You Feel It?" community reports (felt count + CDI intensity)
- Current weather via Open-Meteo (temperature, conditions, wind)
- Historical context — comparison to area average magnitude
- Nearby recent earthquakes within 500 km (clickable)
- Direct link to USGS event page

### Filtering & Time-Lapse
- **Time period selector** — past hour, day, week, or month
- **Magnitude range slider** — dual-thumb filter (0.0–10.0)
- **Time-lapse animation** — replay earthquakes appearing chronologically with play/pause/seek

### Earthquake List
- Searchable, sortable left sidebar (toggle with hamburger button or `L` key)
- Sort by magnitude, time, or location
- Click any item to fly to it on the map

### Data & Refresh
- **Auto-refresh** — poll USGS every 60 seconds (toggle on/off)
- **Manual refresh** button

### UX
- **Dark / Light theme** — toggle with button or `T` key, persisted to localStorage
- **Shareable deep links** — selected earthquake, period, and magnitude filter encoded in URL
- **Keyboard navigation** — Arrow keys cycle earthquakes, Escape closes panel, Space toggles time-lapse, T toggles theme, L toggles list
- **Fly-to animation** — smooth pan/zoom to selected earthquake
- **Statistics bar** — count, max magnitude, average magnitude, most recent, tsunami alerts
- **Responsive layout** — works on mobile

## Data Sources

- **USGS Earthquake API** — real-time earthquake feeds (no API key required)
- **Open-Meteo API** — current weather data (no API key required)
- **Tectonic Plates** — GeoJSON from fraxen/tectonicplates (fetched on demand)

## Tech Stack

- React 19
- TypeScript (strict mode, fully type-safe, no `any`)
- Vite 6
- Leaflet + react-leaflet

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Arrow Up/Down | Cycle through earthquakes |
| Escape | Close detail panel |
| Space | Toggle time-lapse play/pause |
| T | Toggle dark/light theme |
| L | Toggle earthquake list sidebar |

## Build for Production

```bash
npm run build
npm run preview
```
