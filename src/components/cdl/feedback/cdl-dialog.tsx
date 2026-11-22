import React from "react"
import { X } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export { DialogTrigger as CdlDialogTrigger, DialogClose as CdlDialogClose }

/**
 * The dialog root. Radix's `Dialog`, plus one thing: a closing dialog keeps
 * rendering the content it had.
 *
 * A closing dialog stays mounted for the length of its exit animation (200ms),
 * and the first half of that plays at full opacity. Callers drive `open` off
 * the same state the content is read from — `open={record !== null}`, with the
 * title and body read off `record` — so clearing that state on close swaps the
 * content while the panel is still fully visible. The reader watches the dialog
 * turn into a different, usually emptier dialog, and only then fade. Holding
 * the last children fixes it here rather than asking every caller to keep two
 * copies of its own state.
 *
 * Uncontrolled use (a `CdlDialogTrigger` with no `open` prop) passes straight
 * through — there is no close for this to be early for.
 */
export function CdlDialog({ open, children, ...props }: React.ComponentProps<typeof Dialog>) {
  const held = React.useRef(children)
  if (open) held.current = children
  return (
    <Dialog open={open} {...props}>
      {open === undefined ? children : open ? children : held.current}
    </Dialog>
  )
}

interface CdlDialogContentProps {
  children: React.ReactNode
  className?: string
  "data-theme"?: string
  /** Render as a plain div panel (no portal/overlay) — for Storybook previews. */
  standalone?: boolean
}

export function CdlDialogContent({ children, className, "data-theme": dataTheme, standalone }: CdlDialogContentProps) {
  if (standalone) {
    return (
      <div
        className={`rounded-lg border bg-background shadow-lg overflow-hidden ${className ?? ""}`}
        data-theme={dataTheme}
      >
        {children}
      </div>
    )
  }
  return (
    <DialogContent
      showCloseButton={false}
      className={`gap-0 p-0 ${className ?? ""}`}
      data-theme={dataTheme}
      // CdlDialog has no description slot — body content varies too much for
      // one. Explicitly opting out silences Radix's aria-describedby warning.
      aria-describedby={undefined}
    >
      {children}
    </DialogContent>
  )
}

interface CdlDialogHeaderProps {
  title: string
  actions?: React.ReactNode
  /** Render without DialogClose (for use outside a Dialog context, e.g. Storybook previews). */
  standalone?: boolean
}

const closeButtonClass =
  "flex items-center justify-center size-7 rounded-md hover:bg-accent transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function CdlDialogHeader({ title, actions, standalone }: CdlDialogHeaderProps) {
  const titleClass = "flex-1 text-base leading-normal font-medium"
  return (
    <div className="flex items-center gap-2.5 border-b py-2 pl-3 pr-2">
      {/* Radix requires a DialogTitle inside DialogContent for screen readers;
          standalone previews render outside a Dialog context, so a plain <p>. */}
      {standalone ? (
        <p className={titleClass}>{title}</p>
      ) : (
        <DialogTitle className={titleClass}>{title}</DialogTitle>
      )}
      <div className="flex items-center gap-1">
        {actions}
        {standalone ? (
          <div className={closeButtonClass}>
            <X className="size-4 text-muted-foreground" />
          </div>
        ) : (
          <DialogClose className={closeButtonClass}>
            <X className="size-4 text-muted-foreground" />
            <span className="sr-only">Close</span>
          </DialogClose>
        )}
      </div>
    </div>
  )
}

interface CdlDialogBodyProps {
  children: React.ReactNode
  /**
   * Extra classes merged onto the body. Padding defaults to `p-3` (matching the
   * header/footer inset); pass another `p-*` class to change it, or `p-0` for
   * flush content such as a full-bleed table or image.
   */
  className?: string
}

export function CdlDialogBody({ children, className }: CdlDialogBodyProps) {
  return <div className={cn("p-3", className)}>{children}</div>
}

interface CdlDialogFooterProps {
  children: React.ReactNode
  className?: string
}

export function CdlDialogFooter({ children, className }: CdlDialogFooterProps) {
  return (
    <div className={`flex items-center justify-end border-t py-2 pl-3 pr-2 ${className ?? ""}`}>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
