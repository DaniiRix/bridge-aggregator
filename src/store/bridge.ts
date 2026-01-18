import type { Hex } from "viem";
import { create } from "zustand";

export interface Token {
  chainId: number;
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  logoURI: string;
}

export interface Chain {
  id: number;
  name: string;
  iconUrl: string;
}

export type BridgeState = {
  areRoutesVisible: boolean;
  selectedAdapter?: string;
  from: {
    chain?: Chain;
    token?: Token;
    amount?: string;
  };
  to: {
    chain?: Chain;
    token?: Token;
    amount?: string;
  };
  recipient?: Hex;
};

export type BridgeActions = {
  toggleRoutes: () => void;
  selectAdapter: (adapter: string) => void;
  setFromChain: (chain: Chain) => void;
  setFromToken: (token: Token) => void;
  setFromAmount: (amount: string) => void;
  setToChain: (chain: Chain) => void;
  setToToken: (token: Token) => void;
  setToAmount: (amount: string) => void;
  setRecipient: (recipient: Hex) => void;
  reset: () => void;
};

export type BridgeStore = BridgeState & BridgeActions;

export const defaultInitState: BridgeState = {
  areRoutesVisible: false,
  from: {
    amount: "",
  },
  to: {
    amount: "",
  },
};

export const useBridge = create<BridgeStore>()((set) => ({
  ...defaultInitState,
  toggleRoutes: () =>
    set((state) => ({ areRoutesVisible: !state.areRoutesVisible })),
  selectAdapter: (adapter) => set(() => ({ selectedAdapter: adapter })),
  setFromChain: (chain) =>
    set((state) => ({
      from: { ...state.from, chain, amount: "" },
      to: { ...state.to, amount: "" },
    })),
  setFromToken: (token) =>
    set((state) => ({
      from: { ...state.from, token, amount: "" },
      to: { ...state.to, amount: "" },
    })),
  setFromAmount: (amount) =>
    set((state) => ({
      from: { ...state.from, amount },
      to: { ...state.to, amount: "" },
    })),
  setToChain: (chain) =>
    set((state) => ({
      from: {
        ...state.from,
        amount: "",
      },
      to: { ...state.to, chain, amount: "" },
    })),
  setToToken: (token) =>
    set((state) => ({
      from: {
        ...state.from,
        amount: "",
      },
      to: { ...state.to, token, amount: "" },
    })),
  setToAmount: (amount) => set((state) => ({ to: { ...state.to, amount } })),
  setRecipient: (recipient) => set(() => ({ recipient })),
  reset: () => set(defaultInitState),
}));
