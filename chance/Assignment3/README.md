# Wiki War Room

Wiki War Room is a fully TypeScript, React, and Vite fake-betting app with auto-generated rapid markets.

Simulation only. No real-money gambling. No payouts.

## Requirements Coverage

- External API integration: Wikimedia MediaWiki API (`recentchanges` endpoint)
- Full TypeScript + strict type safety
- React (latest major, v19)
- Vite build tool (v6)

## Product Behavior

- No manual page entry
- App automatically keeps 6 live markets running
- Markets are generated from pages with highest recent edit activity
- Bets resolve in 1, 3, or 5 minutes
- Odds are derived from baseline recent edit velocity
- Bankroll and bet history are stored in `localStorage`

## External API

Endpoint used:

- `https://en.wikipedia.org/w/api.php?action=query&list=recentchanges...&origin=*`

The app polls every 15 seconds and updates edit counts for open markets.

## Scripts

- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run preview`

## Run

```bash
npm install
npm run dev
```
