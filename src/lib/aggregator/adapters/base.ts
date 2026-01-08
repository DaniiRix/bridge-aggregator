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
  estimatedFee: string;
  estimatedTime: number;
  estimatedAmount: string;
  txRequest: {
    to: Hex;
    data: Hex;
    value?: bigint;
  };
}

export abstract class BaseAdapter {
  constructor(
    public readonly name: string,
    public readonly logo: string,
  ) {}

  abstract getQuote(request: QuoteRequest): Promise<Quote>;

  supportsRoute?(request: QuoteRequest): Promise<boolean>;
}
