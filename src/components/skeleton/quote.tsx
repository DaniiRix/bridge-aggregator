import { Box, Flex, Skeleton, SkeletonCircle } from "@chakra-ui/react";

export const QuoteSkeleton = () => (
  <Box w="100%" p={4} bg="bg.2" borderRadius="lg" cursor="pointer">
    <Flex justify="space-between" align="center" w="100%">
      <Flex align="center" gap={2} w="100%">
        <SkeletonCircle size="9" />
        <Flex direction="column" w="100%" gap={2}>
          <Skeleton height="3" width="50%" />
          <Skeleton height="3" width="100%" />
        </Flex>
      </Flex>

      <Flex direction="column" gap={2} align="flex-end" w="100%">
        <Skeleton height="3" width="20%" />
        <Skeleton height="3" width="40%" />
      </Flex>
    </Flex>
  </Box>
);
