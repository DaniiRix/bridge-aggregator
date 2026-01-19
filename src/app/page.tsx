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
import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { formatUnits } from "viem";
import { BridgeAction } from "@/components/bridge-action";
import { RecipientEditor } from "@/components/recipient-editor";
import { NoRouteFound, RouteList, RouteNotSelected } from "@/components/route";
import { QuoteSkeleton } from "@/components/skeleton/quote";
import { SlippageSettings } from "@/components/slippage-settings";
import { TokenSwitcher } from "@/components/token-switcher";
import { Warnings } from "@/components/warnings";
import { useQuote } from "@/hooks/use-quote";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useTokensPrice } from "@/hooks/use-token-price";
import { useBridge } from "@/store/bridge";
import { usePrivacy } from "@/store/privacy";
import { formatNumber, isInputGreaterThanDecimals } from "@/utils/number";
import { normalizeAddress } from "@/utils/string";
import { Tooltip } from "../components/ui/tooltip";

const MotionBox = motion(Box);

export default function BridgeAggregatorPage() {
  const switchPrivacyId = useId();

  const {
    areRoutesVisible,
    selectedAdapter,
    from,
    to,
    toggleRoutes,
    setFromAmount,
    setToAmount,
  } = useBridge();

  const { isPrivacyEnabled, togglePrivacy } = usePrivacy();

  const { data: tokensWithBalanceOnFromChain } = useTokenBalance(
    from.chain?.id,
  );
  const { data: tokensWithBalanceOnToChain } = useTokenBalance(to.chain?.id);
  const { data: { fromTokenPrice, toTokenPrice } = {} } = useTokensPrice();

  const {
    data: quotes = [],
    isLoading: areQuotesLoading,
    isSuccess,
    refetch: refetchQuotes,
    dataUpdatedAt: lastFetchedQuotesAt,
  } = useQuote();

  const inputRef = useRef<HTMLInputElement>(null);
  const inputBoxRef = useRef<HTMLDivElement>(null);
  const [inputBoxHeight, setInputBoxHeight] = useState<number | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: height can change
  useEffect(() => {
    if (!inputBoxRef.current?.offsetHeight) return;

    setInputBoxHeight(inputBoxRef.current.offsetHeight);
  }, [inputBoxRef.current?.offsetHeight]);

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

  const exchangeRate = useMemo(() => {
    const defaultRate = { rate: "0", rateUSD: "0" };

    if (
      !from.amount ||
      new Decimal(from.amount).isZero() ||
      !to.token?.decimals ||
      quotes.length === 0
    )
      return defaultRate;

    const selectedQuote = selectedAdapter
      ? quotes.find((q) => q.adapter.name === selectedAdapter)
      : quotes[0];

    if (!selectedQuote) return defaultRate;

    const rate = new Decimal(selectedQuote.estimatedAmount)
      .div(new Decimal(10).pow(to.token.decimals))
      .div(from.amount)
      .toDecimalPlaces(4);

    if (rate.isZero()) return defaultRate;

    const rateUSD = new Decimal(toTokenPrice || "0")
      .mul(rate)
      .toDecimalPlaces(2)
      .toString();

    return {
      rate: rate.lt("0.0001") ? "< 0.0001" : rate.toString(),
      rateUSD,
    };
  }, [toTokenPrice, from.amount, to.token?.decimals, selectedAdapter, quotes]);

  useEffect(() => {
    if (to.token?.decimals && quotes?.length > 0) {
      const newAmount = formatUnits(
        BigInt(quotes[0].estimatedAmount),
        to.token.decimals,
      ).toString();

      setToAmount(newAmount);
    }
  }, [to.token?.decimals, quotes, setToAmount]);

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
          <AnimatePresence mode="wait">
            {[1, 2, 3, 4, 5].map((i) => (
              <MotionBox
                key={`skeleton-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.3,
                  delay: i * 0.05,
                  ease: "easeOut",
                }}
                w="100%"
              >
                <QuoteSkeleton />
              </MotionBox>
            ))}
          </AnimatePresence>
        </VStack>
      );
    }

    if (!quotes || quotes.length === 0) {
      if (isSuccess && from.amount) {
        return <NoRouteFound />;
      }

      return <RouteNotSelected />;
    }

    return (
      <RouteList
        quotes={quotes}
        lastFetchedQuotesAt={lastFetchedQuotesAt}
        refetchQuotes={refetchQuotes}
      />
    );
  };

  return (
    <Container
      w="auto"
      maxW="100%"
      minH="100%"
      mt={{ base: 5, lg: 10 }}
      py={{ base: 4, lg: 9 }}
      px={{ base: 2, lg: 6 }}
    >
      <Flex
        direction="row"
        gap={6}
        justify="center"
        align="stretch"
        w="100%"
        position="relative"
      >
        <Box
          ref={inputBoxRef}
          w="100%"
          maxW="30rem"
          h="fit-content"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.700"
          p={4}
          position="relative"
        >
          <VStack gap={4} align="stretch">
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
                      {formatNumber(
                        new Decimal(fromTokenPrice || "0")
                          .mul(from.amount || "0")
                          .toDecimalPlaces(2)
                          .toString(),
                      )}
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
                  <RecipientEditor />
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
                      {formatNumber(
                        new Decimal(toTokenPrice || "0")
                          .mul(to.amount || "0")
                          .toDecimalPlaces(2)
                          .toString(),
                      )}
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

            <Warnings />

            <BridgeAction />

            {quotes.length > 0 && (
              <Flex w="100%" gap={2} align="center" justify="space-between">
                <Text fontSize="xs" color="gray.300" display="flex" gap={1}>
                  1 {from?.token?.symbol} = {exchangeRate.rate}{" "}
                  {to?.token?.symbol}
                  <Text color="gray.400" ml={0.5}>
                    (${exchangeRate.rateUSD})
                  </Text>
                </Text>

                <SlippageSettings refetchQuotes={refetchQuotes} />
              </Flex>
            )}
          </VStack>
        </Box>

        <Button
          display={{ base: areRoutesVisible ? "flex" : "none", lg: "none" }}
          position="absolute"
          top="-5%"
          zIndex={10}
          left="50%"
          transform="translateX(-50%)"
          gap={1}
          fontSize="xs"
          color="gray.400"
          variant="ghost"
          p={0}
          height="fit-content"
          bg={{ _hover: "none" }}
          onClick={toggleRoutes}
        >
          <ArrowLeft size={18} />
          <Text fontSize="sm" fontWeight="medium">
            Back
          </Text>
        </Button>

        <MotionBox
          w="100%"
          maxW="30rem"
          h={{ base: "100%", lg: "fit-content" }}
          maxH={inputBoxHeight ? `${inputBoxHeight}px` : "auto"}
          bg="gray.800"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.700"
          p={4}
          boxShadow={{ base: "none", lg: "dark-lg" }}
          display={{ base: areRoutesVisible ? "block" : "none", lg: "block" }}
          position={{ base: "absolute", lg: "relative" }}
          top={{ base: 0, lg: "auto" }}
          left={{ base: "50%", lg: "auto" }}
          right={{ base: 0, lg: "auto" }}
          bottom={{ base: 0, lg: "auto" }}
          zIndex={{ base: 10 }}
          transform={{ base: "translateX(-50%)", lg: "none" }}
          overflowY="auto"
          initial={false}
          animate={{
            clipPath: areRoutesVisible ? "inset(0 0 0 0)" : "inset(0 0 0 100%)",
          }}
          transition={{
            duration: 0.4,
            ease: "easeInOut",
          }}
          css={{
            "@media (min-width: 993px)": {
              clipPath: "inset(0 0 0 0) !important",
            },
          }}
        >
          <VStack gap={4} align="stretch">
            {renderQuotes()}
          </VStack>
        </MotionBox>
      </Flex>
    </Container>
  );
}
