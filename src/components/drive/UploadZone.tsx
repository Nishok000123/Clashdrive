import { useCallback, useRef, useState } from "react";

interface UploadZoneProps {
  onDrop: (files: File[]) => void;
  disabled?: boolean;
}

export function UploadZone({ onDrop, disabled }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        onDrop(droppedFiles);
      }
    },
    [onDrop, disabled]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        onDrop(selectedFiles);
      }
      e.target.value = "";
    },
    [onDrop]
  );

  const handleZoneClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleZoneClick}
      className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 text-center cursor-pointer group select-none ${
        isDragging
          ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/10 scale-[1.01] shadow-inner"
          : "border-surface-300/60 dark:border-surface-400/15 hover:border-brand-500/40 hover:bg-surface-200/30 dark:hover:bg-surface-200/5"
      } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      {/* Hidden file input — pointer-events-none so it never intercepts drag-and-drop */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={true}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      <div
        className={`flex flex-col items-center gap-3.5 pointer-events-none transition-transform duration-250 ${
          isDragging ? "scale-105" : ""
        }`}
      >
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-250 ${
            isDragging
              ? "gradient-brand shadow-lg shadow-brand-500/20"
              : "bg-surface-200 dark:bg-surface-200/10 group-hover:bg-surface-300/70 dark:group-hover:bg-surface-200/20 border border-surface-300/30 dark:border-surface-400/10 shadow-sm"
          }`}
        >
          <svg
            className={`w-7 h-7 transition-colors ${
              isDragging ? "text-white" : "text-surface-600 dark:text-surface-400"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
            />
          </svg>
        </div>

        <div>
          <p className="text-sm font-bold text-surface-900 tracking-tight">
            {isDragging ? "Drop files here" : "Drag & drop files"}
          </p>
          <p className="text-xs text-surface-500 mt-1 font-semibold">
            or click to browse • Unlimited Telegram Vault storage
          </p>
        </div>
      </div>
    </div>
  );
}
