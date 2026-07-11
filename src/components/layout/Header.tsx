import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { Input } from "../ui/Input";
import type { UserProfile, SavedAccount } from "../../types";
import type { Theme } from "../../hooks/useTheme";

interface HeaderProps {
  driveTitle: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onLogout: () => void;
  userProfile: UserProfile | null;
  accounts: SavedAccount[];
  activeAccountId: string | null;
  onSwitchAccount: (userId: string) => void;
  onRemoveAccount: (userId: string) => void;
  onAddAccount: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onMenuClick?: () => void;
}

export function Header({
  driveTitle,
  searchQuery,
  onSearchChange,
  onLogout,
  userProfile,
  accounts,
  activeAccountId,
  onSwitchAccount,
  onRemoveAccount,
  onAddAccount,
  theme,
  setTheme,
  onMenuClick,
}: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Search input keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close theme menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fallback initial
  const initials = userProfile?.firstName
    ? userProfile.firstName.charAt(0).toUpperCase()
    : "U";

  const displayName = userProfile
    ? [userProfile.firstName, userProfile.lastName].filter(Boolean).join(" ")
    : "Telegram User";

  return (
    <header className="sticky top-0 z-40 glass border-b border-surface-300/40 dark:border-surface-300/10">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16 gap-3 sm:gap-4">
        {/* Hamburger Menu (visible on screens < lg) */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden w-10 h-10 rounded-xl bg-surface-100/40 dark:bg-surface-200/20 hover:bg-surface-200/85 dark:hover:bg-surface-300/30 border border-surface-300/40 dark:border-surface-300/10 text-surface-600 dark:text-surface-700 flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-sm shrink-0"
            title="Open Menu"
          >
            <svg className="w-5.5 h-5.5 text-surface-800 dark:text-surface-750" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0 select-none">
          <svg className="w-9 h-9" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="header-logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#24A1DE" />
                <stop offset="100%" stopColor="#4F46E5" />
              </linearGradient>
              <linearGradient id="header-logo-cloud" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#E0E7FF" stopOpacity="0.85" />
              </linearGradient>
            </defs>
            <circle cx="64" cy="64" r="60" fill="url(#header-logo-bg)" />
            <circle cx="64" cy="64" r="56" fill="none" stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="2.5" />
            <path d="M42 80c-5.52 0-10-4.48-10-10 0-4.88 3.5-8.94 8.2-9.82C41.4 51.78 49.38 46 58.5 46c8.07 0 15.22 4.45 18 11.02 1.34-.63 2.85-.98 4.45-.98 5.52 0 10 4.48 10 10s-4.48 10-10 10H42z" fill="url(#header-logo-cloud)" />
            <path d="M51 68l24-15.5L46.5 61l.5 9.5 4-2.5z" fill="#24A1DE" />
            <path d="M75 52.5L46.5 61l15.5 5.5 13-14z" fill="#38BDF8" />
          </svg>
          <div>
            <h1 className="text-sm font-extrabold gradient-text leading-tight flex items-center gap-1.5">
              Clash Drive
              <span className="text-[9px] font-extrabold bg-brand-500/10 text-brand-450 dark:text-brand-400 px-1.5 py-0.5 rounded-full border border-brand-500/15">
                v1.0
              </span>
            </h1>
            <p className="text-[10px] text-surface-500 dark:text-surface-600 leading-tight font-bold">
              {driveTitle === "Clash Drive" || driveTitle === "TG Cloud Drive" ? "Telegram Cloud Storage" : driveTitle}
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex-1 max-w-lg hidden md:block relative">
          <Input
            ref={searchRef}
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="!bg-surface-100/40 dark:!bg-surface-200/10 !border-surface-300/60 dark:!border-surface-300/10 !py-2 text-sm pr-16 shadow-sm"
            icon={
              <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          {!searchQuery && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none select-none text-[9px] font-extrabold text-surface-500 bg-surface-200/80 dark:bg-surface-300/10 px-1.5 py-0.5 rounded-md border border-surface-300/40 dark:border-surface-300/10 shadow-sm">
              <span>Ctrl</span>
              <span>K</span>
            </div>
          )}
          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange("");
                searchRef.current?.focus();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface-200 hover:bg-surface-300 dark:bg-surface-300/30 text-surface-600 dark:text-surface-550 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
              title="Clear Search"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Theme Switcher */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="w-10 h-10 rounded-xl bg-surface-100/40 dark:bg-surface-200/20 hover:bg-surface-200/80 border border-surface-300/40 dark:border-surface-300/10 text-surface-700 dark:text-surface-600 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
              title="Switch Theme"
            >
              {theme === "light" && (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              )}
              {theme === "dark" && (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              {theme === "system" && (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 top-12.5 z-50 glass rounded-2xl p-1.5 w-[140px] animate-scale-in shadow-2xl border border-surface-300/40 dark:border-surface-300/10 flex flex-col gap-0.5 select-none">
                {([
                  { id: "light", label: "Light", icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                    </svg>
                  )},
                  { id: "dark", label: "Dark", icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )},
                  { id: "system", label: "System", icon: (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )},
                ] satisfies { id: Theme; label: string; icon: ReactNode }[]).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setTheme(item.id);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      theme === item.id
                        ? "bg-brand-500 text-white shadow-md shadow-brand-500/15"
                        : "text-surface-750 dark:text-surface-700 hover:bg-surface-200/70 dark:hover:bg-surface-300/10"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Account Manager (Premium Multi-Account Dropdown) */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-surface-200/50 dark:bg-surface-200/20 hover:bg-surface-200/90 dark:hover:bg-surface-350/30 border border-surface-300/40 dark:border-surface-300/10 transition-all active:scale-95 group shadow-sm cursor-pointer"
            >
              {userProfile?.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={displayName}
                  className="w-7.5 h-7.5 rounded-full object-cover border border-surface-300/40 dark:border-surface-300/10 shadow-inner"
                />
              ) : (
                <div className="w-7.5 h-7.5 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {initials}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <p className="text-[11px] font-extrabold text-surface-900 truncate max-w-[100px] tracking-tight">
                  {displayName}
                </p>
                <p className="text-[9px] text-surface-500 truncate max-w-[100px] font-mono leading-none mt-0.5 font-bold">
                  ID: {userProfile?.id}
                </p>
              </div>
              <svg
                className={`w-3 h-3 text-surface-500 transition-transform duration-300 ${showDropdown ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDropdown && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-45" onClick={() => setShowDropdown(false)} />
                
                <div className="absolute right-0 top-12.5 z-50 glass rounded-3xl p-5 w-[310px] animate-scale-in shadow-2xl border border-surface-300/30 dark:border-surface-300/10 space-y-4 select-none">
                  <div className="pb-3.5 border-b border-surface-300/20 dark:border-surface-300/10">
                    <p className="text-[9px] uppercase font-bold tracking-wider text-surface-500">
                      Active Cloud Session
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      {userProfile?.avatarUrl ? (
                        <img
                          src={userProfile.avatarUrl}
                          alt={displayName}
                          className="w-11 h-11 rounded-full object-cover border border-surface-300/40 dark:border-surface-300/10"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-brand-500 flex items-center justify-center text-white text-lg font-bold shadow-md">
                          {initials}
                        </div>
                      )}
                      <div className="overflow-hidden flex-1">
                        <p className="text-sm font-extrabold text-surface-900 truncate tracking-tight">
                          {displayName}
                        </p>
                        <p className="text-[10px] text-brand-450 dark:text-brand-400 font-bold truncate">
                          @{userProfile?.username || "no_username"}
                        </p>
                        <p className="text-[9px] text-surface-500 font-mono mt-0.5 font-bold">
                          ID: {userProfile?.id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Other accounts list */}
                  {accounts.length > 1 && (
                    <div className="space-y-2.5">
                      <p className="text-[9px] uppercase font-bold tracking-wider text-surface-500">
                        Switch Active Identity
                      </p>
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {accounts
                          .filter((acc) => acc.userId !== activeAccountId)
                          .map((acc) => (
                            <div
                              key={acc.userId}
                              className="flex items-center justify-between p-2 rounded-2xl hover:bg-surface-200/50 dark:hover:bg-surface-300/10 border border-transparent hover:border-surface-300/30 transition-all group/item"
                            >
                              <button
                                onClick={() => {
                                  onSwitchAccount(acc.userId);
                                  setShowDropdown(false);
                                }}
                                className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                              >
                                {acc.avatarUrl ? (
                                  <img
                                    src={acc.avatarUrl}
                                    alt={acc.idName}
                                    className="w-8 h-8 rounded-full object-cover border border-surface-300/40 dark:border-surface-300/10"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
                                    {acc.idName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="truncate">
                                  <p className="text-xs font-bold text-surface-900 truncate tracking-tight">
                                    {acc.idName}
                                  </p>
                                  <p className="text-[9px] text-surface-500 font-mono mt-0.5 font-bold">
                                    ID: {acc.userId}
                                  </p>
                                </div>
                              </button>
                              
                              {/* Remove account */}
                              <button
                                onClick={() => onRemoveAccount(acc.userId)}
                                className="p-1.5 rounded-lg text-surface-500 hover:text-danger hover:bg-danger/10 opacity-0 group-hover/item:opacity-100 transition-all cursor-pointer active:scale-90"
                                title="Sign Out"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Account Actions */}
                  <div className="pt-3 border-t border-surface-300/20 dark:border-surface-300/10 space-y-1.5">
                    {accounts.length < 3 && (
                      <button
                        onClick={() => {
                          onAddAccount();
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-2.5 py-2 text-xs text-brand-450 dark:text-brand-400 hover:bg-brand-500/10 rounded-xl transition-colors flex items-center gap-2.5 font-bold cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Add Another Account ({accounts.length}/3)
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onLogout();
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-2.5 py-2 text-xs text-danger hover:bg-danger/10 rounded-xl transition-colors flex items-center gap-2.5 font-bold cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out Account
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
