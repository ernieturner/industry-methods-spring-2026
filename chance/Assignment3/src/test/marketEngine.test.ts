import { describe, expect, it } from 'vitest';
import { createMarketsFromHotPages, settleBetsForMarket, settleMarket } from '../lib/marketEngine';
import type { Bet, HotPage, Market } from '../lib/types';

describe('createMarketsFromHotPages', () => {
  it('creates only requested count and excludes existing titles', () => {
    const pages: HotPage[] = [
      { title: 'A', edits1m: 2, edits5m: 8, views24h: 120000 },
      { title: 'B', edits1m: 1, edits5m: 7, views24h: 90000 },
      { title: 'C', edits1m: 1, edits5m: 6, views24h: 75000 }
    ];

    const markets = createMarketsFromHotPages(pages, new Set(['A']), 2);
    expect(markets.length).toBe(2);
    expect(markets.some((market) => market.title === 'A')).toBe(false);
  });
});

describe('settlement', () => {
  it('resolves YES when edits meet threshold and pays winning bets', () => {
    const market: Market = {
      id: 'm1',
      title: 'Example',
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-01-01T00:01:00.000Z',
      durationMinutes: 1,
      threshold: 2,
      baselineEditsPerMin: 2,
      baselineViewsPerHour: 2000,
      currentEdits: 3,
      currentViewsPerHour: 2100,
      status: 'OPEN',
      result: null
    };

    const resolved = settleMarket(market);
    expect(resolved.result).toBe('YES');

    const bets: Bet[] = [
      {
        id: 'b1',
        marketId: 'm1',
        side: 'YES',
        amount: 50,
        placedAt: market.createdAt,
        settled: false,
        payout: null
      }
    ];

    const settled = settleBetsForMarket(900, bets, resolved);
    expect(settled.bankroll).toBeGreaterThan(900);
    expect(settled.bets[0]?.settled).toBe(true);
    expect(settled.bets[0]?.payout).toBeGreaterThan(0);
  });
});
