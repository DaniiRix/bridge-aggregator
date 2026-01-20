const chainsMap = {
  ethereum: 1,
  bsc: 56,
  polygon: 137,
  optimism: 10,
  arbitrum: 42161,
  avax: 43114,
  gnosis: 100,
  klaytn: 8217,
  aurora: 1313161554,
  celo: 42220,
  cronos: 25,
  moonriver: 1285,
  boba: 288,
  okexchain: 66,
  fuse: 122,
  moonbeam: 1284,
  zksync: 324,
  polygonzkevm: 1101,
  kava: 2222,
  metis: 1088,
  base: 8453,
  linea: 59144,
  scroll: 534352,
  sonic: 146,
  unichain: 130,
  hyperevm: 999,
  monad: 143,
  ink: 57073,
  plasma: 9745,
} as const;

export const chainIdToName = (chainId: number) => {
  return Object.entries(chainsMap).find(
    ([, id]) => id === Number(chainId),
  )?.[0];
};
