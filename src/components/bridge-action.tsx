import { Button } from "@chakra-ui/react";
import {
  useAddRecentTransaction,
  useConnectModal,
} from "@rainbow-me/rainbowkit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { type Address, erc20Abi, parseUnits } from "viem";
import {
  useConnection,
  useSendTransaction,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { readContract, waitForTransactionReceipt } from "wagmi/actions";
import { useQuote } from "@/hooks/use-quote";
import { wagmiConfig } from "@/lib/providers";
import { useBridge } from "@/lib/providers/bridge-store";
import { toaster } from "./ui/toaster";

export const BridgeAction = () => {
  const { address, chainId } = useConnection();
  const { openConnectModal } = useConnectModal();
  const addRecentTransaction = useAddRecentTransaction();

  const { mutateAsync: switchChainAsync } = useSwitchChain();
  const { mutateAsync: writeContract, isPending: isApproving } =
    useWriteContract();
  const { mutateAsync: sendBridgeTransaction, isPending: isSending } =
    useSendTransaction({
      mutation: {
        onSuccess() {
          queryClient.refetchQueries({ queryKey: ["token-balances"] });
        },
      },
    });

  const queryClient = useQueryClient();

  const { selectedAdapter, from, to } = useBridge((state) => state);
  const { data: quoteData, isLoading: areQuotesLoading } = useQuote();
  const { quotes = [] } = quoteData || {};

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
      isSending ||
      !selectedAdapter
    );
  }, [address, from, to, selectedAdapter, isApproving, isSending]);

  const approveToken = async () => {
    const selectedQuote = quotes.find(
      (q) => q.adapter.name === selectedAdapter,
    );
    if (
      !from.token ||
      !from.amount ||
      !selectedQuote ||
      !selectedQuote.tokenApprovalAddress
    )
      return;

    const hash = await writeContract({
      address: from.token.address as Address,
      abi: erc20Abi,
      functionName: "approve",
      args: [
        selectedQuote.tokenApprovalAddress as Address,
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
  };

  const { data: allowance, refetch: refetchAllowance } = useQuery({
    queryKey: ["allowance", selectedAdapter, from.token?.address],
    queryFn: async () => {
      if (!selectedAdapter || !from.token || !address) return 0;

      const selectedQuote = quotes.find(
        (q) => q.adapter.name === selectedAdapter,
      );
      if (!selectedQuote || !selectedQuote.tokenApprovalAddress) return 0;

      const allowance = await readContract(wagmiConfig, {
        address: from.token.address as Address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, selectedQuote.tokenApprovalAddress as Address],
      });

      return allowance;
    },
    enabled: Boolean(selectedAdapter && from.token && address),
  });

  const { mutateAsync: approveTokenMutation } = useMutation({
    mutationFn: approveToken,
    onMutate: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
    onSuccess: () => {
      refetchAllowance();
    },
  });

  const handleBridge = useCallback(async () => {
    if (isDisabled) return;

    if (chainId !== from.chain!.id) {
      try {
        await switchChainAsync({ chainId: from.chain!.id });
      } catch (error) {
        toaster.create({
          title: "Failed to switch chain",
          type: "error",
        });
        return;
      }
    }

    if (
      !allowance ||
      BigInt(allowance) < parseUnits(from.amount!, from.token!.decimals)
    ) {
      await approveTokenMutation();
    }

    const selectedRoute = quotes.find(
      (q) => q.adapter.name === selectedAdapter,
    );
    if (!selectedRoute) return;

    const hex = await sendBridgeTransaction({
      ...selectedRoute.txRequest,
      chainId: from.chain!.id,
    });

    await waitForTransactionReceipt(wagmiConfig, {
      hash: hex,
    });

    addRecentTransaction({
      hash: hex,
      description: `Cross chain swap from ${from.token!.symbol} to ${to.token!.symbol} via ${selectedAdapter}`,
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
      size="lg"
      w="100%"
      disabled={isDisabled}
      onClick={handleBridge}
      loading={areQuotesLoading || isApproving || isSending}
      loadingText={areQuotesLoading ? "Fetching quotes" : "Bridging"}
    >
      {!selectedAdapter ? "Select Route" : "Bridge"}
    </Button>
  );
};
