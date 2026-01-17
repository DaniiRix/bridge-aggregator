// get api key from here: https://portal.li.fi

import { normalizeAddress } from "@/utils/string";
import { BaseAdapter, type Quote, type QuoteRequest } from "./base";

type TokenMap = Record<string, string[]>;

export class LifiAdapter extends BaseAdapter {
  apiEndpoint = "https://li.quest/v1";
  apiKey =
    "33e6b5a0-7675-4984-a734-da53f0543f4c.95fbd39f-4f66-43b4-b184-6fa6f46b4901"; // @todo: add api key
  integrator = "defillama";
  tokenListFile = "src/data/lifi.json";
  supportedChainIds = [
    1, // Ethereum
    42161, // Arbitrum
    8453, // Base
    1337, // Hyperliquid
    999, // HyperEVM
    143, // Monad
    56, // BSC
    10, // Optimism
    137, // Polygon
    43114, // Avalanche
    100, // Gnosis
    1088, // Metis
    1135, // Lisk
    122, // FUSE
    1284, // Moonbeam
    130, // Unichain
    1329, // Sei
    13371, // Immutable zkEVM
    14, // Flare
    146, // Sonic
    1480, // Vana
    1625, // Gravity
    167000, // Taiko
    1868, // Soneium
    1923, // Swellchain
    2020, // Ronin
    204, // opBNB
    21000000, // Corn
    232, // Lens
    25, // Cronos
    252, // Fraxtal
    2741, // Abstract
    288, // Boba
    30, // Rootstock
    324, // zkSync
    33139, // Apechain
    34443, // Mode
    42220, // Celo
    42793, // Etherlink
    43111, // Hemi
    480, // World Chain
    50, // XDC
    5000, // Mantle
    50104, // Sophon
    534352, // Scroll
    55244, // Superposition
    57073, // Ink
    59144, // Linea
    60808, // BOB
    747, // Flow
    747474, // Katana
    80094, // Berachain
    81457, // Blast
    8217, // Kaia
    88, // Viction
    9745, // Plasma
    988, // Stable
    98866, // Plume
  ];

  private tokens: TokenMap = {};

  constructor() {
    super(
      "li.fi",
      "https://icons.llamao.fi/icons/protocols/li.fi?w=48&q=75",
      true,
    );
  }

  async generateTokenList() {
    const chains = this.supportedChainIds.join(",");
    const res = await fetch(`${this.apiEndpoint}/tokens?chains=${chains}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `[Lifi] Error fetching token list: ${errorData.message || res.statusText}`,
      );
    }

    const data = (await res.json()) as {
      tokens: Record<string, { address: string }[]>;
    };

    const dataToSave: TokenMap = Object.fromEntries(
      Object.entries(data.tokens).map(([chainId, tokens]) => [
        chainId,
        tokens.map((t) => normalizeAddress(t.address)),
      ]),
    );

    const { writeFile, mkdir } = await import("node:fs/promises");
    const path = await import("node:path");
    const filePath = path.join(process.cwd(), this.tokenListFile);
    const dirPath = path.dirname(filePath);

    await mkdir(dirPath, { recursive: true });
    await writeFile(filePath, JSON.stringify(dataToSave, null, 2));
  }

  async supportsRoute(request: QuoteRequest) {
    if (
      !this.supportedChainIds.includes(request.srcChainId) ||
      !this.supportedChainIds.includes(request.dstChainId)
    ) {
      return false;
    }

    const tokens = await this.getTokens();
    const isInputSupported = tokens[String(request.srcChainId)].includes(
      normalizeAddress(request.inputToken.address),
    );
    if (!isInputSupported) return false;

    const isOutputSupported = tokens[String(request.dstChainId)].includes(
      normalizeAddress(request.outputToken.address),
    );
    if (!isOutputSupported) return false;

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

    const url = new URL(`${this.apiEndpoint}/quote`);
    url.searchParams.set("fromChain", srcChainId.toString());
    url.searchParams.set("toChain", dstChainId.toString());
    url.searchParams.set("fromToken", inputToken.address);
    url.searchParams.set("toToken", outputToken.address);
    url.searchParams.set("fromAddress", sender);
    url.searchParams.set("toAddress", sender);
    url.searchParams.set("fromAmount", amount);
    url.searchParams.set("slippage", String(slippagePercent / 100));
    url.searchParams.set("integrator", this.integrator);
    url.searchParams.set("skipSimulation", "false");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-lifi-api-key": this.apiKey,
      },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `[Lifi] Error fetching quote: ${errorData.message || res.statusText}`,
      );
    }

    const data = await res.json();
    const gasEstimate = data.estimate.gasCosts.reduce(
      (acc: number, val: { limit: string }) => acc + Number(val.limit),
      0,
    );

    return {
      adapter: { name: this.name, logo: this.logo },
      tokenSpenderAddress: data?.estimate?.approvalAddress,
      estimatedTime: data?.estimate?.executionDuration || 0,
      estimatedAmount: data?.estimate?.toAmount || "0",
      gasEstimate: gasEstimate || "0",
      txRequest: {
        to: data?.transactionRequest?.to,
        data: data?.transactionRequest?.data,
        value: data?.transactionRequest?.value
          ? BigInt(data.transactionRequest.value)
          : undefined,
      },
    };
  }

  private async getTokens(): Promise<TokenMap> {
    if (Object.keys(this.tokens).length > 0) {
      return this.tokens;
    }

    try {
      const tokens = await import("../../../data/lifi.json");
      this.tokens = tokens.default || tokens;
      return this.tokens || [];
    } catch (error) {
      console.warn("[Lifi] lifi.json not found, using empty tokens", error);
      this.tokens = {};
      return this.tokens;
    }
  }
}
