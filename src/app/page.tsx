"use client";

import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Input,
  Link,
  Spacer,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CheckCircle2Icon, ExternalLinkIcon, InfoIcon } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { formatUnits } from "viem";
import { AggIcons, LlamaIcon } from "@/components/icons";
import { TokenSwitcher } from "@/components/token-switcher";
import { useBridge } from "@/lib/providers/bridge-store";
import { isInputGreaterThanDecimals } from "@/utils/number";
import { Tooltip } from "../components/ui/tooltip";

enum STATES {
  INPUT,
  ROUTES,
}

export default function BridgeAggregatorPage() {
  const switchPrivacyId = useId();

  const { isPrivacyEnabled, from, togglePrivacy, setFromAmount } = useBridge(
    (state) => state,
  );

  const [uiState, setUiState] = useState(STATES.INPUT);
  const [aggregator, setAggregator] = useState("");
  const [selectedChain, setSelectedChain] = useState(null);

  const routesRef = useRef(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedRoutes = [
    // {
    //   name: "CowSwap",
    //   amount: 10,
    // },
  ];
  const warnings: string[] = [];
  const tokenBalance = 0;

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
    if (from.token && tokenBalance) {
      setFromAmount(formatUnits(tokenBalance, from.token.decimals).toString());
    }
  }, [from.token, tokenBalance, setFromAmount]);

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

                  <Button
                    fontSize="xs"
                    color="gray.400"
                    variant="ghost"
                    p={0}
                    height="fit-content"
                    onClick={handleMaxClick}
                  >
                    Balance: --
                  </Button>
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
                    />
                    <TokenSwitcher side="to" />
                  </Flex>
                  <Text fontSize="xs" color="gray.400">
                    Balance: --
                  </Text>
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

            <Button
              colorPalette="blue"
              size="lg"
              w="100%"
              disabled={!selectedChain}
            >
              Connect Wallet
            </Button>
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
          display={{
            base: uiState === STATES.ROUTES ? "block" : "none",
            md: "block",
          }}
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
            {!normalizedRoutes || normalizedRoutes?.length === 0 ? (
              <RouteNotSelected />
            ) : (
              <VStack gap={2}>
                {normalizedRoutes?.map((route) => (
                  <Box
                    key={route.name}
                    w="100%"
                    p={4}
                    bg="gray.700"
                    borderRadius="lg"
                    border="2px solid"
                    borderColor={
                      aggregator === route.name ? "blue.500" : "transparent"
                    }
                    cursor="pointer"
                    _hover={{ borderColor: "gray.600" }}
                    onClick={() => setAggregator(route.name)}
                  >
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="medium">{route.name}</Text>
                      <Text fontSize="sm" color="gray.400">
                        {route.amount}
                      </Text>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}
          </VStack>
        </Box>
      </Flex>
    </Container>
  );
}

const RouteNotSelected = () => {
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
