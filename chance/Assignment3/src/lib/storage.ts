import type { AppState } from './types';

const STORAGE_KEY = 'wiki-war-room-v2';

export const defaultState: AppState = {
  bankroll: 1000,
  markets: [],
  bets: [],
  lastHotRefreshAt: null
};

export function loadState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState;

  try {
    const parsed = JSON.parse(raw) as AppState;
    if (!Array.isArray(parsed.markets) || !Array.isArray(parsed.bets) || typeof parsed.bankroll !== 'number') {
      return defaultState;
    }
    return parsed;
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
