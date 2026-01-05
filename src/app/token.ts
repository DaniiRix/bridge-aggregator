"use server";

import { type Address, zeroAddress } from "viem";
import { chainIdToName } from "@/lib/constants/chains";
import { scramble } from "@/utils/string";

interface RawBalance {
  address: string;
  total_amount: string;
  whitelist?: boolean;
}

interface BalancesResponse {
  balances: RawBalance[];
}

interface PriceData {
  decimals: number;
  symbol: string;
  price: number;
}

const BALANCE_API_BASE = "https://peluche.llamao.fi";
const PRICE_API_BASE = "https://coins.llama.fi";
const PRICE_BATCH_SIZE = 100;
const API_KEY =
  "_RqMaPV5)37j3HUOp41RbJrqOoq4wi6eB_J64fjiLrsKL?hhe_h_r0wh7fgEOh_d";

export async function fetchPrices(
  tokens: string[],
): Promise<Record<string, PriceData>> {
  if (tokens.length === 0) return {};

  const batches = Array.from(
    { length: Math.ceil(tokens.length / PRICE_BATCH_SIZE) },
    (_, i) => tokens.slice(i * PRICE_BATCH_SIZE, (i + 1) * PRICE_BATCH_SIZE),
  );

  const responses = await Promise.all(
    batches.map((batch) =>
      fetch(`${PRICE_API_BASE}/prices/current/${batch.join(",")}`)
        .then((r) => r.json())
        .catch(() => ({ coins: {} })),
    ),
  );

  return responses.reduce(
    (acc, res) => ({ ...acc, ...res.coins }),
    {} as Record<string, PriceData>,
  );
}

export async function fetchBalancesAndPrices(
  chainId: number,
  address: Address,
) {
  const res = await fetch(
    `${BALANCE_API_BASE}/balances?addresses=${address}&chainId=${chainId}&type=erc20`,
    {
      headers: { "x-api-key": scramble(API_KEY) },
    },
  );

  if (!res.ok) throw new Error(`Failed to fetch balances: ${res.status}`);
  const balancesData: BalancesResponse = await res.json();

  const tokensToPrice = [
    ...balancesData.balances
      .filter((b) => b.whitelist)
      .map((b) => `${chainIdToName(chainId)}:${b.address}`),
    `${chainIdToName(chainId)}:${zeroAddress}`,
  ];

  const prices = await fetchPrices(tokensToPrice);

  return { balances: balancesData, prices };
}
