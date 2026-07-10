import { useState, useRef, useEffect } from "react";
import type { DriveConfig, TopicFolder, DriveFile, UploadProgress, DownloadProgress, SavedAccount, UserProfile } from "../../types";
import type { Theme } from "../../hooks/useTheme";
import { Header } from "../layout/Header";
import { Sidebar } from "./Sidebar";
import { Breadcrumb } from "./Breadcrumb";
import { TopicList } from "./TopicList";
import { FileGrid } from "./FileGrid";
import { UploadZone } from "./UploadZone";
import { CreateFolderModal } from "./CreateFolderModal";
import { ProgressBar } from "../ui/ProgressBar";
import { formatBytes } from "../../lib/manifest";
import { FileIcon } from "./FileIcon";

interface DashboardProps {
  driveConfig: DriveConfig;
  topics: TopicFolder[];
  files: DriveFile[];
  loadingFiles: boolean;
  uploads: UploadProgress[];
  downloadProgress: DownloadProgress | null;
  onFolderClick: (id: number) => void;
  onBackToRoot: () => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (folder: TopicFolder) => void;
  onDeleteFolder: (id: number) => void;
  onFileDrop: (files: File[]) => void;
  onDownload: (file: DriveFile) => void | Promise<void>;
  onDownloadFilesBatch?: (files: DriveFile[]) => Promise<void>;
  onCancelUpload?: (fileId: string) => void;
  onCancelDownload?: () => void;
  onRenameFile: (file: DriveFile) => void;
  onDeleteFile: (file: DriveFile) => void;
  onLogout: () => void;
  userProfile: UserProfile | null;
  accounts: SavedAccount[];
  activeAccountId: string | null;
  onAddAccount: () => void;
  onSwitchAccount: (userId: string) => void;
  onRemoveAccount: (userId: string) => void;
  activeFolderId: number | null;
  filterTopics: (q: string) => TopicFolder[];
  filterFiles: (q: string) => DriveFile[];
  onPreview: (file: DriveFile) => void;
  allFiles: DriveFile[];
  recentFiles: DriveFile[];
  indexing: boolean;
  indexingProgress: { current: number; total: number };
  onDeleteFilesBatch: (files: DriveFile[]) => Promise<boolean>;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onJoinUpdateChannel?: () => void | Promise<void>;
  joiningChannel?: boolean;
  triggerConfirm?: (title: string, message: string, onConfirm: () => void | Promise<void>) => void;
  triggerToast?: (message: string, type?: "success" | "error" | "info") => void;
}

