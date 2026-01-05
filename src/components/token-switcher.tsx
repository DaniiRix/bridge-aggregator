"use client";

import {
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  Image,
  Input,
  InputGroup,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CheckCircle2Icon, ChevronDownIcon, SearchIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { zeroAddress } from "viem";
import { useDebounce } from "@/hooks/use-debounce";
import { allChains, type WagmiChain } from "@/lib/chains";
import { useBridge } from "@/lib/providers/bridge-store";
import type { Token } from "@/store/bridge";
import { titleCase, truncate, truncateAddress } from "@/utils/string";
import { TokenWithChainLogo } from "./ui/dual-token";

const tokens = [
  {
    chainId: 1,
    name: "Ethereum",
    symbol: "ETH",
    logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
  },
];

export const TokenSwitcher = ({ side }: { side: "from" | "to" }) => {
  const { from, to, setFromChain, setToChain } = useBridge((state) => state);

  const selectedChain = useMemo(
    () => (side === "from" ? from.chain : to.chain),
    [from.chain, to.chain, side],
  );

  const selectedToken = useMemo(
    () => (side === "from" ? from.token : to.token),
    [from.token, to.token, side],
  );

  const handleChainSelect = useCallback(
    (chain: WagmiChain) => {
      if (side === "from") {
        setFromChain(chain);
      } else {
        setToChain(chain);
      }
    },
    [side, setFromChain, setToChain],
  );

  return (
    <Dialog.Root>
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
              ></div>
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
          <Dialog.Content>
            <Dialog.Body bg="bg.1" p={4} border="1px solid" borderColor="bg.3">
              <HStack gap={10} alignItems="flex-start">
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" color="white">
                    Select a network
                  </Text>

                  <VStack mt={4} gap={2} alignItems="flex-start">
                    {allChains.map((chain) => (
                      <Button
                        key={chain.id}
                        size="sm"
                        variant="plain"
                        color="white"
                        rounded="lg"
                        bg={selectedChain?.id === chain.id ? "bg.3/70" : "bg.1"}
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

                <TokensList side={side} tokens={tokens} />
              </HStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

const TokensList = ({
  side,
  tokens,
}: {
  side: "from" | "to";
  tokens: Token[];
}) => {
  const { from, to, setFromToken, setToToken } = useBridge((state) => state);

  const selectedToken = useMemo(
    () => (side === "from" ? from.token : to.token),
    [from.token, to.token, side],
  );

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredTokens = useMemo(
    () =>
      tokens.filter((token) =>
        token.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
      ),
    [tokens, debouncedSearchTerm],
  );

  const handleTokenSelect = useCallback(
    (token: Token) => {
      if (side === "from") {
        setFromToken(token);
      } else {
        setToToken(token);
      }
    },
    [side, setFromToken, setToToken],
  );

  return (
    <Box flex={1}>
      <Text fontSize="lg" fontWeight="semibold" color="white">
        Select a token
      </Text>

      <InputGroup
        mt={4}
        startElement={<SearchIcon />}
        className="dark"
        bg="bg.2"
        borderRadius="full"
        w="100%"
      >
        <Input
          placeholder="Search token"
          value={searchTerm}
          color="white"
          borderRadius="full"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>
      <VStack mt={4} gap={3} alignItems="flex-start">
        {filteredTokens.map((token) => (
          <Button
            key={token.address}
            size="md"
            variant="plain"
            color="white"
            rounded="lg"
            px={2}
            py={6}
            w="100%"
            bg={selectedToken?.address === token.address ? "bg.3/70" : "bg.1"}
            justifyContent="flex-start"
            _hover={{ bg: "bg.3/70" }}
            onClick={() => handleTokenSelect(token)}
          >
            <Image
              src={token.logo}
              alt={token.name}
              width="32px"
              height="32px"
              borderRadius="full"
              bg="bg.2"
            />
            <Flex w="100%" align="center" justify="space-between">
              <Flex align="flex-start" direction="column">
                <Text fontSize="sm" letterSpacing="tight">
                  {token.name}
                </Text>
                <Flex align="center" gap={2}>
                  <Text fontSize="x-small" color="text.2/80" mt={-0.5}>
                    {titleCase(token.name)}
                  </Text>
                  <Text fontSize="x-small" color="text.2/80" mt={-0.5}>
                    {truncateAddress(zeroAddress)}
                  </Text>
                </Flex>
              </Flex>

              {selectedToken?.address === token.address && <CheckCircle2Icon />}
            </Flex>
          </Button>
        ))}
      </VStack>
    </Box>
  );
};
