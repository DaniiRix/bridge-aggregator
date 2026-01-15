import { Box, Flex, HStack, Image, Link, Text, VStack } from "@chakra-ui/react";
import Decimal from "decimal.js-light";
import {
  CheckCircle2Icon,
  ClockIcon,
  ExternalLinkIcon,
  FuelIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useId } from "react";
import { formatUnits } from "viem";
import { AggIcons, LlamaIcon } from "@/components/icons";
import type { QuoteWithAmount } from "@/lib/aggregator/adapters/base";
import { useBridge } from "@/store/bridge";
import { formatNumber } from "@/utils/number";
import { RefreshQuotes } from "./refresh";
import { TokenWithChainLogo } from "./ui/dual-token";
import { Tooltip } from "./ui/tooltip";

const MotionBox = motion(Box);

export const RouteList = ({
  quotes,
  lastFetchedQuotesAt,
  refetchQuotes,
}: {
  quotes: QuoteWithAmount[];
  lastFetchedQuotesAt: number;
  refetchQuotes: () => void;
}) => {
  const { to, selectAdapter, setToAmount } = useBridge();

  const handleSelection = useCallback(
    (adapter: string) => {
      if (adapter && to.token?.decimals) {
        const quote = quotes.find((q) => q.adapter.name === adapter);
        if (quote) {
          selectAdapter(adapter);

          const newAmount = formatUnits(
            BigInt(quote.estimatedAmount),
            to.token.decimals,
          ).toString();
          setToAmount(newAmount);
        }
      }
    },
    [to.token?.decimals, quotes, setToAmount, selectAdapter],
  );

  return (
    <VStack gap={2}>
      <HStack align="flex-start" gap={2}>
        <Flex direction="column" flex={1} gap={2}>
          <Text fontSize="lg" fontWeight="semibold" color="white" w="100%">
            Select a route
          </Text>
          <Text fontSize="sm" color="gray.400/80" w="100%">
            Best route is selected based on net output after gas fees.
          </Text>
        </Flex>

        <RefreshQuotes
          refetch={refetchQuotes}
          lastFetched={lastFetchedQuotesAt}
        />
      </HStack>

      <AnimatePresence mode="wait">
        {quotes?.map((q, qIdx) => (
          <RouteItem
            key={q.adapter.name}
            topQuote={quotes[0]}
            quote={q}
            qIdx={qIdx}
            handleSelection={handleSelection}
          />
        ))}
      </AnimatePresence>
    </VStack>
  );
};

const RouteItem = ({
  topQuote,
  quote,
  qIdx,
  handleSelection,
}: {
  topQuote: QuoteWithAmount;
  quote: QuoteWithAmount;
  qIdx: number;
  handleSelection: (adapter: string) => void;
}) => {
  const quoteId = useId();
  const { selectedAdapter, to } = useBridge();

  const lossPercent = new Decimal(topQuote.estimatedAmountAfterFeesUSD)
    .sub(quote.estimatedAmountAfterFeesUSD)
    .div(topQuote.estimatedAmountAfterFeesUSD)
    .mul(100)
    .toDecimalPlaces(3)
    .toNumber();

  return (
    <MotionBox
      key={quote.adapter.name}
      w="100%"
      p={4}
      bg="bg.2"
      borderRadius="lg"
      border="2px solid"
      borderColor={
        selectedAdapter === quote.adapter.name ? "blue.500" : "transparent"
      }
      cursor="pointer"
      _hover={{ borderColor: "gray.600" }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.3,
        delay: qIdx * 0.05,
        ease: "easeOut",
      }}
      onClick={() => handleSelection(quote.adapter.name)}
    >
      <Flex justify="space-between" align="center">
        <Flex align="center" gap={2}>
          <TokenWithChainLogo token={to.token!} chain={to.chain!} />
          <Flex direction="column">
            <Text
              fontSize="lg"
              color="gray.200"
              fontWeight="semibold"
              display="flex"
              gap={2}
            >
              {Number.parseFloat(
                formatUnits(BigInt(quote.estimatedAmount), to.token!.decimals),
              ).toFixed(to.token!.decimals / 3)}{" "}
              <Text color="gray.400">{to.token!.symbol}</Text>
            </Text>

            <Flex gap={3}>
              <Text fontSize="sm" color="gray.400">
                ≈ {formatNumber(quote.estimatedAmountAfterFeesUSD, 3)} after gas
                fees
              </Text>
              <Text
                fontSize="sm"
                color="gray.400"
                display="flex"
                gap={0.5}
                alignItems="center"
              >
                <ClockIcon size={12} />
                {quote.estimatedTime}s
              </Text>
            </Flex>
          </Flex>
        </Flex>

        <Flex direction="column" gap={2} align="flex-end">
          <Text
            fontWeight="medium"
            fontSize="sm"
            color={
              qIdx !== 0 ? (lossPercent > 0 ? "red.500" : "green.500") : ""
            }
          >
            {qIdx === 0
              ? "BEST"
              : `${lossPercent > 0 ? `-` : ``}${lossPercent}%`}
          </Text>
          <Flex
            fontWeight="medium"
            display="flex"
            fontSize="sm"
            gap={1.5}
            alignItems="center"
          >
            {quote.gasEstimate === "0" && (
              <Tooltip
                ids={{ trigger: quoteId }}
                content="Failed to estimate gas fees"
              >
                <div color="gray.400">
                  <FuelIcon size={14} color="#AA4A44" />
                </div>
              </Tooltip>
            )}
            <Text color="gray.400">via</Text>
            <Image
              src={quote.adapter.logo}
              alt={quote.adapter.name}
              width="16px"
              height="16px"
              rounded="full"
            />
            <Text> {quote.adapter.name}</Text>
          </Flex>
        </Flex>
      </Flex>
    </MotionBox>
  );
};

