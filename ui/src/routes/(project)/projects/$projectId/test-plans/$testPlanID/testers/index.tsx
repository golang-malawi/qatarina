import {
  Badge,
  Box,
  Card,
  Grid,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { IconSearch, IconUsers } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/page-states";
import { useTestPlanQuery } from "@/services/TestPlanService";
import { useUsersQuery } from "@/services/UserService";
import type { components } from "@/lib/api/v1";
import { useTranslation } from "react-i18next";

type TestPlanItem = components["schemas"]["schema.TestPlanResponseItem"];

type UserRecord = {
  ID?: number;
  id?: number;
  FirstName?: string;
  LastName?: string;
  displayName?: string;
  Email?: string;
  email?: string;
  username?: string;
};

type PlanTester = {
  id: number;
  name: string;
  email: string;
  role: string;
  assignments: number;
};

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID/testers/"
)({
  component: TestPlanTestersPage,
});

function TestPlanTestersPage() {
  const { t } = useTranslation();
  const { testPlanID } = Route.useParams();
  const [searchTerm, setSearchTerm] = useState("");

  const testPlanQuery = useTestPlanQuery(testPlanID) as {
    data: TestPlanItem | undefined;
    isLoading: boolean;
    isError: boolean;
  };

  const usersQuery = useUsersQuery();
  const users = useMemo(
    () => (usersQuery.data?.users ?? []) as UserRecord[],
    [usersQuery.data?.users]
  );

  const usersById = useMemo(() => {
    const map = new Map<number, UserRecord>();
    users.forEach((user) => {
      const id = Number(user.ID ?? user.id);
      if (!Number.isNaN(id)) map.set(id, user);
    });
    return map;
  }, [users]);

  const assignmentCountByTester = useMemo(() => {
    const map = new Map<number, number>();
    const testCases = testPlanQuery.data?.test_cases ?? [];
    testCases.forEach((testCase) => {
      testCase.assigned_tester_ids?.forEach((testerId) => {
        map.set(testerId, (map.get(testerId) ?? 0) + 1);
      });
    });
    return map;
  }, [testPlanQuery.data?.test_cases]);

  const testers = useMemo(() => {
    const ids = new Set<number>();
    if (testPlanQuery.data?.assigned_to_id) {
      ids.add(testPlanQuery.data.assigned_to_id);
    }
    assignmentCountByTester.forEach((_, testerId) => ids.add(testerId));

    return Array.from(ids)
      .map((id): PlanTester => {
        const user = usersById.get(id);
        const assignments = assignmentCountByTester.get(id) ?? 0;
        return {
          id,
          name: getUserName(user, id),
          email: user?.Email ?? user?.email ?? t("test_plans.no_users"),
          role:
            id === testPlanQuery.data?.assigned_to_id
              ? t("test_plans.role.owner")
              : t("test_plans.role.assigned"),
          assignments,
        };
      })
      .sort(
        (a, b) => b.assignments - a.assignments || a.name.localeCompare(b.name)
      );
  }, [assignmentCountByTester, testPlanQuery.data?.assigned_to_id, usersById, t]);

  const filteredTesters = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return testers;
    return testers.filter((tester) => {
      const searchable = `${tester.id} ${tester.name} ${tester.email} ${tester.role}`.toLowerCase();
      return searchable.includes(term);
    });
  }, [searchTerm, testers]);

  const totalAssignments = testers.reduce(
    (total, tester) => total + tester.assignments,
    0
  );

  if (testPlanQuery.isLoading || usersQuery.isLoading) {
    return <LoadingState label={t("test_plans.loading")} />;
  }

  if (testPlanQuery.isError) {
    return <ErrorState title={t("test_plans.error")} />;
  }

  return (
    <Box w="full">
      <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" mb={5}>
        <Card.Body p={{ base: 4, md: 6 }}>
          <Stack gap={2}>
            <HStack gap={2}>
              <Icon as={IconUsers} color="brand.solid" />
              <Heading size="lg" color="fg.heading">
                {t("test_plans.testers")}
              </Heading>
            </HStack>
            <Text color="fg.subtle">{t("test_plans.testers_description")}</Text>
            <HStack gap={2} flexWrap="wrap">
              <Badge colorPalette="brand" variant="subtle">
                {testers.length} {t("test_plans.testers.count")}
              </Badge>
              <Badge colorPalette="blue" variant="subtle">
                {totalAssignments} {t("test_plans.testers.assignments")}
              </Badge>
              <Badge colorPalette="gray" variant="subtle">
                {filteredTesters.length} {t("test_plans.testers.shown")}
              </Badge>
            </HStack>
          </Stack>
        </Card.Body>
      </Card.Root>

      <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" mb={5}>
        <Card.Body p={4}>
          <InputGroup startElement={<IconSearch size={16} />}>
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t("test_plans.search_testers")}
            />
          </InputGroup>
        </Card.Body>
      </Card.Root>

      {testers.length === 0 ? (
        <EmptyState
          title={t("test_plans.empty_testers")}
          description={t("test_plans.empty_testers_description")}
        />
      ) : filteredTesters.length === 0 ? (
        <EmptyState
          title={t("test_plans.no_match_testers")}
          description={t("test_plans.no_match_testers_description")}
        />
      ) : (
        <Stack gap={4}>
          {filteredTesters.map((tester) => (
            <Card.Root
              key={tester.id}
              border="sm"
              borderColor="border.subtle"
              bg="bg.surface"
              shadow="sm"
            >
              <Card.Body p={5}>
                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "minmax(0, 1.3fr) minmax(0, 1fr)",
                  }}
                  gap={4}
                >
                  <Stack gap={1}>
                    <Heading size="md" color="fg.heading">
                      {tester.name}
                    </Heading>
                    <Text color="fg.subtle" fontSize="sm">
                      {tester.email}
                    </Text>
                    <HStack gap={2} flexWrap="wrap">
                      <Badge colorPalette="gray" variant="outline">
                        ID: {tester.id}
                      </Badge>
                      <Badge
                        colorPalette={
                          tester.role === t("test_plans.role.owner")
                            ? "purple"
                            : "brand"
                        }
                        variant="subtle"
                      >
                        {tester.role}
                      </Badge>
                    </HStack>
                  </Stack>

                  <Stack gap={1}>
                    <Text fontSize="xs" color="fg.subtle">
                      {t("test_plans.assigned_cases")}
                    </Text>
                    <Heading size="lg" color="fg.heading">
                      {tester.assignments}
                    </Heading>
                    <Text color="fg.subtle" fontSize="sm">
                      {tester.assignments > 0
                        ? t("test_plans.assigned_cases_description")
                        : t("test_plans.no_assigned_cases")}
                    </Text>
                  </Stack>
                </Grid>
              </Card.Body>
            </Card.Root>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function getUserName(user?: UserRecord, fallbackId?: number) {
  if (!user) return `User ${fallbackId ?? ""}`.trim();
  const fullName = `${user.FirstName ?? ""} ${user.LastName ?? ""}`.trim();
  return (
    user.displayName ||
    fullName ||
    user.username ||
    user.Email ||
    user.email ||
    `User ${fallbackId ?? ""}`.trim()
  );
}

