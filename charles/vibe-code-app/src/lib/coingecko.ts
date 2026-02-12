import { z } from "zod";

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

const globalMarketSchema = z.object({
  data: z.object({
    active_cryptocurrencies: z.number(),
    markets: z.number(),
    total_market_cap: z.record(z.string(), z.number()),
    total_volume: z.record(z.string(), z.number()),
    market_cap_percentage: z.record(z.string(), z.number()),
    market_cap_change_percentage_24h_usd: z.number(),
    updated_at: z.number(),
  }),
});

const marketCoinSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  image: z.string(),
  current_price: z.number(),
  market_cap: z.number(),
  market_cap_rank: z.number().nullable(),
  total_volume: z.number(),
  price_change_percentage_24h: z.number().nullable(),
  price_change_percentage_7d_in_currency: z.number().nullable().optional(),
  sparkline_in_7d: z
    .object({
      price: z.array(z.number()),
    })
    .nullable()
    .optional(),
});

const topCoinsSchema = z.array(marketCoinSchema);

const trendingCoinsSchema = z.object({
  coins: z.array(
    z.object({
      item: z.object({
        id: z.string(),
        name: z.string(),
        symbol: z.string(),
        market_cap_rank: z.number().nullable(),
        thumb: z.string(),
        score: z.number(),
        price_btc: z.number(),
        data: z
          .object({
            price: z.union([z.number(), z.string()]).optional(),
            price_change_percentage_24h: z
              .object({
                usd: z.union([z.number(), z.string()]).optional(),
              })
              .optional(),
          })
          .passthrough()
          .optional(),
      }),
    }),
  ),
});

type QueryValue = string | number | boolean;

export type GlobalMarketSnapshot = z.infer<typeof globalMarketSchema>["data"];
export type MarketCoin = z.infer<typeof marketCoinSchema>;

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  marketCapRank: number | null;
  score: number;
  priceBtc: number;
  priceUsd: number | null;
  priceChange24hUsd: number | null;
  thumb: string;
}

const toNumber = (value: number | string | undefined): number | null => {
  if (value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const parsed = Number(value.replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const fetchFromCoinGecko = async <T>(
  endpoint: string,
  schema: z.ZodType<T>,
  queryParams: Record<string, QueryValue> = {},
): Promise<T> => {
  const normalizedEndpoint = endpoint.replace(/^\/+/, "");
  const url = new URL(normalizedEndpoint, `${COINGECKO_BASE_URL}/`);

  for (const [key, value] of Object.entries(queryParams)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`CoinGecko request failed: ${response.status}`);
  }

  const payload: unknown = await response.json();
  return schema.parse(payload);
};

export const fetchGlobalMarketSnapshot =
  async (): Promise<GlobalMarketSnapshot> => {
    const payload = await fetchFromCoinGecko("/global", globalMarketSchema);
    return payload.data;
  };

export const fetchTopCoins = async (): Promise<MarketCoin[]> =>
  fetchFromCoinGecko("/coins/markets", topCoinsSchema, {
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: 15,
    page: 1,
    sparkline: true,
    price_change_percentage: "24h,7d",
  });

export const fetchTrendingCoins = async (): Promise<TrendingCoin[]> => {
  const payload = await fetchFromCoinGecko(
    "/search/trending",
    trendingCoinsSchema,
  );

  return payload.coins
    .map(({ item }) => ({
      id: item.id,
      name: item.name,
      symbol: item.symbol,
      marketCapRank: item.market_cap_rank,
      score: item.score,
      priceBtc: item.price_btc,
      priceUsd: toNumber(item.data?.price),
      priceChange24hUsd: toNumber(item.data?.price_change_percentage_24h?.usd),
      thumb: item.thumb,
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 7);
};