export const RouteNotSelected = () => {
  return (
    <Flex flexDir="column" justifyContent="space-around" h="100%">
      <Flex position="relative">
        <Flex
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={1}
        >
          {LlamaIcon}
        </Flex>

        <Box
          display="flex"
          width="fit-content"
          overflow="hidden"
          my={20}
          px={48}
          animationName="slideX"
          animationDuration="10s"
          animationTimingFunction="linear"
          animationIterationCount="infinite"
        >
          {[...AggIcons, ...AggIcons].map((Icon, i) => (
            <Box
              key={i}
              boxShadow="0px 2.63014px 15.7808px rgba(0, 0, 0, 0.45)"
              w="48px"
              h="48px"
              mr="48px"
            >
              {Icon}
            </Box>
          ))}
        </Box>
      </Flex>

      <Box zIndex={1}>
        <Text fontSize="2xl" textAlign="center" mt="4" fontWeight="bold">
          The Aggregator of Aggregators
        </Text>
        <HStack gap={4} mt={6} w="100%" justifyContent="center">
          <Flex gap={2} alignItems="center" color="blue.400">
            <CheckCircle2Icon size={16} />
            <Text fontSize="sm" p={0}>
              Totally Free
            </Text>
          </Flex>

          <Flex gap={2} alignItems="center" color="blue.400">
            <CheckCircle2Icon size={16} />
            <Text fontSize="sm" p={0}>
              Gas Estimation
            </Text>
          </Flex>

          <Flex gap={1} alignItems="center" color="blue.400">
            <CheckCircle2Icon size={16} />
            <Text fontSize="sm" p={0}>
              Preserves Privacy
            </Text>
          </Flex>
        </HStack>

        <Text fontSize="sm" color="gray.300" textAlign="center" mt={6}>
          LlamaBridge looks for the best route for your trade <br /> among a
          variety of Bridge Aggregators, guaranteeing you <br /> the best
          execution prices in DeFi.
          <br /> <br /> Try it now or{" "}
          <Link
            href="https://twitter.com/defillama/status/1609989799653285888"
            textDecoration={"underline"}
          >
            learn more
            <ExternalLinkIcon size={14} />
          </Link>
        </Text>
      </Box>
    </Flex>
  );
};

export const NoRouteFound = () => {
  return (
    <Flex flexDir="column" justifyContent="space-around" h="100%">
      <Flex position="relative">
        <Flex
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={1}
        >
          {LlamaIcon}
        </Flex>

        <Box
          display="flex"
          width="fit-content"
          overflow="hidden"
          my={20}
          px={48}
          animationName="slideX"
          animationDuration="10s"
          animationTimingFunction="linear"
          animationIterationCount="infinite"
        >
          {[...AggIcons, ...AggIcons].map((Icon, i) => (
            <Box
              key={i}
              boxShadow="0px 2.63014px 15.7808px rgba(0, 0, 0, 0.45)"
              w="48px"
              h="48px"
              mr="48px"
            >
              {Icon}
            </Box>
          ))}
        </Box>
      </Flex>

      <Box zIndex={1}>
        <Text fontSize="2xl" textAlign="center" mt="4" fontWeight="bold">
          No Route Found
        </Text>

        <Text fontSize="sm" color="gray.300" textAlign="center" mt={6}>
          LlamaBridge looks for the best route for your trade <br /> among a
          variety of Bridge Aggregators, guaranteeing you <br /> the best
          execution prices in DeFi.
          <br /> <br /> Try it now or{" "}
          <Link
            href="https://twitter.com/defillama/status/1609989799653285888"
            textDecoration={"underline"}
          >
            learn more
            <ExternalLinkIcon size={14} />
          </Link>
        </Text>
      </Box>
    </Flex>
  );
};
