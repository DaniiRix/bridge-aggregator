import { Box, Text } from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";

export const Navbar = () => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Box display="flex" alignItems="center" gap={2} px={{ base: 4, lg: 0 }}>
        <Image src="/logo.png" alt="Logo" width={45} height={45} />
        <Text fontSize={{ base: "xl", lg: "3xl" }} fontWeight="bold">
          LlamaBridge
        </Text>
      </Box>
      <Box display={{ base: "none", lg: "flex" }}>
        <ConnectButton chainStatus="none" showBalance={false} />
      </Box>
    </Box>
  );
};
