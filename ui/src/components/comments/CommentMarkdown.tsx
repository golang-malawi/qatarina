import { Box, Link } from "@chakra-ui/react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Compact markdown styling sized for chat bubbles. Raw HTML is not rendered
// (react-markdown escapes it), so comment text cannot inject markup.
const markdownCss = {
  fontSize: "sm",
  lineHeight: "1.5",
  color: "fg",
  wordBreak: "break-word",
  // The composer stores each line as a single newline, so keep those line breaks
  "& p": { whiteSpace: "pre-wrap" },
  "& > * + *, & li > * + *, & blockquote > * + *": { marginTop: 2 },
  "& h1, & h2, & h3, & h4, & h5, & h6": { fontWeight: "semibold", lineHeight: "1.3" },
  "& h1": { fontSize: "lg" },
  "& h2": { fontSize: "md" },
  "& h3, & h4, & h5, & h6": { fontSize: "sm" },
  "& ul, & ol": { paddingInlineStart: 5 },
  "& ul": { listStyleType: "disc" },
  "& ul ul": { listStyleType: "circle" },
  "& ol": { listStyleType: "decimal" },
  "& li + li": { marginTop: 0.5 },
  "& li.task-list-item": { listStyleType: "none", marginInlineStart: -5 },
  "& li.task-list-item input": { marginInlineEnd: 1.5, verticalAlign: "middle" },
  "& blockquote": {
    borderInlineStartWidth: "3px",
    borderColor: "border.emphasized",
    paddingInlineStart: 3,
    color: "fg.muted",
  },
  "& code": {
    fontFamily: "mono",
    fontSize: "0.85em",
    bg: "bg.emphasized",
    borderRadius: "sm",
    px: 1,
    py: 0.5,
  },
  "& pre": {
    fontFamily: "mono",
    fontSize: "xs",
    bg: "bg.emphasized",
    borderRadius: "md",
    p: 3,
    overflowX: "auto",
    whiteSpace: "pre",
  },
  "& pre code": { bg: "transparent", p: 0, fontSize: "inherit" },
  "& hr": { borderColor: "border.emphasized", marginY: 3 },
  "& table": { borderCollapse: "collapse", display: "block", overflowX: "auto", maxW: "full" },
  "& th, & td": { borderWidth: "1px", borderColor: "border.emphasized", px: 2, py: 1, textAlign: "start" },
  "& th": { fontWeight: "semibold", bg: "bg.subtle" },
  "& img": { maxW: "full", maxH: "320px", borderRadius: "md" },
  "& del": { color: "fg.muted" },
};

const components: Components = {
  a: ({ node: _node, href, children }) => (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      color="brand.fg"
      textDecoration="underline"
      textUnderlineOffset="2px"
      wordBreak="break-all"
    >
      {children}
    </Link>
  ),
  img: ({ node: _node, src, alt }) => (
    <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" referrerPolicy="no-referrer" />
  ),
};

// Renders a comment's text as GitHub flavoured markdown
export function CommentMarkdown({ text }: { text: string }) {
  return (
    <Box css={markdownCss}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </Box>
  );
}
