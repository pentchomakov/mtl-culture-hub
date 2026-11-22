import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { App } from "./App";
import "highlight.js/styles/github.css";
import "./index.css";

/**
 * Two providers CDL requires, and why each is the one it is.
 *
 * `HashRouter`: `CdlAppSidebar` calls `useLocation()` to highlight the active nav item,
 * so anything rendering it must sit inside a router or it throws on mount. Hash routing
 * rather than browser routing because the portal's URLs are `#/<doc-path>`, which also
 * works from a file:// open and needs no server rewrite rule; `HashRouter` reads the same
 * hash the app's own `pathFromHash`/`go` pair writes, so the two agree rather than
 * compete. The app keeps owning navigation. The router is here for CDL's benefit, not to
 * replace it.
 *
 * `TooltipProvider`: the sidebar's tooltips (including nav labels, which are tooltipped
 * when truncated) need a provider above them. Without one they silently never appear.
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <TooltipProvider delayDuration={300}>
        <App />
      </TooltipProvider>
    </HashRouter>
  </StrictMode>,
);
