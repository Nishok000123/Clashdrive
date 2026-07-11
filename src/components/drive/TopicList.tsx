import type { TopicFolder } from "../../types";

interface TopicListProps {
  folders: TopicFolder[];
  onFolderClick: (id: number) => void;
  onRenameFolder: (folder: TopicFolder) => void;
  onDeleteFolder: (id: number) => void;
}

export function TopicList({
  folders,
  onFolderClick,
  onRenameFolder,
  onDeleteFolder,
}: TopicListProps) {
  const folderColors = [
    "#6366f1", // Indigo
    "#0ea5e9", // Sky Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#f43f5e", // Rose
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#14b8a6", // Teal
  ];

  if (folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in select-none">
        <div className="w-20 h-20 rounded-[28px] bg-surface-200/40 dark:bg-surface-200/10 flex items-center justify-center mb-5 border border-surface-300/30 dark:border-surface-300/5 text-surface-400">
          <svg
            className="w-10 h-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </div>
        <p className="text-surface-900 font-bold mb-1 text-sm">No folders yet</p>
        <p className="text-surface-550 text-xs max-w-[200px] text-center leading-relaxed">
          Create a folder using the "New Folder" action to start organizing.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
      {folders.map((folder, idx) => {
        const themeColor = folderColors[idx % folderColors.length];
        return (
          <div
            key={folder.id}
            onClick={() => onFolderClick(folder.id)}
            className="bg-surface-100 dark:bg-surface-200 rounded-3xl p-5 cursor-pointer border border-surface-300/40 dark:border-surface-300/10 hover:bg-surface-200/50 dark:hover:bg-surface-300/20 hover:border-brand-500/25 dark:hover:border-brand-500/35 group transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-md hover:shadow-brand-500/5 select-none animate-slide-up"
            style={{ animationDelay: `${idx * 20}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner"
                style={{
                  backgroundColor: `${themeColor}12`,
                  color: themeColor,
                }}
              >
                <svg className="w-6 h-6 filter drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
              </div>

              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenameFolder(folder);
                  }}
                  className="p-1.5 rounded-xl hover:bg-brand-500/10 text-surface-500 hover:text-brand-500 active:scale-90 transition-all cursor-pointer shadow-sm border border-transparent hover:border-brand-500/10"
                  title="Rename folder"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(folder.id);
                  }}
                  className="p-1.5 rounded-xl hover:bg-danger/10 text-surface-500 hover:text-danger active:scale-90 transition-all cursor-pointer shadow-sm border border-transparent hover:border-danger/15"
                  title="Delete folder"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <p className="text-xs font-black text-surface-900 truncate tracking-tight">
              {folder.title}
            </p>
            <p className="text-[10px] text-surface-500 mt-1 font-bold">
              {new Date(folder.date * 1000).toLocaleDateString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}
