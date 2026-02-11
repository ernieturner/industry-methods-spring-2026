# Explain This Place

Client-only travel snapshot app. Search a place and get a quick summary, 7‑day forecast, and lightweight estimates for crowds, prices, and best time to visit.

## Highlights
- Fast place search with type‑ahead suggestions
- Place detail view with Wikipedia summary + photo
- 7‑day forecast (Open‑Meteo)
- Country info + price/crowd heuristics
- Favorites stored in localStorage
- Dark mode

## APIs
- Nominatim (OpenStreetMap) for geocoding/search
- Open‑Meteo for weather
- Wikipedia REST API for summaries/images
- Rest Countries for country metadata

## Tech Stack
- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Zod for runtime validation

## Scripts
```bash
npm run dev
npm run typecheck
```

## Local Setup
```bash
npm install
npm run dev
```

Open the local URL shown in the terminal.

## Notes
- Client-only app: no backend services.
- Data is fetched directly from public APIs.
- Estimates are heuristic and labeled as such in the UI.