export function Dashboard({
  driveConfig,
  topics,
  files,
  loadingFiles,
  uploads,
  downloadProgress,
  onFolderClick,
  onBackToRoot,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onFileDrop,
  onDownload,
  onDownloadFilesBatch,
  onCancelUpload,
  onCancelDownload,
  onRenameFile,
  onDeleteFile,
  onLogout,
  userProfile,
  accounts,
  activeAccountId,
  onAddAccount,
  onSwitchAccount,
  onRemoveAccount,
  activeFolderId,
  filterTopics,
  filterFiles,
  onPreview,
  allFiles,
  recentFiles,
  indexing,
  indexingProgress,
  onDeleteFilesBatch,
  theme,
  setTheme,
  onJoinUpdateChannel,
  joiningChannel = false,
  triggerConfirm,
  triggerToast,
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "size" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectionState, setSelectionState] = useState<{
    folderId: number | null;
    ids: Set<number>;
  }>({ folderId: activeFolderId, ids: new Set() });
  const selectedFileIds =
    selectionState.folderId === activeFolderId ? selectionState.ids : new Set<number>();

  const mainRef = useRef<HTMLElement | null>(null);
  const dragCounter = useRef(0);
  const [isDraggingPage, setIsDraggingPage] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const handleToggleSelect = (id: number) => {
    setSelectionState((prevState) => {
      const prev = prevState.folderId === activeFolderId ? prevState.ids : new Set<number>();
      const copy = new Set(prev);
      if (copy.has(id)) {
        copy.delete(id);
      } else {
        copy.add(id);
      }
      return { folderId: activeFolderId, ids: copy };
    });
  };

  const activeFolder = topics.find((t) => t.id === activeFolderId) ?? null;
  const displayedTopics = searchQuery
    ? filterTopics(searchQuery)
    : topics;

  // Filter files matching search query globally (for root view search)
  const matchingFiles = searchQuery
    ? allFiles.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // Filter files by search query (for folder view)
  let filtered = searchQuery ? filterFiles(searchQuery) : files;

  // Filter files by category
  const getFileCategory = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
    if (["mp4", "webm", "ogg", "mov"].includes(ext)) return "video";
    if (["mp3", "wav", "m4a", "flac", "ogg"].includes(ext)) return "audio";
    if (["pdf", "docx", "xlsx", "xls", "csv", "txt", "md", "json", "zip", "rar"].includes(ext)) return "document";
    return "other";
  };

  if (selectedCategory !== "all") {
    filtered = filtered.filter((f) => getFileCategory(f.name) === selectedCategory);
  }

  // Sort files
  const displayedFiles = [...filtered].sort((a, b) => {
    let comp = 0;
    if (sortBy === "name") comp = a.name.localeCompare(b.name);
    else if (sortBy === "size") comp = a.size - b.size;
    else if (sortBy === "date") comp = a.date - b.date;
    return sortOrder === "asc" ? comp : -comp;
  });

  const handleToggleSelectAll = () => {
    const filesToSelect = activeFolderId === null ? matchingFiles : displayedFiles;
    setSelectionState((prevState) => {
      const prev = prevState.folderId === activeFolderId ? prevState.ids : new Set<number>();
      const allSelected = filesToSelect.length > 0 && filesToSelect.every((f) => prev.has(f.id));
      const copy = new Set(prev);
      if (allSelected) {
        filesToSelect.forEach((f) => copy.delete(f.id));
      } else {
        filesToSelect.forEach((f) => copy.add(f.id));
      }
      return { folderId: activeFolderId, ids: copy };
    });
  };

  const selectedFiles = (activeFolderId === null ? allFiles : files).filter((f) => selectedFileIds.has(f.id));

  const handleBatchDelete = () => {
    if (selectedFiles.length === 0) return;
    if (triggerConfirm) {
      triggerConfirm(
        "Delete Selected Files",
        `Are you sure you want to delete all ${selectedFiles.length} selected files from Telegram cloud storage?`,
        async () => {
          const ok = await onDeleteFilesBatch(selectedFiles);
          if (ok) {
            setSelectionState({ folderId: activeFolderId, ids: new Set() });
            triggerToast?.("Successfully deleted selected files.", "success");
          } else {
            triggerToast?.("Failed to delete some selected files.", "error");
          }
        }
      );
    }
  };

  const handleBatchDownload = async () => {
    if (selectedFiles.length === 0) return;
    if (onDownloadFilesBatch) {
      await onDownloadFilesBatch(selectedFiles);
      setSelectionState({ folderId: activeFolderId, ids: new Set() });
      return;
    }
    for (const file of selectedFiles) {
      try {
        await onDownload(file);
      } catch (err) {
        console.error("Batch download error:", err);
      }
    }
    setSelectionState({ folderId: activeFolderId, ids: new Set() });
  };

  const activeUploads = uploads.filter(
    (u) => u.status !== "done"
  );

  // Smooth scroll to top on folder navigation change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeFolderId]);

  // Full-page drag and drop listeners
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDraggingPage(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDraggingPage(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingPage(false);
      dragCounter.current = 0;
      const droppedFiles = Array.from(e.dataTransfer?.files || []);
      if (droppedFiles.length > 0) {
        onFileDrop(droppedFiles);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [onFileDrop]);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-50 flex flex-col relative transition-colors duration-300">
      {/* Full-screen drag wash overlay */}
      {isDraggingPage && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 border-[3px] border-dashed border-brand-400/80 m-4 rounded-3xl animate-fade-in pointer-events-none"
          style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        >
          <div className="w-24 h-24 rounded-3xl bg-surface-900/90 text-white flex items-center justify-center mb-4 shadow-2xl border border-surface-300/10">
            <svg className="w-12 h-12 text-accent-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-white text-xl font-black tracking-tight">Drop files anywhere to upload</p>
          <p className="text-surface-300 text-xs font-bold uppercase tracking-wider mt-1.5 opacity-80">Upload instantly to your active folder</p>
        </div>
      )}

      <Header
        driveTitle={driveConfig.chatTitle}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onLogout={onLogout}
        userProfile={userProfile}
        accounts={accounts}
        activeAccountId={activeAccountId}
        onAddAccount={onAddAccount}
        onSwitchAccount={onSwitchAccount}
        onRemoveAccount={onRemoveAccount}
        theme={theme}
        setTheme={setTheme}
        onMenuClick={() => setShowMobileSidebar(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          folders={topics}
          activeFolderId={activeFolderId}
          onFolderClick={onFolderClick}
          onCreateFolder={() => setShowCreateFolder(true)}
          onBackToRoot={onBackToRoot}
          allFiles={allFiles}
          indexing={indexing}
          indexingProgress={indexingProgress}
          onJoinUpdateChannel={onJoinUpdateChannel}
          joiningChannel={joiningChannel}
        />

        <main ref={mainRef} className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Breadcrumb
            folderName={activeFolder?.title ?? null}
            onBackToRoot={onBackToRoot}
          />

          {activeFolderId === null ? (
            /* Root view: show folders */
            <div className="space-y-8">
              {/* Recent Files Panel */}
              {!searchQuery && recentFiles.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-extrabold uppercase tracking-widest text-surface-600 flex items-center gap-2 select-none">
                    <span>Recent Uploads</span>
                    <span className="text-[9px] uppercase bg-brand-500/10 text-brand-450 dark:text-brand-400 font-extrabold px-2 py-0.5 rounded-full border border-brand-500/15 animate-pulse select-none">
                      Activity
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentFiles.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => onPreview(file)}
                        className="glass glass-hover p-4.5 rounded-3xl flex items-center gap-4 border border-surface-300/40 dark:border-surface-300/10 shadow-sm cursor-pointer relative group animate-slide-up"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-surface-200/55 dark:bg-surface-300/5 flex items-center justify-center shrink-0 shadow-inner border border-surface-300/10">
                          <FileIcon fileName={file.name} className="w-5.5 h-5.5 filter drop-shadow-sm" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-surface-900 truncate group-hover:text-brand-500 transition-colors">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-surface-500 mt-1 font-bold">
                            {formatBytes(file.size)} • {new Date(file.date * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-surface-600">
                  {searchQuery ? "Matching Folders" : "Folders"}
                  <span className="text-[10px] font-bold text-surface-500 ml-2 bg-surface-200/60 dark:bg-surface-300/15 px-2 py-0.5 rounded-full font-mono border border-surface-300/10">
                    {displayedTopics.length}
                  </span>
                </h2>
                <button
                  onClick={() => setShowCreateFolder(true)}
                  className="lg:hidden flex items-center gap-1.5 text-xs text-brand-450 hover:text-brand-600 transition-colors font-bold uppercase tracking-wider cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
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
                  New
                </button>
              </div>

              {displayedTopics.length > 0 ? (
                <TopicList
                  folders={displayedTopics}
                  onFolderClick={onFolderClick}
                  onRenameFolder={onRenameFolder}
                  onDeleteFolder={onDeleteFolder}
                />
              ) : (
                searchQuery && (
                  <p className="text-xs text-surface-550 italic select-none">No folders matching "{searchQuery}"</p>
                )
              )}

              {/* Search Results: Files */}
              {searchQuery && (
                <div className="space-y-4 pt-6 border-t border-surface-300/40 dark:border-surface-300/10">
                  <h2 className="text-sm font-extrabold uppercase tracking-widest text-surface-600 flex items-center gap-2">
                    <span>Search Results: Files</span>
                    <span className="text-[10px] font-bold text-surface-500 bg-surface-200/60 dark:bg-surface-300/15 px-2 py-0.5 rounded-full font-mono border border-surface-300/10">
                      {matchingFiles.length}
                    </span>
                  </h2>
                  <FileGrid
                    files={matchingFiles}
                    loading={loadingFiles}
                    onDownload={onDownload}
                    onPreview={onPreview}
                    onRename={onRenameFile}
                    onDelete={onDeleteFile}
                    selectedFileIds={selectedFileIds}
                    onToggleSelect={handleToggleSelect}
                    onToggleSelectAll={handleToggleSelectAll}
                  />
                </div>
              )}

              {searchQuery && displayedTopics.length === 0 && matchingFiles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center select-none">
                  <div className="w-16 h-16 mb-4 rounded-2xl bg-surface-200/40 dark:bg-surface-200/10 flex items-center justify-center text-surface-500 border border-surface-300/30 dark:border-surface-300/5">
                    <svg className="w-8 h-8 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-surface-900 font-bold mb-1 text-sm">No results found</p>
                  <p className="text-surface-550 text-xs max-w-[260px] leading-relaxed">
                    We couldn't find any folders or files matching "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Folder view: show upload zone + files */
            <div className="space-y-8">
              <UploadZone
                onDrop={onFileDrop}
              />

              {/* Upload progress indicators */}
              {activeUploads.length > 0 && (
                <div className="space-y-3.5">
                  {activeUploads.map((u) => (
                    <div
                      key={u.fileId}
                      className="glass rounded-3xl p-5 space-y-3 border border-surface-300/40 dark:border-surface-300/10 animate-slide-up shadow-sm relative overflow-hidden"
                    >
                      {/* Loading reflection sheen */}
                      <div className="absolute inset-0 shimmer pointer-events-none" />

                      <div className="flex items-center justify-between text-sm relative z-10 select-none">
                        <span className="text-surface-900 font-bold truncate mr-4">
                          {u.fileName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-surface-600 dark:text-surface-500 text-xs shrink-0 font-bold font-mono">
                            {u.status === "uploading"
                              ? `${Math.round((u.uploadedBytes / (u.totalBytes || 1)) * 100)}%`
                              : u.status === "finalizing"
                                ? "Finalizing..."
                                : u.status === "error"
                                  ? "Error"
                                  : "Preparing..."}
                          </span>
                          {(u.status === "uploading" || u.status === "preparing") && onCancelUpload && (
                            <button
                              onClick={() => onCancelUpload(u.fileId)}
                              className="p-1 hover:bg-surface-200 dark:hover:bg-surface-300/20 text-surface-650 dark:text-surface-600 hover:text-danger rounded-full transition-all cursor-pointer flex items-center justify-center"
                              title="Cancel Upload"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      <ProgressBar
                        value={
                          u.totalBytes > 0
                            ? (u.uploadedBytes / u.totalBytes) * 100
                            : 0
                        }
                        color={u.status === "error" ? "brand" : "accent"}
                      />
                      <div className="flex justify-between text-[10px] text-surface-500 font-bold relative z-10 uppercase select-none tracking-wide">
                        <span>
                          {formatBytes(u.uploadedBytes)} /{" "}
                          {formatBytes(u.totalBytes)}
                          {u.speedBps ? ` - ${formatBytes(u.speedBps)}/s` : ""}
                        </span>
                        {u.error && (
                          <span className="text-danger line-clamp-1 break-all max-w-xs normal-case" title={u.error}>
                            {u.error}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Download progress */}
              {downloadProgress && (
                <div className="glass rounded-3xl p-5 space-y-3 border border-surface-300/40 dark:border-surface-300/10 animate-slide-up shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 shimmer pointer-events-none" />
                  
                  <div className="flex items-center justify-between text-sm relative z-10 select-none">
                    <span className="text-surface-900 font-bold truncate mr-4">
                      ⬇️ {downloadProgress.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-surface-600 dark:text-surface-500 text-xs font-bold font-mono">
                        {downloadProgress.progress}%
                      </span>
                      {onCancelDownload && (
                        <button
                          onClick={onCancelDownload}
                          className="p-1 hover:bg-surface-200 dark:hover:bg-surface-300/20 text-surface-650 dark:text-surface-600 hover:text-danger rounded-full transition-all cursor-pointer flex items-center justify-center"
                          title="Cancel Download"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <ProgressBar
                    value={downloadProgress.progress}
                    color="success"
                  />
                  <div className="flex justify-between text-[10px] text-surface-500 font-bold relative z-10 uppercase select-none tracking-wide">
                    <span>
                      {formatBytes(downloadProgress.downloadedBytes)} /{" "}
                      {formatBytes(downloadProgress.totalBytes)}
                    </span>
                    <span>{formatBytes(downloadProgress.speedBps)}/s</span>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
                  {/* Category tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    {[
                      { id: "all", label: "All Files" },
                      { id: "image", label: "Images" },
                      { id: "video", label: "Videos" },
                      { id: "audio", label: "Audio" },
                      { id: "document", label: "Documents" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-2 border select-none ${
                          selectedCategory === cat.id
                            ? "bg-brand-500 text-white border-brand-500/25 shadow-md shadow-brand-500/15"
                            : "bg-surface-100/40 dark:bg-surface-200/20 text-surface-750 dark:text-surface-700 border-surface-300/40 dark:border-surface-300/10 hover:bg-surface-200 dark:hover:bg-surface-300/10"
                        }`}
                      >
                        <FileIcon category={cat.id} className="w-4 h-4 shrink-0 filter drop-shadow-sm" />
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Sorting options */}
                  <div className="flex items-center gap-2 shrink-0 select-none">
                    <span className="text-xs text-surface-500 font-bold uppercase tracking-wider">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as "name" | "size" | "date")}
                      className="bg-surface-200 dark:bg-surface-200/10 text-surface-900 text-xs rounded-xl px-3 py-2 border border-surface-300/30 dark:border-surface-300/10 outline-none cursor-pointer focus:border-brand-400 font-bold tracking-tight"
                    >
                      <option value="date">Date</option>
                      <option value="name">Name</option>
                      <option value="size">Size</option>
                    </select>

                    <button
                      onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                      className="p-2 rounded-xl bg-surface-200 dark:bg-surface-200/10 hover:bg-surface-300 dark:hover:bg-surface-300/10 text-surface-700 dark:text-surface-650 transition-colors cursor-pointer border border-transparent hover:border-surface-300/30 active:scale-90"
                      title={sortOrder === "asc" ? "Sort Ascending" : "Sort Descending"}
                    >
                      {sortOrder === "asc" ? (
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h5m0 0v-8m0 0v8" />
                        </svg>
                      ) : (
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9M3 12h9m0 0l-3-3m3 3l-3 3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-300/40 dark:border-surface-300/10">
                  <h2 className="text-sm font-extrabold uppercase tracking-widest text-surface-600 mb-5">
                    Files
                    <span className="text-[10px] font-bold text-surface-500 ml-2 bg-surface-200/60 dark:bg-surface-300/15 px-2 py-0.5 rounded-full font-mono border border-surface-300/10">
                      {displayedFiles.length}
                    </span>
                  </h2>
                  <FileGrid
                    files={displayedFiles}
                    loading={loadingFiles}
                    onDownload={onDownload}
                    onPreview={onPreview}
                    onRename={onRenameFile}
                    onDelete={onDeleteFile}
                    selectedFileIds={selectedFileIds}
                    onToggleSelect={handleToggleSelect}
                    onToggleSelectAll={handleToggleSelectAll}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating OS Action Dock */}
      {selectedFileIds.size > 0 && (
        <div 
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass rounded-[24px] px-6 py-4 flex items-center gap-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] animate-scale-in border border-brand-500/25 max-w-[90vw] md:max-w-none"
          style={{ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
        >
          <div className="text-[11px] font-black text-surface-900 shrink-0 uppercase tracking-widest select-none">
            <span className="text-brand-500 font-black text-sm mr-1">{selectedFileIds.size}</span>
            Selected
          </div>
          <div className="h-5 w-[1px] bg-surface-300/40 dark:bg-surface-300/10" />
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchDownload}
              className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/10 active:scale-95 transition-all cursor-pointer select-none border border-brand-600/10"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger text-xs font-bold transition-all border border-danger/20 active:scale-95 cursor-pointer select-none"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
            <button
              onClick={() => setSelectionState({ folderId: activeFolderId, ids: new Set() })}
              className="px-4 py-2.5 rounded-xl bg-surface-200 hover:bg-surface-300 dark:bg-surface-300/20 dark:hover:bg-surface-300/35 text-surface-700 text-xs font-bold active:scale-95 transition-all cursor-pointer select-none"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <CreateFolderModal
        open={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onSubmit={onCreateFolder}
      />

      {/* Mobile Sidebar Navigation Drawer */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
            onClick={() => setShowMobileSidebar(false)}
          />
          {/* Drawer Content */}
          <div className="relative flex flex-col w-64 max-w-[80vw] bg-surface-50 dark:bg-surface-100 h-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-r border-surface-300/40 dark:border-surface-300/10 animate-slide-right select-none z-50">
            {/* Header close button inside mobile drawer */}
            <div className="p-4 border-b border-surface-300/40 dark:border-surface-300/10 flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-surface-500 uppercase tracking-widest">Navigation</span>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="p-1.5 rounded-xl hover:bg-surface-200/80 dark:hover:bg-surface-300/10 text-surface-550 cursor-pointer active:scale-90"
              >
                <svg className="w-5 h-5 text-surface-600 dark:text-surface-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Drawer Body container */}
            <div className="flex-1 overflow-hidden">
              <Sidebar
                className="w-full flex flex-col h-full bg-transparent select-none"
                folders={topics}
                activeFolderId={activeFolderId}
                onFolderClick={(id) => {
                  onFolderClick(id);
                  setShowMobileSidebar(false);
                }}
                onCreateFolder={() => {
                  setShowMobileSidebar(false);
                  setShowCreateFolder(true);
                }}
                onBackToRoot={() => {
                  onBackToRoot();
                  setShowMobileSidebar(false);
                }}
                allFiles={allFiles}
                indexing={indexing}
                indexingProgress={indexingProgress}
                onJoinUpdateChannel={onJoinUpdateChannel}
                joiningChannel={joiningChannel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
