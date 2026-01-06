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
  adapterName: string;
  tokenApprovalAddress?: Hex;
  estimatedFee: string;
  estimatedTime: number;
  estimatedAmount: string;
  rawQuote: any;
}

export interface QuoteResult {
  adapter: string;
  quote?: Quote;
  error?: Error;
}

export abstract class BaseAdapter {
  constructor(public readonly name: string) {}

  abstract getQuote(request: QuoteRequest): Promise<Quote>;

  abstract bridge(request: QuoteRequest, quote: Quote): Promise<string>;
}
