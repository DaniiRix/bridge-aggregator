import { Flex, Image } from "@chakra-ui/react";
import type { Chain, Token } from "@/store/bridge";

export const TokenWithChainLogo = ({
  token,
  chain,
  width = "32px",
  height = "32px",
}: {
  token: Token;
  chain: Chain;
  width?: string;
  height?: string;
}) => {
  return (
    <Flex align="center" gap={2} position="relative">
      <Image
        src={token.logo}
        alt={token.name}
        width={width}
        height={height}
        bg="bg.3"
        borderRadius="full"
      />
      <Image
        src={chain.iconUrl}
        alt={chain.name}
        width="14px"
        height="14px"
        borderRadius="full"
        position="absolute"
        bottom="0"
        right="0"
      />
    </Flex>
  );
};
