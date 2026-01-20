"use client";

import {
  Box,
  Button,
  type ButtonProps,
  Dialog,
  Flex,
  Grid,
  GridItem,
  IconButton,
  Image,
  Input,
  InputGroup,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDownIcon, Coins, SearchIcon, XIcon } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { formatUnits } from "viem";
import { useDebounce } from "@/hooks/use-debounce";
import {
  type TokenWithBalance,
  useTokenBalance,
} from "@/hooks/use-token-balance";
import { useTokens } from "@/hooks/use-tokens";
import { allChains, type WagmiChain } from "@/lib/chains";
import type { Token } from "@/store/bridge";
import { useBridge } from "@/store/bridge";
import { titleCase, truncate, truncateAddress } from "@/utils/string";
import { TokensSkeleton } from "./skeleton/token-switch";
import { TokenWithChainLogo } from "./ui/dual-token";

export const TokenSwitcher = ({ side }: { side: "from" | "to" }) => {
  const { from, to, setFromChain, setToChain } = useBridge();

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const selectedChain = useMemo(
    () => (side === "from" ? from.chain : to.chain),
    [from.chain, to.chain, side],
  );

  const selectedToken = useMemo(
    () => (side === "from" ? from.token : to.token),
    [from.token, to.token, side],
  );

  const handleChainSelect = useCallback(
    (chain?: WagmiChain) => {
      if (side === "from") {
        setFromChain(chain);
      } else {
        setToChain(chain);
      }
    },
    [side, setFromChain, setToChain],
  );

  return (
    <Dialog.Root
      {...(!!selectedChain && {
        initialFocusEl: () => inputRef.current,
      })}
      size={selectedChain ? "lg" : "xs"}
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
    >
      <Dialog.Trigger asChild>
        <Button
          size="lg"
          variant="surface"
          bg="bg.2"
          rounded="full"
          p={2}
          gap={1}
          _hover={{ bg: "bg.3/70" }}
        >
          {selectedToken && selectedChain ? (
            <Flex align="center" gap={2}>
              <TokenWithChainLogo token={selectedToken} chain={selectedChain} />

              <VStack gap={0} alignItems="flex-start">
                <Text fontSize="md" fontWeight="bold">
                  {selectedToken.symbol}
                </Text>
                <Text fontSize="xs" color="text.2/80" mt={-1}>
                  {truncate(selectedChain?.name, 14)}
                </Text>
              </VStack>
            </Flex>
          ) : (
            <Flex align="center" gap={2}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "100%",
                  backgroundColor: "#565A69",
                }}
              />
              <VStack gap={0} alignItems="flex-start">
                <Text fontSize="sm" fontWeight="bold">
                  Token
                </Text>
                <Text fontSize="xs" color="text.3" mt={-1}>
                  Not Selected
                </Text>
              </VStack>
            </Flex>
          )}
          <ChevronDownIcon />
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="transparent">
            <Dialog.Body>
              <Grid
                gap={2}
                display="grid"
                templateColumns={`repeat(${selectedChain ? "3" : "1"}, 1fr)`}
              >
                <GridItem
                  colSpan={{ base: 3, lg: 1 }}
                  display={{
                    base: selectedChain ? "none" : "block",
                    lg: "block",
                  }}
                >
                  <Box
                    bg="bg.1"
                    p={4}
                    border="1px solid"
                    borderColor="bg.3"
                    minW={selectedChain ? "unset" : "300px"}
                    borderRadius="lg"
                  >
                    <Text fontSize="lg" fontWeight="semibold" color="white">
                      Select network
                    </Text>

                    <VStack
                      mt={4}
                      gap={2}
                      alignItems="flex-start"
                      maxH="400px"
                      overflowY="auto"
                    >
                      {allChains.map((chain) => (
                        <Button
                          key={chain.id}
                          size="sm"
                          variant="plain"
                          color="white"
                          rounded="lg"
                          bg={
                            selectedChain?.id === chain.id ? "bg.3/70" : "bg.1"
                          }
                          p={2}
                          gap={2}
                          w="100%"
                          justifyContent="flex-start"
                          _hover={{ bg: "bg.3/70" }}
                          onClick={() => handleChainSelect(chain)}
                        >
                          <Image
                            src={chain.iconUrl}
                            alt={chain.name}
                            width="24px"
                            height="24px"
                            borderRadius="full"
                          />
                          <Text fontSize="sm" letterSpacing="tight">
                            {chain.name}
                          </Text>
                        </Button>
                      ))}
                    </VStack>
                  </Box>
                </GridItem>

                {selectedChain && (
                  <GridItem colSpan={{ base: 3, lg: 2 }}>
                    <Box
                      bg="bg.1"
                      p={4}
                      border="1px solid"
                      borderColor="bg.3"
                      rounded="lg"
                      h="100%"
                    >
                      <Flex justify="space-between" align="center">
                        <Text fontSize="lg" fontWeight="semibold" color="white">
                          Select a token
                        </Text>

                        <IconButton
                          variant="ghost"
                          onClick={() => setOpen(false)}
                          bg="bg.1"
                          _hover={{ bg: "bg.1" }}
                          size="sm"
                        >
                          <XIcon color="white" />
                        </IconButton>
                      </Flex>

                      <Flex align="center" gap={2} mt={4}>
                        <InputGroup
                          startElement={<SearchIcon size={18} />}
                          className="dark"
                          bg="bg.2"
                          borderRadius="full"
                          w="100%"
                        >
                          <Input
                            size="sm"
                            ref={inputRef}
                            placeholder="Search token"
                            value={searchTerm}
                            color="white"
                            borderRadius="full"
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </InputGroup>

                        <Button
                          display={{ base: "block", lg: "none" }}
                          size="sm"
                          rounded="full"
                          bg="bg.2"
                          onClick={() => handleChainSelect(undefined)}
                        >
                          <Image
                            src={selectedChain?.iconUrl}
                            alt={selectedChain?.name}
                            width="24px"
                            height="24px"
                            borderRadius="full"
                          />

                          <Text fontSize="sm" fontWeight="medium">
                            {selectedChain.name.length > 10
                              ? `${selectedChain.name.slice(0, 10)}...`
                              : selectedChain.name}
                          </Text>
                        </Button>
                      </Flex>

                      <TokensList
                        searchTerm={searchTerm}
                        side={side}
                        closeDialog={() => setOpen(false)}
                      />
                    </Box>
                  </GridItem>
                )}
              </Grid>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

