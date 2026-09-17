"use client";

import * as React from "react";

interface DropdownContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null);

function useDropdown() {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) {
    throw new Error("DropdownMenu components must be used within a DropdownMenu");
  }
  return ctx;
}

export function DropdownMenu({
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (valueOrFn: React.SetStateAction<boolean>) => {
      const next = typeof valueOrFn === "function" ? valueOrFn(open) : valueOrFn;
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, open, onOpenChange]
  );

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownContext.Provider>
  );
}

export interface DropdownMenuTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  render?: React.ReactNode;
  asChild?: boolean;
}

export const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps
>(({ children, render, className = "", onClick, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useDropdown();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented) {
      setOpen((prev) => !prev);
    }
  };

  const combinedRef = (node: HTMLButtonElement | null) => {
    triggerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
  };

  if (render && React.isValidElement(render)) {
    return React.cloneElement(render as React.ReactElement<any>, {
      ref: combinedRef,
      onClick: (e: any) => {
        (render.props as any).onClick?.(e);
        handleClick(e);
      },
      "aria-haspopup": "menu",
      "aria-expanded": open,
    });
  }

  return (
    <button
      ref={combinedRef}
      type="button"
      className={className}
      onClick={handleClick}
      aria-haspopup="menu"
      aria-expanded={open}
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

export function DropdownMenuPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export interface DropdownMenuContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
  className?: string;
}

export const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ className = "", align = "start", side = "top", children, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useDropdown();
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (
        contentRef.current &&
        !contentRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen, triggerRef]);

  if (!open) return null;

  const alignStyles: Record<string, string> = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  };

  const sideStyles: Record<string, string> = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
  };

  return (
    <div
      ref={(node) => {
        contentRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      role="menu"
      className={`absolute ${sideStyles[side] || sideStyles.top} ${
        alignStyles[align] || alignStyles.start
      } z-50 min-w-[12rem] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)] p-1 text-[var(--ink)] shadow-2xl animate-in fade-in-0 zoom-in-95 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

export function DropdownMenuGroup({
  children,
  className = "",
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-0.5 ${className}`}>{children}</div>;
}

export function DropdownMenuLabel({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface DropdownMenuItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
}

export const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuItemProps
>(({ className = "", children, disabled, onClick, ...props }, ref) => {
  const { setOpen } = useDropdown();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onClick?.(e);
    if (!e.defaultPrevented) {
      setOpen(false);
    }
  };

  return (
    <button
      ref={ref}
      role="menuitem"
      disabled={disabled}
      type="button"
      className={`relative flex w-full cursor-pointer select-none items-center justify-between rounded-lg px-2.5 py-2 text-sm font-medium outline-none transition-colors hover:bg-neutral-100 hover:text-[var(--ink)] dark:hover:bg-neutral-800 disabled:pointer-events-none disabled:opacity-50 text-left ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

export function DropdownMenuSeparator({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      className={`my-1 h-px bg-[var(--line)] ${className}`}
      {...props}
    />
  );
}

export function DropdownMenuShortcut({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`ml-auto text-xs tracking-widest text-[var(--ink-soft)] opacity-70 ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

interface SubContextValue {
  openSub: boolean;
  setOpenSub: React.Dispatch<React.SetStateAction<boolean>>;
}

const SubContext = React.createContext<SubContextValue | null>(null);

export function DropdownMenuSub({ children }: { children: React.ReactNode }) {
  const [openSub, setOpenSub] = React.useState(false);
  return (
    <SubContext.Provider value={{ openSub, setOpenSub }}>
      <div
        className="relative"
        onMouseEnter={() => setOpenSub(true)}
        onMouseLeave={() => setOpenSub(false)}
      >
        {children}
      </div>
    </SubContext.Provider>
  );
}

export function DropdownMenuSubTrigger({
  children,
  className = "",
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex cursor-pointer select-none items-center justify-between rounded-lg px-2.5 py-2 text-sm font-medium transition-colors hover:bg-neutral-100 hover:text-[var(--ink)] dark:hover:bg-neutral-800 ${className}`}
    >
      <span>{children}</span>
      <span className="text-xs text-[var(--ink-soft)]">▶</span>
    </div>
  );
}

export function DropdownMenuSubContent({
  children,
  className = "",
}: React.HTMLAttributes<HTMLDivElement>) {
  const subCtx = React.useContext(SubContext);
  if (!subCtx?.openSub) return null;

  return (
    <div
      className={`absolute left-full top-0 ml-1 min-w-[10rem] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)] p-1 text-[var(--ink)] shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
}
