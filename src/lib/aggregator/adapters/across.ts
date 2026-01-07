import { prepareTransactionRequest } from "wagmi/actions";
import { wagmiConfig } from "@/lib/providers";
import { BaseAdapter, type Quote, type QuoteRequest } from "./base";

interface ChainAndToken {
  chainId: number;
  name: string;
  logoURI: string;
  tokens: string[];
}

export class AcrossAdapter extends BaseAdapter {
  apiEndpoint = "https://app.across.to/api";
  integratorId = ""; // @todo: add integrator id

  constructor() {
    super("across", "https://icons.llamao.fi/icons/protocols/across?w=48&q=75");
  }

  async getSupportedChainsAndTokens(): Promise<ChainAndToken[]> {
    const [resChain, resTokens] = await Promise.all([
      fetch(`${this.apiEndpoint}/swap/chains`),
      fetch(`${this.apiEndpoint}/swap/tokens`),
    ]);

    if (!resChain.ok || !resTokens.ok) {
      throw new Error("Failed to fetch supported chains and tokens");
    }

    const chains = await resChain.json();
    const tokens = await resTokens.json();

    return chains.map((chain: any) => ({
      chainId: chain.chainId,
      name: chain.name,
      logoURI: chain.logoURI,
      tokens: tokens.filter((token: any) => token.chainId === chain.chainId),
    }));
  }

  async getQuote(request: QuoteRequest): Promise<Quote> {
    const { srcChainId, dstChainId, inputToken, outputToken, sender, amount } =
      request;

    const url = new URL(`${this.apiEndpoint}/swap/approval`);
    url.searchParams.set("tradeType", "exactInput");
    url.searchParams.set("amount", amount);
    url.searchParams.set("inputToken", inputToken);
    url.searchParams.set("originChainId", srcChainId.toString());
    url.searchParams.set("outputToken", outputToken);
    url.searchParams.set("destinationChainId", dstChainId.toString());
    url.searchParams.set("depositor", sender);

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

    const txRequest = await prepareTransactionRequest(wagmiConfig, {
      chainId: data.swapTx.chainId,
      to: data.swapTx.to,
      data: data.swapTx.data,
      value: data.swapTx.value ? BigInt(data.swapTx.value) : undefined,
    });

    console.log({ txRequest });

    return {
      adapter: { name: this.name, logo: this.logo },
      tokenApprovalAddress: approval?.to,
      estimatedFee: data.fees?.total?.amountUsd || "0",
      estimatedTime: data.expectedFillTime || 0,
      estimatedAmount: data.expectedOutputAmount || "0",
      txRequest,
    };
  }
}
