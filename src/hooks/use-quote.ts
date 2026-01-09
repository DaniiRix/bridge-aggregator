import { useQuery } from "@tanstack/react-query";
import { type Address, getAddress, parseUnits } from "viem";
import { useConnection } from "wagmi";
import { BridgeAggregator } from "@/lib/aggregator";
import { AcrossAdapter } from "@/lib/aggregator/adapters/across";
import type { Quote, QuoteRequest } from "@/lib/aggregator/adapters/base";
import { RelayAdapter } from "@/lib/aggregator/adapters/relay";
import { useBridge } from "@/lib/providers/bridge-store";
import type { BridgeState } from "@/store/bridge";
import { useDebounce } from "./use-debounce";

const acrossAdapter = new AcrossAdapter();
const relayAdapter = new RelayAdapter();
const aggregator = new BridgeAggregator([acrossAdapter, relayAdapter], {
  timeout: 5000,
});

const STALE_TIME_MS = 25_000;

export const useQuote = () => {
  const { address } = useConnection();
  const { from, to } = useBridge((state) => state);

  const debouncedAmount = useDebounce(from.amount, 300);

  return useQuery<{ quotes: Quote[]; warnings: string[] }>({
    queryKey: ["quotes", from, to, debouncedAmount],
    queryFn: () => getQuotes(address, from, to, debouncedAmount),
    enabled: Boolean(
      address &&
        from.chain &&
        from.token &&
        to.chain &&
        to.token &&
        debouncedAmount &&
        parseFloat(debouncedAmount),
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

  const result = await aggregator.getQuotes(request);
  return { quotes: result, warnings };
};
