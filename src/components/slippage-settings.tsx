import {
  Button,
  Dialog,
  Flex,
  Grid,
  IconButton,
  Input,
  InputGroup,
  Portal,
  RadioGroup,
  Text,
} from "@chakra-ui/react";
import { Settings2Icon, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BASIS_POINTS_MULTIPLIER,
  MAX_SLIPPAGE_PERCENT,
  useSlippage,
} from "@/store/slippage";
import { formatPercent } from "@/utils/number";
import { toaster } from "./ui/toaster";

const SLIPPAGE_OPTIONS = [
  { label: "0.1%", value: 1000 }, // 0.1% * 10_000
  { label: "0.25%", value: 2500 }, // 0.25% * 10_000
  { label: "0.5%", value: 5000 }, // 0.5% * 10_000
  { label: "1%", value: 10000 }, // 1% * 10_000
  { label: "3%", value: 30000 }, // 3% * 10_000
] as const;

export const SlippageSettings = () => {
  const { slippagePercent, setSlippagePercent } = useSlippage();

  const [open, setOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [customValue, setCustomValue] = useState<string>("");
  const [isCustomSelected, setIsCustomSelected] = useState(false);

  const slippageBasisPoints = useMemo((): number | null => {
    if (isCustomSelected) {
      const customPercent = Number.parseFloat(customValue);
      if (
        Number.isNaN(customPercent) ||
        customPercent <= 0 ||
        customPercent > MAX_SLIPPAGE_PERCENT
      ) {
        return null;
      }
      return Math.round(customPercent * 10_000);
    }

    const basisPoints = Number.parseInt(selectedOption, 10);
    if (!basisPoints) {
      return null;
    }
    const percent = basisPoints / 10_000;
    if (percent > MAX_SLIPPAGE_PERCENT) {
      return null;
    }
    return basisPoints;
  }, [isCustomSelected, customValue, selectedOption]);

  useEffect(() => {
    const currentSlippageBp = slippagePercent * BASIS_POINTS_MULTIPLIER;

    const matchingOption = SLIPPAGE_OPTIONS.find(
      (opt) => opt.value === currentSlippageBp,
    );
    if (matchingOption) {
      setSelectedOption(String(matchingOption.value));
      setIsCustomSelected(false);
      setCustomValue("");
    } else {
      setSelectedOption("custom");
      setIsCustomSelected(true);
      setCustomValue(String(currentSlippageBp / 10_000));
    }
  }, [slippagePercent]);

  const handleValueChange = useCallback((value: string | null) => {
    if (!value) return;

    if (value === "custom") {
      setIsCustomSelected(true);
      setSelectedOption("custom");
    } else {
      setIsCustomSelected(false);
      setSelectedOption(value);
      setCustomValue("");
    }
  }, []);

  const handleCustomInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      if (inputValue === "" || /^\d*\.?\d*$/.test(inputValue)) {
        setCustomValue(inputValue);
      }
    },
    [],
  );

  const handleSave = useCallback(() => {
    if (!slippageBasisPoints) return;

    let slippagePercent: number;

    if (isCustomSelected) {
      const customPercent = Number.parseFloat(customValue);
      if (
        Number.isNaN(customPercent) ||
        customPercent <= 0 ||
        customPercent > MAX_SLIPPAGE_PERCENT
      ) {
        toaster.create({
          title: "Invalid custom slippage",
          type: "error",
        });
        return;
      }
      slippagePercent = customPercent;
    } else {
      slippagePercent = slippageBasisPoints / 10_000;
      if (slippagePercent > MAX_SLIPPAGE_PERCENT) {
        toaster.create({
          title: "Invalid slippage",
          type: "error",
        });
        return;
      }
    }

    setSlippagePercent(slippagePercent);

    setOpen(false);
  }, [slippageBasisPoints, isCustomSelected, customValue, setSlippagePercent]);

  return (
    <Dialog.Root size="sm" open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          size="xs"
          borderColor="gray.700"
          color="gray.300"
        >
          Max slippage: {formatPercent(slippagePercent / 100)}{" "}
          <Settings2Icon size={14} />
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="bg.1">
            <Dialog.Header>
              <Flex
                align="center"
                justifyContent="space-between"
                gap={2}
                w="100%"
              >
                <Dialog.Title color="white">Slippage tolerance</Dialog.Title>
                <IconButton
                  bg="none"
                  color="gray.100"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  <XIcon />
                </IconButton>
              </Flex>
            </Dialog.Header>
            <Dialog.Body color="white">
              <Text fontSize="sm">
                Slippage is the maximum allowed difference between the quoted
                and execution price. If the price moves against you beyond this
                %, the transaction will revert.
              </Text>

              <RadioGroup.Root
                value={selectedOption}
                onValueChange={(e) => handleValueChange(e.value)}
                mt={4}
              >
                <Grid templateColumns="repeat(3, 1fr)" gap={2}>
                  {SLIPPAGE_OPTIONS.map((opt) => (
                    <RadioGroup.Item
                      key={opt.value}
                      value={String(opt.value)}
                      border="1px solid"
                      borderColor="gray.700"
                      borderRadius="lg"
                      p={2}
                      textAlign="center"
                      display="flex"
                      justifyContent="center"
                      cursor="pointer"
                      _hover={{ borderColor: "gray.600", bg: "bg.2" }}
                      _checked={{ borderColor: "gray.600", bg: "bg.2" }}
                    >
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemText>{opt.label}</RadioGroup.ItemText>
                    </RadioGroup.Item>
                  ))}
                  <RadioGroup.Item
                    value="custom"
                    border="1px solid"
                    borderColor="gray.700"
                    borderRadius="lg"
                    p={2}
                    textAlign="center"
                    display="flex"
                    justifyContent="center"
                    cursor="pointer"
                    _hover={{ borderColor: "gray.600", bg: "bg.2" }}
                    _checked={{ borderColor: "gray.600", bg: "bg.1" }}
                  >
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemText>Custom</RadioGroup.ItemText>
                  </RadioGroup.Item>
                </Grid>
              </RadioGroup.Root>

              {isCustomSelected && (
                <InputGroup endElement="%" mt={4}>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={customValue}
                    onChange={(e) => handleCustomInputChange(e)}
                    placeholder="1.0"
                    color="white"
                    borderRadius="lg"
                    w="100%"
                  />
                </InputGroup>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button colorPalette="blue" onClick={handleSave}>
                Save
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
