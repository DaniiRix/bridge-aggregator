"use client";

import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import {
  darkTheme,
  getDefaultConfig,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WagmiProvider } from "wagmi";
import { Breakpoints } from "@/components/breakpoints";
import { DarkMode } from "@/components/ui/color-mode";
import { Toaster } from "@/components/ui/toaster";
import { allChains } from "../chains";
import { rpcsTransports } from "../rpcs";
import { themeConfig } from "../theme";

export const wagmiConfig = getDefaultConfig({
  appName: "LlamaBridge",
  projectId: "b3d4ba9fb97949ab12267b470a6f31d2",
  chains: allChains as any,
  transports: rpcsTransports,
  ssr: false,
});

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ChakraProvider value={createSystem(defaultConfig, themeConfig)}>
      <DarkMode>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider
              theme={darkTheme({
                accentColor: "#2563eb",
                borderRadius: "medium",
              })}
            >
              {children}
              <Toaster />
              <Breakpoints />
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </DarkMode>
    </ChakraProvider>
  );
};
