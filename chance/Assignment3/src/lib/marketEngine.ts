import { yesNoOdds } from './odds';
import type { Bet, BetSide, HotPage, Market } from './types';

export const TARGET_OPEN_MARKETS = 6;
export const DURATION_OPTIONS: Array<1 | 3 | 5> = [1, 3, 5];

export function createMarketsFromHotPages(hotPages: HotPage[], existingOpenTitles: Set<string>, count: number): Market[] {
  const candidates = hotPages.filter((page) => !existingOpenTitles.has(page.title)).slice(0, count);

  return candidates.map((page, index) => {
    const durationMinutes = DURATION_OPTIONS[index % DURATION_OPTIONS.length] ?? 1;
    const baselineEditsPerMin = Math.max(0.2, page.edits5m / 5);
    const baselineViewsPerHour = Math.max(50, Math.round(page.views24h / 24));
    const threshold = Math.max(1, Math.round(baselineEditsPerMin * durationMinutes));
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + durationMinutes * 60_000);

    return {
      id: crypto.randomUUID(),
      title: page.title,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      durationMinutes,
      threshold,
      baselineEditsPerMin,
      baselineViewsPerHour,
      currentEdits: 0,
      currentViewsPerHour: null,
      status: 'OPEN',
      result: null
    };
  });
}

export function settleMarket(market: Market): Market {
  const result: BetSide = market.currentEdits >= market.threshold ? 'YES' : 'NO';
  return {
    ...market,
    status: 'RESOLVED',
    result
  };
}

export function settleBetsForMarket(bankroll: number, bets: Bet[], market: Market): { bankroll: number; bets: Bet[] } {
  if (market.result === null) {
    return { bankroll, bets };
  }

  const odds = yesNoOdds(market.baselineEditsPerMin, market.threshold, market.durationMinutes);
  let nextBankroll = bankroll;

  const updated = bets.map((bet) => {
    if (bet.marketId !== market.id || bet.settled) {
      return bet;
    }

    const won = bet.side === market.result;
    const payout = won ? Number((bet.amount * (bet.side === 'YES' ? odds.yes : odds.no)).toFixed(2)) : 0;
    nextBankroll = Number((nextBankroll + payout).toFixed(2));

    return {
      ...bet,
      settled: true,
      payout
    };
  });

  return {
    bankroll: nextBankroll,
    bets: updated
  };
}
