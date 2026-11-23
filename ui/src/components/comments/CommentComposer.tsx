import { Box, Button, Flex, HStack, IconButton, Spinner, Text } from "@chakra-ui/react";
import { createContext, useContext, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuImageOff, LuImagePlus, LuRotateCw, LuSendHorizontal, LuX } from "react-icons/lu";
import { Extension, Node as TiptapNode, mergeAttributes } from "@tiptap/core";
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor, type NodeViewProps } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text_ from "@tiptap/extension-text";
import HardBreak from "@tiptap/extension-hard-break";
import History from "@tiptap/extension-history";
import Placeholder from "@tiptap/extension-placeholder";
import { Fragment, Slice, type Node as PMNode } from "@tiptap/pm/model";
import { Plugin, TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { gapCursor } from "@tiptap/pm/gapcursor";
import { dropCursor } from "@tiptap/pm/dropcursor";
import { attachmentToken, attachmentTokenPattern } from "@/components/comments/attachmentTokens";
import { CommentAttachment, useCommentAttachmentImage } from "@/services/TestPlanService";
import { EmojiPickerButton } from "@/components/comments/EmojiPickerButton";
import {
  ACCEPTED_IMAGE_TYPES,
  useAttachmentUploads,
  type AttachmentUploads,
  type PendingAttachment,
} from "@/components/comments/useAttachmentUploads";

const IMAGE_NODE = "commentImage";

type UploadsContextValue = Pick<AttachmentUploads, "items" | "retry"> & { testPlanId: number };

const UploadsContext = createContext<UploadsContextValue | null>(null);

function ImageNodeView({ node, selected, deleteNode }: NodeViewProps) {
  const { t } = useTranslation();
  const uploads = useContext(UploadsContext);
  // Screenshots already saved on the comment being edited are loaded from the server
  const attachmentId: string | undefined = node.attrs.attachmentId ?? undefined;
  const saved = useCommentAttachmentImage(uploads?.testPlanId ?? 0, attachmentId);
  const item = uploads?.items.find((i) => i.localId === node.attrs.localId);
  const status = attachmentId
    ? saved.isError
      ? "missing"
      : saved.src
        ? "done"
        : "uploading"
    : (item?.status ?? "missing");
  const src = attachmentId ? saved.src : node.attrs.src;

  return (
    <NodeViewWrapper data-drag-handle>
      <Box
        position="relative"
        display="inline-block"
        borderRadius="lg"
        overflow="hidden"
        borderWidth="1px"
        borderColor={status === "error" ? "red.solid" : "border.subtle"}
        outline={selected ? "2px solid" : "none"}
        outlineColor="brand.solid"
        outlineOffset="1px"
        cursor="grab"
        title={node.attrs.name}
      >
        {status === "missing" ? (
          <Flex w="160px" h="100px" align="center" justify="center" direction="column" gap={1} color="fg.muted">
            <LuImageOff />
            <Text fontSize="xs">{t("test_plans.comments.image_removed", "Image removed")}</Text>
          </Flex>
        ) : !src ? (
          // A saved screenshot that is still being fetched
          <Box w="160px" h="100px" bg="bg.muted" />
        ) : (
          <img
            src={src}
            alt={node.attrs.name}
            draggable={false}
            style={{ display: "block", maxHeight: 180, maxWidth: 280, objectFit: "cover" }}
          />
        )}
        {(status === "uploading" || status === "error") && (
          <Flex position="absolute" inset={0} align="center" justify="center" bg="blackAlpha.500">
            {status === "uploading" ? (
              <Spinner size="sm" color="white" />
            ) : (
              <IconButton
                size="2xs"
                variant="solid"
                colorPalette="red"
                borderRadius="full"
                aria-label={t("test_plans.comments.retry_upload", "Retry upload")}
                onClick={() => item && uploads?.retry(item.localId)}
              >
                <LuRotateCw />
              </IconButton>
            )}
          </Flex>
        )}
        <IconButton
          position="absolute"
          top={1}
          right={1}
          size="2xs"
          minW={5}
          h={5}
          variant="solid"
          colorPalette="gray"
          borderRadius="full"
          aria-label={t("test_plans.comments.remove_attachment", "Remove image")}
          onClick={deleteNode}
        >
          <LuX />
        </IconButton>
      </Box>
    </NodeViewWrapper>
  );
}

// A screenshot placed between paragraphs of the message
const CommentImage = TiptapNode.create({
  name: IMAGE_NODE,
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      localId: { default: null },
      // Set for a screenshot that was already posted, instead of localId
      attachmentId: { default: null },
      src: { default: null },
      name: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "comment-image" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["comment-image", mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView, { className: "comment-image-node" });
  },
});

