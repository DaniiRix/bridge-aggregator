"use server";

import { bridgeAggregator } from "../aggregator";
import type { Quote, QuoteRequest } from "../aggregator/adapters/base";

export const getQuotesFromServer = async (
  request: QuoteRequest,
  adapters?: string[],
): Promise<Quote[]> => {
  return await bridgeAggregator.getQuotes(request, adapters);
};
