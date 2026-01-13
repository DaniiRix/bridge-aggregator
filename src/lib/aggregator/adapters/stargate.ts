import { decodeFunctionData, erc20Abi, type Hex } from "viem";
import { BaseAdapter, type Quote, type QuoteRequest } from "./base";

export class StargateAdapter extends BaseAdapter {
  apiEndpoint = "https://stargate.finance/api";
  chainIdToKey: Record<string, string> = {
    "1": "ethereum",
    "10": "optimism",
    "14": "flare",
    "25": "cronosevm",
    "30": "rootstock",
    "37": "xpla",
    "40": "telos",
    "50": "xdc",
    "56": "bsc",
    "88": "tomo",
    "100": "gnosis",
    "122": "fuse",
    "137": "polygon",
    "143": "monad",
    "146": "sonic",
    "169": "manta",
    "196": "xlayer",
    "204": "opbnb",
    "239": "tac",
    "252": "fraxtal",
    "291": "orderly",
    "295": "hedera",
    "324": "zksync",
    "480": "worldchain",
    "592": "astar",
    "999": "hyperliquid",
    "1030": "conflux",
    "1088": "metis",
    "1101": "zkevm",
    "1116": "coredao",
    "1135": "lisk",
    "1284": "moonbeam",
    "1285": "moonriver",
    "1890": "lightlink",
    "2222": "kava",
    "3338": "peaq",
    "5000": "mantle",
    "8217": "klaytn",
    "8453": "base",
    "34443": "mode",
    "42161": "arbitrum",
    "42220": "celo",
    "42793": "etherlink",
    "43114": "avalanche",
    "55244": "superposition",
    "57073": "ink",
    "59144": "linea",
    "60808": "bob",
    "81457": "blast",
    "167000": "taiko",
    "534352": "scroll",
    "747474": "katana",
    "7777777": "zora",
    "1313161554": "aurora",
    "1380012617": "rarible",
  };

  constructor() {
    super(
      "stargate",
      "https://icons.llamao.fi/icons/protocols/stargate-finance?w=48&q=75",
    );
  }

  async supportsRoute(request: QuoteRequest): Promise<boolean> {
    if (request.inputToken.symbol !== request.outputToken.symbol) return false;

    if (
      !Object.keys(this.chainIdToKey).includes(String(request.srcChainId)) ||
      !Object.keys(this.chainIdToKey).includes(String(request.dstChainId))
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

    const srcChainKey = this.chainIdToKey[String(srcChainId)];
    const dstChainKey = this.chainIdToKey[String(dstChainId)];

    const slippageMultiplier = 1 - slippagePercent / 100;
    const minAmount = Math.floor(parseInt(amount, 10) * slippageMultiplier);
    const dstAmountMin = minAmount.toString();

    const url = new URL(`${this.apiEndpoint}/v1/quotes`);
    url.searchParams.set("srcToken", inputToken.address);
    url.searchParams.set("dstToken", outputToken.address);
    url.searchParams.set("srcAddress", sender);
    url.searchParams.set("dstAddress", sender);
    url.searchParams.set("srcChainKey", srcChainKey);
    url.searchParams.set("dstChainKey", dstChainKey);
    url.searchParams.set("srcAmount", amount);
    url.searchParams.set("dstAmountMin", dstAmountMin);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `[Stargate] Error fetching quote: ${errorData.message || res.statusText}`,
      );
    }

    const data = await res.json();
    if (!data.quotes || data.quotes.length === 0) {
      throw new Error(
        `[Stargate] No quotes found for ${request.inputToken.symbol}`,
      );
    }

    const approvalStep = data.quotes[0].steps.find(
      (step: { type: string }) => step.type === "approve",
    );

    let spender: Hex | undefined;
    if (approvalStep?.transaction?.data) {
      spender = decodeFunctionData({
        abi: erc20Abi,
        data: approvalStep.transaction.data,
      })?.args?.[0] as Hex;
    }

    const bridgeStep = data.quotes[0].steps.find(
      (step: { type: string }) => step.type === "bridge",
    );

    return {
      adapter: { name: this.name, logo: this.logo },
      tokenSpenderAddress: spender,
      estimatedTime: data.duration?.estimated || 0,
      estimatedAmount: data.quotes[0]?.dstAmount || "0",
      gasEstimate: "0",
      txRequest: {
        to: bridgeStep?.transaction?.to,
        data: bridgeStep?.transaction?.data,
        value: bridgeStep?.transaction?.value
          ? BigInt(bridgeStep.transaction.value)
          : undefined,
      },
    };
  }
}
