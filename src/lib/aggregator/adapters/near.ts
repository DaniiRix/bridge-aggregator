// Get partner api key from here: https://partners.near-intents.org to avoid 0.1% fee

import { encodeFunctionData, erc20Abi, type Hex } from "viem";
import { estimateGas } from "wagmi/actions";
import { wagmiConfig } from "@/lib/config";
import { BaseAdapter, type Quote, type QuoteRequest } from "./base";

type NearRoute = {
  contractAddress?: string;
  blockchain: string;
  assetId: string;
};

export class NearAdapter extends BaseAdapter {
  apiKey = "YOUR_SECRET_TOKEN";
  apiEndpoint = "https://1click.chaindefuser.com";
  referrer = "defillama.com";
  tokenListFile = "src/data/near.json";

  private nearRoutes: NearRoute[] | null = null;

  constructor() {
    super(
      "near",
      "https://icons.llamao.fi/icons/protocols/near?w=48&q=75",
      true,
    );
  }

  async generateTokenList() {
    const res = await fetch(`${this.apiEndpoint}/v0/tokens`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `[Near] Error fetching token list: ${errorData.message || res.statusText}`,
      );
    }

    const data = await res.json();

    if (typeof window === "undefined") {
      const { writeFile, mkdir } = await import("node:fs/promises");
      const path = await import("node:path");
      const filePath = path.join(process.cwd(), this.tokenListFile);
      const dirPath = path.dirname(filePath);

      await mkdir(dirPath, { recursive: true });
      await writeFile(filePath, JSON.stringify(data, null, 2));
    } else {
      console.warn(
        "[Near] generateTokenList should only be called in Node.js environment",
      );
    }

    return data;
  }

  private async getNearRoutes(): Promise<NearRoute[]> {
    if (this.nearRoutes) {
      return this.nearRoutes;
    }

    try {
      const routes = await import("../../../data/near.json");
      this.nearRoutes = routes.default || routes;
      return this.nearRoutes || [];
    } catch (error) {
      console.warn("[Near] near.json not found, using empty routes");
      this.nearRoutes = [];
      return this.nearRoutes;
    }
  }

  async supportsRoute(request: QuoteRequest): Promise<boolean> {
    const { srcChainId, dstChainId, inputToken, outputToken } = request;
    const routes = await this.getNearRoutes();
    if (!routes || routes.length === 0) return true;

    const isInputSupported = routes.some(
      (route) =>
        route.contractAddress?.toLowerCase() ===
          inputToken.address.toLowerCase() &&
        route.blockchain === this.chainIdToName(srcChainId),
    );
    if (!isInputSupported) return false;

    const isOutputSupported = routes.some(
      (route) =>
        route.contractAddress?.toLowerCase() ===
          outputToken.address.toLowerCase() &&
        route.blockchain === this.chainIdToName(dstChainId),
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
      amount,
    } = request;

    const inputTokenAssetId = await this.getAssetId(
      srcChainId,
      inputToken.address,
    );
    const outputTokenAssetId = await this.getAssetId(
      dstChainId,
      outputToken.address,
    );

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
        recipient: sender,
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
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `[Near] Error submitting deposit transaction: ${errorData.message || res.statusText}`,
      );
    }
  }

  private chainIdToName(chainId: number): string {
    switch (chainId) {
      case 1:
        return "eth";
      case 56:
        return "bsc";
      case 137:
        return "pol";
      case 42161:
        return "arb";
      case 10:
        return "op";
      case 8453:
        return "base";
      case 43114:
        return "avax";
      case 100:
        return "gnosis";
      case 59144:
        return "linea";
      case 534352:
        return "scroll";
      case 324:
        return "zksync";
      case 80094:
        return "bera";
      case 143:
        return "monad";
      default:
        return "unknown";
    }
  }

  private async getAssetId(chainId: number, address: string): Promise<string> {
    const chainName = this.chainIdToName(chainId);
    const routes = await this.getNearRoutes();

    const assetId = routes.find(
      (route) =>
        route.contractAddress?.toLowerCase() === address.toLowerCase() &&
        route.blockchain === chainName,
    )?.assetId;

    if (!assetId) {
      throw new Error(
        `Asset not found for chain ${chainName} and address ${address}`,
      );
    }

    return assetId;
  }
}
