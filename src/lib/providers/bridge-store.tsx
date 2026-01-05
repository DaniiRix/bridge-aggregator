"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { useStore } from "zustand";
import { type BridgeStore, createBridgeStore } from "@/store/bridge";

export type BridgeStoreApi = ReturnType<typeof createBridgeStore>;

export const BridgeStoreContext = createContext<BridgeStoreApi | undefined>(
  undefined,
);

export interface BridgeStoreProviderProps {
  children: ReactNode;
}

export const BridgeStoreProvider = ({ children }: BridgeStoreProviderProps) => {
  const [store] = useState(() => createBridgeStore());
  return (
    <BridgeStoreContext.Provider value={store}>
      {children}
    </BridgeStoreContext.Provider>
  );
};

export const useBridge = <T,>(selector: (store: BridgeStore) => T): T => {
  const bridgeStoreContext = useContext(BridgeStoreContext);
  if (!bridgeStoreContext) {
    throw new Error(`useBridgeStore must be used within BridgeStoreProvider`);
  }

  return useStore(bridgeStoreContext, selector);
};
