"use client";

import { useEffect, useRef, useState } from "react";

type Theme = "light" | "dark";

type Props = {
  userName?: string;
  onSignOut: () => void;
};

const STORAGE_KEY = "pre-legal-theme";

export function AccountBubble({ userName, onSignOut }: Props) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const rootRef = useRef<HTMLDivElement>(null);

  // Apply saved theme on first mount.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial: Theme = stored === "dark" ? "dark" : "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  // Close on outside click / Escape.
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  function applyTheme(next: Theme) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  const initials = (userName || "PL").trim().slice(0, 2).toUpperCase();

  return (
    <div ref={rootRef} className="fixed bottom-5 left-5 z-50">
      {open && (
        <div className="absolute bottom-14 left-0 w-56 rounded-xl border border-black/10 bg-white p-2 shadow-xl">
          <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-neutral-400">Theme</p>
          <div className="mb-2 flex gap-1 px-2">
            <button
              type="button"
              onClick={() => applyTheme("light")}
              className={`flex-1 rounded-md px-2 py-1.5 text-sm transition ${
                theme === "light" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => applyTheme("dark")}
              className={`flex-1 rounded-md px-2 py-1.5 text-sm transition ${
                theme === "dark" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              Dark
            </button>
          </div>
          <div className="my-1 h-px bg-black/10" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="w-full rounded-md px-2 py-1.5 text-left text-sm text-red-600 transition hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white shadow-lg transition hover:scale-105"
      >
        {initials}
      </button>
    </div>
  );
}
