import { useQuery } from "@tanstack/react-query";
import { fetchPrices } from "@/lib/actions/token";
import { chainIdToName } from "@/lib/constants/chains";
import type { Token } from "@/store/bridge";

const STALE_TIME_MS = 60_000;

export const useTokenPrice = (token?: Token) => {
  return useQuery<string>({
    queryKey: ["token-price", token?.address],
    queryFn: () => getTokenPrice(token),
    enabled: Boolean(!!token),
    staleTime: STALE_TIME_MS,
    refetchInterval: STALE_TIME_MS,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

async function getTokenPrice(token?: Token): Promise<string> {
  if (!token) return "0";

  try {
    const chainName = chainIdToName(token.chainId);
    if (!chainName) {
      console.warn(`Unknown chain ID: ${token.chainId}`);
      return "0";
    }

    const tokenPrice = await fetchPrices([`${chainName}:${token.address}`]);
    return String(tokenPrice[`${chainName}:${token.address}`]?.price ?? 0);
  } catch (error) {
    console.error(`Failed to fetch token price for ${token.address}`, error);
    return "0";
  }
}
