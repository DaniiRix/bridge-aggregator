import type { Hex } from "viem";
import type { BaseAdapter, Quote, QuoteRequest } from "./adapters/base";

export interface AggregatorConfig {
  timeout?: number;
}

export class BridgeAggregator {
  private adapters: Map<string, BaseAdapter> = new Map();
  private config: Required<AggregatorConfig>;

  constructor(adapters: BaseAdapter[], config: AggregatorConfig = {}) {
    for (const adapter of adapters) {
      this.adapters.set(adapter.name, adapter);
    }

    this.config = {
      timeout: config.timeout ?? 10000,
    };
  }

  async generateTokenList() {
    const promises = Array.from(this.adapters.values()).map((adapter) => {
      if (adapter.generateTokenList) {
        return adapter.generateTokenList();
      }

      return Promise.resolve();
    });

    await Promise.all(promises);
  }

  async getQuotes(request: QuoteRequest): Promise<Quote[]> {
    const quotePromises = Array.from(this.adapters.values()).map((adapter) =>
      this.getQuote(adapter, request),
    );

    const results = await Promise.allSettled(quotePromises);
    const quotes: Quote[] = [];

    console.log({ results });

    for (const result of results) {
      if (result.status === "fulfilled" && !result.value.error) {
        quotes.push(result.value.quote);
      }
    }

    return quotes;
  }

  async postBridge(quote: Quote, srcTxHash: Hex): Promise<void> {
    const adapter = this.adapters.get(quote.adapter.name);
    if (!adapter) throw new Error("Adapter not found");

    if (adapter?.postBridge) {
      return await adapter.postBridge(quote, srcTxHash);
    }

    return Promise.resolve();
  }

  private async getQuote(
    adapter: BaseAdapter,
    request: QuoteRequest,
  ): Promise<
    { quote: Quote; error?: never } | { quote?: never; error: Error }
  > {
    try {
      if (adapter.supportsRoute) {
        const supported = await adapter.supportsRoute(request);

        if (!supported) {
          return {
            error: new Error("Route not supported"),
          };
        }
      }

      const quote = await this.withTimeout(
        adapter.getQuote(request),
        this.config.timeout,
      );

      return { quote };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeoutMs),
    );

    return Promise.race([promise, timeoutPromise]);
  }
}
