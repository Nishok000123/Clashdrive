interface ProgressBarProps {
  value: number; // 0-100, or -1 for indeterminate
  size?: "sm" | "md";
  color?: "brand" | "accent" | "success";
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  size = "md",
  color = "brand",
  showLabel = false,
}: ProgressBarProps) {
  const isIndeterminate = value < 0;

  const heights: Record<string, string> = {
    sm: "h-1",
    md: "h-2",
  };

  const colors: Record<string, string> = {
    brand: "from-brand-400 to-brand-600",
    accent: "from-accent-400 to-accent-600",
    success: "from-emerald-400 to-emerald-600",
  };

  const glowColors: Record<string, string> = {
    brand: "shadow-brand-500/20",
    accent: "shadow-accent-500/20",
    success: "shadow-emerald-500/20",
  };

  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {showLabel && !isIndeterminate && (
        <div className="flex justify-end mb-1">
          <span className="text-[10px] font-bold text-surface-500 tabular-nums">
            {Math.round(clampedValue)}%
          </span>
        </div>
      )}
      <div
        className={`relative w-full bg-surface-300/40 dark:bg-surface-300/15 rounded-full overflow-hidden ${heights[size]}`}
      >
        {isIndeterminate ? (
          <div
            className={`absolute ${heights[size]} rounded-full bg-gradient-to-r ${colors[color]} animate-progress-indeterminate shadow-sm ${glowColors[color]}`}
          />
        ) : (
          <div
            className={`${heights[size]} rounded-full bg-gradient-to-r ${colors[color]} transition-all duration-500 ease-out shadow-sm ${glowColors[color]}`}
            style={{ width: `${clampedValue}%` }}
          >
            {/* Animated shine overlay */}
            {clampedValue > 0 && clampedValue < 100 && (
              <div
                className="absolute inset-0 rounded-full opacity-40"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                  backgroundSize: "200% 100%",
                  animation: "progress-shine 2s ease-in-out infinite",
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
