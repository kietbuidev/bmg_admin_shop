"use client";

import { useClickOutside } from "@/hooks/use-click-outside";
import { cn } from "@/lib/utils";
import { SetStateActionType } from "@/types/set-state-action-type";
import type { ButtonHTMLAttributes } from "react";
import {
  createContext,
  forwardRef,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
} from "react";

type DropdownContextType = {
  isOpen: boolean;
  handleOpen: () => void;
  handleClose: () => void;
};

const DropdownContext = createContext<DropdownContextType | null>(null);

function useDropdownContext() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("useDropdownContext must be used within a Dropdown");
  }
  return context;
}

type DropdownProps = {
  children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: SetStateActionType<boolean>;
};

export function Dropdown({ children, isOpen, setIsOpen }: DropdownProps) {
  const triggerRef = useRef<HTMLElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      handleClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
    } else {
      setTimeout(() => {
        triggerRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  function handleClose() {
    setIsOpen(false);
  }

  function handleOpen() {
    setIsOpen(true);
  }

  return (
    <DropdownContext.Provider value={{ isOpen, handleOpen, handleClose }}>
      <div className="relative" onKeyDown={handleKeyDown}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

type DropdownContentProps = {
  align?: "start" | "end" | "center";
  side?: "top" | "bottom";
  className?: string;
  children: React.ReactNode;
};

function getPositionClasses(
  side: "top" | "bottom",
  align: "start" | "end" | "center",
) {
  const horizontalClass =
    align === "center"
      ? "left-1/2 -translate-x-1/2"
      : align === "start"
        ? "left-0"
        : "right-0";

  if (side === "top") {
    const origin =
      align === "center"
        ? "origin-bottom"
        : align === "start"
          ? "origin-bottom-left"
          : "origin-bottom-right";
    return `bottom-full mb-2 ${origin} ${horizontalClass}`;
  }

  const origin =
    align === "center"
      ? "origin-top"
      : align === "start"
        ? "origin-top-left"
        : "origin-top-right";
  return `top-full mt-2 ${origin} ${horizontalClass}`;
}

export function DropdownContent({
  children,
  align = "center",
  side = "bottom",
  className,
}: DropdownContentProps) {
  const { isOpen, handleClose } = useDropdownContext();

  const contentRef = useClickOutside<HTMLDivElement>(() => {
    if (isOpen) handleClose();
  });

  if (!isOpen) return null;

  return (
    <div
      ref={contentRef}
      role="menu"
      aria-orientation="vertical"
      className={cn(
        "fade-in-0 zoom-in-95 pointer-events-auto absolute z-99 min-w-[8rem] rounded-lg animate-in",
        getPositionClasses(side, align),
        className,
      )}
    >
      {children}
    </div>
  );
}

type DropdownTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export const DropdownTrigger = forwardRef<HTMLButtonElement, DropdownTriggerProps>(
  ({ children, className, onClick, ...props }, ref) => {
    const { handleOpen, isOpen } = useDropdownContext();

    function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      if (!event.defaultPrevented) {
        handleOpen();
      }
    }

    return (
      <button
        ref={ref}
        className={className}
        onClick={handleClick}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        data-state={isOpen ? "open" : "closed"}
        {...props}
      >
        {children}
      </button>
    );
  },
);

DropdownTrigger.displayName = "DropdownTrigger";

export function DropdownClose({ children }: PropsWithChildren) {
  const { handleClose } = useDropdownContext();

  return <div onClick={handleClose}>{children}</div>;
}
