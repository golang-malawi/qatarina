import { Box, Text } from "@chakra-ui/react";

export const Logo = ({ size = "lg" }: { size?: "lg" | "sm" }) => {
  const logoSize = size === "lg" ? "16" : "8";
  return (
    <Box
      w={logoSize}
      h={logoSize}
      borderRadius="md"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <img src="/qatarina.png" alt="logo" />
    </Box>
  );
};
