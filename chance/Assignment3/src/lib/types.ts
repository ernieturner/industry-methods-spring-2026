export type BetSide = 'YES' | 'NO';
export type MarketStatus = 'OPEN' | 'RESOLVED';

export interface HotPage {
  title: string;
  edits1m: number;
  edits5m: number;
  views24h: number;
}

export interface Market {
  id: string;
  title: string;
  createdAt: string;
  expiresAt: string;
  durationMinutes: 1 | 3 | 5;
  threshold: number;
  baselineEditsPerMin: number;
  baselineViewsPerHour: number;
  currentEdits: number;
  currentViewsPerHour: number | null;
  status: MarketStatus;
  result: BetSide | null;
}

export interface Bet {
  id: string;
  marketId: string;
  side: BetSide;
  amount: number;
  placedAt: string;
  settled: boolean;
  payout: number | null;
}

export interface AppState {
  bankroll: number;
  markets: Market[];
  bets: Bet[];
  lastHotRefreshAt: string | null;
}
