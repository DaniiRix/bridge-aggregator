import { Box, Flex, HStack, Image, Link, Text, VStack } from "@chakra-ui/react";
import Decimal from "decimal.js-light";
import { CheckCircle2Icon, ClockIcon, ExternalLinkIcon } from "lucide-react";
import { formatUnits } from "viem";
import { AggIcons, LlamaIcon } from "@/components/icons";
import type { QuoteWithAmount } from "@/lib/aggregator/adapters/base";
import { useBridge } from "@/lib/providers/bridge-store";
import { formatNumber } from "@/utils/number";
import { TokenWithChainLogo } from "./ui/dual-token";

export const RouteList = ({ quotes }: { quotes: QuoteWithAmount[] }) => {
  const { selectedAdapter, to, selectAdapter } = useBridge((state) => state);

  return (
    <VStack gap={2}>
      <Text fontSize="lg" fontWeight="semibold" color="white" w="100%">
        Select a route
      </Text>
      <Text fontSize="sm" color="gray.400/80" w="100%">
        Best route is selected based on net output after gas fees.
      </Text>

      {quotes?.map((q, qIdx) => {
        const lossPercent = new Decimal(quotes[0].estimatedAmountAfterFeesUSD)
          .sub(q.estimatedAmountAfterFeesUSD)
          .div(quotes[0].estimatedAmountAfterFeesUSD)
          .mul(100)
          .toDecimalPlaces(2)
          .toNumber();

        return (
          <Box
            key={q.adapter.name}
            w="100%"
            p={4}
            bg="bg.2"
            borderRadius="lg"
            border="2px solid"
            borderColor={
              selectedAdapter === q.adapter.name ? "blue.500" : "transparent"
            }
            cursor="pointer"
            _hover={{ borderColor: "gray.600" }}
            onClick={() => selectAdapter(q.adapter.name)}
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
                      formatUnits(
                        BigInt(q.estimatedAmount),
                        to.token!.decimals,
                      ),
                    ).toFixed(to.token!.decimals / 3)}{" "}
                    <Text color="gray.400">{to.token!.symbol}</Text>
                  </Text>

                  <Flex gap={3}>
                    <Text fontSize="sm" color="gray.400">
                      ≈ {formatNumber(q.estimatedAmountAfterFeesUSD)} after gas
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
                      {q.estimatedTime}s
                    </Text>
                  </Flex>
                </Flex>
              </Flex>

              <Flex direction="column" gap={2} align="flex-end">
                <Text
                  fontWeight="medium"
                  fontSize="sm"
                  color={qIdx !== 0 ? "red.500" : ""}
                >
                  {qIdx === 0 ? "BEST" : `${lossPercent}%`}
                </Text>
                <Flex
                  fontWeight="medium"
                  display="flex"
                  fontSize="sm"
                  gap={1.5}
                  alignItems="center"
                >
                  <Text color="gray.400">via</Text>
                  <Image
                    src={q.adapter.logo}
                    alt={q.adapter.name}
                    width="16px"
                    height="16px"
                    rounded="full"
                  />
                  <Text> {q.adapter.name}</Text>
                </Flex>
              </Flex>
            </Flex>
          </Box>
        );
      })}
    </VStack>
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
          <Flex gap={2} alignItems="center">
            <CheckCircle2Icon color="blue" size={16} />
            <Text fontSize="sm" color={"blue.500"} p={0}>
              Totally Free
            </Text>
          </Flex>

          <Flex gap={2} alignItems="center">
            <CheckCircle2Icon color="blue" size={16} />
            <Text fontSize="sm" color={"blue.500"} p={0}>
              Gas Estimation
            </Text>
          </Flex>

          <Flex gap={1} alignItems="center">
            <CheckCircle2Icon color="blue" size={16} />
            <Text fontSize="sm" color={"blue.500"} p={0}>
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