const HEADER_HEIGHT = 20;
const TOKEN_ROW_HEIGHT = 56;

const TokensList = ({
  searchTerm,
  side,
  closeDialog,
}: {
  searchTerm: string;
  side: "from" | "to";
  closeDialog: () => void;
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const { from, to } = useBridge();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const chainId = useMemo(
    () => (side === "from" ? from.chain?.id : to.chain?.id),
    [side, from.chain?.id, to.chain?.id],
  );

  const { data: tokens = [], isLoading: isTokenLoading } = useTokens(chainId);
  const { data: tokensWithBalances = [], isLoading: isTokenBalanceLoading } =
    useTokenBalance(chainId);

  const selectedToken = useMemo(
    () => (side === "from" ? from.token : to.token),
    [from.token, to.token, side],
  );

  const filteredTokens = useMemo(() => {
    if (!debouncedSearchTerm) return tokens;
    const search = debouncedSearchTerm.toLowerCase();
    return tokens.filter(
      (token) =>
        token.name.toLowerCase().includes(search) ||
        token.symbol.toLowerCase().includes(search),
    );
  }, [tokens, debouncedSearchTerm]);

  const filteredTokensWithBalance = useMemo(() => {
    if (!debouncedSearchTerm) return tokensWithBalances;
    const search = debouncedSearchTerm.toLowerCase();
    return tokensWithBalances.filter(
      (token) =>
        token.name.toLowerCase().includes(search) ||
        token.symbol.toLowerCase().includes(search),
    );
  }, [tokensWithBalances, debouncedSearchTerm]);

  const tokensWithoutBalance = useMemo(() => {
    const balanceAddresses = new Set(
      filteredTokensWithBalance.map((t) => t.address.toLowerCase()),
    );
    return filteredTokens.filter(
      (token) => !balanceAddresses.has(token.address.toLowerCase()),
    );
  }, [filteredTokens, filteredTokensWithBalance]);

  const topHeight = useMemo(() => {
    let height = 0;

    if (filteredTokensWithBalance.length > 0) {
      height += HEADER_HEIGHT;
      height += filteredTokensWithBalance.length * TOKEN_ROW_HEIGHT;
    }

    if (tokensWithoutBalance.length > 0) {
      height += HEADER_HEIGHT;
    }

    return height;
  }, [filteredTokensWithBalance.length, tokensWithoutBalance.length]);

  const rowVirtualizer = useVirtualizer({
    count: tokensWithoutBalance.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => TOKEN_ROW_HEIGHT,
    scrollMargin: topHeight,
  });

  if (
    (isTokenLoading && tokens.length === 0) ||
    (isTokenBalanceLoading && tokensWithBalances.length === 0)
  ) {
    return <TokensSkeleton />;
  }

  if (filteredTokens.length === 0 && filteredTokensWithBalance.length === 0) {
    return (
      <Flex
        w="100%"
        h={200}
        align="center"
        justify="center"
        gap={2}
        color="text.2"
      >
        <Coins size={24} />
        <Text fontSize="sm">No tokens found</Text>
      </Flex>
    );
  }

  return (
    <Box mt={4} ref={parentRef} height="420px" overflowY="auto">
      <Box
        position="relative"
        w="100%"
        h={`${rowVirtualizer.getTotalSize() + topHeight}px`}
      >
        {filteredTokensWithBalance.length > 0 && (
          <Box w="100%">
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="text.2"
              h={`${HEADER_HEIGHT}px`}
            >
              Your tokens
            </Text>
            {filteredTokensWithBalance.map((token) => (
              <TokenRow
                side={side}
                selectedTokenAddress={selectedToken?.address}
                token={token}
                key={`balance-${token.address}`}
                closeDialog={closeDialog}
              />
            ))}
          </Box>
        )}

        {tokensWithoutBalance.length > 0 && (
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="text.2"
            h={`${HEADER_HEIGHT}px`}
          >
            All tokens
          </Text>
        )}

        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <TokenRow
            key={`${virtualRow.index}-${tokensWithoutBalance[virtualRow.index].address}`}
            data-index={virtualRow.index}
            token={tokensWithoutBalance[virtualRow.index]}
            side={side}
            selectedTokenAddress={selectedToken?.address}
            closeDialog={closeDialog}
            position="absolute"
            top={0}
            left={0}
            w="100%"
            transform={`translateY(${virtualRow.start}px)`}
          />
        ))}
      </Box>
    </Box>
  );
};

