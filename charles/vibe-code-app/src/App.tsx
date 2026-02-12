import { useMemo, type ReactNode } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Coins,
  Globe2,
  RefreshCw,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";
import { Sparkline } from "./components/Sparkline";
import { TrendBadge } from "./components/TrendBadge";
import { useDashboardData } from "./hooks/useDashboardData";
import { usePersistentState } from "./hooks/usePersistentState";
import type { MarketCoin } from "./lib/coingecko";
import {
  formatBtc,
  formatDateTime,
  formatInteger,
  formatPercent,
  formatUsd,
} from "./lib/formatters";
import "./App.css";

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
}

const trendFilters = ["all", "gainers", "losers"] as const;
type TrendFilter = (typeof trendFilters)[number];

const sortKeys = [
  "market_cap_rank",
  "current_price",
  "market_cap",
  "price_change_24h",
  "price_change_7d",
  "total_volume",
] as const;
type CoinSortKey = (typeof sortKeys)[number];

const sortDirections = ["asc", "desc"] as const;
type SortDirection = (typeof sortDirections)[number];

const trendFilterSet: ReadonlySet<string> = new Set(trendFilters);
const sortKeySet: ReadonlySet<string> = new Set(sortKeys);
const sortDirectionSet: ReadonlySet<string> = new Set(sortDirections);

const MetricCard = ({ icon, label, value, hint }: MetricCardProps) => (
  <article className="metric-card">
    <div className="metric-card-head">
      <span className="metric-icon">{icon}</span>
      <span className="metric-label">{label}</span>
    </div>
    <p className="metric-value">{value}</p>
    {hint ? <p className="metric-hint">{hint}</p> : null}
  </article>
);

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
};

const isTrendFilter = (value: unknown): value is TrendFilter =>
  typeof value === "string" && trendFilterSet.has(value);

const isSortKey = (value: unknown): value is CoinSortKey =>
  typeof value === "string" && sortKeySet.has(value);

const isSortDirection = (value: unknown): value is SortDirection =>
  typeof value === "string" && sortDirectionSet.has(value);

const isSearchTerm = (value: unknown): value is string => typeof value === "string";

const getCoinSortValue = (coin: MarketCoin, sortKey: CoinSortKey): number | null => {
  switch (sortKey) {
    case "market_cap_rank":
      return coin.market_cap_rank;
    case "current_price":
      return coin.current_price;
    case "market_cap":
      return coin.market_cap;
    case "price_change_24h":
      return coin.price_change_percentage_24h;
    case "price_change_7d":
      return coin.price_change_percentage_7d_in_currency ?? null;
    case "total_volume":
      return coin.total_volume;
  }
};

const getSortKeyLabel = (sortKey: CoinSortKey): string => {
  switch (sortKey) {
    case "market_cap_rank":
      return "Market Cap Rank";
    case "current_price":
      return "Current Price";
    case "market_cap":
      return "Market Cap";
    case "price_change_24h":
      return "24h Change";
    case "price_change_7d":
      return "7d Change";
    case "total_volume":
      return "24h Volume";
  }
};

const MetricCardSkeleton = () => (
  <article className="metric-card metric-card-skeleton" aria-hidden="true">
    <div className="metric-card-head">
      <span className="metric-icon skeleton-box" />
      <span className="metric-label skeleton-box skeleton-text-short" />
    </div>
    <p className="metric-value skeleton-box skeleton-text-wide" />
    <p className="metric-hint skeleton-box skeleton-text-medium" />
  </article>
);

const EmptyPanelMessage = ({ message }: { message: string }) => (
  <p className="panel-empty">{message}</p>
);

