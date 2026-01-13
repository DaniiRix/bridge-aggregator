"use server";

import { bridgeAggregator } from "@/hooks/use-quote";
import type { Quote, QuoteRequest } from "../aggregator/adapters/base";

export const getQuotesFromServer = async (
  request: QuoteRequest,
): Promise<Quote[]> => {
  return await bridgeAggregator.getQuotes(request);
};
