import type { ChunkManifest } from "../types";

export function isChunkOrThumbFileName(fileName?: string): boolean {
  if (!fileName) return false;
  const name = fileName.toLowerCase();
  if (/\.part\d+$/i.test(name)) return true;
  if (/\.thumb\.(jpg|jpeg|png|webp|gif)$/i.test(name)) return true;
  return false;
}

/**
 * Try to parse a message as a file manifest.
 * Returns null if the message text isn't a valid segmented_file JSON payload.
 */
export function parseManifest(text: string): ChunkManifest | null {
  try {
    const data = JSON.parse(text);
    if (
      data &&
      data.type === "segmented_file" &&
      typeof data.fileName === "string" &&
      data.fileName.length > 0 &&
      data.fileName.length <= 255 &&
      !isChunkOrThumbFileName(data.fileName) &&
      typeof data.fileSize === "number" &&
      data.fileSize >= 0 &&
      data.fileSize <= 1024 * 1024 * 1024 * 50 && // 50 GB max
      Array.isArray(data.chunks) &&
      data.chunks.length > 0 &&
      data.chunks.every((id: unknown) => typeof id === "number" && id > 0)
    ) {
      const manifest: ChunkManifest = {
        type: "segmented_file",
        fileName: data.fileName,
        fileSize: data.fileSize,
        chunks: data.chunks,
        ...(typeof data.chunkSize === "number" && data.chunkSize > 0 ? { chunkSize: data.chunkSize } : {}),
        ...(typeof data.thumb === "number" ? { thumb: data.thumb } : {}),
      };
      return manifest;
    }
  } catch {
    // Not JSON — regular message or a raw chunk, skip it
  }
  return null;
}

/**
 * Build the JSON string that gets sent as the final manifest message.
 */
export function buildManifest(
  fileName: string,
  fileSize: number,
  chunkMsgIds: number[],
  thumbMsgId?: number,
  chunkSize?: number
): string {
  const manifest: ChunkManifest = {
    type: "segmented_file",
    fileName,
    fileSize,
    chunks: chunkMsgIds,
    ...(chunkSize !== undefined ? { chunkSize } : {}),
    ...(thumbMsgId !== undefined ? { thumb: thumbMsgId } : {}),
  };
  return JSON.stringify(manifest);
}

export function getFileChunkSize(manifest: ChunkManifest): number {
  if (manifest.chunkSize && manifest.chunkSize > 0) {
    return manifest.chunkSize;
  }
  // All legacy files uploaded prior to dynamic chunking used fixed 50 MB (52,428,800 bytes) chunks
  return 50 * 1024 * 1024;
}



/**
 * Format bytes into a human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0 || !isFinite(bytes)) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Guess a file's icon based on its extension.
 */
export function getFileIcon(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    // Images
    png: "🖼️",
    jpg: "🖼️",
    jpeg: "🖼️",
    gif: "🖼️",
    webp: "🖼️",
    svg: "🖼️",
    // Video
    mp4: "🎬",
    mkv: "🎬",
    avi: "🎬",
    mov: "🎬",
    webm: "🎬",
    // Audio
    mp3: "🎵",
    wav: "🎵",
    flac: "🎵",
    ogg: "🎵",
    aac: "🎵",
    // Documents
    pdf: "📕",
    doc: "📝",
    docx: "📝",
    txt: "📄",
    md: "📄",
    // Archives
    zip: "📦",
    rar: "📦",
    "7z": "📦",
    tar: "📦",
    gz: "📦",
    // Code
    js: "💻",
    ts: "💻",
    py: "💻",
    rs: "💻",
    go: "💻",
    java: "💻",
    // Data
    json: "📊",
    csv: "📊",
    xlsx: "📊",
    // Executables
    exe: "⚙️",
    msi: "⚙️",
    apk: "📱",
    iso: "💿",
  };
  return map[ext] || "📁";
}
