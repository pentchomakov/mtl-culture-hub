import { type ReactNode, useEffect } from "react";

// Module-level, deliberately: the count has to outlive any one Modal instance, because the
// point of it is what happens when two of them overlap.
let openModals = 0;
let previousOverflow = "";

/**
 * The board's one modal shell: scrim, centred panel, click-outside and Escape to close.
 *
 * Both modals (a ticket's detail view and the Summary recap) mount through here so the
 * dismiss behaviour is defined once. Each supplies its own header, because a ticket
 * header carries an id and a status pill while the recap header carries a stamp and a
 * Copy button, and merging those into one prop list buys nothing.
 */
export function Modal({
  onClose,
  labelledBy,
  children,
}: {
  onClose: () => void;
  /** Id of the element naming the dialog, for assistive tech. */
  labelledBy?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock the page behind the modal while it is open.
  //
  // The scrim is already `fixed`, so it cannot itself drift. What made the dim area look
  // like it was being dragged upward was the board scrolling behind it: a wheel gesture
  // that reaches the end of the panel's own scroll chains to the document, the page moves
  // under a stationary scrim, and the eye reads the scrim as the thing that shifted. So
  // two halves are needed and neither is sufficient alone: `overscroll-contain` below
  // stops the chaining, and the lock here stops a page that was already mid-scroll from
  // moving at all.
  //
  // The previous value is restored rather than cleared, because clearing would discard an
  // overflow the app itself had set. Ref-counted so two overlays open at once (a recap
  // opened over a ticket) do not have the first one's unmount unlock the page under the
  // second.
  useEffect(() => {
    const body = document.body;
    if (openModals === 0) previousOverflow = body.style.overflow;
    openModals += 1;
    body.style.overflow = "hidden";
    return () => {
      openModals -= 1;
      if (openModals === 0) body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      // The scrim is the foreground token at 40%, which is a dark wash over the light
      // board. In dark mode that token is near-white, and a light wash would lift the
      // page above the panel sitting on it, so the dark side gets its own scrim rather
      // than an inverted one.
      //
      // `h-dvh` over `inset-0`'s implied height: on mobile Safari the initial containing
      // block is the LARGE viewport, so a scrim sized to it hides its own bottom edge
      // behind the browser chrome until the toolbars collapse. The dynamic unit tracks
      // the visible viewport instead, which is the edge the user can actually see.
      className="fixed inset-0 z-50 flex h-dvh items-start justify-center overflow-y-auto overscroll-contain bg-foreground/40 p-4 dark:bg-black/60 sm:p-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="my-4 w-full max-w-3xl rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/** Shared close affordance, so both modal headers dismiss the same way. */
export function ModalClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="rounded-lg px-2 py-1 text-lg leading-none text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      ✕
    </button>
  );
}
