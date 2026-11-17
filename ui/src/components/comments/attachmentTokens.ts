// Screenshots are stored inside comment text with a markdown style token, ![name](attachment:<id>),
// so they render at the position they were inserted rather than all at the end

const TOKEN_SOURCE = String.raw`!\[([^\]\n]*)\]\(attachment:([0-9a-fA-F-]{36})\)`;

export function attachmentTokenPattern() {
  return new RegExp(TOKEN_SOURCE, "g");
}

export function attachmentToken(name: string, id: string) {
  return `![${name.replace(/[[\]\n]/g, "")}](attachment:${id})`;
}

export function stripAttachmentTokens(text: string) {
  return text.replace(attachmentTokenPattern(), "").replace(/\n{3,}/g, "\n\n").trim();
}
