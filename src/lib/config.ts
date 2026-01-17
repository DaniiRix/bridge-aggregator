import { createConfig } from "wagmi";
import { allChains } from "./chains";
import { rpcsTransports } from "./rpcs";

export const wagmiConfig = createConfig({
  chains: allChains,
  transports: rpcsTransports,
  ssr: false,
});
