import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js-light";
import { type Address, formatUnits, parseUnits } from "viem";
import { useConnection, useGasPrice } from "wagmi";
import { getQuotesFromServer } from "@/lib/actions/quote";
import { bridgeAggregator } from "@/lib/aggregator";
import type {
  Quote,
  QuoteRequest,
  QuoteWithAmount,
} from "@/lib/aggregator/adapters/base";
import type { BridgeState } from "@/store/bridge";
import { useBridge } from "@/store/bridge";
import { usePrivacy } from "@/store/privacy";
import { useSlippage } from "@/store/slippage";
import { useDebounce } from "./use-debounce";
import { useTokensPrice } from "./use-token-price";

export const QUOTES_REFETCH_TIME_MS =
  process.env.NODE_ENV === "development" ? 200_000 : 25_000;

export const useQuote = () => {
  const { address } = useConnection();

  const { slippagePercent } = useSlippage((state) => state);
  const { from, to } = useBridge();
  const { isPrivacyEnabled } = usePrivacy();

  const debouncedAmount = useDebounce(from.amount, 500);
  const { data: { toTokenPrice, gasTokenPrice } = {} } = useTokensPrice();
  const { data: gasPrice } = useGasPrice({
    chainId: from.chain?.id,
  });

  return useQuery<QuoteWithAmount[]>({
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
        isPrivacyEnabled,
        slippagePercent,
        toTokenPrice,
        gasTokenPrice,
        gasPrice,
      ),
    enabled: Boolean(
      address &&
        from.chain &&
        from.token &&
        to.chain &&
        to.token &&
        debouncedAmount,
    ),
    staleTime: QUOTES_REFETCH_TIME_MS,
    refetchInterval: QUOTES_REFETCH_TIME_MS,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

const getQuotes = async (
  address?: Address,
  from?: BridgeState["from"],
  to?: BridgeState["to"],
  debouncedAmount?: string,
  isPrivacyEnabled?: boolean,
  slippagePercent?: number,
  tokenPrice?: string,
  gasTokenPrice?: string,
  gasPrice?: bigint,
) => {
  if (
    !address ||
    !from?.chain ||
    !from?.token ||
    !debouncedAmount ||
    !slippagePercent ||
    !parseFloat(debouncedAmount) ||
    !to?.chain ||
    !to?.token ||
    !tokenPrice ||
    !gasPrice ||
    !gasTokenPrice
  )
    return [];

  const request: QuoteRequest = {
    slippagePercent,
    srcChainId: from.chain.id,
    dstChainId: to.chain.id,
    inputToken: from.token,
    outputToken: to.token,
    sender: address,
    amount: parseUnits(debouncedAmount, from.token.decimals).toString(),
  };

  let quotes: Quote[] = [];
  if (isPrivacyEnabled) {
    quotes = await getQuotesFromServer(request);
  } else {
    quotes = await bridgeAggregator.getQuotes(request);
  }

  console.log({ quotes });

  const quotesWithAmount: QuoteWithAmount[] = quotes.map((q) => {
    const estimatedAmountUSD = new Decimal(tokenPrice).mul(
      formatUnits(BigInt(q.estimatedAmount), to.token!.decimals),
    );

    const gasFeesUSD = new Decimal(gasTokenPrice)
      .mul(gasPrice?.toString())
      .mul(q.gasEstimate)
      .div(1e18);

    const estimatedAmountAfterFeesUSD = estimatedAmountUSD
      .sub(gasFeesUSD)
      .toDecimalPlaces(4)
      .toString();

    return {
      ...q,
      estimatedAmountUSD: estimatedAmountUSD.toDecimalPlaces(2).toString(),
      estimatedAmountAfterFeesUSD,
    };
  });

  const sortedQuotes = quotesWithAmount.sort((a, b) => {
    if (a.gasEstimate === "0" && b.gasEstimate !== "0") return 1;
    if (a.gasEstimate !== "0" && b.gasEstimate === "0") return -1;

    return (
      parseFloat(b.estimatedAmountAfterFeesUSD || "0") -
      parseFloat(a.estimatedAmountAfterFeesUSD || "0")
    );
  });

  return sortedQuotes;
};
