import type { Hex } from "viem";
import { getBytecode, getCapabilities } from "wagmi/actions";
import { wagmiConfig } from "@/lib/providers";

export const detectWalletType = async (
  address?: Hex,
  chainId?: number,
): Promise<{
  isEOA: boolean;
  isSmartWallet: boolean;
  isEIP7702Delegated: boolean;
}> => {
  if (!address || !chainId) {
    return { isEOA: false, isSmartWallet: false, isEIP7702Delegated: false };
  }

  try {
    let hasSmartWalletCapabilities = false;
    try {
      const capabilities = await getCapabilities(wagmiConfig, {
        account: address,
        chainId,
      });

      hasSmartWalletCapabilities = Boolean(
        capabilities?.atomic?.status === "supported" ||
          capabilities?.paymasterService?.supported,
      );
    } catch (e) {}

    const code = await getBytecode(wagmiConfig, {
      address,
      chainId,
    });

    const hasCode = Boolean(code && code !== "0x");
    const isEIP7702Delegated = Boolean(
      code?.toLowerCase().startsWith("0xef01"),
    );

    const isSmartWallet = hasCode && hasSmartWalletCapabilities;
    const isEOA = !isSmartWallet;

    return { isEOA, isSmartWallet, isEIP7702Delegated };
  } catch (e) {
    return { isEOA: false, isSmartWallet: false, isEIP7702Delegated: false };
  }
};
