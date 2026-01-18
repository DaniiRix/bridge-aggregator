// Get partner api key from here: https://partners.near-intents.org to avoid 0.1% fee

import { encodeFunctionData, erc20Abi, type Hex } from "viem";
import { estimateGas } from "wagmi/actions";
import type { NearToken } from "@/lib/actions/token-list";
import { wagmiConfig } from "@/lib/config";
import { normalizeAddress } from "@/utils/string";
import { BaseAdapter, type Quote, type QuoteRequest } from "./base";

const CHAIN_NAME_MAP: Record<number, string> = {
  1: "eth",
  56: "bsc",
  137: "pol",
  42161: "arb",
  10: "op",
  8453: "base",
  43114: "avax",
  100: "gnosis",
  59144: "linea",
  534352: "scroll",
  324: "zksync",
  80094: "bera",
  143: "monad",
};

export class NearAdapter extends BaseAdapter {
  apiKey = "YOUR_SECRET_TOKEN";
  apiEndpoint = "https://1click.chaindefuser.com";
  referrer = "defillama.com";

  constructor() {
    super(
      "near",
      "https://icons.llamao.fi/icons/protocols/near?w=48&q=75",
      true,
      "https://1click.chaindefuser.com/v0/tokens",
    );
  }

  async supportsRoute(request: QuoteRequest): Promise<boolean> {
    const { srcChainId, dstChainId, inputToken, outputToken } = request;
    const srcChainName = CHAIN_NAME_MAP[srcChainId];
    const dstChainName = CHAIN_NAME_MAP[dstChainId];
    if (!srcChainName || !dstChainName) return false;

    const tokens = (await this.getTokens()) as Required<NearToken>[];
    if (!tokens || tokens.length === 0) return true;

    const isInputSupported = tokens.some(
      (token) =>
        token.contractAddress === normalizeAddress(inputToken.address) &&
        token.blockchain === srcChainName,
    );
    if (!isInputSupported) return false;

    const isOutputSupported = tokens.some(
      (token) =>
        token.contractAddress === outputToken.address.toLowerCase() &&
        token.blockchain === dstChainName,
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

    const [inputTokenAssetId, outputTokenAssetId] = await Promise.all([
      this.getAssetId(srcChainId, inputToken.address),
      this.getAssetId(dstChainId, outputToken.address),
    ]);

    const deadline = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    const res = await fetch(`${this.apiEndpoint}/v0/quote`, {
      method: "POST",
      headers: {
        // Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dry: false,
        depositMode: "SIMPLE",
        swapType: "EXACT_INPUT",
        slippageTolerance: Math.round(slippagePercent * 100),
        originAsset: inputTokenAssetId,
        depositType: "ORIGIN_CHAIN",
        destinationAsset: outputTokenAssetId,
        amount,
        refundTo: sender,
        refundType: "ORIGIN_CHAIN",
        recipient: recipient,
        recipientType: "DESTINATION_CHAIN",
        deadline,
        referral: this.referrer,
        quoteWaitingTimeMs: 3000,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `[Relay] Error fetching quote: ${errorData.message || res.statusText}`,
      );
    }

    const data = await res.json();
    const quote = data?.quote;

    const encodedFnData = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [quote?.depositAddress, quote?.amountIn],
    });

    let estimatedGas = BigInt(0);
    try {
      estimatedGas = await estimateGas(wagmiConfig, {
        chainId: srcChainId,
        account: sender,
        to: quote?.depositAddress,
        data: encodedFnData,
      });
    } catch (error) {
      console.warn("[Near] Failed to estimate gas", error);
    }

    return {
      adapter: { name: this.name, logo: this.logo },
      tokenSpenderAddress: undefined,
      estimatedTime: quote?.timeEstimate || 0,
      estimatedAmount: quote?.amountOut || "0",
      gasEstimate: estimatedGas?.toString() || "0",
      txRequest: {
        to: inputToken.address as Hex,
        data: encodedFnData,
      },
      extraData: {
        depositAddress: quote?.depositAddress,
      },
    };
  }

  async postBridge(quote: Quote, srcTxHash: Hex): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(`${this.apiEndpoint}/v0/deposit/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          txHash: srcTxHash,
          depositAddress: quote.extraData?.depositAddress,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(
          `[Near] Error submitting deposit transaction: ${errorData.message || res.statusText}`,
        );
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getAssetId(chainId: number, address: string): Promise<string> {
    const chainName = CHAIN_NAME_MAP[chainId];

    const tokens = (await this.getTokens()) as Required<NearToken>[];

    const assetId = tokens.find(
      (token) =>
        token.contractAddress === address.toLowerCase() &&
        token.blockchain === chainName,
    )?.assetId;

    if (!assetId) {
      throw new Error(
        `Asset not found for chain ${chainName} and address ${address}`,
      );
    }

    return assetId;
  }
}
