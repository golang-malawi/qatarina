import { Link } from "@tanstack/react-router";
import { Avatar, AvatarGroup } from "./ui/avatar";
import { TesterRecord } from "@/common/models";

type TestersAvatarGroupProps = {
  testers: TesterRecord[];
};
export default function TestersAvatarGroup({
  testers,
}: TestersAvatarGroupProps) {
  const many = testers.length > 4;
  const includedTesters = many ? testers.slice(0, 4) : testers;
  const avatars = includedTesters.map((t) => (
    <Link
      key={t.user_id}
      to={`/workspace/testers/view/$testerId`}
      params={{ testerId: `${t.user_id}` }}
    >
      <Avatar
        shadow="sm"
        bg="brand.solid"
        color="brand.contrast"
        name={t.name}
        key={t.user_id}
      />
    </Link>
  ));

  if (avatars.length < 1) {
    return <span>No Testers Assigned</span>;
  }

  return (
    <AvatarGroup size="md">
      {avatars}
      {many && (
        <Link to="/workspace/testers">
          <Avatar name="+" bg="bg.inverted" color="fg.inverted" />
        </Link>
      )}
    </AvatarGroup>
  );
}
