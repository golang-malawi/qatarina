import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
  Box,
  Button,
  Heading,
  Textarea,
  Text,
  Stack,
  Spinner,
  HStack,
  Tabs,
  IconButton,
} from "@chakra-ui/react";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useProjectTestCaseTemplateQuery,
  useAddProjectTestCaseTemplateMutation,
} from "@/services/ProjectService";
import { toaster } from "@/components/ui/toaster";
import { useTranslation } from "react-i18next";
import {
  LuHeading,
  LuBold,
  LuItalic,
  LuQuote,
  LuCode,
  LuLink,
  LuList,
  LuListOrdered,
  LuSquareCheck,
} from "react-icons/lu";

// Import CSS stylesheet for markdown preview styling
import "@uiw/react-markdown-preview/markdown.css";

// Lazy load Markdown preview component
const MDMarkdown = lazy(() => import("@uiw/react-markdown-preview"));

function TestCaseTemplatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectId } = useParams({
    from: "/(project)/projects/$projectId/settings/TestCaseTemplate",
  });
  const queryClient = useQueryClient();
  const projectID = Number(projectId);

  const { data, isLoading } = useProjectTestCaseTemplateQuery(projectID);
  const saveMutation = useAddProjectTestCaseTemplateMutation();
  const [template, setTemplate] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (data) {
      setTemplate(data.test_case_template ?? "");
    }
  }, [data]);

  // Markdown formatting toolbar handler
  const applyMarkdown = (
    action:
      | "heading"
      | "bold"
      | "italic"
      | "quote"
      | "code"
      | "link"
      | "list"
      | "ordered-list"
      | "task"
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const selectedText = val.substring(start, end);

    let replacement = "";
    let offsetStart = 0;
    let offsetEnd = 0;

    switch (action) {
      case "bold": {
        const text = selectedText || "bold text";
        replacement = `**${text}**`;
        offsetStart = 2;
        offsetEnd = 2 + text.length;
        break;
      }
      case "italic": {
        const text = selectedText || "italic text";
        replacement = `*${text}*`;
        offsetStart = 1;
        offsetEnd = 1 + text.length;
        break;
      }
      case "code": {
        if (selectedText.includes("\n")) {
          replacement = `\n\`\`\`\n${selectedText}\n\`\`\`\n`;
          offsetStart = 5;
          offsetEnd = 5 + selectedText.length;
        } else {
          const text = selectedText || "code";
          replacement = `\`${text}\``;
          offsetStart = 1;
          offsetEnd = 1 + text.length;
        }
        break;
      }
      case "link": {
        const text = selectedText || "link text";
        replacement = `[${text}](https://)`;
        offsetStart = 1;
        offsetEnd = 1 + text.length;
        break;
      }
      case "heading": {
        const lines = (selectedText || "Heading").split("\n");
        replacement = lines.map((line) => `### ${line}`).join("\n");
        offsetStart = 4;
        offsetEnd = replacement.length;
        break;
      }
      case "quote": {
        const lines = (selectedText || "quote text").split("\n");
        replacement = lines.map((line) => `> ${line}`).join("\n");
        offsetStart = 2;
        offsetEnd = replacement.length;
        break;
      }
      case "list": {
        const lines = (selectedText || "list item").split("\n");
        replacement = lines.map((line) => `- ${line}`).join("\n");
        offsetStart = 2;
        offsetEnd = replacement.length;
        break;
      }
      case "ordered-list": {
        const lines = (selectedText || "list item").split("\n");
        replacement = lines.map((line, idx) => `${idx + 1}. ${line}`).join("\n");
        offsetStart = 3;
        offsetEnd = replacement.length;
        break;
      }
      case "task": {
        const lines = (selectedText || "task item").split("\n");
        replacement = lines.map((line) => `- [ ] ${line}`).join("\n");
        offsetStart = 6;
        offsetEnd = replacement.length;
        break;
      }
    }

    const newValue = val.substring(0, start) + replacement + val.substring(end);
    setTemplate(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + offsetStart, start + offsetEnd);
    }, 0);
  };

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        params: { path: { projectID } },
        body: {
          project_id: projectID,
          test_case_template: template,
        },
      });
      toaster.create({
        title: t("projects.settings.template.saved"),
        description: t("projects.settings.template.saved_description"),
        type: "success",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["projectTemplate", projectID] });
      navigate({ to: `/projects/${projectId}/settings` });
    } catch (err: any) {
      toaster.create({
        title: t("projects.settings.template.error"),
        description: err.message,
        type: "error",
        duration: 4000,
      });
    }
  };

  const handleCancel = () => {
    navigate({ to: `/projects/${projectId}/settings` });
  };

  if (isLoading) {
    return (
      <Box p={10}>
        <Spinner size="lg" />
        <Text mt={4}>{t("projects.settings.template.loading")}</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Heading size="lg" mb={8}>
        {data?.test_case_template
          ? t("projects.settings.template.add_description_title")
          : t("projects.settings.template.add_title")}
      </Heading>

      <Stack gap={6}>
        <Box w="100%" borderWidth="1px" borderRadius="md" p={2} bg="bg.panel">
          <Tabs.Root defaultValue="write" variant="outline">
            <HStack justify="space-between" align="center" flexWrap="wrap" pb={2}>
              <Tabs.List>
                <Tabs.Trigger value="write">Write</Tabs.Trigger>
                <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
              </Tabs.List>

              {/* Formatting Toolbar */}
              <HStack gap={1} flexWrap="wrap">
                <IconButton
                  aria-label="Heading"
                  size="xs"
                  variant="ghost"
                  onClick={() => applyMarkdown("heading")}
                >
                  <LuHeading />
                </IconButton>
                <IconButton
                  aria-label="Bold"
                  size="xs"
                  variant="ghost"
                  onClick={() => applyMarkdown("bold")}
                >
                  <LuBold />
                </IconButton>
                <IconButton
                  aria-label="Italic"
                  size="xs"
                  variant="ghost"
                  onClick={() => applyMarkdown("italic")}
                >
                  <LuItalic />
                </IconButton>
                <IconButton
                  aria-label="Quote"
                  size="xs"
                  variant="ghost"
                  onClick={() => applyMarkdown("quote")}
                >
                  <LuQuote />
                </IconButton>
                <IconButton
                  aria-label="Code"
                  size="xs"
                  variant="ghost"
                  onClick={() => applyMarkdown("code")}
                >
                  <LuCode />
                </IconButton>
                <IconButton
                  aria-label="Link"
                  size="xs"
                  variant="ghost"
                  onClick={() => applyMarkdown("link")}
                >
                  <LuLink />
                </IconButton>
                <IconButton
                  aria-label="Unordered List"
                  size="xs"
                  variant="ghost"
                  onClick={() => applyMarkdown("list")}
                >
                  <LuList />
                </IconButton>
                <IconButton
                  aria-label="Ordered List"
                  size="xs"
                  variant="ghost"
                  onClick={() => applyMarkdown("ordered-list")}
                >
                  <LuListOrdered />
                </IconButton>
                <IconButton
                  aria-label="Task List"
                  size="xs"
                  variant="ghost"
                  onClick={() => applyMarkdown("task")}
                >
                  <LuSquareCheck />
                </IconButton>
              </HStack>
            </HStack>

            <Tabs.Content value="write" pt={1}>
              <Textarea
                ref={textareaRef}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder={t("projects.settings.template.placeholder")}
                minH="320px"
              />
            </Tabs.Content>

            <Tabs.Content value="preview" pt={1}>
              <Box
                p={3}
                minH="320px"
                data-color-mode="auto"
                css={{
                  "& .wmde-markdown": {
                    background: "transparent !important",
                    lineHeight: "1.4 !important",
                  },
                  "& .wmde-markdown p": {
                    marginTop: "0.2rem !important",
                    marginBottom: "0.2rem !important",
                    whiteSpace: "pre-wrap !important",
                  },
                  "& .wmde-markdown ol, & .wmde-markdown ul": {
                    listStyleType: "decimal !important",
                    paddingLeft: "1.5rem !important",
                    marginTop: "0.25rem !important",
                    marginBottom: "0.25rem !important",
                  },
                  "& .wmde-markdown ul": {
                    listStyleType: "disc !important",
                  },
                  "& .wmde-markdown ul.contains-task-list": {
                    listStyleType: "none !important",
                    paddingLeft: "0.75rem !important",
                    marginLeft: "0 !important",
                  },
                  "& .wmde-markdown li": {
                    display: "list-item !important",
                    marginTop: "0.1rem !important",
                    marginBottom: "0.1rem !important",
                    whiteSpace: "pre-wrap !important",
                  },
                  "& .wmde-markdown li.task-list-item": {
                    display: "block !important",
                    listStyleType: "none !important",
                  },
                  "& .wmde-markdown li.task-list-item input[type='checkbox']": {
                    marginRight: "0.5rem !important",
                    marginLeft: "0 !important",
                    verticalAlign: "middle !important",
                    position: "relative",
                    top: "-1px",
                  },
                  "& .wmde-markdown li > p": {
                    display: "inline !important",
                    marginTop: "0 !important",
                    marginBottom: "0 !important",
                  },
                  "& .wmde-markdown h1, & .wmde-markdown h2, & .wmde-markdown h3, & .wmde-markdown h4, & .wmde-markdown h5, & .wmde-markdown h6": {
                    marginTop: "0.5rem !important",
                    marginBottom: "0.25rem !important",
                    lineHeight: "1.2 !important",
                  },
                  "& .wmde-markdown blockquote": {
                    borderLeft: "4px solid var(--chakra-colors-border-muted, #ccc) !important",
                    paddingLeft: "1rem !important",
                    marginTop: "0.25rem !important",
                    marginBottom: "0.25rem !important",
                  },
                  "& .wmde-markdown em, & .wmde-markdown i": {
                    fontStyle: "italic !important",
                  },
                  "& .wmde-markdown strong, & .wmde-markdown b": {
                    fontWeight: "bold !important",
                  },
                }}
              >
                <Suspense fallback={<div>Loading preview...</div>}>
                  <MDMarkdown
                    className="wmde-markdown"
                    source={template || "*Nothing to preview*"}
                  />
                </Suspense>
              </Box>
            </Tabs.Content>
          </Tabs.Root>
        </Box>

        <Box>
          <Button
            type="button"
            colorScheme="blue"
            mr={4}
            onClick={handleSave}
            loading={saveMutation.isPending}
          >
            {t("projects.settings.template.save_button")}
          </Button>
          <Button type="button" variant="outline" onClick={handleCancel}>
            {t("projects.settings.template.cancel_button")}
          </Button>
        </Box>

        <Text color="gray.500">
          {t("projects.settings.template.helper")}
        </Text>
      </Stack>
    </Box>
  );
}

export const Route = createFileRoute(
  "/(project)/projects/$projectId/settings/TestCaseTemplate"
)({
  component: TestCaseTemplatePage,
});