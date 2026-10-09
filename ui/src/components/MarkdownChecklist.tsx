import { createContext, useContext, useMemo, type ComponentProps } from "react";
import { Box, Button, Flex, Text } from "@chakra-ui/react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "next-themes";
import "@uiw/react-markdown-preview/markdown.css";
import { TASK_LINE, type ChecklistState } from "@/lib/markdown-checklist";

type ChecklistContextValue = {
  checked: ChecklistState;
  toggle?: (line: number, value: boolean) => void;
};

const ChecklistContext = createContext<ChecklistContextValue>({ checked: {} });
const TaskLineContext = createContext<number | null>(null);

function TaskCheckbox({
  defaultChecked,
}: {
  defaultChecked: boolean;
}) {
  const line = useContext(TaskLineContext);
  const { checked, toggle } = useContext(ChecklistContext);
  const isChecked = line !== null ? (checked[line] ?? defaultChecked) : defaultChecked;
  const interactive = !!toggle && line !== null;

  return (
    <input
      type="checkbox"
      checked={isChecked}
      disabled={!interactive}
      onChange={(e) => interactive && toggle(line, e.target.checked)}
      className="task-list-item-checkbox"
      style={{ cursor: interactive ? "pointer" : "default" }}
    />
  );
}

const components: Components = {
  li: ({ node, children, ...props }) => (
    <li {...props}>
      <TaskLineContext.Provider value={node?.position?.start.line ?? null}>
        {children}
      </TaskLineContext.Provider>
    </li>
  ),
  input: ({ node: _node, ...props }: ComponentProps<"input"> & { node?: unknown }) =>
    props.type === "checkbox" ? (
      <TaskCheckbox defaultChecked={!!props.checked} />
    ) : (
      <input {...props} />
    ),
};

// GitHub's markdown CSS (.wmde-markdown) relies on browser-default list bullets,
// which Chakra's CSS reset removes, so restore them here
const markdownCss = {
  "& .wmde-markdown": { background: "transparent !important" },
  "& ul": { listStyleType: "disc" },
  "& ul ul": { listStyleType: "circle" },
  "& ul ul ul": { listStyleType: "square" },
  "& ol": { listStyleType: "decimal" },
};

type MarkdownChecklistProps = {
  markdown: string;
  /** When provided, checkboxes become clickable and their state is reported here */
  checked?: ChecklistState;
  onToggle?: (line: number, value: boolean) => void;
  onReset?: () => void;
  /** Noun used in the progress counter, e.g. "3 of 5 steps checked" */
  itemLabel?: string;
};

/**
 * Renders markdown (GFM) and turns task list items ("- [ ] step") into
 * checkboxes a tester can tick while executing a test case.
 */
export function MarkdownChecklist({
  markdown,
  checked = {},
  onToggle,
  onReset,
  itemLabel = "steps",
}: MarkdownChecklistProps) {
  const { resolvedTheme } = useTheme();
  const ctx = useMemo(() => ({ checked, toggle: onToggle }), [checked, onToggle]);

  const taskLines = useMemo(
    () =>
      markdown
        .split("\n")
        .map((l, i) => (TASK_LINE.test(l) ? i + 1 : null))
        .filter((l): l is number => l !== null),
    [markdown],
  );
  const total = taskLines.length;
  const done = taskLines.filter((line) => {
    const fromSource = /\[[xX]\]/.test(markdown.split("\n")[line - 1]);
    return checked[line] ?? fromSource;
  }).length;

  return (
    <Box>
      {onToggle && total > 0 && (
        <Flex align="center" gap={3} mb={2}>
          <Text fontSize="sm" color="fg.muted">
            {done} of {total} {itemLabel} checked
          </Text>
          {onReset && Object.keys(checked).length > 0 && (
            <Button size="xs" variant="ghost" onClick={onReset}>
              Reset
            </Button>
          )}
        </Flex>
      )}
      <Box
        css={markdownCss}
        data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}
      >
        <div className="wmde-markdown">
          <ChecklistContext.Provider value={ctx}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {markdown}
            </ReactMarkdown>
          </ChecklistContext.Provider>
        </div>
      </Box>
    </Box>
  );
}
