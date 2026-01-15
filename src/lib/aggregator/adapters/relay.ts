// ref: https://docs.relay.link/references/api/get-quote-v2
// for hyperliquid: https://github.com/relayprotocol/relay-kit/blob/522748b8810c3f81d5b9a990485bd7eaf8e8e689/packages/sdk/src/utils/executeSteps/index.ts#L128

import { estimateGas } from "wagmi/actions";
import { wagmiConfig } from "@/lib/providers";
import { detectWalletType } from "@/utils/wallet";
import { BaseAdapter, type Quote, type QuoteRequest } from "./base";

export class RelayAdapter extends BaseAdapter {
  apiEndpoint = "https://api.relay.link";
  referrer = "defillama.com";

  constructor() {
    super("relay", "https://icons.llamao.fi/icons/protocols/relay?w=48&q=75");
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

    const { isEOA } = await detectWalletType(sender, srcChainId);

    const res = await fetch(`${this.apiEndpoint}/quote/v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tradeType: "EXACT_INPUT",
        amount: amount,
        originCurrency: inputToken.address,
        originChainId: srcChainId,
        destinationCurrency: outputToken.address,
        destinationChainId: dstChainId,
        user: sender,
        referrer: this.referrer,
        explicitDeposit: !isEOA,
        slippageTolerance: Math.round(slippagePercent * 100),
      }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `[Relay] Error fetching quote: ${errorData.message || res.statusText}`,
      );
    }

    const data = await res.json();
    const dataTx = data.steps[0]?.items[0]?.data;
    if (!dataTx) throw new Error("No data found");

    let estimatedGas = BigInt(0);
    try {
      estimatedGas = await estimateGas(wagmiConfig, {
        chainId: srcChainId,
        account: sender,
        to: dataTx.to,
        data: dataTx.data,
        value: dataTx.value ? BigInt(dataTx.value) : undefined,
      });
    } catch (error) {
      console.warn("[Relay] Failed to estimate gas", error);
    }

    return {
      adapter: { name: this.name, logo: this.logo },
      tokenSpenderAddress: isEOA ? undefined : dataTx.to,
      estimatedTime: data?.details?.timeEstimate || 0,
      estimatedAmount: data?.details?.currencyOut?.amount || "0",
      gasEstimate: estimatedGas?.toString() || "0",
      txRequest: {
        to: dataTx.to,
        data: dataTx.data,
        value: dataTx.value ? BigInt(dataTx.value) : undefined,
      },
    };
  }
}
