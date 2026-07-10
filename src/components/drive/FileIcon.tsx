import React from "react";

interface FileIconProps {
  fileName?: string;
  category?: string;
  className?: string;
}

interface FileCardProps {
  gradId: string;
  colors: [string, string];
  children: React.ReactNode;
  className?: string;
}

function FileCard({ gradId, colors, children, className = "w-5 h-5" }: FileCardProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="100%" stopColor={colors[1]} />
        </linearGradient>
        <linearGradient id={`${gradId}-flap`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.1} />
        </linearGradient>
      </defs>
      {/* Page Base with folded corner */}
      <path
        d="M3 0h19.5L32 9.5V35a3 3 0 01-3 3H3a3 3 0 01-3-3V3a3 3 0 013-3z"
        fill={`url(#${gradId})`}
      />
      {/* Folded Flap */}
      <path
        d="M22.5 0v9.5H32L22.5 0z"
        fill={`url(#${gradId}-flap)`}
      />
      {/* Inner Symbol */}
      <g>
        {children}
      </g>
    </svg>
  );
}

export function FileIcon({ fileName, category, className = "w-5 h-5" }: FileIconProps) {
  // Determine file type from extension if fileName is provided
  let type = category || "";

  if (fileName && !type) {
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
    const map: Record<string, string> = {
      // Images
      png: "image",
      jpg: "image",
      jpeg: "image",
      gif: "image",
      webp: "image",
      svg: "image",
      // Video
      mp4: "video",
      mkv: "video",
      avi: "video",
      mov: "video",
      webm: "video",
      // Audio
      mp3: "audio",
      wav: "audio",
      flac: "audio",
      ogg: "audio",
      aac: "audio",
      // Documents
      pdf: "pdf",
      doc: "document",
      docx: "document",
      txt: "text",
      md: "text",
      // Archives
      zip: "archive",
      rar: "archive",
      "7z": "archive",
      tar: "archive",
      gz: "archive",
      // Code
      js: "code",
      ts: "code",
      py: "code",
      rs: "code",
      go: "code",
      java: "code",
      // Data
      json: "data",
      csv: "data",
      xlsx: "data",
      // Executables
      exe: "executable",
      msi: "executable",
      apk: "apk",
      iso: "disc",
    };
    type = map[ext] || "folder";
  }

  // Fallback if still empty
  if (!type) {
    type = "folder";
  }

  // Render matching SVG
  switch (type) {
    case "all":
    case "folder":
      return (
        <svg
          className={className}
          viewBox="0 0 32 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="folderBackGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="folderFrontGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <filter id="folderShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodOpacity="0.15" />
            </filter>
          </defs>
          {/* Back Cover & Tab */}
          <path
            d="M2 5a2 2 0 012-2h8l2.5 3H28a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V5z"
            fill="url(#folderBackGrad)"
          />
          {/* Front pocket */}
          <path
            d="M2 11h28v13a2 2 0 01-2 2H4a2 2 0 01-2-2V11z"
            fill="url(#folderFrontGrad)"
            filter="url(#folderShadow)"
          />
        </svg>
      );

    case "image":
      return (
        <FileCard gradId="imgGrad" colors={["#10b981", "#047857"]} className={className}>
          <circle cx="11" cy="18" r="2.5" fill="#ffffff" />
          <path
            d="M6 29l6-6 4 4 8-8 3.5 3.5"
            stroke="#ffffff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </FileCard>
      );

    case "video":
      return (
        <FileCard gradId="videoGrad" colors={["#8b5cf6", "#5b21b6"]} className={className}>
          <circle cx="16" cy="22" r="6" stroke="#ffffff" strokeWidth={2} />
          <polygon points="14.5,19 19,22 14.5,25" fill="#ffffff" />
        </FileCard>
      );

    case "audio":
      return (
        <FileCard gradId="audioGrad" colors={["#06b6d4", "#0369a1"]} className={className}>
          <path
            d="M10 27a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm11-3a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
            fill="#ffffff"
          />
          <path
            d="M12.5 22V13.5l11-2.5V20"
            stroke="#ffffff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </FileCard>
      );

    case "pdf":
      return (
        <FileCard gradId="pdfGrad" colors={["#f43f5e", "#be123c"]} className={className}>
          <path
            d="M8 15h16M8 20h16M8 25h10"
            stroke="#ffffff"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <rect x="7" y="27" width="18" height="7" rx="1.5" fill="#ef4444" />
          <text
            x="16"
            y="32.5"
            fill="#ffffff"
            fontSize="5.5"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            PDF
          </text>
        </FileCard>
      );

    case "document":
    case "text":
      return (
        <FileCard gradId="docGrad" colors={["#3b82f6", "#1d4ed8"]} className={className}>
          <path
            d="M8 15h16M8 20h16M8 25h16M8 30h10"
            stroke="#ffffff"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </FileCard>
      );

    case "archive":
      return (
        <FileCard gradId="zipGrad" colors={["#f97316", "#c2410c"]} className={className}>
          <rect x="8" y="16" width="16" height="14" rx="2" stroke="#ffffff" strokeWidth={2} />
          <path d="M16 16v14M8 23h16" stroke="#ffffff" strokeWidth={2} />
        </FileCard>
      );

    case "code":
      return (
        <FileCard gradId="codeGrad" colors={["#4b5563", "#1f2937"]} className={className}>
          <path
            d="M10 26l-4-4 4-4M22 18l4 4-4 4M18 15l-4 14"
            stroke="#ffffff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </FileCard>
      );

    case "data":
      return (
        <FileCard gradId="dataGrad" colors={["#84cc16", "#3f6212"]} className={className}>
          <path
            d="M9 28v-6M16 28v-11M23 28v-8"
            stroke="#ffffff"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <path d="M6 30h20" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
        </FileCard>
      );

    case "executable":
      return (
        <FileCard gradId="exeGrad" colors={["#475569", "#1e293b"]} className={className}>
          <rect x="6" y="15" width="20" height="16" rx="2" stroke="#ffffff" strokeWidth={2} />
          <path
            d="M10 21l3 1.5-3 1.5M15 25h6"
            stroke="#ffffff"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </FileCard>
      );

    case "apk":
      return (
        <FileCard gradId="apkGrad" colors={["#a855f7", "#6b21a8"]} className={className}>
          <rect x="9" y="13" width="14" height="20" rx="2" stroke="#ffffff" strokeWidth={2} />
          <line x1="9" y1="28" x2="23" y2="28" stroke="#ffffff" strokeWidth={1.5} />
          <circle cx="16" cy="30.5" r="1" fill="#ffffff" />
        </FileCard>
      );

    case "disc":
      return (
        <FileCard gradId="discGrad" colors={["#6366f1", "#312e81"]} className={className}>
          <circle cx="16" cy="21" r="7" stroke="#ffffff" strokeWidth={2} />
          <circle cx="16" cy="21" r="2" stroke="#ffffff" strokeWidth={1.5} />
        </FileCard>
      );

    default:
      return (
        <FileCard gradId="defGrad" colors={["#94a3b8", "#475569"]} className={className}>
          <path
            d="M9 16h14M9 22h14M9 28h8"
            stroke="#ffffff"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </FileCard>
      );
  }
}