function App() {
  const [searchTerm, setSearchTerm] = usePersistentState<string>(
    "crypto-dashboard.top-coins.search",
    "",
    isSearchTerm,
  );
  const [trendFilter, setTrendFilter] = usePersistentState<TrendFilter>(
    "crypto-dashboard.top-coins.filter",
    "all",
    isTrendFilter,
  );
  const [sortKey, setSortKey] = usePersistentState<CoinSortKey>(
    "crypto-dashboard.top-coins.sort-key",
    "market_cap_rank",
    isSortKey,
  );
  const [sortDirection, setSortDirection] = usePersistentState<SortDirection>(
    "crypto-dashboard.top-coins.sort-direction",
    "asc",
    isSortDirection,
  );

  const { globalMarketQuery, topCoinsQuery, trendingCoinsQuery } = useDashboardData();

  const isFetching =
    globalMarketQuery.isFetching ||
    topCoinsQuery.isFetching ||
    trendingCoinsQuery.isFetching;

  const refetchAll = async () => {
    await Promise.allSettled([
      globalMarketQuery.refetch(),
      topCoinsQuery.refetch(),
      trendingCoinsQuery.refetch(),
    ]);
  };

  const globalMarket = globalMarketQuery.data ?? null;
  const topCoins = topCoinsQuery.data ?? [];
  const trendingCoins = trendingCoinsQuery.data ?? [];

  const isGlobalLoading = globalMarketQuery.status === "pending" && !globalMarket;
  const isTopCoinsLoading = topCoinsQuery.status === "pending" && topCoins.length === 0;
  const isTrendingLoading = trendingCoinsQuery.status === "pending" && trendingCoins.length === 0;

  const globalMarketError = globalMarketQuery.status === "error" ? globalMarketQuery.error : null;
  const topCoinsError = topCoinsQuery.status === "error" ? topCoinsQuery.error : null;
  const trendingCoinsError =
    trendingCoinsQuery.status === "error" ? trendingCoinsQuery.error : null;

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const visibleTopCoins = useMemo(() => {
    const filteredCoins = topCoins.filter((coin) => {
      if (normalizedSearchTerm) {
        const matchesSearch =
          coin.name.toLowerCase().includes(normalizedSearchTerm) ||
          coin.symbol.toLowerCase().includes(normalizedSearchTerm);

        if (!matchesSearch) {
          return false;
        }
      }

      if (trendFilter === "gainers") {
        return (coin.price_change_percentage_24h ?? 0) > 0;
      }

      if (trendFilter === "losers") {
        return (coin.price_change_percentage_24h ?? 0) < 0;
      }

      return true;
    });

    return [...filteredCoins].sort((coinA, coinB) => {
      const valueA = getCoinSortValue(coinA, sortKey);
      const valueB = getCoinSortValue(coinB, sortKey);

      if (valueA === null && valueB === null) {
        return 0;
      }

      if (valueA === null) {
        return 1;
      }

      if (valueB === null) {
        return -1;
      }

      const difference = valueA - valueB;
      return sortDirection === "asc" ? difference : -difference;
    });
  }, [topCoins, normalizedSearchTerm, trendFilter, sortKey, sortDirection]);

  const dominance = useMemo(() => {
    if (!globalMarket) {
      return [];
    }

    return Object.entries(globalMarket.market_cap_percentage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [globalMarket]);

  const hasNoData = !globalMarket && topCoins.length === 0 && trendingCoins.length === 0;
  const fallbackError = globalMarketError ?? topCoinsError ?? trendingCoinsError;

  if (hasNoData && fallbackError) {
    return (
      <main className="screen-state">
        <TriangleAlert size={30} />
        <h1>Unable to load dashboard</h1>
        <p>{getErrorMessage(fallbackError)}</p>
        <button className="refresh-button" type="button" onClick={() => void refetchAll()}>
          Try again
        </button>
      </main>
    );
  }

  const resetControls = () => {
    setSearchTerm("");
    setTrendFilter("all");
    setSortKey("market_cap_rank");
    setSortDirection("asc");
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="hero-kicker">Client-only - React + TypeScript + Vite</p>
          <h1>Crypto Market Pulse</h1>
          <p className="hero-subtitle">Live trends powered by the CoinGecko API.</p>
        </div>
        <button
          className="refresh-button"
          type="button"
          onClick={() => void refetchAll()}
          disabled={isFetching}
        >
          <RefreshCw className={isFetching ? "spin" : ""} size={16} />
          Refresh
        </button>
      </header>

      <section className="stats-grid" aria-label="Global market metrics">
        {isGlobalLoading ? (
          Array.from({ length: 4 }, (_, index) => <MetricCardSkeleton key={index} />)
        ) : globalMarket ? (
          <>
            <MetricCard
              icon={<Globe2 size={18} />}
              label="Total Market Cap"
              value={formatUsd(globalMarket.total_market_cap["usd"] ?? 0, true)}
              hint={`Updated ${formatDateTime(globalMarket.updated_at)}`}
            />
            <MetricCard
              icon={<Coins size={18} />}
              label="24h Market Cap Shift"
              value={formatPercent(globalMarket.market_cap_change_percentage_24h_usd)}
            />
            <MetricCard
              icon={<Coins size={18} />}
              label="24h Total Volume"
              value={formatUsd(globalMarket.total_volume["usd"] ?? 0, true)}
            />
            <MetricCard
              icon={<Coins size={18} />}
              label="Active Cryptocurrencies"
              value={formatInteger(globalMarket.active_cryptocurrencies)}
              hint={`${formatInteger(globalMarket.markets)} markets tracked`}
            />
          </>
        ) : (
          <EmptyPanelMessage message="Global market metrics are currently unavailable." />
        )}
      </section>

      <section className="dashboard-grid">
        <article className="panel wide-panel">
          <header className="panel-header">
            <h2>Top Coins by Market Cap</h2>
            <p>24h + 7d trend overview</p>
          </header>

          <div className="panel-controls">
            <label className="control-field control-search">
              <Search size={15} />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name or symbol"
                aria-label="Search top coins"
              />
            </label>

            <label className="control-field">
              <span>Trend</span>
              <select
                value={trendFilter}
                onChange={(event) => {
                  const nextValue = event.target.value;

                  if (isTrendFilter(nextValue)) {
                    setTrendFilter(nextValue);
                  }
                }}
                aria-label="Filter by trend"
              >
                <option value="all">All</option>
                <option value="gainers">Gainers</option>
                <option value="losers">Losers</option>
              </select>
            </label>

            <label className="control-field">
              <span>Sort</span>
              <select
                value={sortKey}
                onChange={(event) => {
                  const nextValue = event.target.value;

                  if (isSortKey(nextValue)) {
                    setSortKey(nextValue);
                  }
                }}
                aria-label="Sort top coins"
              >
                {sortKeys.map((key) => (
                  <option key={key} value={key}>
                    {getSortKeyLabel(key)}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="control-toggle"
              type="button"
              onClick={() =>
                setSortDirection((currentDirection) =>
                  currentDirection === "asc" ? "desc" : "asc",
                )
              }
              aria-label="Toggle sort direction"
            >
              {sortDirection === "asc" ? <ArrowUpAZ size={16} /> : <ArrowDownAZ size={16} />}
              {sortDirection.toUpperCase()}
            </button>

            <button className="control-clear" type="button" onClick={resetControls}>
              <X size={14} />
              Clear
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Coin</th>
                  <th>Price</th>
                  <th>24h</th>
                  <th>7d</th>
                  <th>Volume</th>
                  <th>7d Line</th>
                </tr>
              </thead>
              <tbody>
                {isTopCoinsLoading ? (
                  Array.from({ length: 8 }, (_, index) => (
                    <tr key={index} aria-hidden="true">
                      <td>
                        <span className="skeleton-box skeleton-text-short" />
                      </td>
                      <td>
                        <span className="skeleton-box skeleton-text-wide" />
                      </td>
                      <td>
                        <span className="skeleton-box skeleton-text-medium" />
                      </td>
                      <td>
                        <span className="skeleton-box skeleton-text-short" />
                      </td>
                      <td>
                        <span className="skeleton-box skeleton-text-short" />
                      </td>
                      <td>
                        <span className="skeleton-box skeleton-text-medium" />
                      </td>
                      <td>
                        <span className="skeleton-box skeleton-text-wide" />
                      </td>
                    </tr>
                  ))
                ) : topCoinsError && topCoins.length === 0 ? (
                  <tr className="table-message-row">
                    <td colSpan={7}>
                      <EmptyPanelMessage
                        message={`Unable to load top coins: ${getErrorMessage(topCoinsError)}`}
                      />
                    </td>
                  </tr>
                ) : visibleTopCoins.length === 0 ? (
                  <tr className="table-message-row">
                    <td colSpan={7}>
                      <EmptyPanelMessage message="No coins match your current search/filter." />
                    </td>
                  </tr>
                ) : (
                  visibleTopCoins.map((coin) => (
                    <tr key={coin.id}>
                      <td>{coin.market_cap_rank ?? "-"}</td>
                      <td className="coin-cell">
                        <img className="coin-logo" src={coin.image} alt="" loading="lazy" />
                        <div>
                          <p>{coin.name}</p>
                          <span>{coin.symbol.toUpperCase()}</span>
                        </div>
                      </td>
                      <td>{formatUsd(coin.current_price)}</td>
                      <td>
                        <TrendBadge value={coin.price_change_percentage_24h} />
                      </td>
                      <td>
                        <TrendBadge value={coin.price_change_percentage_7d_in_currency} />
                      </td>
                      <td>{formatUsd(coin.total_volume, true)}</td>
                      <td className="sparkline-cell">
                        <Sparkline
                          points={coin.sparkline_in_7d?.price ?? []}
                          trend={coin.price_change_percentage_7d_in_currency}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <header className="panel-header">
            <h2>Trending Coins</h2>
            <p>Most searched assets right now</p>
          </header>

          {isTrendingLoading ? (
            <div className="trending-grid">
              {Array.from({ length: 5 }, (_, index) => (
                <article className="trend-card" key={index} aria-hidden="true">
                  <div className="trend-title-row">
                    <span className="skeleton-box skeleton-circle" />
                    <div>
                      <p className="trend-name skeleton-box skeleton-text-medium" />
                      <span className="trend-symbol skeleton-box skeleton-text-short" />
                    </div>
                    <span className="trend-rank skeleton-box skeleton-text-short" />
                  </div>
                  <div className="trend-metrics">
                    <p>
                      <span className="skeleton-box skeleton-text-medium" />
                      <strong className="skeleton-box skeleton-text-short" />
                    </p>
                    <p>
                      <span className="skeleton-box skeleton-text-medium" />
                      <strong className="skeleton-box skeleton-text-short" />
                    </p>
                    <p>
                      <span className="skeleton-box skeleton-text-medium" />
                      <strong className="skeleton-box skeleton-text-short" />
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : trendingCoinsError && trendingCoins.length === 0 ? (
            <EmptyPanelMessage
              message={`Unable to load trending coins: ${getErrorMessage(trendingCoinsError)}`}
            />
          ) : trendingCoins.length === 0 ? (
            <EmptyPanelMessage message="No trending coin data returned right now." />
          ) : (
            <div className="trending-grid">
              {trendingCoins.map((coin) => (
                <article className="trend-card" key={coin.id}>
                  <div className="trend-title-row">
                    <img src={coin.thumb} alt="" loading="lazy" />
                    <div>
                      <p className="trend-name">{coin.name}</p>
                      <span className="trend-symbol">{coin.symbol.toUpperCase()}</span>
                    </div>
                    <span className="trend-rank">#{coin.score + 1}</span>
                  </div>
                  <div className="trend-metrics">
                    <p>
                      <span>Price (BTC)</span>
                      <strong>{formatBtc(coin.priceBtc)}</strong>
                    </p>
                    <p>
                      <span>Price (USD)</span>
                      <strong>{coin.priceUsd !== null ? formatUsd(coin.priceUsd) : "n/a"}</strong>
                    </p>
                    <p>
                      <span>24h Change</span>
                      <TrendBadge value={coin.priceChange24hUsd} />
                    </p>
                    <p>
                      <span>Market Cap Rank</span>
                      <strong>{coin.marketCapRank ?? "n/a"}</strong>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="panel">
          <header className="panel-header">
            <h2>Market Dominance</h2>
            <p>Share of total market cap by asset</p>
          </header>

          {isGlobalLoading ? (
            <ul className="dominance-list">
              {Array.from({ length: 4 }, (_, index) => (
                <li key={index} aria-hidden="true">
                  <span className="skeleton-box skeleton-text-short" />
                  <strong className="skeleton-box skeleton-text-short" />
                </li>
              ))}
            </ul>
          ) : dominance.length === 0 ? (
            <EmptyPanelMessage message="Dominance metrics are unavailable." />
          ) : (
            <ul className="dominance-list">
              {dominance.map(([symbol, percent]) => (
                <li key={symbol}>
                  <span>{symbol.toUpperCase()}</span>
                  <strong>{formatPercent(percent, false)}</strong>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}

export default App;
