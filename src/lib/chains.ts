import type { Chain } from "viem";
import * as wagmiChains from "viem/chains";

const ICONS_CDN = "https://icons.llamao.fi/icons";
export function chainIconUrl(chain: string) {
  return `${ICONS_CDN}/chains/rsz_${chain.toLowerCase()}?w=48&h=48`;
}

export interface WagmiChain extends Chain {
  network: string;
  iconUrl: string;
  iconBackground: string;
}

const okx = {
  ...wagmiChains.okc,
  network: "okexchain",
  iconUrl: chainIconUrl("oktchain"),
  iconBackground: "#000",
};

const binance = {
  ...wagmiChains.bsc,
  network: "bsc",
  iconUrl: chainIconUrl("binance"),
  iconBackground: "#000",
};

const boba = {
  ...wagmiChains.boba,
  network: "boba",
  iconUrl: chainIconUrl("boba"),
  iconBackground: "#000",
};

const moonbeam = {
  ...wagmiChains.moonbeam,
  network: "moonbeam",
  iconUrl: chainIconUrl("moonbeam"),
  iconBackground: "#000",
};

const fuse = {
  ...wagmiChains.fuse,
  network: "fuse",
  iconUrl: chainIconUrl("fuse"),
  iconBackground: "#000",
};

const moonriver = {
  ...wagmiChains.moonriver,
  network: "moonriver",
  iconUrl: chainIconUrl("moonriver"),
  iconBackground: "#000",
};

const cronos = {
  ...wagmiChains.cronos,
  network: "cronos",
  iconUrl: chainIconUrl("cronos"),
  iconBackground: "#000",
};
const celo = {
  ...wagmiChains.celo,
  network: "celo",
  iconUrl: chainIconUrl("celo"),
  iconBackground: "#000",
};
const aurora = {
  ...wagmiChains.aurora,
  network: "aurora",
  iconUrl: chainIconUrl("aurora"),
  iconBackground: "#000",
};
const avax = {
  ...wagmiChains.avalanche,
  network: "avax",
  iconUrl: chainIconUrl("avalanche"),
  iconBackground: "#000",
};

const klaytn = {
  ...wagmiChains.klaytn,
  network: "klaytn",
  iconUrl: chainIconUrl("klaytn"),
  iconBackground: "#000",
};

const gnosis = {
  ...wagmiChains.gnosis,
  network: "gnosis",
  iconUrl: chainIconUrl("gnosis"),
  iconBackground: "#000",
};
const polygon = {
  ...wagmiChains.polygon,
  network: "polygon",
  iconUrl: chainIconUrl("polygon"),
  iconBackground: "#000",
};

const arbitrum = {
  ...wagmiChains.arbitrum,
  network: "arbitrum",
  iconUrl: chainIconUrl("arbitrum"),
  iconBackground: "#000",
};

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

const zksync = {
  ...wagmiChains.zksync,
  network: "zksync",
  iconUrl: chainIconUrl("zksync era"),
  iconBackground: "#000",
};

const polygonZKEvm = {
  ...wagmiChains.polygonZkEvm,
  network: "polygonzkevm",
  iconUrl: chainIconUrl("Polygon zkEVM"),
  iconBackground: "#000",
};

const kava = {
  ...wagmiChains.kava,
  network: "kava",
  iconUrl: chainIconUrl("Kava"),
  iconBackground: "#000",
};

const metis = {
  ...wagmiChains.metis,
  network: "metis",
  iconUrl: chainIconUrl("metis"),
  iconBackground: "#000",
};

const base = {
  ...wagmiChains.base,
  network: "base",
  iconUrl: chainIconUrl("Base"),
  iconBackground: "#000",
};

const linea = {
  ...wagmiChains.linea,
  network: "linea",
  iconUrl: chainIconUrl("Linea"),
  iconBackground: "#000",
};

const scroll = {
  ...wagmiChains.scroll,
  network: "scroll",
  iconUrl: chainIconUrl("Scroll"),
  iconBackground: "#000",
};

const sonic = {
  ...wagmiChains.sonic,
  network: "sonic",
  iconUrl: chainIconUrl("sonic"),
  iconBackground: "#000",
};

const unichain = {
  ...wagmiChains.unichain,
  network: "unichain",
  iconUrl: chainIconUrl("unichain"),
  iconBackground: "#000",
};

const hyperevm = {
  ...wagmiChains.hyperEvm,
  network: "hyperevm",
  iconUrl: chainIconUrl("hyperevm"),
  iconBackground: "#000",
};

const monad = {
  ...wagmiChains.monad,
  network: "monad",
  iconUrl: chainIconUrl("Monad"),
  iconBackground: "#000",
};

const arbitrumNova = {
  ...wagmiChains.arbitrumNova,
  network: "arbitrumNova",
  iconUrl: chainIconUrl("Arbitrum Nova"),
  iconBackground: "#000",
};

const blast = {
  ...wagmiChains.blast,
  network: "blast",
  iconUrl: chainIconUrl("blast"),
  iconBackground: "#000",
};

const ink = {
  ...wagmiChains.ink,
  network: "ink",
  iconUrl: chainIconUrl("ink"),
  iconBackground: "#000",
};

const plasma = {
  ...wagmiChains.plasma,
  network: "plasma",
  iconUrl: chainIconUrl("plasma"),
  iconBackground: "#000",
};

const katana = {
  ...wagmiChains.katana,
  network: "katana",
  iconUrl: chainIconUrl("katana"),
  iconBackground: "#000",
};

export const allChains: readonly [WagmiChain, ...WagmiChain[]] = [
  ethereum,
  arbitrum,
  polygon,
  binance,
  optimism,
  base,
  avax,
  zksync,
  polygonZKEvm,
  linea,
  gnosis,
  klaytn,
  aurora,
  cronos,
  celo,
  moonriver,
  boba,
  okx,
  moonbeam,
  fuse,
  kava,
  metis,
  scroll,
  sonic,
  unichain,
  hyperevm,
  monad,
  ink,
  plasma,
];
