import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import hljs from "highlight.js";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import { CdlPageContainer } from "@/components/cdl/layout/cdl-page-container";
import allDocs, { type Doc } from "virtual:docs";
import config from "virtual:spec-config";

const DOC_PATHS = new Set(allDocs.map((d) => d.path));

// Group order from config: configured labels (in order), then "Feature Library",
// then "Docs". The finder appends any other groups encountered (alphabetical) so a
// new/renamed group is never silently dropped.
const GROUP_ORDER = config.docs?.groupOrder ?? ["Feature Library", "Docs"];

// The brand theme, or undefined. `null` in the config is the deliberate "no theme"
// answer: base CDL greyscale, and `usePageTheme` then sets no `data-theme` attribute at
// all. `undefined` is what CdlPageContainer wants for that, hence the coercion rather
// than passing the config value straight through. See src/themes/index.ts.
const THEME = config.branding?.theme ?? undefined;

// Landing doc: config.docs.home → first rootFile-ish → first available doc. If the
// configured home isn't a known doc, fall back to the first doc in the corpus.
const HOME = (() => {
  const want = config.docs?.home;
  if (want && DOC_PATHS.has(want)) return want;
  if (DOC_PATHS.has("README.md")) return "README.md";
  return allDocs[0]?.path ?? "README.md";
})();

// ── helpers ──────────────────────────────────────────────────────────────────
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Resolve a relative markdown link (from a doc) to a repo-relative path. */
function resolveDocPath(from: string, href: string): string {
  const clean = href.split("#")[0].split("?")[0];
  if (!clean) return "";
  const parts = from.includes("/") ? from.slice(0, from.lastIndexOf("/")).split("/") : [];
  for (const seg of clean.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

function pathFromHash(): string {
  const h = location.hash.replace(/^#\/?/, "");
  return h ? decodeURIComponent(h) : HOME;
}

function go(path: string) {
  location.hash = "#/" + path;
}

// ── code + mermaid + links ─────────────────────────────────────────────────
function CodeBlock({ lang, code }: { lang?: string; code: string }) {
  const html = useMemo(() => {
    try {
      if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
    } catch {
      /* fall through to plain */
    }
    return escapeHtml(code);
  }, [lang, code]);
  return (
    <pre className="hljs">
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  );
}

let mermaidReady = false;
function Mermaid({ code }: { code: string }) {
  const [svg, setSvg] = useState("");
  const [err, setErr] = useState(false);
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  useEffect(() => {
    if (!mermaidReady) {
      mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });
      mermaidReady = true;
    }
    let alive = true;
    mermaid
      .render("mmd-" + rawId, code)
      .then((r) => alive && setSvg(r.svg))
      .catch(() => alive && setErr(true));
    return () => {
      alive = false;
    };
  }, [code, rawId]);
  if (err) return <pre className="hljs">{code}</pre>;
  if (!svg) return <div className="py-4 text-sm text-muted-foreground">Rendering diagram…</div>;
  return <div className="mermaid-svg" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function DocLink({ href, from, children }: { href?: string; from: string; children: ReactNode }) {
  // Prose links are `prose-a:text-primary` from the article wrapper, so the accent comes
  // from the theme's `--primary` token rather than from a brand utility of our own.
  const cls = "underline decoration-primary/40 underline-offset-2 hover:decoration-primary";
  if (!href) return <span>{children}</span>;
  if (/^(https?:|mailto:)/.test(href))
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {children}
      </a>
    );
  if (href.startsWith("#"))
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  const target = resolveDocPath(from, href);
  if (target && DOC_PATHS.has(target))
    return (
      <a
        href={"#/" + target}
        className={cls}
        onClick={(e) => {
          e.preventDefault();
          go(target);
        }}
      >
        {children}
      </a>
    );
  // Points at a non-doc file (code/asset) or unknown: show, but don't navigate.
  return (
    <span className="text-muted-foreground underline decoration-dotted" title={target || href}>
      {children}
    </span>
  );
}

function markdownComponents(from: string): Components {
  return {
    a: ({ href, children }) => (
      <DocLink href={href} from={from}>
        {children}
      </DocLink>
    ),
    pre: ({ children }) => <>{children}</>,
    code: ({ className, children }) => {
      const text = String(children ?? "");
      const lang = /language-([\w-]+)/.exec(className ?? "")?.[1];
      const block = !!lang || text.includes("\n");
      if (lang === "mermaid") return <Mermaid code={text.replace(/\n+$/, "")} />;
      if (block) return <CodeBlock lang={lang} code={text.replace(/\n+$/, "")} />;
      return <code className="rounded bg-muted px-1 py-0.5 text-[0.85em] text-foreground">{children}</code>;
    },
  };
}

// ── the finder ────────────────────────────────────────────────────────────────
function rank(d: Doc): [number, string] {
  // No-id docs (overview, section READMEs) before tickets; tickets by id; else title.
  return d.data.id ? [1, String(d.data.id)] : [0, d.title.toLowerCase()];
}

/** One doc row. Scrolls itself into view when it's the active one. */
function DocEntry({ doc, active }: { doc: Doc; active: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  // A corpus with a long section deep-links into rows far below the fold.
  // `block: "nearest"` scrolls the finder the minimum needed and leaves it alone when
  // the row is already visible.
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest" });
  }, [active]);
  return (
    <button
      ref={ref}
      onClick={() => go(doc.path)}
      aria-current={active ? "page" : undefined}
      className={`w-full rounded-md px-2 py-1.5 text-left transition-colors ${
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      }`}
      title={doc.path}
    >
      {doc.data.id && (
        <span
          className={`mr-1.5 font-mono text-[11px] ${
            active ? "text-sidebar-primary-foreground/75" : "text-sidebar-foreground/45"
          }`}
        >
          {String(doc.data.id)}
        </span>
      )}
      <span className="align-middle">{doc.title}</span>
    </button>
  );
}

