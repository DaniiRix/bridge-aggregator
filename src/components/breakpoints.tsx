import { Box, useBreakpointValue } from "@chakra-ui/react";

export const Breakpoints = () => {
  const breakpoint = useBreakpointValue({
    base: "base",
    sm: "sm",
    md: "md",
    lg: "lg",
    xl: "xl",
    "2xl": "2xl",
  });

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <Box
      position="fixed"
      bottom={2}
      right={2}
      zIndex={10}
      px={3}
      py={1}
      bg="bg.3"
      borderRadius="full"
      fontSize="sm"
      fontFamily="mono"
      opacity={0.8}
      pointerEvents="none"
    >
      {breakpoint}
    </Box>
  );
};
