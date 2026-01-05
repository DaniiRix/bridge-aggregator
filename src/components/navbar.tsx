import { Box, Text } from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";

export const Navbar = () => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Box display="flex" alignItems="center" gap={2}>
        <Image src="/logo.png" alt="Logo" width={50} height={50} />
        <Text fontSize="3xl" fontWeight="bold">
          LlamaBridge
        </Text>
      </Box>
      <ConnectButton chainStatus="none" showBalance={false} />
    </Box>
  );
};