function collectImageIds(doc: PMNode) {
  const ids = new Set<string>();
  doc.descendants((node) => {
    if (node.type.name === IMAGE_NODE && node.attrs.localId) ids.add(node.attrs.localId);
  });
  return ids;
}

// The saved attachment behind an image node: one posted earlier, or one uploaded in this session
function imageAttachment(node: PMNode, items: PendingAttachment[]) {
  if (node.attrs.attachmentId) return { id: node.attrs.attachmentId as string, name: node.attrs.name as string };
  const item = items.find((i) => i.localId === node.attrs.localId);
  return item?.attachment?.id ? { id: item.attachment.id, name: item.file.name } : null;
}

function collectAttachmentIds(doc: PMNode, items: PendingAttachment[]) {
  const ids: string[] = [];
  doc.forEach((node) => {
    if (node.type.name !== IMAGE_NODE) return;
    const id = imageAttachment(node, items)?.id;
    if (id && !ids.includes(id)) ids.push(id);
  });
  return ids;
}

function hasSavedImages(doc: PMNode) {
  let found = false;
  doc.forEach((node) => {
    if (node.type.name === IMAGE_NODE && node.attrs.attachmentId) found = true;
  });
  return found;
}

type JSONNode = { type: string; attrs?: Record<string, unknown>; content?: JSONNode[]; text?: string };

// Turns stored comment text back into editor content, so a posted comment can be edited.
// Each line becomes a paragraph and each attachment token becomes an image.
function deserialize(content: string, attachments: CommentAttachment[]): JSONNode {
  const byId = new Map(attachments.filter((a) => a.id).map((a) => [a.id!, a]));
  const placed = new Set<string>();
  const nodes: JSONNode[] = [];
  const paragraph = (text: string): JSONNode =>
    text ? { type: "paragraph", content: [{ type: "text", text }] } : { type: "paragraph" };
  const image = (a: CommentAttachment): JSONNode => ({
    type: IMAGE_NODE,
    attrs: { attachmentId: a.id, name: a.file_name || "screenshot" },
  });

  for (const line of content.split("\n")) {
    let lastIndex = 0;
    let hadToken = false;
    for (const match of line.matchAll(attachmentTokenPattern())) {
      hadToken = true;
      const before = line.slice(lastIndex, match.index);
      if (before.trim()) nodes.push(paragraph(before));
      lastIndex = (match.index ?? 0) + match[0].length;
      const attachment = byId.get(match[2]);
      if (attachment && !placed.has(match[2])) {
        placed.add(match[2]);
        nodes.push(image(attachment));
      }
    }
    const rest = line.slice(lastIndex);
    if (!hadToken || rest.trim()) nodes.push(paragraph(rest));
  }
  // Attachments the text doesn't reference (e.g. older comments) are shown at the end
  for (const [id, attachment] of byId) if (!placed.has(id)) nodes.push(image(attachment));
  if (nodes.length === 0 || nodes[nodes.length - 1].type === IMAGE_NODE) nodes.push(paragraph(""));
  return { type: "doc", content: nodes };
}

// Turns the editor content into the stored comment format: plain text lines with attachment tokens
function serialize(doc: PMNode, items: PendingAttachment[]) {
  const blocks: string[] = [];
  doc.forEach((node) => {
    if (node.type.name === IMAGE_NODE) {
      const attachment = imageAttachment(node, items);
      if (attachment) blocks.push(attachmentToken(attachment.name || "screenshot", attachment.id));
      return;
    }
    let text = "";
    node.forEach((child) => {
      text += child.type.name === "hardBreak" ? "\n" : (child.text ?? "");
    });
    blocks.push(text);
  });
  return blocks.join("\n").replace(/^\s*\n/, "").replace(/\s+$/, "");
}

