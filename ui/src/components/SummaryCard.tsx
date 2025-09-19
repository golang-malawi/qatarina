import {Box, Stat as StatNamespace} from "@chakra-ui/react";

interface SummaryCardProps {
    label: string;
    value: number | string;
}

export const SummaryCard = ({label, value}: SummaryCardProps) => (
    <Box p={4} shadow="md" borderWidth="1px" borderRadius="md" bg="white">
        <StatNamespace.Root>
            <StatNamespace.Label>{label}</StatNamespace.Label>
            <StatNamespace.ValueText>
                {value !== undefined && value !== null ? String(value) : "N/A"}
                </StatNamespace.ValueText>
        </StatNamespace.Root>
    </Box>
);