import { Box, Flex, HStack, Image, Link, Stack, Text } from "@chakra-ui/react";
import { Fragment, useState } from "react";
import { useLinkPreviewQuery } from "@/services/TestPlanService";

const URL_PATTERN = /https?:\/\/[^\s<>"'`]+/g;
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"]+$/;
const MAX_PREVIEWS = 3;

function splitUrl(match: string) {
  const trailing = match.match(TRAILING_PUNCTUATION)?.[0] ?? "";
  return { url: match.slice(0, match.length - trailing.length), trailing };
}

function extractUrls(text?: string): string[] {
  if (!text) return [];
  const urls = (text.match(URL_PATTERN) ?? []).map((m) => splitUrl(m).url);
  return [...new Set(urls)];
}

// Renders text with URLs turned into links, keeping line breaks
export function LinkifiedText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const { url, trailing } = splitUrl(match[0]);
    const start = match.index ?? 0;
    parts.push(text.slice(lastIndex, start));
    parts.push(
      <Link
        key={start}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        color="brand.fg"
        textDecoration="underline"
        textUnderlineOffset="2px"
        wordBreak="break-all"
      >
        {url}
      </Link>
    );
    parts.push(trailing);
    lastIndex = start + match[0].length;
  }
  parts.push(text.slice(lastIndex));
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>{part}</Fragment>
      ))}
    </>
  );
}

function LinkPreviewCard({ url }: { url: string }) {
  const { data } = useLinkPreviewQuery(url);
  const [imageFailed, setImageFailed] = useState(false);
  const [faviconFailed, setFaviconFailed] = useState(false);

  if (!data || (!data.title && !data.description)) return null;

  const showImage = !!data.image && !imageFailed;
  const showFavicon = !!data.favicon && !faviconFailed;

  return (
    <Flex
      maxW="520px"
      borderWidth="1px"
      borderColor="border.subtle"
      borderLeftWidth="4px"
      borderLeftColor="brand.solid"
      borderRadius="md"
      bg="bg.panel"
      overflow="hidden"
    >
      <Stack gap={1} px={3} py={2.5} minW={0} flex="1">
        {(data.site_name || showFavicon) && (
          <HStack gap={1.5}>
            {showFavicon && (
              <Image
                src={data.favicon}
                alt=""
                boxSize="16px"
                borderRadius="sm"
                objectFit="contain"
                referrerPolicy="no-referrer"
                onError={() => setFaviconFailed(true)}
              />
            )}
            {data.site_name && (
              <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
                {data.site_name}
              </Text>
            )}
          </HStack>
        )}
        {data.title && (
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            fontWeight="semibold"
            fontSize="sm"
            color="brand.fg"
            lineClamp={2}
          >
            {data.title}
          </Link>
        )}
        {data.description && (
          <Text fontSize="sm" color="fg.muted" lineClamp={3}>
            {data.description}
          </Text>
        )}
        {showImage && (
          <Box mt={1} borderRadius="md" overflow="hidden" borderWidth="1px" borderColor="border.subtle">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Image
                src={data.image}
                alt=""
                maxH="220px"
                w="full"
                objectFit="cover"
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={() => setImageFailed(true)}
              />
            </a>
          </Box>
        )}
      </Stack>
    </Flex>
  );
}

// Slack style preview cards for the links in a message
export function LinkPreviews({ text }: { text?: string }) {
  const urls = extractUrls(text).slice(0, MAX_PREVIEWS);
  if (urls.length === 0) return null;
  return (
    <Stack gap={2} mt={2}>
      {urls.map((url) => (
        <LinkPreviewCard key={url} url={url} />
      ))}
    </Stack>
  );
}
