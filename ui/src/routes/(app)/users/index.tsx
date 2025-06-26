import { createFileRoute, Link } from "@tanstack/react-router";
import { Box, Button, Flex, Heading } from "@chakra-ui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import $api from "@/lib/api/query";
import { IconUser } from "@tabler/icons-react";

export const Route = createFileRoute("/(app)/users/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData($api.queryOptions("get", "/v1/users")),
  component: RouteComponent
});

function RouteComponent() {
  const {
    data: { users },
    isPending,
    error,
  } = useSuspenseQuery($api.queryOptions("get", "/v1/users"));

  if (isPending) {
    return "Loading users...";
  }

  if (error) {
    return <div className="error">Error: error fetching users</div>;
  }
  return (
    <Box>
      <Heading size="3xl">Users</Heading>
      <Link to={`/users/new`}>
        <Button>
          Add New User
        </Button>
      </Link>
      <Flex direction="column" gap="2" p="4" borderTop={"1px black solid"}>
        {users.map((user) => 
        <Box key={user.username}>
          <IconUser />
          <Link 
            to={`/users/view/$userID`}
            params={{ userID: user.id }} >
              <strong>{user.displayName}</strong>
          </Link>
          <p>
            <small>Registered At: {user.createdAt}</small>
          </p>
        </Box>)}
      </Flex>
    </Box>
  );
}
