import type { Bet, Market } from '../lib/types';

interface ResolvedBetSidebarProps {
  bets: Bet[];
  markets: Market[];
}

export function ResolvedBetSidebar({ bets, markets }: ResolvedBetSidebarProps) {
  const marketMap = new Map(markets.map((market) => [market.id, market]));
  const active = bets.filter((bet) => !bet.settled).slice(0, 10);
  const settled = bets.filter((bet) => bet.settled).slice(0, 18);

  return (
    <aside className="panel resolved-rail">
      <h2>Bet Tracker</h2>
      <h3>Active Bets</h3>
      {active.length === 0 ? (
        <p className="muted">No active bets.</p>
      ) : (
        <ul className="resolved-list">
          {active.map((bet) => {
            const market = marketMap.get(bet.marketId);
            return (
              <li key={bet.id} className="resolved-item active-item">
                <p className="resolved-title">{market?.title ?? 'Unknown page'}</p>
                <p className="muted">
                  {bet.side} ${bet.amount}
                </p>
                <p className="money-pending">LIVE</p>
              </li>
            );
          })}
        </ul>
      )}

      <h3>Resolved Bets</h3>
      {settled.length === 0 ? (
        <p className="muted">No settled bets yet.</p>
      ) : (
        <ul className="resolved-list">
          {settled.map((bet) => {
            const market = marketMap.get(bet.marketId);
            const net = (bet.payout ?? 0) - bet.amount;
            const won = net > 0;

            return (
              <li key={bet.id} className="resolved-item">
                <p className="resolved-title">{market?.title ?? 'Unknown page'}</p>
                <p className="muted">
                  You bet {bet.side} ${bet.amount}
                </p>
                <p className={won ? 'money-up' : 'money-down'}>
                  {won ? 'WON' : 'LOST'} {won ? '+' : '-'}${Math.abs(net).toFixed(2)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
