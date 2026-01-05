import type { Chain } from "viem";
import * as wagmiChains from "viem/chains";
import { chainIconUrl } from "./nativeTokens";

export interface WagmiChain extends Chain {
  network: string;
  iconUrl: string;
  iconBackground: string;
}

const ethereum = {
  ...wagmiChains.mainnet,
  network: "ethereum",
  iconUrl: chainIconUrl("ethereum"),
  iconBackground: "#000",
};

const optimism = {
  ...wagmiChains.optimism,
  network: "optimism",
  iconUrl: chainIconUrl("optimism"),
  iconBackground: "#000",
};

const binance = {
  ...wagmiChains.bsc,
  network: "bsc",
  iconUrl: chainIconUrl("binance"),
  iconBackground: "#000",
};

const arbitrum = {
  ...wagmiChains.arbitrum,
  network: "arbitrum",
  iconUrl: chainIconUrl("arbitrum"),
  iconBackground: "#000",
};

const polygon = {
  ...wagmiChains.polygon,
  network: "polygon",
  iconUrl: chainIconUrl("polygon"),
  iconBackground: "#000",
};

const base = {
  ...wagmiChains.base,
  network: "base",
  iconUrl: chainIconUrl("Base"),
  iconBackground: "#000",
};

export const allChains: Array<WagmiChain> = [
  ethereum,
  arbitrum,
  polygon,
  binance,
  optimism,
  base,
];
