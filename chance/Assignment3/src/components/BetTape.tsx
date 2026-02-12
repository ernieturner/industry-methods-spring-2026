import type { Bet, Market } from '../lib/types';

interface BetTapeProps {
  bets: Bet[];
  markets: Market[];
}

export function BetTape({ bets, markets }: BetTapeProps) {
  const marketMap = new Map(markets.map((market) => [market.id, market]));
  const recent = bets.slice(0, 20);

  return (
    <section className="panel">
      <h2>Recent Bets</h2>
      {recent.length === 0 ? (
        <p className="muted">No bets yet.</p>
      ) : (
        <ul className="tape">
          {recent.map((bet) => {
            const title = marketMap.get(bet.marketId)?.title ?? 'Unknown';
            const net = bet.settled ? (bet.payout ?? 0) - bet.amount : -bet.amount;
            return (
              <li key={bet.id}>
                <span>
                  {bet.side} ${bet.amount} on {title}
                </span>
                <strong className={bet.settled ? (net >= 0 ? 'money-up' : 'money-down') : 'money-pending'}>
                  {bet.settled ? `${net >= 0 ? '+' : '-'}$${Math.abs(net).toFixed(2)}` : 'PENDING'}
                </strong>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
