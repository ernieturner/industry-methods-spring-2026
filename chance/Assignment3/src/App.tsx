import { useEffect, useMemo, useState } from 'react';
import { BetTape } from './components/BetTape';
import { MarketCard } from './components/MarketCard';
import { ResolvedBetSidebar } from './components/ResolvedBetSidebar';
import { createMarketsFromHotPages, settleBetsForMarket, settleMarket, TARGET_OPEN_MARKETS } from './lib/marketEngine';
import { defaultState, loadState, saveState } from './lib/storage';
import { fetchCurrentHourViewsByTitle, fetchEditsSinceByTitle, fetchHotPages } from './lib/wikiApi';
import type { AppState, Bet, BetSide } from './lib/types';

const POLL_MS = 7_500;
const THEME_KEY = 'wiki-war-room-theme';
type Theme = 'light' | 'dark';

export function App() {
  const [state, setState] = useState<AppState>(defaultState);
  const [error, setError] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const openMarkets = useMemo(() => state.markets.filter((market) => market.status === 'OPEN'), [state.markets]);
  const resolvedMarkets = useMemo(() => state.markets.filter((market) => market.status === 'RESOLVED').slice(0, 6), [state.markets]);
  const settledBets = useMemo(() => state.bets.filter((bet) => bet.settled), [state.bets]);
  const settledNet = useMemo(
    () => settledBets.reduce((sum, bet) => sum + ((bet.payout ?? 0) - bet.amount), 0),
    [settledBets]
  );
  const settledWins = useMemo(() => settledBets.filter((bet) => (bet.payout ?? 0) > 0).length, [settledBets]);

  function topUpMarkets(current: AppState, hotPages: Awaited<ReturnType<typeof fetchHotPages>>): AppState {
    const open = current.markets.filter((market) => market.status === 'OPEN');
    const missing = Math.max(0, TARGET_OPEN_MARKETS - open.length);

    if (missing === 0) {
      return current;
    }

    const existingTitles = new Set(open.map((market) => market.title));
    const newMarkets = createMarketsFromHotPages(hotPages, existingTitles, missing);

    return {
      ...current,
      markets: [...newMarkets, ...current.markets],
      lastHotRefreshAt: new Date().toISOString()
    };
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap(): Promise<void> {
      try {
        const loaded = loadState();
        const hotPages = await fetchHotPages(18);
        const withMarkets = topUpMarkets(loaded, hotPages);
        if (!cancelled) {
          setState(withMarkets);
          setBooting(false);
        }
      } catch (caught) {
        if (!cancelled) {
          setBooting(false);
          setError(caught instanceof Error ? caught.message : 'Failed to bootstrap markets.');
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (booting) return;

    let cancelled = false;
    let busy = false;

    async function poll(): Promise<void> {
      if (busy) return;
      busy = true;

      try {
        const openNow = state.markets.filter((market) => market.status === 'OPEN');
        const titles = openNow.map((market) => market.title);
        const earliest = openNow
          .map((market) => market.createdAt)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

        const countsByTitle = earliest ? await fetchEditsSinceByTitle(titles, earliest) : new Map<string, number>();
        const viewsByTitle = await fetchCurrentHourViewsByTitle(titles);
        const hotPages = await fetchHotPages(18);

        if (cancelled) return;

        setState((current) => {
          const now = Date.now();
          let nextState: AppState = {
            ...current,
            markets: current.markets.map((market) => {
              if (market.status !== 'OPEN') return market;

              const editsSinceOpen = countsByTitle.get(market.title) ?? market.currentEdits;
              return {
                ...market,
                currentEdits: editsSinceOpen,
                currentViewsPerHour: viewsByTitle.get(market.title) ?? market.currentViewsPerHour
              };
            }),
            lastHotRefreshAt: new Date().toISOString()
          };

          const openAfterRefresh = nextState.markets.filter((market) => market.status === 'OPEN');
          openAfterRefresh.forEach((market) => {
            if (new Date(market.expiresAt).getTime() > now) return;

            const resolved = settleMarket(market);
            const settlement = settleBetsForMarket(nextState.bankroll, nextState.bets, resolved);

            nextState = {
              ...nextState,
              bankroll: settlement.bankroll,
              bets: settlement.bets,
              markets: nextState.markets.map((entry) => (entry.id === market.id ? resolved : entry))
            };
          });

          return nextState;
        });

        setState((current) => topUpMarkets(current, hotPages));
      } catch {
        // Ignore poll errors for resiliency.
      } finally {
        busy = false;
      }
    }

    const timer = window.setInterval(() => {
      void poll();
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [booting, state.markets]);

  function placeBet(marketId: string, side: BetSide, amount: number): void {
    setError(null);
    setState((current) => {
      if (amount <= 0 || amount > current.bankroll) {
        setError('Not enough bankroll for this bet.');
        return current;
      }

      const market = current.markets.find((entry) => entry.id === marketId);
      if (!market || market.status !== 'OPEN') {
        setError('That market is no longer open.');
        return current;
      }

      const bet: Bet = {
        id: crypto.randomUUID(),
        marketId,
        side,
        amount,
        placedAt: new Date().toISOString(),
        settled: false,
        payout: null
      };

      return {
        ...current,
        bankroll: Number((current.bankroll - amount).toFixed(2)),
        bets: [bet, ...current.bets]
      };
    });
  }

  return (
    <main>
      <section className="app-shell">
        <section className="main-column">
          <header className="hero panel">
            <h1>Wiki War Room</h1>
            <p>Place quick YES/NO bets on live Wikipedia page activity and track your results in real time.</p>
            <button type="button" className="theme-toggle" onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}>
              {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            </button>
            <div className="summary-strip">
              <p className="summary-pill">
                Bankroll <strong>${state.bankroll.toFixed(2)}</strong>
              </p>
              <p className={`summary-pill ${settledNet >= 0 ? 'net-up' : 'net-down'}`}>
                Settled P/L <strong>{settledNet >= 0 ? '+' : '-'}${Math.abs(settledNet).toFixed(2)}</strong>
              </p>
              <p className="summary-pill">
                Settled Wins <strong>{settledWins}</strong>
              </p>
            </div>
            <p className="muted">
              6 auto markets are generated from high-traffic Wikipedia pages with recent activity. Polling every 7.5 seconds.
            </p>
            {state.lastHotRefreshAt && (
              <p className="muted">Last data refresh: {new Date(state.lastHotRefreshAt).toLocaleTimeString()}</p>
            )}
          </header>

          {error && <p className="error">{error}</p>}

          <section>
            <h2>Live Markets</h2>
            {booting ? (
              <p className="muted">Loading live markets...</p>
            ) : (
              <div className="market-grid">
                {openMarkets.map((market) => (
                  <MarketCard key={market.id} market={market} bankroll={state.bankroll} onBet={placeBet} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2>Recently Resolved Markets</h2>
            <div className="market-grid">
              {resolvedMarkets.length === 0 ? (
                <p className="muted">No resolved rounds yet.</p>
              ) : (
                resolvedMarkets.map((market) => (
                  <MarketCard key={market.id} market={market} bankroll={state.bankroll} onBet={placeBet} />
                ))
              )}
            </div>
          </section>

          <BetTape bets={state.bets} markets={state.markets} />
        </section>

        <ResolvedBetSidebar bets={state.bets} markets={state.markets} />
      </section>
    </main>
  );
}