const TokenRow = ({
  side,
  token,
  selectedTokenAddress,
  closeDialog,
  ...props
}: ButtonProps & {
  side: "from" | "to";
  token: TokenWithBalance;
  selectedTokenAddress?: string;
  closeDialog: () => void;
}) => {
  const { setFromToken, setToToken } = useBridge();

  const handleTokenSelect = useCallback(
    (token: Token) => {
      if (side === "from") {
        setFromToken(token);
      } else {
        setToToken(token);
      }
      closeDialog();
    },
    [side, setFromToken, setToToken, closeDialog],
  );

  return (
    <Button
      size="md"
      variant="plain"
      color="white"
      rounded="lg"
      px={2}
      py={3}
      w="100%"
      h={`${TOKEN_ROW_HEIGHT}px`}
      bg={selectedTokenAddress === token.address ? "bg.3/70" : "transparent"}
      justifyContent="flex-start"
      _hover={{ bg: "bg.3/70" }}
      onClick={() => handleTokenSelect(token)}
      {...props}
    >
      <Image
        src={token.logoURI}
        alt={token.name}
        width="32px"
        height="32px"
        borderRadius="full"
        bg="bg.2"
      />
      <Flex w="100%" align="center" justify="space-between" gap={2}>
        <Flex align="flex-start" direction="column" flex={1} minW={0}>
          <Text fontSize="sm" letterSpacing="tight" fontWeight="medium">
            {token.symbol}
          </Text>
          <Flex align="center" gap={1}>
            <Text
              fontSize="xs"
              letterSpacing="tight"
              color="text.2/80"
              mt={-0.5}
              maxLines={1}
            >
              {truncate(titleCase(token.name), 15)}
            </Text>
            <Text fontSize="xs" color="text.2/50">
              •
            </Text>
            <Text
              fontSize="xs"
              letterSpacing="tight"
              color="text.2/80"
              mt={-0.5}
            >
              {truncateAddress(token.address)}
            </Text>
          </Flex>
        </Flex>

        {!!token?.balanceUSD && (
          <Flex align="flex-end" direction="column" minW={0}>
            <Text fontSize="sm" letterSpacing="tight" fontWeight="medium">
              ${token.balanceUSD}
            </Text>
            <Flex align="center" gap={2}>
              <Text
                fontSize="xs"
                letterSpacing="tight"
                color="text.2/80"
                mt={-0.5}
                maxLines={1}
              >
                {Number.parseFloat(
                  formatUnits(BigInt(token.amount ?? 0), token.decimals),
                ).toFixed(2)}
              </Text>
            </Flex>
          </Flex>
        )}
      </Flex>
    </Button>
  );
};
