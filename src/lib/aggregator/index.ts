import type {
  BaseAdapter,
  Quote,
  QuoteRequest,
  QuoteResult,
} from "./adapters/base";

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

  async getQuotes(request: QuoteRequest): Promise<QuoteResult[]> {
    const quotePromises = Array.from(this.adapters.values()).map((adapter) =>
      this.getQuote(adapter, request),
    );

    const results = await Promise.allSettled(quotePromises);
    const quotes: QuoteResult[] = [];

    for (const result of results) {
      if (result.status === "fulfilled" && !result.value.error) {
        quotes.push(result.value);
      }
    }

    return quotes.sort((a, b) =>
      BigInt(a.quote?.estimatedAmount || 0) >
      BigInt(b.quote?.estimatedAmount || 0)
        ? 1
        : -1,
    );
  }

  async bridge(
    adapterName: string,
    request: QuoteRequest,
    quote: Quote,
  ): Promise<string> {
    const adapter = this.adapters.get(adapterName);
    if (!adapter) {
      throw new Error(`Adapter ${adapterName} not found`);
    }

    return adapter.bridge(request, quote);
  }

  private async getQuote(
    adapter: BaseAdapter,
    request: QuoteRequest,
  ): Promise<QuoteResult> {
    try {
      if (adapter.supportsRoute) {
        const supported = await this.withTimeout(
          adapter.supportsRoute(request),
          this.config.timeout,
        );

        if (!supported) {
          return {
            adapter: adapter.name,
            error: new Error("Route not supported"),
          };
        }
      }

      const quote = await this.withTimeout(
        adapter.getQuote(request),
        this.config.timeout,
      );

      return {
        adapter: adapter.name,
        quote,
      };
    } catch (error) {
      return {
        adapter: adapter.name,
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
