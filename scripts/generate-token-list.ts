import { BridgeAggregator } from "@/lib/aggregator";
import { AcrossAdapter } from "@/lib/aggregator/adapters/across";
import { NearAdapter } from "@/lib/aggregator/adapters/near";
import { RelayAdapter } from "@/lib/aggregator/adapters/relay";

(async function generateTokensList() {
  const bridgeAggregator = new BridgeAggregator([
    new AcrossAdapter(),
    new RelayAdapter(),
    new NearAdapter(),
  ]);

  await bridgeAggregator.generateTokenList();
})();
