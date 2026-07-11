import React, { useEffect, useState, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const [closing, setClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) focusable[0].focus();
  }, [open]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 250);
  };

  if (!open && !closing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 dark:bg-black/80 ${closing ? "animate-backdrop-exit" : "animate-backdrop-enter"}`}
        style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
        onClick={handleClose}
      />
      {/* Panel */}
      <div
        ref={modalRef}
        className={`relative bg-surface-100 dark:bg-surface-200 rounded-[28px] p-6 sm:p-7 w-full max-w-md mx-auto border border-surface-300/60 dark:border-surface-300/15 shadow-2xl ${closing ? "animate-spring-out" : "animate-spring-in"}`}
      >
        <div className="flex items-center justify-between mb-5 select-none">
          <h3 className="text-base sm:text-lg font-bold text-surface-900 tracking-tight">{title}</h3>
          <button
            onClick={handleClose}
            className="text-surface-500 hover:text-surface-900 dark:hover:text-surface-800 transition-all p-1.5 rounded-xl hover:bg-surface-200/80 dark:hover:bg-surface-300/10 cursor-pointer active:scale-90"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
