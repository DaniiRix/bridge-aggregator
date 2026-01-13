import { bridgeAggregator } from "@/lib/aggregator";

(async function generateTokensList() {
  await bridgeAggregator.generateTokenList();
})();
