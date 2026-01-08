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

  async getQuotes(request: QuoteRequest): Promise<Quote[]> {
    const quotePromises = Array.from(this.adapters.values()).map((adapter) =>
      this.getQuote(adapter, request),
    );

    const results = await Promise.allSettled(quotePromises);
    const quotes: Quote[] = [];

    for (const result of results) {
      if (result.status === "fulfilled" && !result.value.error) {
        quotes.push(result.value.quote);
      }
    }

    return quotes.sort((a, b) =>
      BigInt(a.estimatedAmount || 0) > BigInt(b.estimatedAmount || 0) ? 1 : -1,
    );
  }

  private async getQuote(
    adapter: BaseAdapter,
    request: QuoteRequest,
  ): Promise<
    { quote: Quote; error?: never } | { quote?: never; error: Error }
  > {
    try {
      if (adapter.supportsRoute) {
        const supported = await this.withTimeout(
          adapter.supportsRoute(request),
          this.config.timeout,
        );

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
