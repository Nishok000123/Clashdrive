import type { TopicFolder, DriveFile } from "../../types";
import { Button } from "../ui/Button";
import { StatsWidget } from "./StatsWidget";

function getFolderIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("video")) {
    return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 00-2 2z" />
      </svg>
    );
  }
  if (t.includes("audio") || t.includes("music")) {
    return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    );
  }
  if (t.includes("photo") || t.includes("image") || t.includes("pic")) {
    return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  if (t.includes("doc") || t.includes("text") || t.includes("pdf") || t.includes("file")) {
    return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

function getFolderColor(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("video")) return "#8b5cf6";
  if (t.includes("audio") || t.includes("music")) return "#06b6d4";
  if (t.includes("photo") || t.includes("image") || t.includes("pic")) return "#10b981";
  if (t.includes("doc") || t.includes("text") || t.includes("pdf") || t.includes("file")) return "#3b82f6";
  return "#f59e0b";
}

interface SidebarProps {
  className?: string;
  folders: TopicFolder[];
  activeFolderId: number | null;
  onFolderClick: (id: number) => void;
  onCreateFolder: () => void;
  onBackToRoot: () => void;
  allFiles: DriveFile[];
  indexing: boolean;
  indexingProgress: { current: number; total: number };
  onJoinUpdateChannel?: () => void | Promise<void>;
  joiningChannel?: boolean;
}

export function Sidebar({
  className = "",
  folders,
  activeFolderId,
  onFolderClick,
  onCreateFolder,
  onBackToRoot,
  allFiles,
  indexing,
  indexingProgress,
  onJoinUpdateChannel,
  joiningChannel = false,
}: SidebarProps) {
  return (
    <aside className={className || "w-64 shrink-0 hidden lg:flex flex-col border-r border-surface-300/40 dark:border-surface-300/10 bg-surface-100/30 h-[calc(100vh-4rem)] select-none"}>
      <div className="p-4">
        <Button onClick={onCreateFolder} className="w-full rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-brand-500/15" size="md">
          <svg
            className="w-4.5 h-4.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Folder
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        <button
          onClick={onBackToRoot}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-300 font-extrabold tracking-tight border ${
            activeFolderId === null
              ? "bg-brand-500/10 text-brand-500 border-brand-500/20 shadow-inner"
              : "text-surface-750 dark:text-surface-700 hover:bg-surface-200/50 dark:hover:bg-surface-300/10 border-transparent hover:border-surface-300/30"
          }`}
        >
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>My Drive</span>
        </button>

        <div className="pt-4.5 pb-2 px-4 select-none">
          <p className="text-[9px] uppercase tracking-widest text-surface-500 font-extrabold">
            Folders
          </p>
        </div>

        <div className="space-y-0.5 pr-0.5">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onFolderClick(folder.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-300 group font-extrabold tracking-tight border ${
                activeFolderId === folder.id
                  ? "bg-brand-500/10 text-brand-500 border-brand-500/20 shadow-inner"
                  : "text-surface-750 dark:text-surface-700 hover:bg-surface-200/50 dark:hover:bg-surface-300/10 border-transparent hover:border-surface-300/30"
              }`}
            >
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] shrink-0 font-extrabold"
                style={{
                  backgroundColor: `${getFolderColor(folder.title)}15`,
                  color: getFolderColor(folder.title),
                }}
              >
                {getFolderIcon(folder.title)}
              </div>
              <span className="truncate">{folder.title}</span>
            </button>
          ))}

          {folders.length === 0 && (
            <div className="px-4 py-8 text-center select-none">
              <p className="text-xs text-surface-500 font-semibold">No folders yet</p>
              <p className="text-[10px] text-surface-500/80 mt-1 max-w-[150px] mx-auto">
                Create a folder to organize storage.
              </p>
            </div>
          )}
        </div>

        {/* Removed old Community Nav Join section */}
      </nav>

      <div className="p-4 border-t border-surface-300/40 dark:border-surface-300/10 space-y-3 shrink-0">
        <StatsWidget
          files={allFiles}
          indexing={indexing}
          indexingProgress={indexingProgress}
        />

        {onJoinUpdateChannel && (
          <button
            onClick={onJoinUpdateChannel}
            disabled={joiningChannel}
            className={`w-full relative overflow-hidden flex items-center justify-between gap-2 px-3 py-3 rounded-2xl text-[11px] font-black transition-all duration-300 border border-brand-500/20 bg-brand-500/5 hover:bg-brand-500/10 dark:bg-brand-500/5 dark:hover:bg-brand-500/10 text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-350 cursor-pointer shadow-sm hover:shadow-brand-500/10 select-none group active:scale-[0.98] ${
              joiningChannel ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {/* Shimmer backdrop effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />

            <div className="flex items-center gap-2 min-w-0 shrink-0">
              {joiningChannel ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <svg
                  className="w-3.5 h-3.5 shrink-0 transform group-hover:rotate-12 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              )}
              <span className="shrink-0 tracking-tight font-extrabold">{joiningChannel ? "Joining..." : "Join Updates"}</span>
            </div>

            <span className="text-[9px] bg-brand-500/15 dark:bg-brand-500/25 px-1.5 py-0.5 rounded-lg border border-brand-500/20 font-mono tracking-tight shrink-0 font-extrabold group-hover:scale-105 transition-transform">
              @clashgramclient
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}
