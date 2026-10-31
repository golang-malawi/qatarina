import { Box, Stack, Text } from "@chakra-ui/react";
import { CommentAttachment } from "@/services/TestPlanService";
import { CommentAttachments } from "@/components/comments/CommentAttachments";
import { LinkifiedText, LinkPreviews } from "@/components/comments/LinkPreviews";
import { attachmentTokenPattern } from "@/components/comments/attachmentTokens";

type Segment = { kind: "text"; text: string } | { kind: "images"; attachments: CommentAttachment[] };

const URL_IN_LINE = /https?:\/\//;

// Splits text after every line that holds a link, so each link's preview sits right below it
function splitAtLinks(text: string): Segment[] {
  const segments: Segment[] = [];
  let block: string[] = [];
  for (const line of text.split("\n")) {
    block.push(line);
    if (URL_IN_LINE.test(line)) {
      segments.push({ kind: "text", text: block.join("\n") });
      block = [];
    }
  }
  if (block.join("").trim()) segments.push({ kind: "text", text: block.join("\n") });
  return segments;
}

function buildSegments(content: string, attachments: CommentAttachment[]): Segment[] {
  const byId = new Map(attachments.map((a) => [a.id, a]));
  const placed = new Set<string>();
  const segments: Segment[] = [];

  const pushText = (raw: string) => {
    const text = raw.replace(/^\s*\n/, "").replace(/\s+$/, "");
    if (text.trim()) segments.push(...splitAtLinks(text));
  };
  const pushImage = (attachment: CommentAttachment, between: string) => {
    const last = segments[segments.length - 1];
    // Images with only whitespace between them are shown side by side
    if (last?.kind === "images" && !between.trim()) {
      last.attachments.push(attachment);
    } else {
      pushText(between);
      segments.push({ kind: "images", attachments: [attachment] });
    }
  };

  let lastIndex = 0;
  for (const match of content.matchAll(attachmentTokenPattern())) {
    const between = content.slice(lastIndex, match.index);
    lastIndex = (match.index ?? 0) + match[0].length;
    const attachment = byId.get(match[2]);
    if (!attachment || placed.has(match[2])) {
      pushText(between);
      continue;
    }
    placed.add(match[2]);
    pushImage(attachment, between);
  }
  pushText(content.slice(lastIndex));

  // Attachments not referenced in the text (e.g. older comments) go at the end
  const unplaced = attachments.filter((a) => a.id && !placed.has(a.id));
  if (unplaced.length > 0) segments.push({ kind: "images", attachments: unplaced });

  return segments;
}

export function CommentBody({
  testPlanId,
  content,
  attachments,
  isOwn,
}: {
  testPlanId: number;
  content?: string;
  attachments?: CommentAttachment[];
  isOwn: boolean;
}) {
  const segments = buildSegments(content ?? "", attachments ?? []);

  return (
    <Stack gap={2} align="flex-start">
      {segments.map((segment, i) =>
        segment.kind === "images" ? (
          <CommentAttachments key={i} testPlanId={testPlanId} attachments={segment.attachments} />
        ) : (
          <Box key={i} maxW="full">
            <Box
              display="inline-block"
              maxW="full"
              px={4}
              py={2.5}
              bg={isOwn ? "brand.subtle" : "bg.muted"}
              borderRadius="2xl"
              borderTopLeftRadius={i === 0 ? "sm" : "2xl"}
            >
              <Text fontSize="sm" whiteSpace="pre-wrap" wordBreak="break-word" color="fg">
                <LinkifiedText text={segment.text} />
              </Text>
            </Box>
            <LinkPreviews text={segment.text} />
          </Box>
        )
      )}
    </Stack>
  );
}
