interface LoadingScreenProps {
  message?: string;
  subtext?: string;
}

export function LoadingScreen({
  message = "Initializing",
  subtext,
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 animate-fade-in relative overflow-hidden bg-surface-50 dark:bg-surface-50">
      {/* Ambient background glows */}
      <div className="absolute w-[350px] h-[350px] rounded-full bg-brand-500/5 dark:bg-brand-500/10 blur-3xl animate-pulse-slow" />
      <div className="absolute w-[250px] h-[250px] rounded-full bg-accent-500/5 dark:bg-accent-500/8 blur-3xl animate-pulse-slow delay-1000" />
      
      {/* Premium Loader Ring */}
      <div className="relative w-24 h-24">
        {/* Outer Orbit */}
        <div className="absolute inset-0 rounded-full border border-surface-300/40 dark:border-surface-300/10 shadow-inner" />
        
        {/* Gradient spinner ring */}
        <svg className="absolute inset-0 w-24 h-24" viewBox="0 0 96 96" style={{ animation: "gradient-ring-spin 0.9s linear infinite" }}>
          <defs>
            <linearGradient id="spinnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="48" cy="48" r="44" fill="none" stroke="url(#spinnerGrad)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="200 100" />
        </svg>
        
        {/* Dashed secondary loop */}
        <div
          className="absolute inset-2.5 rounded-full border border-dashed border-accent-400/20 animate-spin"
          style={{ animationDuration: "5s", animationDirection: "reverse" }}
        />

        {/* Outer dot tracker */}
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{ animationDuration: "1.8s" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-400 shadow-md shadow-brand-500/40" />
        </div>

        {/* Center Glass Logo Shell */}
        <div className="absolute inset-4 rounded-full bg-surface-100/90 dark:bg-surface-200/90 flex items-center justify-center shadow-lg border border-surface-300/15 backdrop-blur-md">
          <svg className="w-8 h-8 animate-pulse-slow" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="load-logo-cloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <path d="M42 80c-5.52 0-10-4.48-10-10 0-4.88 3.5-8.94 8.2-9.82C41.4 51.78 49.38 46 58.5 46c8.07 0 15.22 4.45 18 11.02 1.34-.63 2.85-.98 4.45-.98 5.52 0 10 4.48 10 10s-4.48 10-10 10H42z" fill="url(#load-logo-cloud)" />
          </svg>
        </div>
      </div>

      <div className="text-center space-y-2.5 relative z-10 select-none">
        <p className="text-surface-900 font-extrabold text-lg sm:text-xl tracking-tight select-none">
          {message}
        </p>
        {subtext && (
          <p className="text-surface-500 dark:text-surface-600 text-[10px] uppercase font-extrabold tracking-widest animate-pulse-slow">
            {subtext}
          </p>
        )}
        {/* Animated dots */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-brand-500/50"
              style={{
                animation: "dots-bounce 1.4s ease-in-out infinite",
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
