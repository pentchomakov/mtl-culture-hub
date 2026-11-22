import React from "react"
import { X } from "lucide-react"
import { Dialog } from "radix-ui"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CdlDrawerProps {
  /** Whether the drawer is open. Controlled — pair with `onOpenChange`. */
  open: boolean
  /** Called with `false` when the user dismisses the drawer (close button, overlay click, Escape). */
  onOpenChange: (open: boolean) => void
  /**
   * Header row content, doubling as the drawer's accessible title (it renders
   * inside the dialog's `Title`, which labels the dialog for screen readers).
   * Provide it whenever possible; without it, a visually hidden "Drawer"
   * fallback keeps the dialog labelled.
   */
  header?: React.ReactNode
  /**
   * Pinned below the scrollable body, e.g. an action row. The drawer supplies the
   * inset, so pass the row itself — do not wrap it in a padded container.
   */
  footer?: React.ReactNode
  /** Class names merged onto the footer slot, after its defaults — e.g. `"p-3"` to tighten the built-in inset. */
  footerClassName?: string
  /**
   * Scrollable body content. The drawer supplies the inset, so pass the content
   * itself — do not wrap it in a padded container. Set `flushBody` when the
   * content must run edge to edge.
   */
  children?: React.ReactNode
  /**
   * Panel width: 384px, 480px (default), 576px, 768px, or 960px. Reach past
   * `lg` only for a drawer that holds a working table — a worksheet the reader
   * edits column by column. A drawer this wide covers most of the page, so a
   * detail list never needs one.
   */
  width?: "sm" | "md" | "lg" | "xl" | "2xl"
  /**
   * Set to `true` to drop the body inset so the content runs edge to edge. Use it
   * for a table, or for stacked sections that carry their own dividers and
   * padding. The footer keeps its inset either way.
   */
  flushBody?: boolean
  /**
   * Set to `false` when the content manages its own scrolling — a full-height
   * table, or a tab set with `fill`. The body then bounds the content to the
   * panel's height instead of wrapping it in a scroll area, so the overflow
   * happens inside the content and its own sticky header stays put. Defaults to
   * `true`, which scrolls the whole body.
   */
  bodyScroll?: boolean
}

const widthClass: Record<string, string> = {
  sm: "w-[384px]",
  md: "w-[480px]",
  lg: "w-[576px]",
  xl: "w-[768px]",
  "2xl": "w-[960px]",
}

export function CdlDrawer({
  open,
  onOpenChange,
  header,
  footer,
  footerClassName,
  children,
  width = "md",
  flushBody = false,
  bodyScroll = true,
}: CdlDrawerProps) {
  // A closing drawer stays mounted for its exit animation, and the first half
  // of that plays at full opacity. Callers read the content off the same state
  // that closing clears — a selected record, a route param — so without this
  // the panel empties out while it is still on screen. Holding the last
  // children keeps it showing what it had until it is gone. Same reasoning as
  // CdlDialog; see the note there.
  const heldHeader = React.useRef(header)
  const heldFooter = React.useRef(footer)
  const heldChildren = React.useRef(children)
  if (open) {
    heldHeader.current = header
    heldFooter.current = footer
    heldChildren.current = children
  }
  const shownHeader = open ? header : heldHeader.current
  const shownFooter = open ? footer : heldFooter.current
  const shownChildren = open ? children : heldChildren.current

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/40",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />

        {/* Panel. The body is free-form content rather than a single summary
            sentence, so there is no Dialog.Description — aria-describedby is
            cleared explicitly to keep the dialog's a11y contract honest. */}
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cn(
            "fixed z-50 top-4 right-4 bottom-4 flex flex-col",
            "bg-background rounded-xl overflow-hidden border border-border",
            "shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
            "data-[state=open]:duration-300 data-[state=closed]:duration-200",
            "transition ease-in-out",
            // A fixed width would run off a narrow laptop at the two wide
            // sizes, so the panel never exceeds the viewport less a gutter.
            "max-w-[calc(100vw-2rem)]",
            widthClass[width],
          )}
        >
          {/* Header row — always renders; carries the close button. The header
              content is the dialog's accessible title; a hidden fallback keeps
              the dialog labelled when no header is given. */}
          <div className="shrink-0 min-h-11 flex items-center gap-2.5 px-4 py-2 border-b">
            <Dialog.Title className="flex-1 min-w-0 text-base font-medium">
              {shownHeader ?? <span className="sr-only">Drawer</span>}
            </Dialog.Title>
            <Dialog.Close
              className={cn(
                "shrink-0 rounded-sm opacity-70 transition-opacity",
                "hover:opacity-100",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "disabled:pointer-events-none",
              )}
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>

          {/* Scrollable body. The inset lives here, not in the caller, so every
              drawer reads the same; `flushBody` drops it for edge-to-edge content. */}
          {shownChildren != null &&
            (bodyScroll ? (
              <ScrollArea
                className={cn(
                  "flex-1 min-h-0",
                  // Radix gives the scroll viewport a `display: table` child, which
                  // grows to its widest content instead of holding the panel width.
                  // A wide child — a table in a wide drawer — then overflows and is
                  // clipped. Blocking that child keeps the body inside the panel and
                  // lets the content scroll itself.
                  "[&_[data-slot=scroll-area-viewport]>div]:!block",
                )}
              >
                <div className={cn("flex flex-col", !flushBody && "p-4")}>{shownChildren}</div>
              </ScrollArea>
            ) : (
              // No scroll area: the content is bounded to what is left of the
              // panel and scrolls whatever part of itself it chooses to.
              <div className={cn("flex min-h-0 flex-1 flex-col", !flushBody && "p-4")}>
                {shownChildren}
              </div>
            ))}

          {/* Footer — the inset matches the body, so an action row lines up with
              the content above it. */}
          {shownFooter != null && (
            <div className={cn("shrink-0 border-t px-4 py-3", footerClassName)}>{shownFooter}</div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
