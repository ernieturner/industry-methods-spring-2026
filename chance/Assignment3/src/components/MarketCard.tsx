import { useMemo, useState } from 'react';
import { yesNoOdds } from '../lib/odds';
import { wikiPageUrl } from '../lib/wikiApi';
import type { BetSide, Market } from '../lib/types';

interface MarketCardProps {
  market: Market;
  bankroll: number;
  onBet: (marketId: string, side: BetSide, amount: number) => void;
}

const QUICK_AMOUNTS = [10, 25, 50, 100] as const;

export function MarketCard({ market, bankroll, onBet }: MarketCardProps) {
  const [stake, setStake] = useState<number>(25);
  const odds = yesNoOdds(market.baselineEditsPerMin, market.threshold, market.durationMinutes);
  const secondsLeft = Math.max(0, Math.floor((new Date(market.expiresAt).getTime() - Date.now()) / 1000));
  const proposition = `Will "${market.title}" hit ${market.threshold}+ edits within ${market.durationMinutes} minute${
    market.durationMinutes > 1 ? 's' : ''
  }?`;
  const favoriteSide: BetSide = useMemo(() => (odds.yes <= odds.no ? 'YES' : 'NO'), [odds.no, odds.yes]);

  return (
    <article className="market-card panel">
      <header>
        <p className="eyebrow">LIVE WIKI PAGE</p>
        <a href={wikiPageUrl(market.title)} target="_blank" rel="noreferrer">
          {market.title}
        </a>
      </header>

      <p className="proposition">{proposition}</p>
      <div className="market-stats">
        <p>
          Current: <strong>{market.currentEdits}</strong>
        </p>
        <p>
          Target: <strong>{market.threshold}+</strong>
        </p>
        <p>
          Time Left: <strong>{secondsLeft}s</strong>
        </p>
      </div>
      <p className="muted">Baseline {market.baselineEditsPerMin.toFixed(2)} edits/min | Favorite: {favoriteSide}</p>
      <p className="muted">
        Views: {market.currentViewsPerHour ?? '--'} this hour | 24h avg: {Math.round(market.baselineViewsPerHour).toLocaleString()}/hr
      </p>

      {market.status === 'OPEN' ? (
        <>
          <div className="chip-row">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={`stake-${amount}`}
                type="button"
                className={stake === amount ? 'chip-active' : ''}
                disabled={amount > bankroll}
                onClick={() => setStake(amount)}
              >
                ${amount}
              </button>
            ))}
          </div>
          <div className="bet-grid">
            <button type="button" className="bet-btn yes" disabled={stake > bankroll} onClick={() => onBet(market.id, 'YES', stake)}>
              YES ({odds.yes}x)
            </button>
            <button type="button" className="bet-btn no" disabled={stake > bankroll} onClick={() => onBet(market.id, 'NO', stake)}>
              NO ({odds.no}x)
            </button>
          </div>
        </>
      ) : (
        <p className={`result ${market.result === 'YES' ? 'result-yes' : 'result-no'}`}>
          Final Result: <strong>{market.result}</strong> ({market.currentEdits} edits)
        </p>
      )}
    </article>
  );
}
