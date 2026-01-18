import type { Hex } from "viem";
import type { Token } from "@/store/bridge";

export interface QuoteRequest {
  slippagePercent: number;
  srcChainId: number;
  dstChainId: number;
  inputToken: Token;
  outputToken: Token;
  sender: Hex;
  recipient: Hex;
  amount: string;
}

export interface Quote {
  adapter: { name: string; logo: string };
  tokenSpenderAddress?: Hex;
  estimatedTime: number;
  estimatedAmount: string;
  gasEstimate: string;
  txRequest: {
    to: Hex;
    data: Hex;
    value?: bigint;
  };
  extraData?: Record<string, any>;
}

export interface QuoteWithAmount extends Quote {
  estimatedAmountUSD: string;
  estimatedAmountAfterFeesUSD: string;
}

export abstract class BaseAdapter {
  constructor(
    public readonly name: string,
    public readonly logo: string,
    public readonly doesUseApiKey: boolean = false,
  ) {}

  abstract getQuote(request: QuoteRequest): Promise<Quote>;

  postBridge?(quote: Quote, srcTxHash: Hex): Promise<void>;

  generateTokenList?(): Promise<void>;
  async supportsRoute?(request: QuoteRequest): Promise<boolean>;
}
