import { useQuery } from "@tanstack/react-query";
import {
  fetchGlobalMarketSnapshot,
  fetchTopCoins,
  fetchTrendingCoins,
} from "../lib/coingecko";

export const useDashboardData = () => {
  const globalMarketQuery = useQuery({
    queryKey: ["global-market-snapshot"],
    queryFn: fetchGlobalMarketSnapshot,
    staleTime: 60_000,
    refetchInterval: 180_000,
  });

  const topCoinsQuery = useQuery({
    queryKey: ["top-market-coins"],
    queryFn: fetchTopCoins,
    staleTime: 45_000,
    refetchInterval: 120_000,
  });

  const trendingCoinsQuery = useQuery({
    queryKey: ["trending-coins"],
    queryFn: fetchTrendingCoins,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  return {
    globalMarketQuery,
    topCoinsQuery,
    trendingCoinsQuery,
  };
};
