import { Box, Text } from "@chakra-ui/react";

export const Logo = ({ size = "lg" }: { size?: "lg" | "sm" }) => {
  const logoSize = size === "lg" ? "64px" : "32px";
  const logoFontSize = size === "lg" ? "2xl" : "lg";
  return (
    <Box
      w={logoSize}
      h={logoSize}
      bg="brand"
      borderRadius="md"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Text fontSize={logoFontSize} fontWeight="bold" color="white">
        QA
      </Text>
    </Box>
  );
};
