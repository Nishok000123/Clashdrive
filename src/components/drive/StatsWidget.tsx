import { formatBytes } from "../../lib/manifest";
import type { DriveFile } from "../../types";

interface StatsWidgetProps {
  files: DriveFile[];
  indexing: boolean;
  indexingProgress: { current: number; total: number };
}

export function StatsWidget({ files, indexing, indexingProgress }: StatsWidgetProps) {
  const totalFiles = files.length;
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  let imagesSize = 0;
  let videosSize = 0;
  let audioSize = 0;
  let docsSize = 0;
  let otherSize = 0;

  files.forEach((f) => {
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
      imagesSize += f.size;
    } else if (["mp4", "webm", "ogg", "mov"].includes(ext)) {
      videosSize += f.size;
    } else if (["mp3", "wav", "m4a", "flac", "ogg"].includes(ext)) {
      audioSize += f.size;
    } else if (["pdf", "docx", "xlsx", "xls", "csv", "txt", "md", "json", "zip", "rar"].includes(ext)) {
      docsSize += f.size;
    } else {
      otherSize += f.size;
    }
  });

  const getPercent = (size: number) => {
    if (totalSize === 0) return 0;
    return (size / totalSize) * 100;
  };

  return (
    <div className="space-y-4.5 px-4 py-4.5 bg-surface-150/40 dark:bg-surface-200/10 rounded-3xl border border-surface-300/40 dark:border-surface-300/10 glass select-none">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-surface-800 tracking-tight">Storage Usage</span>
        {indexing ? (
          <span className="text-[10px] text-accent-450 dark:text-accent-400 animate-pulse flex items-center gap-1 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-ping shrink-0" />
            Indexing ({indexingProgress.current}/{indexingProgress.total})
          </span>
        ) : (
          <span className="text-[10px] text-surface-500 font-bold font-mono">{totalFiles} files</span>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-xl font-black text-surface-900 tracking-tight leading-none">
          {formatBytes(totalSize)}
        </div>
        <div className="text-[10px] text-surface-500 font-bold uppercase tracking-wider">Telegram Cloud Vault</div>
      </div>

      {/* Storage Segment Bar */}
      <div className="h-2.5 w-full rounded-full bg-surface-250 dark:bg-surface-300/25 flex overflow-hidden shadow-inner border border-surface-300/10 dark:border-surface-300/5">
        <div
          style={{ width: `${getPercent(imagesSize)}%` }}
          className="bg-brand-500 transition-all duration-500 shadow-sm shadow-brand-500/20"
          title={`Images: ${formatBytes(imagesSize)}`}
        />
        <div
          style={{ width: `${getPercent(videosSize)}%` }}
          className="bg-accent-500 transition-all duration-500 shadow-sm shadow-accent-500/20"
          title={`Videos: ${formatBytes(videosSize)}`}
        />
        <div
          style={{ width: `${getPercent(audioSize)}%` }}
          className="bg-success transition-all duration-500 shadow-sm shadow-success/20"
          title={`Audio: ${formatBytes(audioSize)}`}
        />
        <div
          style={{ width: `${getPercent(docsSize)}%` }}
          className="bg-warning transition-all duration-500 shadow-sm shadow-warning/20"
          title={`Documents: ${formatBytes(docsSize)}`}
        />
        <div
          style={{ width: `${getPercent(otherSize)}%` }}
          className="bg-surface-500 dark:bg-surface-450 transition-all duration-500 shadow-sm"
          title={`Other: ${formatBytes(otherSize)}`}
        />
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] text-surface-600 font-bold select-none pt-1 border-t border-surface-300/10 dark:border-surface-300/5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-brand-500 block shrink-0 shadow-sm shadow-brand-500/10" />
          <span className="truncate">Images ({formatBytes(imagesSize)})</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-accent-500 block shrink-0 shadow-sm shadow-accent-500/10" />
          <span className="truncate">Videos ({formatBytes(videosSize)})</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-success block shrink-0 shadow-sm shadow-success/10" />
          <span className="truncate">Audio ({formatBytes(audioSize)})</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-warning block shrink-0 shadow-sm shadow-warning/10" />
          <span className="truncate">Docs ({formatBytes(docsSize)})</span>
        </div>
      </div>
    </div>
  );
}
