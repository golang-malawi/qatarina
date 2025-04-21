import { Tabs } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/(app)/projects/$projectId/test-cases/$testCaseId/"
)({
  component: ViewTestCase,
});

function ViewTestCase() {
  return (
    <div className="card">
      <Tabs.Root defaultValue="description">
        <Tabs.List>
          <Tabs.Trigger value="description">Description</Tabs.Trigger>
          <Tabs.Trigger value="testers">Testers</Tabs.Trigger>
          <Tabs.Trigger value="results">Test Results</Tabs.Trigger>
          <Tabs.Trigger value="documents">Documents and Media</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="description" title="Description">
          <p className="m-0">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
          </p>
        </Tabs.Content>
        <Tabs.Content value="testers" title="Testers">
          <p className="m-0">
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
            accusantium doloremque laudantium, totam rem aperiam, eaque ipsa
            quae ab illo inventore veritatis et quasi architecto beatae vitae
            dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit
            aspernatur aut odit aut fugit, sed quia consequuntur magni dolores
            eos qui ratione voluptatem sequi nesciunt. Consectetur, adipisci
            velit, sed quia non numquam eius modi.
          </p>
        </Tabs.Content>
        <Tabs.Content value="results" title="Test Results">
          <p className="m-0">
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
            accusantium doloremque laudantium, totam rem aperiam, eaque ipsa
            quae ab illo inventore veritatis et quasi architecto beatae vitae
            dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit
            aspernatur aut odit aut fugit, sed quia consequuntur magni dolores
            eos qui ratione voluptatem sequi nesciunt. Consectetur, adipisci
            velit, sed quia non numquam eius modi.
          </p>
        </Tabs.Content>
        <Tabs.Content value="documents" title="Documents and Media">
          <p className="m-0">
            At vero eos et accusamus et iusto odio dignissimos ducimus qui
            blanditiis praesentium voluptatum deleniti atque corrupti quos
            dolores et quas molestias excepturi sint occaecati cupiditate non
            provident, similique sunt in culpa qui officia deserunt mollitia
            animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis
            est et expedita distinctio. Nam libero tempore, cum soluta nobis est
            eligendi optio cumque nihil impedit quo minus.
          </p>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