export function CommentComposer({
  testPlanId,
  placeholder,
  onSubmit,
  isSubmitting,
  autoFocus,
  onCancel,
  compact = false,
  initialContent,
  initialAttachments,
}: {
  testPlanId: number;
  placeholder: string;
  // Returns true when the comment was posted, which clears the composer
  onSubmit: (content: string, attachmentIds: string[]) => Promise<boolean>;
  isSubmitting: boolean;
  autoFocus?: boolean;
  onCancel?: () => void;
  compact?: boolean;
  // Prefills the composer with a posted comment, for editing it
  initialContent?: string;
  initialAttachments?: CommentAttachment[];
}) {
  const { t } = useTranslation();
  const uploads = useAttachmentUploads(testPlanId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = initialContent !== undefined;
  const [initialDoc] = useState(() =>
    isEditing ? deserialize(initialContent, initialAttachments ?? []) : undefined
  );
  const [hasText, setHasText] = useState(
    () => !!initialContent && initialContent.replace(attachmentTokenPattern(), "").trim().length > 0
  );
  const [hasSaved, setHasSaved] = useState(() => (initialAttachments?.length ?? 0) > 0);
  const [isDragging, setIsDragging] = useState(false);

  // The editor is created once, so its handlers reach the latest values through refs
  const uploadsRef = useRef(uploads);
  uploadsRef.current = uploads;
  const submitRef = useRef<() => void>(() => {});
  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;

  const insertImages = (view: EditorView, files: File[], pos?: number) => {
    const added = uploadsRef.current.addFiles(files);
    if (added.length === 0) return;
    const type = view.state.schema.nodes[IMAGE_NODE];
    const nodes = added.map((item) =>
      type.create({ localId: item.localId, src: item.previewUrl, name: item.file.name })
    );
    let tr = view.state.tr;
    if (pos !== undefined) tr = tr.setSelection(TextSelection.near(tr.doc.resolve(pos)));
    tr = tr.replaceSelection(new Slice(Fragment.from(nodes), 0, 0));

    // Put the cursor on the line after the last image, otherwise the image stays selected
    // and the next key press would replace it
    const lastId = added[added.length - 1].localId;
    let after = -1;
    tr.doc.descendants((node, nodePos) => {
      if (node.type.name === IMAGE_NODE && node.attrs.localId === lastId) after = nodePos + node.nodeSize;
    });
    if (after >= 0) {
      if (!tr.doc.nodeAt(after)?.isTextblock) tr = tr.insert(after, view.state.schema.nodes.paragraph.create());
      tr = tr.setSelection(TextSelection.create(tr.doc, after + 1));
    }
    view.dispatch(tr.scrollIntoView());
    view.focus();
  };

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text_,
      HardBreak,
      History,
      Placeholder.configure({ placeholder }),
      CommentImage,
      Extension.create({
        name: "commentComposer",
        addKeyboardShortcuts() {
          return {
            "Mod-Enter": () => {
              submitRef.current();
              return true;
            },
            Escape: () => {
              if (!cancelRef.current) return false;
              cancelRef.current();
              return true;
            },
          };
        },
        addProseMirrorPlugins() {
          return [
            gapCursor(),
            dropCursor({ color: "var(--chakra-colors-brand-solid)", width: 2 }),
            // Always keep a paragraph after a trailing image so there is somewhere to keep typing
            new Plugin({
              appendTransaction: (_transactions, _oldState, state) => {
                if (state.doc.lastChild?.type.name !== IMAGE_NODE) return null;
                return state.tr.insert(state.doc.content.size, state.schema.nodes.paragraph.create());
              },
            }),
          ];
        },
      }),
    ],
    content: initialDoc,
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      handlePaste: (view, event) => {
        const images = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (images.length === 0) return false;
        insertImages(view, images);
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (moved || files.length === 0) return false;
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        insertImages(view, files, pos);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      setHasText(editor.state.doc.textContent.trim().length > 0);
      setHasSaved(hasSavedImages(editor.state.doc));
      uploadsRef.current.retain(collectImageIds(editor.state.doc));
    },
  });

  const hasImages = hasSaved || uploads.items.some((item) => item.status === "done");
  const canSubmit = (hasText || hasImages) && !uploads.isUploading && !uploads.hasErrors && !isSubmitting;

  const submit = async () => {
    if (!editor || !canSubmit) return;
    const items = uploadsRef.current.itemsRef.current;
    const content = serialize(editor.state.doc, items);
    // Every screenshot still in the message, so an edit keeps the ones left in and drops the rest
    const attachmentIds = collectAttachmentIds(editor.state.doc, items);
    if (await onSubmit(content, attachmentIds)) {
      if (!isEditing) editor.commands.clearContent(true);
      uploads.reset();
    }
  };
  submitRef.current = submit;

  return (
    <Box
      flex="1"
      minW={0}
      borderWidth="1px"
      borderColor={isDragging ? "colorPalette.solid" : "border.subtle"}
      borderStyle={isDragging ? "dashed" : "solid"}
      borderRadius="xl"
      bg={isDragging ? "colorPalette.subtle" : "bg.panel"}
      _focusWithin={{ borderColor: "colorPalette.solid", boxShadow: "0 0 0 1px var(--chakra-colors-color-palette-solid)" }}
      colorPalette="brand"
      overflow="hidden"
      onDragOver={(e) => e.dataTransfer.types.includes("Files") && setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={() => setIsDragging(false)}
      css={{
        "& .ProseMirror": {
          outline: "none",
          minHeight: compact ? "1.5em" : "3em",
          maxHeight: "320px",
          overflowY: "auto",
          px: 3,
          pt: 2,
          pb: 1,
          fontSize: compact ? "sm" : "md",
          lineHeight: "1.5",
        },
        "& .ProseMirror p": { margin: 0 },
        "& .ProseMirror p.is-editor-empty:first-of-type::before": {
          content: "attr(data-placeholder)",
          float: "left",
          height: 0,
          pointerEvents: "none",
          color: "fg.subtle",
        },
        // Images sit side by side when placed one after another
        "& .comment-image-node": { display: "inline-block", verticalAlign: "top", marginRight: 2, marginY: 1 },
      }}
    >
      <UploadsContext.Provider value={{ items: uploads.items, retry: uploads.retry, testPlanId }}>
        <EditorContent editor={editor} />
      </UploadsContext.Provider>
      <Flex justify="space-between" align="center" px={2} pb={2} gap={2}>
        <HStack gap={1} minW={0}>
          <IconButton
            size="xs"
            variant="ghost"
            color="fg.muted"
            borderRadius="full"
            aria-label={t("test_plans.comments.attach_screenshot", "Attach screenshot")}
            title={t("test_plans.comments.attach_screenshot", "Attach screenshot")}
            onClick={() => fileInputRef.current?.click()}
          >
            <LuImagePlus />
          </IconButton>
          <EmojiPickerButton
            onSelect={(emoji) => editor?.chain().focus().insertContent(emoji).run()}
            onPicked={() => editor?.commands.focus()}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            multiple
            hidden
            onChange={(e) => {
              if (editor) insertImages(editor.view, Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          <Text fontSize="xs" color="fg.subtle" truncate>
            {t("test_plans.comments.send_hint_with_attachments", "Markdown supported · Paste or drop screenshots · Ctrl + Enter to send")}
          </Text>
        </HStack>
        <HStack gap={1} flexShrink={0}>
          {onCancel && (
            <Button size="xs" variant="ghost" onClick={onCancel}>
              {t("test_plans.comments.cancel", "Cancel")}
            </Button>
          )}
          <IconButton
            size="xs"
            colorPalette="brand"
            borderRadius="full"
            aria-label={t("test_plans.comments.send", "Send")}
            onClick={submit}
            loading={isSubmitting}
            disabled={!canSubmit}
          >
            <LuSendHorizontal />
          </IconButton>
        </HStack>
      </Flex>
    </Box>
  );
}
