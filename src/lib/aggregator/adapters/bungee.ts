// ref: https://docs.bungee.exchange/bungee-api/api-reference
// domain/ip whitelist at: https://docs.bungee.exchange/bungee-api/api-reference/
import { zeroAddress } from "viem";
import { BaseAdapter, type Quote, type QuoteRequest } from "./base";

const SUPPORTED_CHAINS = [
  1, // Ethereum
  10, // Optimism
  56, // BNB
  100, // Gnosis
  130, // Unichain
  137, // Polygon
  143, // Monad
  146, // Sonic
  324, // zkSync Era
  480, // World Chain
  999, // HyperEVM
  1101, // Polygon zkEVM
  1329, // Sei
  1337, // Hypercore
  1868, // Soneium
  2741, // Abstract
  5000, // Mantle
  8453, // Base
  9745, // Plasma
  34443, // Mode
  42161, // Arbitrum
  43114, // Avalanche
  57073, // Ink
  59144, // Linea
  80094, // Berachain
  81457, // Blast
  89999, // Solana
  98866, // Plume
  534352, // Scroll
  747474, // Katana
  728126428, // Tron
];

export class BungeeAdapter extends BaseAdapter {
  apiEndpoint = "https://public-backend.bungee.exchange"; // @todo: replace with https://backend.bungee.exchange
  affiliateId = ""; // @todo: add affiliate id

  constructor() {
    super("bungee", "https://icons.llamao.fi/icons/protocols/bungee?w=48&q=75");
  }

  async supportsRoute(request: QuoteRequest): Promise<boolean> {
    if (
      !SUPPORTED_CHAINS.includes(request.srcChainId) ||
      !SUPPORTED_CHAINS.includes(request.dstChainId)
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

    const inToken =
      inputToken.address === zeroAddress
        ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
        : inputToken.address;
    const outToken =
      outputToken.address === zeroAddress
        ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
        : outputToken.address;

    const url = new URL(`${this.apiEndpoint}/api/v1/bungee/quote`);
    url.searchParams.set("userAddress", sender);
    url.searchParams.set("originChainId", srcChainId.toString());
    url.searchParams.set("destinationChainId", dstChainId.toString());
    url.searchParams.set("inputToken", inToken);
    url.searchParams.set("outputToken", outToken);
    url.searchParams.set("inputAmount", amount);
    url.searchParams.set("receiverAddress", recipient);
    url.searchParams.set("slippage", String(slippagePercent));
    url.searchParams.set("useInbox", String(true)); // using approval flow instead of permit 2
    url.searchParams.set("enableMultipleAutoRoutes", String(true));

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // affiliate: this.affiliateId,
      },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `[Bungee] Error fetching quote: ${errorData.message || res.statusText}`,
      );
    }

    const data = await res.json();
    if (!data.success || !data?.result?.autoRoute) {
      throw new Error(`[Bungee] Error fetching quote: ${data.message}`);
    }

    const route = data.result.autoRoute;

    return {
      adapter: { name: this.name, logo: this.logo },
      tokenSpenderAddress: route.approvalData?.spenderAddress,
      estimatedTime: route.estimatedTime || 0,
      estimatedAmount: route.output?.amount || "0",
      gasEstimate: String(route.gasFee?.gasLimit || "0"),
      txRequest: {
        to: route.txData?.to,
        data: route.txData?.data,
        value: route.txData?.value ? BigInt(route.txData.value) : undefined,
      },
    };
  }
}
