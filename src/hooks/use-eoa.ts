import { useQuery } from "@tanstack/react-query";
import type { Hex } from "viem";
import { useConnection } from "wagmi";
import { getBytecode, getCapabilities } from "wagmi/actions";
import { wagmiConfig } from "@/lib/config";

interface EOA {
  isEOA: boolean;
  isSmartWallet: boolean;
  isEIP7702Delegated: boolean;
  doesSupportAtomicBatch: boolean;
}

export const useEOA = (chainId?: number) => {
  const { address } = useConnection();

  return useQuery<EOA>({
    queryKey: ["eoa", address, chainId],
    queryFn: () => detectWalletType(address, chainId),
    enabled: Boolean(address && chainId),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
};

export const detectWalletType = async (
  address?: Hex,
  chainId?: number,
): Promise<EOA> => {
  if (!address || !chainId) {
    return {
      isEOA: false,
      isSmartWallet: false,
      isEIP7702Delegated: false,
      doesSupportAtomicBatch: false,
    };
  }

  try {
    let doesSupportAtomicBatch = false;
    try {
      const capabilities = await getCapabilities(wagmiConfig, {
        account: address,
        chainId,
      });

      doesSupportAtomicBatch =
        capabilities?.atomicBatch?.supported ??
        (capabilities.atomic?.status &&
          capabilities.atomic.status === "supported");
    } catch {}

    const code = await getBytecode(wagmiConfig, {
      address,
      chainId,
    });

    const hasCode = Boolean(code && code !== "0x");
    const isEIP7702Delegated = Boolean(
      code?.toLowerCase().startsWith("0xef01"),
    );

    const isSmartWallet =
      doesSupportAtomicBatch || hasCode || isEIP7702Delegated;
    const isEOA = !isSmartWallet;

    return { isEOA, isSmartWallet, isEIP7702Delegated, doesSupportAtomicBatch };
  } catch {
    return {
      isEOA: false,
      isSmartWallet: false,
      isEIP7702Delegated: false,
      doesSupportAtomicBatch: false,
    };
  }
};
