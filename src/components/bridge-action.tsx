import { Button } from "@chakra-ui/react";
import {
  useAddRecentTransaction,
  useConnectModal,
} from "@rainbow-me/rainbowkit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { type Address, erc20Abi, parseUnits, zeroAddress } from "viem";
import {
  useConnection,
  useSendTransaction,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { readContract, waitForTransactionReceipt } from "wagmi/actions";
import { useQuote } from "@/hooks/use-quote";
import { bridgeAggregator } from "@/lib/aggregator";
import { wagmiConfig } from "@/lib/config";
import { useBridge } from "@/store/bridge";
import { toaster } from "./ui/toaster";

export const BridgeAction = () => {
  const { address, chainId } = useConnection();
  const { openConnectModal } = useConnectModal();
  const addRecentTransaction = useAddRecentTransaction();

  const queryClient = useQueryClient();

  const { mutateAsync: switchChainAsync } = useSwitchChain();
  const { mutateAsync: writeContract } = useWriteContract();

  const { selectedAdapter, from, to, toggleRoutes, reset } = useBridge(
    (state) => state,
  );
  const { data: quotes = [], isLoading: areQuotesLoading } = useQuote();

  const { data: allowance } = useQuery({
    queryKey: [
      "allowance",
      selectedAdapter,
      from.token?.chainId,
      from.token?.address,
    ],
    queryFn: async () => {
      if (
        !selectedAdapter ||
        !from.token ||
        !address ||
        from.token.address === zeroAddress
      ) {
        return BigInt(0);
      }

      const selectedQuote = quotes.find(
        (q) => q.adapter.name === selectedAdapter,
      );
      if (!selectedQuote || !selectedQuote.tokenSpenderAddress) return 0;

      const allowance = await readContract(wagmiConfig, {
        address: from.token.address as Address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, selectedQuote.tokenSpenderAddress as Address],
      });

      return allowance;
    },
    enabled: Boolean(
      selectedAdapter &&
        from.token &&
        address &&
        from.token.address !== zeroAddress,
    ),
    staleTime: 10_000,
  });

  const { mutateAsync: approveTokenMutation, isPending: isApproving } =
    useMutation({
      mutationFn: async () => {
        const selectedQuote = quotes.find(
          (q) => q.adapter.name === selectedAdapter,
        );

        if (!from.token || !from.amount || !selectedQuote?.tokenSpenderAddress)
          throw new Error("Invalid quote");

        const hash = await writeContract({
          address: from.token.address as Address,
          abi: erc20Abi,
          functionName: "approve",
          args: [
            selectedQuote.tokenSpenderAddress as Address,
            parseUnits(from.amount, from.token.decimals),
          ],
        });

        await waitForTransactionReceipt(wagmiConfig, {
          hash,
        });

        addRecentTransaction({
          hash,
          description: `Approved token for ${selectedQuote.adapter.name}`,
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "allowance",
            selectedAdapter,
            from.token?.chainId,
            from.token?.address,
          ],
        });
      },
      onError: () => {
        toaster.create({
          title: "Failed to approve token",
          type: "error",
        });
      },
    });

  const { mutateAsync: sendBridgeTransaction, isPending: isSending } =
    useSendTransaction({
      mutation: {
        onSuccess() {
          queryClient.refetchQueries({ queryKey: ["token-balances"] });

          toaster.create({
            title: "Bridge successful",
            type: "success",
          });

          reset();
        },
        onError() {
          toaster.create({
            title: "Failed to bridge",
            type: "error",
          });
        },
      },
    });

  const isDisabled = useMemo(() => {
    return (
      !address ||
      !from.chain ||
      !from.token ||
      !from.amount ||
      !parseFloat(from.amount) ||
      !to.chain ||
      !to.token ||
      !to.amount ||
      isApproving ||
      isSending
    );
  }, [address, from, to, isApproving, isSending]);

  const handleBridge = useCallback(async () => {
    if (isDisabled) return;

    if (chainId !== from.chain?.id) {
      try {
        await switchChainAsync({ chainId: from.chain!.id });
      } catch {
        toaster.create({
          title: "Failed to switch chain",
          type: "error",
        });
        return;
      }
    }

    const selectedQuote = quotes.find(
      (q) => q.adapter.name === selectedAdapter,
    );
    if (!selectedQuote) {
      toaster.create({
        title: "Failed to bridge - no quote found",
        type: "error",
      });
      return;
    }

    if (
      selectedQuote.tokenSpenderAddress &&
      from.token!.address !== zeroAddress &&
      (!allowance ||
        BigInt(allowance) < parseUnits(from.amount!, from.token!.decimals))
    ) {
      await approveTokenMutation();
    }

    const hex = await sendBridgeTransaction({
      ...selectedQuote.txRequest,
      chainId: from.chain?.id,
    });

    await Promise.all([
      waitForTransactionReceipt(wagmiConfig, {
        hash: hex,
      }),
      bridgeAggregator.postBridge(selectedQuote, hex),
    ]);

    addRecentTransaction({
      hash: hex,
      description: `Bridged ${from.token?.symbol} from ${from.chain?.name} to ${to.token?.symbol} on ${to.chain?.name} via ${selectedAdapter}`,
    });
  }, [
    isDisabled,
    chainId,
    quotes,
    from,
    to,
    selectedAdapter,
    allowance,
    switchChainAsync,
    addRecentTransaction,
    approveTokenMutation,
    sendBridgeTransaction,
  ]);

  if (!address)
    return (
      <Button colorPalette="blue" size="lg" w="100%" onClick={openConnectModal}>
        Connect Wallet
      </Button>
    );

  return (
    <Button
      colorPalette="blue"
      size="xl"
      rounded="lg"
      w="100%"
      disabled={isDisabled}
      onClick={selectedAdapter ? handleBridge : toggleRoutes}
      loading={areQuotesLoading || isApproving || isSending}
      loadingText={areQuotesLoading ? "Fetching quotes" : "Bridging"}
    >
      {!selectedAdapter ? "Select Route" : "Bridge"}
    </Button>
  );
};
