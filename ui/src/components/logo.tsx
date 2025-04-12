import { Box, Text } from "@chakra-ui/react";

export const Logo = () => {
  return (
    <Box
      w="64px"
      h="64px"
      bg="bg.muted"
      borderRadius="md"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Text fontSize="2xl" fontWeight="bold" color="white">
        QA
      </Text>
    </Box>
  );
};
