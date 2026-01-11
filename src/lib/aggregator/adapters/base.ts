import type { Hex } from "viem";

export interface QuoteRequest {
  srcChainId: number;
  dstChainId: number;
  inputToken: string;
  outputToken: string;
  sender: Hex;
  amount: string;
}

export interface Quote {
  adapter: { name: string; logo: string };
  tokenApprovalAddress?: Hex;
  estimatedFeeUSD: string;
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
  ) {}

  abstract getQuote(request: QuoteRequest): Promise<Quote>;

  postBridge?(quote: Quote, srcTxHash: Hex): Promise<void>;

  generateTokenList?(): Promise<void>;
  supportsRoute?(request: QuoteRequest): boolean;
}
