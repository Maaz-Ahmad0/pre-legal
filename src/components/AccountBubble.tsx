"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Theme = "light" | "dark";

export interface AccountBubbleProps {
  user?: {
    name?: string;
    email?: string;
    company?: string;
  } | null;
  onSignOut: () => void;
  onOpenSettings?: () => void;
}

const STORAGE_KEY = "pre-legal-theme";

export function AccountBubble({ user, onSignOut, onOpenSettings }: AccountBubbleProps) {
  const [theme, setTheme] = React.useState<Theme>("light");

  React.useEffect(() => {
    const saved = (window.localStorage.getItem(STORAGE_KEY) as Theme) || "light";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (next: Theme) => {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = (displayName.trim().slice(0, 2) || "PL").toUpperCase();

  return (
    <div className="fixed bottom-5 left-5 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              aria-label="Account and theme menu"
              className="h-11 w-11 rounded-full p-0 border-2 border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] shadow-xl hover:scale-105 transition-transform flex items-center justify-center font-bold text-xs"
            >
              <span className="relative flex h-full w-full items-center justify-center">
                {initials}
                <span
                  className={`absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--panel)] ${
                    theme === "dark" ? "bg-amber-400" : "bg-emerald-500"
                  }`}
                  title={`Theme: ${theme}`}
                />
              </span>
            </Button>
          }
        />
        <DropdownMenuContent className="w-56 mb-2" align="start" side="top">
          <DropdownMenuGroup>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuItem className="flex flex-col items-start gap-0.5 pointer-events-none opacity-90">
              <span className="font-semibold text-xs text-[var(--ink)]">{displayName}</span>
              {user?.email && (
                <span className="text-[11px] text-[var(--ink-soft)] truncate max-w-[12rem]">
                  {user.email}
                </span>
              )}
              {user?.company && (
                <span className="text-[10px] text-[var(--accent)] font-medium">
                  {user.company}
                </span>
              )}
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            {/* Theme switcher */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span className="flex items-center gap-2">
                  <span>{theme === "dark" ? "🌙" : "☀️"}</span>
                  <span>Theme: {theme === "dark" ? "Dark" : "Light"}</span>
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => applyTheme("light")}
                    className={theme === "light" ? "bg-neutral-100 dark:bg-neutral-800 font-semibold" : ""}
                  >
                    <span>☀️ Light Mode</span>
                    {theme === "light" && <span>✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => applyTheme("dark")}
                    className={theme === "dark" ? "bg-neutral-100 dark:bg-neutral-800 font-semibold" : ""}
                  >
                    <span>🌙 Dark Mode</span>
                    {theme === "dark" && <span>✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuItem onClick={toggleTheme}>
              <span>Toggle Mode</span>
              <DropdownMenuShortcut>⌘T</DropdownMenuShortcut>
            </DropdownMenuItem>

            {onOpenSettings && (
              <DropdownMenuItem onClick={onOpenSettings}>
                <span>AI / OpenRouter API</span>
                <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={onSignOut}
              className="text-red-600 dark:text-red-400 hover:!bg-red-50 dark:hover:!bg-red-950/40 hover:!text-red-700"
            >
              <span>Log out</span>
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
