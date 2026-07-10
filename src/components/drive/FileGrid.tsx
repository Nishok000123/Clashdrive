import type { DriveFile } from "../../types";
import { formatBytes } from "../../lib/manifest";
import { FileIcon } from "./FileIcon";

interface FileGridProps {
  files: DriveFile[];
  loading: boolean;
  onDownload: (file: DriveFile) => void;
  onPreview: (file: DriveFile) => void;
  onRename?: (file: DriveFile) => void;
  onDelete?: (file: DriveFile) => void;
  selectedFileIds?: Set<number>;
  onToggleSelect?: (fileId: number) => void;
  onToggleSelectAll?: () => void;
}

function getFileStrip(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "file-strip-image";
  if (["mp4", "webm", "ogg", "mov", "mkv", "avi"].includes(ext)) return "file-strip-video";
  if (["mp3", "wav", "m4a", "flac", "ogg", "aac"].includes(ext)) return "file-strip-audio";
  if (["pdf", "doc", "docx", "txt", "md", "json", "csv", "xlsx", "xls"].includes(ext)) return "file-strip-document";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "file-strip-archive";
  if (["js", "ts", "py", "rs", "go", "java", "html", "css", "xml"].includes(ext)) return "file-strip-code";
  return "file-strip-other";
}

export function FileGrid({
  files,
  loading,
  onDownload,
  onPreview,
  onRename,
  onDelete,
  selectedFileIds = new Set(),
  onToggleSelect,
  onToggleSelectAll,
}: FileGridProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="glass rounded-2xl p-4 flex items-center gap-4 animate-pulse border border-surface-300/20 dark:border-surface-300/5"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="w-5 h-5 rounded bg-surface-300 dark:bg-surface-300/20" />
            <div className="w-10 h-10 rounded-xl bg-surface-300 dark:bg-surface-300/20" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-300 dark:bg-surface-300/20 rounded w-1/3" />
              <div className="h-3 bg-surface-300 dark:bg-surface-300/20 rounded w-1/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 animate-fade-in text-center select-none">
        <div className="w-20 h-20 mb-5 rounded-3xl bg-surface-200/40 dark:bg-surface-200/10 flex items-center justify-center text-surface-500 border border-surface-300/30 dark:border-surface-300/5">
          <svg className="w-10 h-10 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-surface-900 font-bold mb-1 text-sm">No files in this folder</p>
        <p className="text-surface-550 text-xs max-w-[260px] leading-relaxed">
          Drag & drop files anywhere on the screen to upload instantly to this folder.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 select-none">
      {/* Table Headers */}
      <div className="flex items-center gap-3 sm:gap-4 px-4 py-2 text-[10px] uppercase tracking-widest text-surface-500 font-extrabold select-none">
        <div className="w-5 sm:w-6 flex items-center justify-center shrink-0">
          <input
            type="checkbox"
            checked={files.length > 0 && files.every((f) => selectedFileIds.has(f.id))}
            onChange={() => onToggleSelectAll?.()}
            className="w-4 h-4 rounded border-surface-350 dark:border-surface-300/20 text-brand-500 focus:ring-brand-400/35 bg-surface-150 dark:bg-surface-300/20 cursor-pointer accent-brand-500 shadow-sm"
          />
        </div>
        <div className="w-10 shrink-0" />
        <div className="flex-1">Name</div>
        <div className="w-24 text-right hidden sm:block">Size</div>
        <div className="w-28 text-right hidden md:block">Date</div>
        <div className="w-24 sm:w-32 shrink-0" />
      </div>

      {/* Table Rows */}
      {files.map((file, idx) => (
        <div
          key={file.id}
          className={`glass rounded-2xl px-4 py-3 flex items-center gap-3 sm:gap-4 border transition-all duration-200 group cursor-pointer animate-slide-up ${getFileStrip(file.name)} ${
            selectedFileIds.has(file.id)
              ? "border-brand-500/40 bg-brand-500/5 dark:bg-brand-500/10 shadow-sm"
              : "border-surface-300/40 dark:border-surface-300/10 hover:border-brand-500/20 dark:hover:border-brand-500/30 hover:bg-surface-100/50 dark:hover:bg-surface-200/20"
          }`}
          style={{ animationDelay: `${Math.min(idx * 20, 300)}ms` }}
          onClick={() => onPreview(file)}
        >
          <div 
            className="w-5 sm:w-6 flex items-center justify-center shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={selectedFileIds.has(file.id)}
              onChange={() => onToggleSelect?.(file.id)}
              className="w-4 h-4 rounded border-surface-300 dark:border-surface-400/20 text-brand-500 focus:ring-brand-500/15 bg-surface-200 dark:bg-surface-300/20 cursor-pointer accent-brand-500 transition-all shadow-sm"
            />
          </div>

          {/* Icon frame */}
          <div className="w-10 h-10 rounded-xl bg-surface-200/50 dark:bg-surface-300/5 flex items-center justify-center shrink-0 shadow-inner border border-surface-300/10 group-hover:scale-105 transition-transform duration-200">
            <FileIcon fileName={file.name} className="w-5 h-5 filter drop-shadow-sm" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-surface-900 truncate group-hover:text-brand-500 transition-colors duration-200">
              {file.name}
            </p>
            <p className="text-[10px] text-surface-500 sm:hidden mt-1 font-bold">
              {formatBytes(file.size)}
            </p>
          </div>

          <div className="w-24 text-right text-xs text-surface-700 dark:text-surface-600 font-bold hidden sm:block font-mono tabular-nums">
            {formatBytes(file.size)}
          </div>

          <div className="w-28 text-right text-xs text-surface-500 font-bold hidden md:block">
            {new Date(file.date * 1000).toLocaleDateString()}
          </div>

          {/* Interactive action links */}
          <div className="w-24 sm:w-32 flex justify-end gap-1 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview(file);
              }}
              className="p-1.5 rounded-xl hover:bg-brand-500/10 text-surface-500 hover:text-brand-500 transition-all cursor-pointer"
              title="Preview"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(file);
              }}
              className="p-1.5 rounded-xl hover:bg-brand-500/10 text-surface-500 hover:text-brand-500 transition-all cursor-pointer"
              title="Download"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            {onRename && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRename(file);
                }}
                className="p-1.5 rounded-xl hover:bg-brand-500/10 text-surface-500 hover:text-brand-500 transition-all cursor-pointer"
                title="Rename"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(file);
                }}
                className="p-1.5 rounded-xl hover:bg-danger/10 text-surface-500 hover:text-danger transition-all cursor-pointer"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
