import {
  Box,
  Flex,
  HStack,
  Skeleton,
  SkeletonCircle,
  Text,
  VStack,
} from "@chakra-ui/react";

export const TokensSkeleton = () => (
  <Box mt={4} overflowY="auto" w="100%" position="relative">
    <Box w="100%">
      <Text fontSize="xs" fontWeight="semibold" color="text.2">
        Your tokens
      </Text>
      <VStack gap={1} alignItems="flex-start" w="100%">
        {[0, 1].map((val) => (
          <HStack
            key={`skeleton-your-token-${val}`}
            gap="3"
            w="100%"
            justifyContent="space-between"
            p={3}
          >
            <SkeletonCircle size="8" />
            <Flex direction="column" alignItems="flex-start" gap="2" w="100%">
              <Skeleton height="3" width="30%" />
              <Skeleton height="3" width="90%" />
            </Flex>
            <Flex direction="column" alignItems="flex-end" gap="2" w="100%">
              <Skeleton height="3" width="30%" />
              <Skeleton height="3" width="20%" />
            </Flex>
          </HStack>
        ))}
      </VStack>
    </Box>
    <Box w="100%">
      <Text fontSize="xs" fontWeight="semibold" color="text.2">
        All tokens
      </Text>
      <VStack gap={1} alignItems="flex-start" w="100%">
        {[0, 1, 2].map((val) => (
          <HStack
            key={`skeleton-all-token-${val}`}
            gap="3"
            w="100%"
            justifyContent="space-between"
            p={3}
          >
            <SkeletonCircle size="8" />
            <Flex direction="column" alignItems="flex-start" gap="2" w="100%">
              <Skeleton height="3" width="20%" />
              <Skeleton height="3" width="50%" />
            </Flex>
          </HStack>
        ))}
      </VStack>
    </Box>
  </Box>
);
