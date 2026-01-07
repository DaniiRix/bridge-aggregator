import { Button } from "@chakra-ui/react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { type Address, erc20Abi, parseUnits } from "viem";
import { useConnection, useWriteContract } from "wagmi";
import { readContract, waitForTransactionReceipt } from "wagmi/actions";
import { useQuote } from "@/hooks/use-quote";
import { wagmiConfig } from "@/lib/providers";
import { useBridge } from "@/lib/providers/bridge-store";

export const BridgeAction = () => {
  const { address } = useConnection();
  const { openConnectModal } = useConnectModal();
  const { mutateAsync: writeContract } = useWriteContract();
  const queryClient = useQueryClient();

  const { selectedAdapter, from, to } = useBridge((state) => state);
  const { data: quoteData } = useQuote();
  const { quotes = [] } = quoteData || {};

  const isDisabled = useMemo(() => {
    return (
      !address ||
      !from.chain ||
      !from.token ||
      !from.amount ||
      !to.chain ||
      !to.token ||
      !to.amount ||
      !selectedAdapter
    );
  }, [address, from, to, selectedAdapter]);

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
        address: selectedQuote.tokenApprovalAddress as Address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, selectedQuote.tokenApprovalAddress as Address],
      });

      return allowance;
    },
    enabled: Boolean(selectedAdapter && from.token && address),
  });

  const approveTokenMutation = useMutation({
    mutationFn: approveToken,
    onMutate: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
    onSuccess: () => {
      refetchAllowance();
    },
  });

  const handleBridge = useCallback(() => {
    if (isDisabled) return;

    if (
      !allowance ||
      BigInt(allowance) < parseUnits(from.amount!, from.token!.decimals)
    ) {
      approveTokenMutation.mutate();
    }
  }, [isDisabled, from, allowance, approveTokenMutation]);

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
    >
      {!selectedAdapter ? "Select Route" : "Bridge"}
    </Button>
  );
};
