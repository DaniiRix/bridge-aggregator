// get api key from here: https://docs.rango.exchange/api-integration/api-key-and-rate-limits
import { zeroAddress } from "viem";
import { BaseAdapter, type Quote, type QuoteRequest } from "./base";

const CHAIN_NAME_MAP: Record<number, string> = {
  1: "ETH",
  10: "OPTIMISM",
  25: "CRONOS",
  56: "BSC",
  66: "OKC",
  100: "GNOSIS",
  137: "POLYGON",
  146: "SONIC",
  324: "ZKSYNC",
  1088: "METIS",
  1101: "POLYGONZK",
  1284: "MOONBEAM",
  1285: "MOONRIVER",
  8453: "BASE",
  34443: "MODE",
  42161: "ARBITRUM",
  42220: "CELO",
  43114: "AVAX_CCHAIN",
  56288: "BOBA_BNB",
  59144: "LINEA",
  80094: "BERACHAIN",
  81457: "BLAST",
  167000: "TAIKO",
  534352: "SCROLL",
  7777777: "ZORA",
  1313161554: "AURORA",
};

export class RangoAdapter extends BaseAdapter {
  apiEndpoint = "https://api.rango.exchange";
  apiKey = "c6381a79-2817-4602-83bf-6a641a409e32"; // @todo: add api key
  referrerCode = ""; // @todo: add referrer code

  constructor() {
    super(
      "rango",
      "https://icons.llamao.fi/icons/protocols/rango?w=48&q=75",
      true,
    );
  }

  async supportsRoute(request: QuoteRequest): Promise<boolean> {
    if (
      !CHAIN_NAME_MAP[request.srcChainId] ||
      !CHAIN_NAME_MAP[request.dstChainId]
    )
      return false;

    return true;
  }

  async getQuote(request: QuoteRequest): Promise<Quote> {
    const {
      slippagePercent,
      srcChainId,
      dstChainId,
      inputToken,
      outputToken,
      sender,
      recipient,
      amount,
    } = request;

    const fromToken =
      inputToken.address === zeroAddress
        ? `${CHAIN_NAME_MAP[srcChainId]}.${inputToken.symbol}`
        : `${CHAIN_NAME_MAP[srcChainId]}--${inputToken.address}`;
    const toToken =
      outputToken.address === zeroAddress
        ? `${CHAIN_NAME_MAP[dstChainId]}.${outputToken.symbol}`
        : `${CHAIN_NAME_MAP[dstChainId]}--${outputToken.address}`;

    const url = new URL(`${this.apiEndpoint}/basic/swap`);
    url.searchParams.set("apiKey", this.apiKey);
    url.searchParams.set("from", fromToken);
    url.searchParams.set("to", toToken);
    url.searchParams.set("amount", amount);
    url.searchParams.set("slippage", slippagePercent.toString());
    url.searchParams.set("fromAddress", sender);
    url.searchParams.set("toAddress", recipient);
    // url.searchParams.set("referrerCode", this.referrerCode);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `[Rango] Error fetching quote: ${errorData.error || res.statusText}`,
      );
    }

    const data = await res.json();
    if (data?.error || data.resultType !== "OK") {
      throw new Error(`[Rango] Error fetching quote: ${data.error}`);
    }

    return {
      adapter: { name: this.name, logo: this.logo },
      tokenSpenderAddress: data?.tx?.txTo,
      estimatedTime: data?.route?.estimatedTimeInSeconds || 0,
      estimatedAmount: data?.route?.outputAmount || "0",
      gasEstimate: BigInt(data?.tx?.gasLimit || "0").toString(),
      txRequest: {
        to: data?.tx?.txTo,
        data: data?.tx?.txData,
        value: data?.tx?.value ? BigInt(data.tx.value) : undefined,
      },
    };
  }
}
