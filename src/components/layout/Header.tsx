import { useState, useRef, useEffect } from "react";
import { Input } from "../ui/Input";
import type { UserProfile, SavedAccount } from "../../types";

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
}: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
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

  // Fallback initial
  const initials = userProfile?.firstName
    ? userProfile.firstName.charAt(0).toUpperCase()
    : "U";

  const displayName = userProfile
    ? [userProfile.firstName, userProfile.lastName].filter(Boolean).join(" ")
    : "Telegram User";

  return (
    <header className="sticky top-0 z-40 glass border-b border-surface-300/50">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="header-grad" x1="0" y1="0" x2="32" y2="32">
                <stop offset="0%" stopColor="#6c63ff" />
                <stop offset="100%" stopColor="#00d2ff" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#header-grad)" opacity="0.15" />
            <path d="M8 12l8-4 8 4v8l-8 4-8-4v-8z" stroke="url(#header-grad)" strokeWidth="1.5" fill="none" />
            <path d="M16 8v16M8 12l8 4 8-4" stroke="url(#header-grad)" strokeWidth="1.5" />
          </svg>
          <div>
            <h1 className="text-sm font-bold gradient-text leading-tight flex items-center gap-2">
              TG Cloud Drive
              <span className="text-[9px] font-medium bg-brand-500/10 text-brand-400 px-1.5 py-0.5 rounded-full border border-brand-500/20">
                v1.0
              </span>
            </h1>
            <p className="text-[10px] text-surface-600 leading-tight">
              {driveTitle}
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex-1 max-w-xl hidden md:block relative">
          <Input
            ref={searchRef}
            placeholder="Search files and folders... (Ctrl+K or /)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="!bg-surface-100 !border-surface-300 !py-2 text-sm pr-10"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange("");
                searchRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface-300 text-surface-800 flex items-center justify-center hover:bg-surface-400 active:scale-90 transition-all"
              title="Clear Search"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* User Account Manager (Premium Multi-Account Dropdown) */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-1 pr-3 rounded-xl bg-surface-100 hover:bg-surface-200/80 border border-surface-300/40 transition-all active:scale-95 group"
          >
            {userProfile?.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={displayName}
                className="w-8 h-8 rounded-lg object-cover border border-surface-300/50 shadow-inner"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-brand-400/20">
                {initials}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <p className="text-[11px] font-bold text-surface-900 truncate max-w-[100px]">
                {displayName}
              </p>
              <p className="text-[9px] text-surface-600 truncate max-w-[100px]">
                ID: {userProfile?.id}
              </p>
            </div>
            <svg
              className={`w-3.5 h-3.5 text-surface-600 transition-transform duration-300 ${showDropdown ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-45" onClick={() => setShowDropdown(false)} />
              
              <div className="absolute right-0 top-12 z-50 glass rounded-2xl p-3 w-[290px] animate-slide-up shadow-2xl border border-surface-300/50 space-y-3">
                <div className="pb-2.5 border-b border-surface-200">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-surface-500">
                    Active Account
                  </p>
                  <div className="flex items-center gap-2.5 mt-2">
                    {userProfile?.avatarUrl ? (
                      <img
                        src={userProfile.avatarUrl}
                        alt={displayName}
                        className="w-10 h-10 rounded-xl object-cover border border-surface-300"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white text-base font-bold shadow-lg">
                        {initials}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-surface-950 truncate">
                        {displayName}
                      </p>
                      <p className="text-[10px] text-surface-600 truncate">
                        @{userProfile?.username || "no_username"}
                      </p>
                      <p className="text-[9px] text-surface-500 font-mono">
                        ID: {userProfile?.id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Other accounts list */}
                {accounts.length > 1 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-surface-500">
                      Switch Account
                    </p>
                    <div className="space-y-1 max-h-[140px] overflow-y-auto">
                      {accounts
                        .filter((acc) => acc.userId !== activeAccountId)
                        .map((acc) => (
                          <div
                            key={acc.userId}
                            className="flex items-center justify-between p-1.5 rounded-xl hover:bg-surface-100/80 transition-colors group/item"
                          >
                            <button
                              onClick={() => {
                                onSwitchAccount(acc.userId);
                                setShowDropdown(false);
                              }}
                              className="flex items-center gap-2 text-left flex-1 min-w-0"
                            >
                              {acc.avatarUrl ? (
                                <img
                                  src={acc.avatarUrl}
                                  alt={acc.idName}
                                  className="w-7 h-7 rounded-lg object-cover border border-surface-300"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center text-white text-xs font-bold">
                                  {acc.idName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="truncate">
                                <p className="text-[11px] font-semibold text-surface-900 truncate">
                                  {acc.idName}
                                </p>
                                <p className="text-[9px] text-surface-500 font-mono">
                                  ID: {acc.userId}
                                </p>
                              </div>
                            </button>
                            
                            {/* Remove account */}
                            <button
                              onClick={() => onRemoveAccount(acc.userId)}
                              className="p-1 rounded-lg text-surface-600 hover:text-danger hover:bg-danger/10 opacity-0 group-hover/item:opacity-100 transition-all"
                              title="Logout account"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Account Actions */}
                <div className="pt-2 border-t border-surface-200 space-y-1">
                  {accounts.length < 3 && (
                    <button
                      onClick={() => {
                        onAddAccount();
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors flex items-center gap-2 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Add Another Account ({accounts.length}/3)
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onLogout();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-danger hover:bg-danger/10 rounded-lg transition-colors flex items-center gap-2 font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out Active Account
                  </button>
                </div>

                {/* Subtly Engineered Watermark inside Account drop down */}
                <div className="text-center pt-1 text-[9px] text-surface-500 border-t border-surface-200/60 font-semibold tracking-wider uppercase">
                  Made by ajisth
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
