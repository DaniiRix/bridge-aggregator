import { useEffect, useState } from "react";
import { getAddress, parseUnits } from "viem";
import { useConnection } from "wagmi";
import { BridgeAggregator } from "@/lib/aggregator";
import { AcrossAdapter } from "@/lib/aggregator/adapters/across";
import type { Quote, QuoteRequest } from "@/lib/aggregator/adapters/base";
import { useBridge } from "@/lib/providers/bridge-store";
import { useDebounce } from "./use-debounce";

const acrossAdapter = new AcrossAdapter();
const aggregator = new BridgeAggregator([acrossAdapter], {
  timeout: 5000,
});

export const useQuote = () => {
  const { address } = useConnection();
  const { from, to } = useBridge((state) => state);

  const [isLoading, setIsLoading] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const debouncedAmount = useDebounce(from.amount, 300);

  useEffect(() => {
    const fetchQuotes = async () => {
      if (
        !address ||
        !from.chain ||
        !from.token ||
        !debouncedAmount ||
        !to.chain ||
        !to.token
      )
        return;

      setIsLoading(true);

      try {
        const request: QuoteRequest = {
          srcChainId: from.chain.id,
          dstChainId: to.chain.id,
          inputToken: getAddress(from.token.address),
          outputToken: getAddress(to.token.address),
          sender: address,
          amount: parseUnits(debouncedAmount, from.token.decimals).toString(),
        };

        const result = await aggregator.getQuotes(request);
        setQuotes(result);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuotes();
  }, [address, from.chain, from.token, to.chain, to.token, debouncedAmount]);

  return {
    quotes,
    isLoading,
    warnings,
  };
};
