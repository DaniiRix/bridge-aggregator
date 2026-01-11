import { useQuery } from "@tanstack/react-query";
import { zeroAddress } from "viem";
import { fetchPrices } from "@/lib/actions/token";
import { chainIdToName } from "@/lib/constants/chains";
import type { Token } from "@/store/bridge";
import { useBridge } from "@/store/bridge";

const STALE_TIME_MS = 60_000;

export const useTokensPrice = () => {
  const { from, to } = useBridge();

  return useQuery<{
    fromTokenPrice: string;
    toTokenPrice: string;
    gasTokenPrice: string;
  }>({
    queryKey: [
      "token-price",
      from.chain?.id,
      from.token?.address,
      to.chain?.id,
      to.token?.address,
    ],
    queryFn: () => getTokensPrice(from.token, to.token),
    enabled: Boolean(
      from.chain?.id && from.token?.address && to.token?.address,
    ),
    staleTime: STALE_TIME_MS,
    refetchInterval: STALE_TIME_MS,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

async function getTokensPrice(
  fromToken?: Token,
  toToken?: Token,
): Promise<{
  fromTokenPrice: string;
  toTokenPrice: string;
  gasTokenPrice: string;
}> {
  if (!fromToken || !toToken)
    return { fromTokenPrice: "0", toTokenPrice: "0", gasTokenPrice: "0" };

  try {
    const fromChainName = chainIdToName(fromToken.chainId);
    if (!fromChainName) {
      console.warn(`Unknown chain ID: ${fromToken.chainId}`);
      return { fromTokenPrice: "0", toTokenPrice: "0", gasTokenPrice: "0" };
    }

    const toChainName = chainIdToName(toToken.chainId);
    if (!toChainName) {
      console.warn(`Unknown chain ID: ${toToken.chainId}`);
      return { fromTokenPrice: "0", toTokenPrice: "0", gasTokenPrice: "0" };
    }

    const tokenPrice = await fetchPrices([
      `${fromChainName}:${fromToken.address}`,
      `${toChainName}:${toToken.address}`,
      `${fromChainName}:${zeroAddress}`,
    ]);

    return {
      fromTokenPrice: String(
        tokenPrice[`${fromChainName}:${fromToken.address}`]?.price ?? 0,
      ),
      toTokenPrice: String(
        tokenPrice[`${toChainName}:${toToken.address}`]?.price ?? 0,
      ),
      gasTokenPrice: String(
        tokenPrice[`${fromChainName}:${zeroAddress}`]?.price ?? 0,
      ),
    };
  } catch (error) {
    console.error(`Failed to fetch token prices`, error);
    return { fromTokenPrice: "0", toTokenPrice: "0", gasTokenPrice: "0" };
  }
}
