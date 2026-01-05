import { useQuery } from "@tanstack/react-query";
import type { Token } from "@/store/bridge";

const STALE_TIME_MS = 60 * 60 * 1000; // 1 hour

export const useTokens = (chainId?: number) => {
  return useQuery<Token[]>({
    queryKey: ["tokens", chainId],
    queryFn: () => getTokens(chainId!),
    enabled: Boolean(chainId),
    staleTime: STALE_TIME_MS,
    refetchInterval: STALE_TIME_MS,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export async function getTokens(chainId: number) {
  try {
    const res = await fetch(
      `https://d3g10bzo9rdluh.cloudfront.net/tokenlists-${chainId}.json`,
    );

    const data = (await res.json()) as Record<string, Token>;
    const tokens = new Set<Token>(Object.values(data));

    return Array.from(tokens);
  } catch (error) {
    console.error(`Failed to fetch tokens for ${chainId}`, error);
    return [];
  }
}
