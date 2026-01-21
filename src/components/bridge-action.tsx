import { Button } from "@chakra-ui/react";
import {
  useAddRecentTransaction,
  useConnectModal,
} from "@rainbow-me/rainbowkit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import {
  type Address,
  encodeFunctionData,
  erc20Abi,
  type Hex,
  parseUnits,
  zeroAddress,
} from "viem";
import {
  useConnection,
  useSendCallsSync,
  useSendTransaction,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { readContract, waitForTransactionReceipt } from "wagmi/actions";
import { useEOA } from "@/hooks/use-eoa";
import { useQuote } from "@/hooks/use-quote";
import { bridgeAggregator } from "@/lib/aggregator";
import { wagmiConfig } from "@/lib/config";
import { useBridge } from "@/store/bridge";
import { toaster } from "./ui/toaster";

export const BridgeAction = () => {
  const queryClient = useQueryClient();

  const { address, chainId } = useConnection();
  const { openConnectModal } = useConnectModal();
  const addRecentTransaction = useAddRecentTransaction();
  const switchChain = useSwitchChain();
  const { mutateAsync: writeContract, isPending: isApproving } =
    useWriteContract();

  const { selectedAdapter, from, to, toggleRoutes, reset } = useBridge(
    (state) => state,
  );
  const { data: quotes = [], isLoading: areQuotesLoading } = useQuote();
  const {
    data: { doesSupportAtomicBatch } = {
      doesSupportAtomicBatch: false,
    },
  } = useEOA(from?.chain?.id);

  const { mutateAsync: sendCalls, isPending: isSendingCalls } =
    useSendCallsSync({
      mutation: {
        onSuccess() {
          queryClient.refetchQueries({ queryKey: ["token-balances"] });
        },
      },
    });

  const { mutateAsync: sendTransaction, isPending: isSending } =
    useSendTransaction({
      mutation: {
        onSuccess() {
          queryClient.refetchQueries({ queryKey: ["token-balances"] });
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
      isSending ||
      isSendingCalls
    );
  }, [address, from, to, isApproving, isSending, isSendingCalls]);

  const approveToken = async () => {
    const selectedQuote = quotes.find(
      (q) => q.adapter.name === selectedAdapter,
    );
    if (
      !from.token ||
      !from.amount ||
      !selectedQuote ||
      !selectedQuote.tokenSpenderAddress
    )
      return;

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
  };

  const { data: allowance, refetch: refetchAllowance } = useQuery({
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
    if (isDisabled || !from.chain) return;

    if (chainId !== from.chain?.id) {
      try {
        await switchChain.mutateAsync({ chainId: from.chain.id });
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
    if (!selectedQuote || !from.token || !from.amount) return;

    const isApprovalNeeded =
      selectedQuote.tokenSpenderAddress &&
      from.token.address !== zeroAddress &&
      (!allowance ||
        BigInt(allowance) < parseUnits(from.amount, from.token.decimals));

    let hex: Hex | undefined;
    if (isApprovalNeeded && doesSupportAtomicBatch) {
      const receipt = await sendCalls({
        calls: [
          {
            to: from.token.address as Address,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: "approve",
              args: [
                selectedQuote.tokenSpenderAddress as Address,
                parseUnits(from.amount, from.token.decimals),
              ],
            }),
          },
          selectedQuote.txRequest,
        ],
        chainId: from.chain?.id,
      });
      hex = receipt.receipts?.at(0)?.transactionHash;
    } else {
      if (isApprovalNeeded) {
        await approveTokenMutation();
      }

      hex = await sendTransaction({
        ...selectedQuote.txRequest,
        chainId: from.chain?.id,
      });

      await Promise.all([
        waitForTransactionReceipt(wagmiConfig, {
          hash: hex,
        }),
        bridgeAggregator.postBridge(selectedQuote, hex),
      ]);
    }

    if (hex)
      addRecentTransaction({
        hash: hex,
        description: `Bridged ${from.token?.symbol} to ${to.token?.symbol} via ${selectedAdapter}`,
      });

    toaster.create({
      title: `Bridged ${from.token?.symbol} to ${to.token?.symbol} via ${selectedAdapter}`,
      type: "success",
    });

    reset();
  }, [
    isDisabled,
    chainId,
    quotes,
    from,
    to,
    selectedAdapter,
    allowance,
    switchChain,
    doesSupportAtomicBatch,
    sendCalls,
    addRecentTransaction,
    approveTokenMutation,
    sendTransaction,
    reset,
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
      loading={areQuotesLoading || isApproving || isSending || isSendingCalls}
      loadingText={areQuotesLoading ? "Fetching quotes" : "Bridging"}
    >
      {!selectedAdapter ? "Select Route" : "Bridge"}
    </Button>
  );
};
