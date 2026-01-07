import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js-light";
import { type Address, erc20Abi, zeroAddress } from "viem";
import { useConnection } from "wagmi";
import { getBalance, readContract } from "wagmi/actions";
import { fetchBalancesAndPrices } from "@/lib/actions/token";
import { chainIdToName } from "@/lib/constants/chains";
import { wrappedTokensByChain } from "@/lib/constants/tokens";
import { wagmiConfig } from "@/lib/providers";
import type { Token } from "@/store/bridge";
import { normalizeAddress } from "@/utils/string";
import { useTokens } from "./use-tokens";

export interface TokenWithBalance extends Token {
  amount?: string;
  balanceUSD?: string;
}

const STALE_TIME_MS = 60_000;

export const useTokenBalance = (chainId?: number) => {
  const { address } = useConnection();

  const { data: tokens } = useTokens(chainId);

  return useQuery<TokenWithBalance[]>({
    queryKey: ["token-balances", address, chainId],
    queryFn: () => getBalances(address, chainId, tokens),
    enabled: Boolean(address && chainId && !!tokens),
    staleTime: STALE_TIME_MS,
    refetchInterval: STALE_TIME_MS,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

const calculateUSD = (
  amount?: string,
  price?: number,
  decimals?: number,
): string => {
  if (!price || !amount || !decimals) return "0";

  return new Decimal(price)
    .mul(new Decimal(amount))
    .div(new Decimal(10).pow(decimals))
    .toNumber()
    .toFixed(2);
};

async function getBalances(
  address?: Address,
  chainId?: number,
  tokens?: Token[],
): Promise<TokenWithBalance[]> {
  if (!address || !chainId || !tokens) return [];

  try {
    const chainName = chainIdToName(chainId);
    if (!chainName) {
      console.warn(`Unknown chain ID: ${chainId}`);
      return [];
    }

    const wrappedToken = wrappedTokensByChain[chainId];

    const [{ balances, prices }, gasBalance, wrappedTokenBalance] =
      await Promise.all([
        fetchBalancesAndPrices(chainId, address),
        getBalance(wagmiConfig, { address, chainId }).catch(() => null),
        wrappedToken
          ? readContract(wagmiConfig, {
              address: wrappedToken,
              abi: erc20Abi,
              functionName: "balanceOf",
              args: [address],
              chainId,
            }).catch(() => null)
          : Promise.resolve(null),
      ]);

    const allBalances = [
      ...balances.balances,
      {
        address: zeroAddress,
        total_amount: gasBalance?.value?.toString() ?? "0",
      },
    ];

    const tokensMap = tokens.reduce<Record<string, Token>>((acc, token) => {
      acc[normalizeAddress(token.address)] = token;
      return acc;
    }, {});

    const finalBalances: Record<string, TokenWithBalance> = {};
    for (const tokenBalance of allBalances) {
      const token = tokensMap[normalizeAddress(tokenBalance.address)];
      if (!token) continue;

      const priceKey = `${chainName}:${token.address}`;
      const priceData = prices[priceKey];
      const balanceUSD = calculateUSD(
        tokenBalance.total_amount,
        priceData?.price,
        priceData?.decimals ?? 18,
      );
      if (new Decimal(balanceUSD).lessThan(0.01)) {
        continue;
      }

      finalBalances[normalizeAddress(token.address)] = {
        ...token,
        amount: tokenBalance.total_amount ?? "0",
        balanceUSD,
      };
    }

    if (
      wrappedTokenBalance !== null &&
      wrappedToken &&
      !!tokensMap[wrappedToken]
    ) {
      const gasTokenPrice = prices[`${chainName}:${zeroAddress}`];

      const balanceUSD = calculateUSD(
        wrappedTokenBalance.toString(),
        gasTokenPrice?.price,
        gasTokenPrice?.decimals ?? 18,
      );

      if (!new Decimal(balanceUSD).lessThan(0.01)) {
        finalBalances[normalizeAddress(wrappedToken)] = {
          ...tokensMap[wrappedToken],
          amount: wrappedTokenBalance.toString(),
          balanceUSD,
        };
      }
    }

    return Object.values(finalBalances).sort(
      (a, b) => Number(b.balanceUSD) - Number(a.balanceUSD),
    );
  } catch (error) {
    console.error(`Failed to fetch balances for ${chainId}:${address}`, error);
    return [];
  }
}
