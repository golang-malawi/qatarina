import { getApiEndpoint } from "@/common/request";

/**
 * Builds the absolute URL for a file served from /uploads.
 * Pass downloadName to have the server send it as a download with that name.
 */
export function getStoredFileUrl(storageUrl?: string, downloadName?: string) {
  if (!storageUrl) return "";
  if (storageUrl.startsWith("http://") || storageUrl.startsWith("https://")) {
    return storageUrl;
  }

  const apiEndpoint = getApiEndpoint().replace(/\/$/, "");
  const url = `${apiEndpoint}${storageUrl}`;
  return downloadName ? `${url}?download=${encodeURIComponent(downloadName)}` : url;
}

export function formatFileSize(bytes?: number) {
  if (!bytes || bytes <= 0) return "0 bytes";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let index = 0;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(1)} ${units[index]}`;
}
