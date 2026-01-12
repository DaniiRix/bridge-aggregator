import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import Decimal from "decimal.js-light";
import { InfoIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
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

  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    const warnings: string[] = [];

    if (selectedAdapter && from.amount) {
      const quote = quotes.find((q) => q.adapter.name === selectedAdapter);
      if (!quote) return;

      if (quote.adapter.name !== quotes[0].adapter.name) {
        const lossPercent = new Decimal(quotes[0].estimatedAmountAfterFeesUSD)
          .sub(quote.estimatedAmountAfterFeesUSD)
          .div(quotes[0].estimatedAmountAfterFeesUSD)
          .mul(100)
          .toDecimalPlaces(2)
          .toNumber();

        warnings.push(
          `You are loosing ${lossPercent}% by not using ${titleCase(quotes[0].adapter.name)}`,
        );
      }

      if (fromTokenPrice) {
        const amountInUSD = new Decimal(fromTokenPrice)
          .mul(from.amount)
          .toDecimalPlaces(2)
          .toNumber();

        const priceImpact =
          amountInUSD / Number(quote.estimatedAmountAfterFeesUSD) - 1;

        const isImpactMoreThan1Percent = priceImpact > 0.01;
        if (isImpactMoreThan1Percent) {
          warnings.push(
            `Price impact is ${Math.abs(Math.round(priceImpact * 100 * 100) / 100)}%, consider using a different route`,
          );
        }
      }
    }

    setWarnings(warnings);
  }, [selectedAdapter, from.amount, fromTokenPrice, quotes]);

  return (
    <Fragment>
      {warnings?.length > 0 && (
        <MotionVStack
          gap={2}
          display={{ base: "none", md: "flex" }}
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
