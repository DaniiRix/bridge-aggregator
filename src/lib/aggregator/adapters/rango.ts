// get api key from here: https://docs.rango.exchange/api-integration/api-key-and-rate-limits
import { zeroAddress } from "viem";
import { BaseAdapter, type Quote, type QuoteRequest } from "./base";

export class RangoAdapter extends BaseAdapter {
  apiEndpoint = "https://api.rango.exchange";
  apiKey = "c6381a79-2817-4602-83bf-6a641a409e32"; // @todo: add api key
  referrerCode = ""; // @todo: add referrer code
  supportedChainIds = [
    42161, // Arbitrum
    1313161554, // Aurora
    43114, // Avalanche
    8453, // Base
    81457, // Blast
    56288, // Boba BNB
    56, // BNB
    42220, // Celo
    25, // Cronos
    1, // Ethereum
    59144, // Linea
    1088, // Metis
    34443, // Mode
    1284, // Moonbeam
    1285, // Moonriver
    66, // OKX Chain (OKC)
    10, // Optimism
    137, // Polygon
    1101, // Polygon zkEVM
    534352, // Scroll
    324, // zkSync Era
    146, // Sonic
    167000, // Taiko
    7777777, // Zora
    80094, // Berachain
  ];
  chainIdToName: Record<string, string> = {
    "1": "ETH",
    "10": "OPTIMISM",
    "25": "CRONOS",
    "56": "BSC",
    "66": "OKC",
    "100": "GNOSIS",
    "137": "POLYGON",
    "146": "SONIC",
    "324": "ZKSYNC",
    "1088": "METIS",
    "1101": "POLYGONZK",
    "1284": "MOONBEAM",
    "1285": "MOONRIVER",
    "8453": "BASE",
    "34443": "MODE",
    "42161": "ARBITRUM",
    "42220": "CELO",
    "43114": "AVAX_CCHAIN",
    "56288": "BOBA_BNB",
    "59144": "LINEA",
    "80094": "BERACHAIN",
    "81457": "BLAST",
    "167000": "TAIKO",
    "534352": "SCROLL",
    "7777777": "ZORA",
    "1313161554": "AURORA",
  };

  constructor() {
    super(
      "rango",
      "https://icons.llamao.fi/icons/protocols/rango?w=48&q=75",
      false,
    );
  }

  async supportsRoute(request: QuoteRequest): Promise<boolean> {
    if (
      !this.supportedChainIds.includes(request.srcChainId) ||
      !this.supportedChainIds.includes(request.dstChainId)
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
      amount,
    } = request;

    const fromToken =
      inputToken.address === zeroAddress
        ? `${this.chainIdToName[String(srcChainId)]}.${inputToken.symbol}`
        : `${this.chainIdToName[String(srcChainId)]}--${inputToken.address}`;
    const toToken =
      outputToken.address === zeroAddress
        ? `${this.chainIdToName[String(dstChainId)]}.${outputToken.symbol}`
        : `${this.chainIdToName[String(dstChainId)]}--${outputToken.address}`;

    const url = new URL(`${this.apiEndpoint}/basic/swap`);
    url.searchParams.set("apiKey", this.apiKey);
    url.searchParams.set("from", fromToken);
    url.searchParams.set("to", toToken);
    url.searchParams.set("amount", amount);
    url.searchParams.set("slippage", slippagePercent.toString());
    url.searchParams.set("fromAddress", sender);
    url.searchParams.set("toAddress", sender);
    // url.searchParams.set("referrerCode", this.referrerCode);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `[Rango] Error fetching quote: ${errorData.error || res.statusText}`,
      );
    }

    const data = await res.json();
    if (data?.error) {
      throw new Error(`[Rango] Error fetching quote: ${data.error}`);
    }

    return {
      adapter: { name: this.name, logo: this.logo },
      tokenSpenderAddress: data?.tx?.approveTo,
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