/** The disclosure chevron: rotates a quarter turn when its section is open. */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

/**
 * The doc finder: search box + the grouped nav, and nothing else.
 *
 * Rendered into `CdlPageContainer`'s `sidebarContent`, which is CDL's own hatch for a
 * sidebar body that `navGroups` cannot express. It cannot: `navGroups` renders a fixed
 * set of links given at mount, and this list is derived from the corpus and re-derived on
 * every keystroke of the search box. `CdlTree` is not the answer either; it is a file
 * *manager* (folder/file icons, a per-row Rename/Delete menu, drag-to-move, multi-select),
 * all of which is wrong for a read-only portal.
 *
 * So the tree is the portal's own and everything around it (the sidebar surface, the
 * collapse behaviour, the theme control, the identity row) is CDL's. Every colour here is
 * a `sidebar-*` token for that reason: the surface behind it belongs to the theme, and a
 * hardcoded slate would be wrong the moment a brand overlay darkened it.
 */
function DocFinder({ current, query, setQuery }: { current: string; query: string; setQuery: (q: string) => void }) {
  const q = query.trim().toLowerCase();
  const groups = useMemo(() => {
    const map = new Map<string, Doc[]>();
    for (const d of allDocs) {
      if (q && !d.title.toLowerCase().includes(q) && !d.path.toLowerCase().includes(q)) continue;
      (map.get(d.group) ?? map.set(d.group, []).get(d.group)!).push(d);
    }
    for (const list of map.values())
      list.sort((a, b) => {
        const [ar, as] = rank(a);
        const [br, bs] = rank(b);
        return ar !== br ? ar - br : as.localeCompare(bs);
      });
    // Ordered groups first, then ANY group not in GROUP_ORDER (alphabetical) so a
    // new/renamed group is never silently dropped from the nav.
    const ordered = GROUP_ORDER.filter((g) => map.has(g));
    const extra = [...map.keys()].filter((g) => !GROUP_ORDER.includes(g)).sort();
    return [...ordered, ...extra].map((g) => [g, map.get(g)!] as const);
  }, [q]);

  // Expansion is additive: opening one section never closes a sibling. Seeded with the
  // section holding the doc the app booted on, so a shared `#/…` URL lands already
  // expanded, and re-seeded on navigation so an in-body link does the same.
  const groupOfCurrent = allDocs.find((d) => d.path === current)?.group;
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(groupOfCurrent ? [groupOfCurrent] : []));
  useEffect(() => {
    if (!groupOfCurrent) return;
    setOpenGroups((prev) => (prev.has(groupOfCurrent) ? prev : new Set(prev).add(groupOfCurrent)));
  }, [groupOfCurrent]);

  const toggle = (g: string) =>
    setOpenGroups((prev) => {
      const n = new Set(prev);
      if (n.has(g)) n.delete(g);
      else n.add(g);
      return n;
    });

  return (
    // `group-data-[collapsible=icon]:hidden`: the finder is a tree of text and cannot
    // shrink to an icon rail, so it withdraws when the sidebar collapses, exactly as
    // CDL does with its own free-form `content` slots.
    <div className="flex min-h-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
      <div className="px-2 pb-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a doc…"
          className="w-full rounded-md border border-sidebar-border bg-sidebar-accent/40 px-2.5 py-1.5 text-[13px] text-sidebar-foreground outline-none placeholder:text-sidebar-foreground/40 focus:border-sidebar-ring focus:ring-2 focus:ring-sidebar-ring/30"
        />
      </div>
      {/* `overscroll-contain` keeps a flick at the end of a long tree from chaining
          into whatever is behind it. */}
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2 text-[13px]">
        {groups.map(([group, docs]) => {
          // A live search query pins every section open, so matches are visible where
          // they are rather than behind a chevron the reader has to guess at.
          const expanded = !!q || openGroups.has(group);
          return (
            <div key={group} className="mb-1">
              <button
                type="button"
                onClick={() => toggle(group)}
                aria-expanded={expanded}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Chevron open={expanded} />
                <span className="flex-1 truncate">{group}</span>
                <span className="font-normal text-sidebar-foreground/40">{docs.length}</span>
              </button>
              {expanded && (
                <div className="mt-0.5 pl-3.5">
                  {docs.map((d) => (
                    <DocEntry key={d.path} doc={d} active={d.path === current} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {groups.length === 0 && <div className="px-2 py-4 text-sidebar-foreground/40">No matching docs.</div>}
      </nav>
    </div>
  );
}

// ── app ─────────────────────────────────────────────────────────────────────
export function App() {
  const byPath = useMemo(() => new Map(allDocs.map((d) => [d.path, d])), []);
  const [path, setPath] = useState(pathFromHash());
  const [raw, setRaw] = useState(false);
  const [query, setQuery] = useState("");
  // `CdlPageContainer`'s <main>, which is the ONLY scroller on the page since index.css
  // pinned html/body to the viewport. Reached through the container's `contentRef` prop
  // because nothing else can reach it; pointing this at the document column instead
  // makes `scrollTo` a silent no-op on a non-scrolling element.
  const scroller = useRef<HTMLElement>(null);

  useEffect(() => {
    const onHash = () => setPath(pathFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // The document this effect has already settled. Seeded with the path the app mounted
  // on, so the effect's FIRST run is never treated as a navigation: `useEffect(…, [path])`
  // runs on mount as well as on change, and without the guard every re-mount (a hot
  // reload, a restored session) yanks the reader to the top of a page they never left.
  const settledPath = useRef(path);

  // A new page opens at its top, and ONLY a new page. React keeps CdlPageContainer's
  // <main> mounted across a hash change and swaps only its children, so its scrollTop
  // survives the navigation unless something resets it. That reset is this.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (import.meta.env.DEV) {
      // The failure mode here is silence: `scrollTo` on a non-scrolling element throws
      // nothing and logs nothing, so a ref pointed one element off the scroller looks
      // exactly like a working scroll reset. Say so instead.
      const overflowY = getComputedStyle(el).overflowY;
      if (overflowY !== "auto" && overflowY !== "scroll") {
        throw new Error(
          `the scroll-reset ref points at a <${el.tagName.toLowerCase()}> with overflow-y: ` +
            `${overflowY}, which cannot scroll, so scrollTo(0, 0) is a silent no-op and every ` +
            `page will open wherever the reader left the last one. The ref must be the element ` +
            `CdlPageContainer marks as its content scroller (its \`contentRef\` prop).`,
        );
      }
    }
    // Same document: the reader's position is theirs. Not ours to move, for any reason.
    if (settledPath.current === path) return;
    settledPath.current = path;
    setRaw(false);
    el.scrollTo(0, 0);
  }, [path]);

  const doc = byPath.get(path) ?? byPath.get(HOME) ?? allDocs[0];

  // No docs at all: render an empty-state shell rather than crashing.
  if (!doc)
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
        No documentation found. Add a doc and reload.
      </div>
    );

  return (
    <CdlPageContainer
      // null in the config means base CDL greyscale, and that is a design rather than a
      // gap: no `data-theme` is set and the tokens stand as they come from the registry.
      theme={THEME}
      title={doc.title}
      // The containing directory as the breadcrumb, not the whole path: CdlPageHeader
      // appends `title` as the current crumb itself, so passing the filename too would
      // print the doc's name twice. The full path is one hover away in `titleInfo`.
      segments={[doc.path.includes("/") ? doc.path.slice(0, doc.path.lastIndexOf("/")) : doc.group]}
      titleInfo={doc.path}
      actions={
        <Button variant={raw ? "default" : "outline"} size="sm" onClick={() => setRaw((r) => !r)}>
          {raw ? "Rendered" : "Raw"}
        </Button>
      }
      sidebar={{
        appName: config.name,
        appDescription: "Spec Kit docs",
        // `hideSettings` is a local addition to the vendored component: a read-only
        // portal has no settings to offer. See the prop's doc comment in
        // cdl-app-sidebar.tsx. The Light/Dark/Auto control and the identity row stay.
        hideSettings: true,
      }}
      sidebarContent={<DocFinder current={doc.path} query={query} setQuery={setQuery} />}
      contentClassName="items-center"
      // The scroller itself, which this component owns and nothing else can reach. A
      // shell migration that drops this prop fails `tsc -b` here rather than quietly
      // reinstating a dead scroll reset.
      contentRef={scroller}
    >
      {/* The document column: just the measure, since CdlPageContainer owns the scroller.
          It is NOT the scroller and must not receive `scroller`. */}
      <div className="w-full max-w-4xl">
        <div className="mb-4 border-b border-border pb-3">
          <code className="truncate text-[12px] text-muted-foreground">{doc.path}</code>
        </div>

        {raw ? (
          <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-foreground">
            {doc.body}
          </pre>
        ) : (
          <article className="doc-prose prose prose-neutral max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-a:text-primary prose-pre:bg-transparent prose-pre:p-0 prose-code:before:content-none prose-code:after:content-none prose-img:rounded-lg">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents(doc.path)}>
              {doc.body}
            </ReactMarkdown>
          </article>
        )}
      </div>
    </CdlPageContainer>
  );
}
