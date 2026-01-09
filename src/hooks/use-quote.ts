import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js-light";
import { type Address, formatUnits, getAddress, parseUnits } from "viem";
import { useConnection } from "wagmi";
import { BridgeAggregator } from "@/lib/aggregator";
import { AcrossAdapter } from "@/lib/aggregator/adapters/across";
import type {
  QuoteRequest,
  QuoteWithAmount,
} from "@/lib/aggregator/adapters/base";
import { RelayAdapter } from "@/lib/aggregator/adapters/relay";
import { useBridge } from "@/lib/providers/bridge-store";
import type { BridgeState } from "@/store/bridge";
import { useDebounce } from "./use-debounce";
import { useTokensPrice } from "./use-token-price";

const acrossAdapter = new AcrossAdapter();
const relayAdapter = new RelayAdapter();
const aggregator = new BridgeAggregator([acrossAdapter, relayAdapter], {
  timeout: 5000,
});

const STALE_TIME_MS = 25_000;

export const useQuote = () => {
  const { address } = useConnection();
  const { from, to } = useBridge((state) => state);

  const debouncedAmount = useDebounce(from.amount, 500);

  const { data: { toTokenPrice, gasTokenPrice } = {} } = useTokensPrice();

  return useQuery<{ quotes: QuoteWithAmount[]; warnings: string[] }>({
    queryKey: [
      "quotes",
      from.token?.chainId,
      from.token?.address,
      to.token?.chainId,
      to.token?.address,
      debouncedAmount,
    ],
    queryFn: () =>
      getQuotes(
        address,
        from,
        to,
        debouncedAmount,
        toTokenPrice,
        gasTokenPrice,
      ),
    enabled: Boolean(
      address &&
        from.chain &&
        from.token &&
        to.chain &&
        to.token &&
        debouncedAmount,
    ),
    staleTime: STALE_TIME_MS,
    refetchInterval: STALE_TIME_MS,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

const getQuotes = async (
  address?: Address,
  from?: BridgeState["from"],
  to?: BridgeState["to"],
  debouncedAmount?: string,
  tokenPrice?: string,
  gasTokenPrice?: string,
) => {
  if (
    !address ||
    !from?.chain ||
    !from?.token ||
    !debouncedAmount ||
    !parseFloat(debouncedAmount) ||
    !to?.chain ||
    !to?.token
  )
    return { quotes: [], warnings: [] };

  const warnings: string[] = []; // @todo
  const request: QuoteRequest = {
    srcChainId: from.chain.id,
    dstChainId: to.chain.id,
    inputToken: getAddress(from.token.address),
    outputToken: getAddress(to.token.address),
    sender: address,
    amount: parseUnits(debouncedAmount, from.token.decimals).toString(),
  };

  const quotes = await aggregator.getQuotes(request);
  console.log({ quotes });

  const quotesWithAmount: QuoteWithAmount[] = quotes.map((q) => {
    const estimatedAmountUSD = new Decimal(tokenPrice ?? "0").mul(
      formatUnits(BigInt(q.estimatedAmount), to.token!.decimals),
    );

    const estimatedAmountAfterFeesUSD = new Decimal(gasTokenPrice ?? "0").mul(
      formatUnits(BigInt(q.estimatedAmount), to.token!.decimals),
    );

    return {
      ...q,
      estimatedAmountUSD: estimatedAmountUSD.toDecimalPlaces(2).toString(),
      estimatedAmountAfterFeesUSD: "0",
    };
  });

  console.log({ quotesWithAmount });
  const sortedQuotes = quotesWithAmount.sort(
    (a, b) =>
      parseFloat(b.estimatedAmountAfterFeesUSD || "0") -
      parseFloat(a.estimatedAmountAfterFeesUSD || "0"),
  );

  return { quotes: sortedQuotes, warnings };
};
