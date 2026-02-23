import { Box, Text } from "@chakra-ui/react";

export const Logo = ({ size = "lg" }: { size?: "lg" | "sm" }) => {
  const logoSize = size === "lg" ? "16" : "8";
  const logoFontSize = size === "lg" ? "2xl" : "lg";
  return (
    <Box
      w={logoSize}
      h={logoSize}
      bg="brand.solid"
      borderRadius="md"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Text fontSize={logoFontSize} fontWeight="bold" color="brand.contrast">
        QA
      </Text>
    </Box>
  );
};
