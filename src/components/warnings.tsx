import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import Decimal from "decimal.js-light";
import { InfoIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import { Fragment } from "react/jsx-runtime";
import { useQuote } from "@/hooks/use-quote";
import { useTokensPrice } from "@/hooks/use-token-price";
import { useBridge } from "@/store/bridge";
import { titleCase } from "@/utils/string";

const MotionVStack = motion(VStack);
const MotionBox = motion(Box);

export const Warnings = () => {
  const { data: quotes = [] } = useQuote();
  const { selectedAdapter, from } = useBridge();

  const { data: { fromTokenPrice } = {} } = useTokensPrice();

  const warnings = useMemo(() => {
    const warningsList: string[] = [];

    if (!selectedAdapter || !from.amount || quotes.length === 0) {
      return warningsList;
    }

    const quote = quotes.find((q) => q.adapter.name === selectedAdapter);
    if (!quote) return warningsList;

    // Check if not using best adapter
    if (quote.adapter.name !== quotes[0].adapter.name) {
      const lossPercent = new Decimal(quotes[0].estimatedAmountAfterFeesUSD)
        .sub(quote.estimatedAmountAfterFeesUSD)
        .div(quotes[0].estimatedAmountAfterFeesUSD)
        .mul(100)
        .toDecimalPlaces(3)
        .toString();

      warningsList.push(
        `You are loosing ${lossPercent}% by not using ${titleCase(quotes[0].adapter.name)}`,
      );
    }

    // Check price impact
    if (fromTokenPrice) {
      const amountInUSD = new Decimal(fromTokenPrice)
        .mul(from.amount)
        .toDecimalPlaces(2)
        .toNumber();

      const priceImpact =
        amountInUSD / Number(quote.estimatedAmountAfterFeesUSD) - 1;

      if (priceImpact > 0.01) {
        warningsList.push(
          `Price impact is ${Math.abs(Math.round(priceImpact * 100 * 100) / 100)}%, consider using a different route`,
        );
      }
    }

    return warningsList;
  }, [selectedAdapter, from.amount, fromTokenPrice, quotes]);

  return (
    <Fragment>
      {warnings?.length > 0 && (
        <MotionVStack
          gap={2}
          display={{ base: "none", lg: "flex" }}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.1, ease: "easeInOut" }}
        >
          <AnimatePresence mode="popLayout">
            {warnings.map((warning, i) => (
              <MotionBox
                key={warning}
                w="100%"
                bg="yellow.200/10"
                p={2}
                borderRadius="lg"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{
                  duration: 0.25,
                  delay: i * 0.05,
                  ease: "easeOut",
                }}
              >
                <Flex align="center" gap={2}>
                  <InfoIcon color="#ECC94B" size={16} />
                  <Text fontSize="xs" color="yellow.400">
                    {warning}
                  </Text>
                </Flex>
              </MotionBox>
            ))}
          </AnimatePresence>
        </MotionVStack>
      )}
    </Fragment>
  );
};
