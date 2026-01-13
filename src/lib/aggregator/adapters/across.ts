import { BaseAdapter, type Quote, type QuoteRequest } from "./base";

export class AcrossAdapter extends BaseAdapter {
  apiEndpoint = "https://app.across.to/api";
  integratorId = "0xdead"; // @todo: add integrator id

  constructor() {
    super("across", "https://icons.llamao.fi/icons/protocols/across?w=48&q=75");
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

    const url = new URL(`${this.apiEndpoint}/swap/approval`);
    url.searchParams.set("tradeType", "exactInput");
    url.searchParams.set("amount", amount);
    url.searchParams.set("inputToken", inputToken);
    url.searchParams.set("originChainId", srcChainId.toString());
    url.searchParams.set("outputToken", outputToken);
    url.searchParams.set("destinationChainId", dstChainId.toString());
    url.searchParams.set("depositor", sender);
    url.searchParams.set("recipient", sender);
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
      tokenSpenderAddress: data?.checks.allowance.spender,
      estimatedTime: data.expectedFillTime || 0,
      estimatedAmount: data.expectedOutputAmount || "0",
      gasEstimate: data.swapTx.gas || "0",
      txRequest: {
        to: data.swapTx.to,
        data: data.swapTx.data,
        value: data.swapTx.value ? BigInt(data.swapTx.value) : undefined,
      },
    };
  }
}
