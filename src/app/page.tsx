"use client";

import {
  Box,
  Button,
  Container,
  Flex,
  Input,
  Spacer,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import Decimal from "decimal.js-light";
import { InfoIcon } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef } from "react";
import { formatUnits } from "viem";
import { BridgeAction } from "@/components/bridge-action";
import { NoRouteFound, RouteList, RouteNotSelected } from "@/components/route";
import { QuoteSkeleton } from "@/components/skeleton/quote";
import { TokenSwitcher } from "@/components/token-switcher";
import { useQuote } from "@/hooks/use-quote";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useTokensPrice } from "@/hooks/use-token-price";
import { useBridge } from "@/lib/providers/bridge-store";
import { isInputGreaterThanDecimals } from "@/utils/number";
import { normalizeAddress } from "@/utils/string";
import { Tooltip } from "../components/ui/tooltip";

export default function BridgeAggregatorPage() {
  const switchPrivacyId = useId();

  const {
    isPrivacyEnabled,
    from,
    to,
    togglePrivacy,
    setFromAmount,
    setToAmount,
  } = useBridge((state) => state);

  const { data: tokensWithBalanceOnFromChain } = useTokenBalance(
    from.chain?.id,
  );
  const { data: tokensWithBalanceOnToChain } = useTokenBalance(to.chain?.id);

  const { data: { fromTokenPrice, toTokenPrice } = {} } = useTokensPrice();

  const {
    data: { quotes = [], warnings = [] } = {},
    isLoading: areQuotesLoading,
    isSuccess,
  } = useQuote();

  const routesRef = useRef(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userTokensBalance = useMemo(() => {
    if (!from.token || !to.token) return { from: "0", to: "0" };

    const normalizedFrom = normalizeAddress(from.token.address);
    const normalizedTo = normalizeAddress(to.token.address);

    return {
      from:
        tokensWithBalanceOnFromChain?.find((t) => t.address === normalizedFrom)
          ?.amount ?? "0",
      to:
        tokensWithBalanceOnToChain?.find((t) => t.address === normalizedTo)
          ?.amount ?? "0",
    };
  }, [
    tokensWithBalanceOnFromChain,
    tokensWithBalanceOnToChain,
    from.token,
    to.token,
  ]);

  useEffect(() => {
    if (to.token && quotes?.length > 0) {
      const newAmount = formatUnits(
        BigInt(quotes[0].estimatedAmount),
        to.token.decimals,
      ).toString();
      setToAmount(newAmount);
    }
  }, [to.token, quotes, setToAmount]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (
        !from.token ||
        !/^\d*\.?\d*$/.test(value) ||
        isInputGreaterThanDecimals(value, from.token.decimals)
      )
        return;
      setFromAmount(value);
    },
    [from.token, setFromAmount],
  );

  const handleMaxClick = useCallback(() => {
    if (from.token && userTokensBalance.from) {
      setFromAmount(
        formatUnits(
          BigInt(userTokensBalance.from),
          from.token.decimals,
        ).toString(),
      );
    }
  }, [from.token, userTokensBalance.from, setFromAmount]);

  const renderQuotes = () => {
    if (areQuotesLoading) {
      return (
        <VStack gap={2}>
          <Text fontSize="lg" fontWeight="semibold" color="white" w="100%">
            Select a route
          </Text>
          <Text fontSize="sm" color="gray.400/80" w="100%">
            Best route is selected based on net output after gas fees.
          </Text>
          <QuoteSkeleton />
          <QuoteSkeleton />
          <QuoteSkeleton />
          <QuoteSkeleton />
          <QuoteSkeleton />
        </VStack>
      );
    }

    if (!quotes || quotes.length === 0) {
      if (isSuccess) {
        return <NoRouteFound />;
      }

      return <RouteNotSelected />;
    }

    return <RouteList quotes={quotes} />;
  };

  return (
    <Container
      maxW="100%"
      minH="100%"
      mt={{ lg: 10 }}
      py={{ base: 4, md: 9 }}
      px={{ base: 4, md: 6 }}
    >
      <Flex
        direction={{ base: "column", lg: "row" }}
        gap={6}
        justify="center"
        align={{ base: "stretch", lg: "flex-start" }}
        w="100%"
        position="relative"
      >
        <Box
          w="100%"
          maxW="30rem"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.700"
          p={4}
          boxShadow={{ base: "none", md: "dark-lg" }}
          position={{ base: "relative", lg: "sticky" }}
          top={{ lg: 6 }}
          alignSelf="flex-start"
        >
          <VStack gap={5} align="stretch">
            <Flex align="center">
              <Text fontWeight="bold" fontSize="md" ml={1}>
                Bridge
              </Text>
              <Spacer />

              <Tooltip
                ids={{ trigger: switchPrivacyId }}
                content="Redirect requests through the DefiLlama Server to hide your IP address"
              >
                <Switch.Root
                  ids={{ root: switchPrivacyId }}
                  checked={isPrivacyEnabled}
                  onCheckedChange={(e) => togglePrivacy(e.checked)}
                >
                  <Switch.HiddenInput />
                  <Switch.Control
                    bg={isPrivacyEnabled ? "gray.100" : "gray.600"}
                  >
                    <Switch.Thumb />
                  </Switch.Control>
                  <Switch.Label>Hide IP</Switch.Label>
                </Switch.Root>
              </Tooltip>
            </Flex>

            <Box>
              <VStack gap={2}>
                <Box
                  w="100%"
                  bg="bg.input"
                  p={4}
                  borderRadius="lg"
                  border="1px solid transparent"
                  _hover={{ borderColor: "gray.600" }}
                  onClick={() => inputRef.current?.focus()}
                >
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="gray.400">
                      From
                    </Text>
                  </Flex>
                  <Flex align="center" gap={2} my={2}>
                    <Input
                      ref={inputRef}
                      flex={1}
                      fontSize="3xl"
                      fontWeight="medium"
                      color="white"
                      as="input"
                      type="text"
                      placeholder="0.0"
                      bg="transparent"
                      border="none"
                      outline="none"
                      pattern="^[0-9]*[.]?[0-9]*$"
                      minLength={1}
                      maxLength={79}
                      inputMode="decimal"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                      _focus={{ outline: "none" }}
                      p={0}
                      my={4}
                      value={from.amount}
                      onChange={(e) => handleInputChange(e.target.value)}
                    />
                    <TokenSwitcher side="from" />
                  </Flex>

                  <Flex justify="space-between" align="center">
                    <Text fontSize="xs" color="gray.400">
                      $
                      {new Decimal(fromTokenPrice || "0")
                        .mul(from.amount || "0")
                        .toDecimalPlaces(2)
                        .toString()}
                    </Text>
                    <Button
                      fontSize="xs"
                      color="gray.400"
                      variant="ghost"
                      p={0}
                      height="fit-content"
                      onClick={handleMaxClick}
                    >
                      Balance:{" "}
                      {from.token
                        ? Number.parseFloat(
                            formatUnits(
                              BigInt(userTokensBalance.from),
                              from.token.decimals,
                            ),
                          ).toFixed(4)
                        : "-"}
                    </Button>
                  </Flex>
                </Box>

                <Box
                  w="100%"
                  bg="bg.input"
                  p={4}
                  borderRadius="lg"
                  border="1px solid transparent"
                  _hover={{ borderColor: "gray.600" }}
                >
                  <Flex justify="space-between">
                    <Text fontSize="sm" color="gray.400">
                      To
                    </Text>
                  </Flex>
                  <Flex align="center" gap={2} my={2}>
                    <Input
                      flex={1}
                      fontSize="3xl"
                      fontWeight="medium"
                      color="white"
                      as="input"
                      type="text"
                      placeholder="0.0"
                      bg="transparent"
                      border="none"
                      outline="none"
                      _focus={{ outline: "none" }}
                      disabled
                      p={0}
                      my={4}
                      value={to.amount}
                    />
                    <TokenSwitcher side="to" />
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text fontSize="xs" color="gray.400">
                      $
                      {new Decimal(toTokenPrice || "0")
                        .mul(to.amount || "0")
                        .toDecimalPlaces(2)
                        .toString()}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      Balance:{" "}
                      {to.token
                        ? Number.parseFloat(
                            formatUnits(
                              BigInt(userTokensBalance.to),
                              to.token.decimals,
                            ),
                          ).toFixed(4)
                        : "-"}
                    </Text>
                  </Flex>
                </Box>
              </VStack>
            </Box>

            {warnings?.length > 0 && (
              <VStack gap={2} display={{ base: "none", md: "flex" }}>
                {warnings.map((warning) => (
                  <Box
                    key={warning}
                    w="100%"
                    bg="yellow.200/10"
                    p={2}
                    borderRadius="lg"
                  >
                    <Flex align="center" gap={2}>
                      <InfoIcon color="#ECC94B" size={16} />
                      <Text fontSize="xs" color="yellow.400">
                        {warning}
                      </Text>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}

            <BridgeAction />
          </VStack>
        </Box>

        <Box
          w="100%"
          h="100%"
          maxW="30rem"
          bg="gray.800"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.700"
          p={4}
          boxShadow={{ base: "none", md: "dark-lg" }}
          position={{ base: "absolute", md: "relative" }}
          top={{ base: 0, md: "auto" }}
          left={{ base: 0, md: "auto" }}
          right={{ base: 0, md: "auto" }}
          bottom={{ base: 0, md: "auto" }}
          zIndex={{ base: 10, md: "auto" }}
          overflowY="auto"
          transition="all 0.4s"
          ref={routesRef}
        >
          <VStack gap={4} align="stretch">
            {renderQuotes()}
          </VStack>
        </Box>
      </Flex>
    </Container>
  );
}
