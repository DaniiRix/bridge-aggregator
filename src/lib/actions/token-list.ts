"use server";

import { zeroAddress } from "viem";
import { normalizeAddress } from "@/utils/string";
import { bridgeAggregator } from "../aggregator";

export type NearToken = {
  assetId: string;
  blockchain: string;
  contractAddress?: string;
};
export type ChainTokenMap = { [chainId: number]: string[] };
type TransformedTokenData = Required<NearToken>[] | ChainTokenMap;

interface TokenCache {
  data: TransformedTokenData;
  fetchedAt: number;
}

const tokenCache = new Map<string, TokenCache>();
const STALE_TIME_MS = 24 * 60 * 60 * 1000; // 24 hours

export const getTokensList = async (adapter: string) => {
  try {
    const cached = tokenCache.get(adapter);
    if (cached && Date.now() - cached.fetchedAt < STALE_TIME_MS) {
      return cached.data;
    }

    if (
      !cached?.data ||
      (typeof cached.data === "object" &&
        Object.keys(cached.data).length === 0) ||
      (Array.isArray(cached.data) && cached.data.length === 0)
    ) {
      const data = await loadTokens(
        adapter,
        bridgeAggregator.getTokenFetchApi(adapter),
      );
      return data || [];
    }

    void loadTokens(adapter, bridgeAggregator.getTokenFetchApi(adapter));
    return cached.data || [];
  } catch {
    throw new Error(`[TokenList] Failed to load tokens for ${adapter}:`);
  }
};

const loadTokens = async (adapter: string, apiEndpoint?: string) => {
  if (!apiEndpoint) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const res = await fetch(apiEndpoint, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `Error fetching token list: ${errorData.message || res.statusText}`,
      );
    }

    const data = await res.json();
    const transformedData = transformTokenData(adapter, data);

    tokenCache.set(adapter, {
      data: transformedData,
      fetchedAt: Date.now(),
    });

    return transformedData;
  } catch (error) {
    console.error(`Failed to save token list: ${error}`);
  } finally {
    clearTimeout(timeout);
  }
};

function transformTokenData(
  adapter: string,
  data: unknown,
): TransformedTokenData {
  switch (adapter) {
    case "near":
      return (data as NearToken[]).map(
        ({ assetId, blockchain, contractAddress }) => ({
          assetId,
          blockchain,
          contractAddress: contractAddress ?? zeroAddress,
        }),
      );

    case "across": {
      const transformedData: ChainTokenMap = {};

      (data as Array<{ chainId: number; address: string }>).forEach(
        ({ chainId, address }) => {
          if (!transformedData[chainId]) transformedData[chainId] = [];
          transformedData[chainId].push(normalizeAddress(address));
        },
      );
      return transformedData;
    }

    case "lifi": {
      const transformedData: ChainTokenMap = {};
      const { tokens } = data as {
        tokens: Record<string, { address: string }[]>;
      };

      Object.entries(tokens).forEach(([chainId, tokenList]) => {
        transformedData[Number(chainId)] = tokenList.map((t) =>
          normalizeAddress(t.address),
        );
      });

      return transformedData;
    }

    default:
      throw new Error(`Unsupported adapter: ${adapter}`);
  }
}
