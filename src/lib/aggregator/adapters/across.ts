import type { ChainTokenMap } from "@/lib/actions/token-list";
import { normalizeAddress } from "@/utils/string";
import { BaseAdapter, type Quote, type QuoteRequest } from "./base";

const SUPPORTED_CHAINS = [
  1, // Ethereum
  10, // Optimism
  137, // Polygon
  42161, // Arbitrum
  324, // zkSync
  8453, // Base
  59144, // Linea
  34443, // Mode
  81457, // Blast
  1135, // Lisk
  534352, // Scroll
  7777777, // Zora
  480, // World Chain
  57073, // Ink
  1868, // Soneium
  130, // Unichain
  232, // Lens
  56, // BNB Smart Chain
  34268394551451, // Solana
  999, // HyperEVM
  9745, // Plasma
  143, // Monad
  1337, // HyperCore
];

export class AcrossAdapter extends BaseAdapter {
  apiEndpoint = "https://app.across.to/api";
  integratorId = "0xdead"; // @todo: add integrator id

  constructor() {
    super(
      "across",
      "https://icons.llamao.fi/icons/protocols/across?w=48&q=75",
      true,
      "https://app.across.to/api/swap/tokens",
    );
  }

  async supportsRoute(request: QuoteRequest): Promise<boolean> {
    const { srcChainId, dstChainId, inputToken, outputToken } = request;
    if (
      !SUPPORTED_CHAINS.includes(srcChainId) ||
      !SUPPORTED_CHAINS.includes(dstChainId)
    )
      return false;

    const tokens = (await this.getTokens()) as ChainTokenMap;

    const isInputSupported = tokens[srcChainId].some(
      (token) => token === normalizeAddress(inputToken.address),
    );
    if (!isInputSupported) return false;

    const isOutputSupported = tokens[dstChainId].some(
      (token) => token === normalizeAddress(outputToken.address),
    );
    return isOutputSupported;
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

    const url = new URL(`${this.apiEndpoint}/swap/approval`);
    url.searchParams.set("tradeType", "exactInput");
    url.searchParams.set("amount", amount);
    url.searchParams.set("inputToken", inputToken.address);
    url.searchParams.set("originChainId", srcChainId.toString());
    url.searchParams.set("outputToken", outputToken.address);
    url.searchParams.set("destinationChainId", dstChainId.toString());
    url.searchParams.set("depositor", sender);
    url.searchParams.set("recipient", recipient);
    url.searchParams.set("skipOriginTxEstimation", "false");
    url.searchParams.set("refundOnOrigin", "true");
    url.searchParams.set("slippage", String(slippagePercent / 100));
    url.searchParams.set("integratorId", this.integratorId);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `[Across] Error fetching quote: ${errorData.message || res.statusText}`,
      );
    }

    const data = await res.json();
    const [approval] = data.approvalTxns ?? [];

    if (!data.swapTx?.simulationSuccess && !approval) {
      throw new Error("Swap simulation failed");
    }

    return {
      adapter: { name: this.name, logo: this.logo },
      tokenSpenderAddress: data?.checks?.allowance?.spender,
      estimatedTime: data.expectedFillTime || 0,
      estimatedAmount: data.expectedOutputAmount || "0",
      gasEstimate: data?.swapTx?.gas || "0",
      txRequest: {
        to: data?.swapTx?.to,
        data: data?.swapTx?.data,
        value: data?.swapTx?.value ? BigInt(data.swapTx.value) : undefined,
      },
    };
  }
}
