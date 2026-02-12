# Tron Topo Arena

Tron-style light-cycle game rendered on an HTML canvas with a dot-based topographic terrain background. The terrain uses procedural noise to vary dot size and color, and the palette is fetched from an external API with a fallback.

## Features
1. Grid-based Tron gameplay with trails and collision detection.
2. Player 1 controls: WASD.
3. Player 2 controls: Arrow keys (toggle for human); otherwise a bot AI.
4. Best-of-N match scoring and round win overlay.
5. Procedural dot-topo terrain pre-rendered to an offscreen canvas.
6. External API palette fetch with randomize button and fallback palette.
7. AI difficulty slider (when bot is active) with speed scaling.

## External API
The app uses The Color API to fetch a daily palette and randomized palettes:
1. Daily palette: `https://www.thecolorapi.com/scheme?hex=...`
2. Random palette: same endpoint with a random seed and cache-busting.

If the API fails or returns invalid data, the app falls back to a built-in neon palette.

## Tech Stack
1. React (latest 18.x)
2. TypeScript (strict, no `any`)
3. Vite

## Run Locally
1. `npm install`
2. `npm run dev`

## Controls
1. Player 1: WASD
2. Player 2: Arrow keys (when enabled)
3. Start: button or first movement key press
4. Pause: button

