---
name: cdl-demo-review-board
description: Capture every page and tab of a demo as screenshots and lay them out on a FigJam board as a stakeholder-review board — grouped in sections, with a Notes and an Action-items sticky beside each screen. Input: a demo name or route base (plus an optional Figma board URL). Output: a Figma file link.
user-invocable: true
---

# Demo → Figma Review Board

Turn a demo into a FigJam review board. The board holds one full-size screenshot per page/tab, grouped into sections that match the demo's navigation, with sticky notes ready for meeting notes and action items.

**Input**: a demo name or route base (e.g. `flight-profitability-alt`, or a path like `/demo/air-canada/flight-profitability-alt`). Optionally a Figma board URL — if it contains a `node-id` that resolves to a PAGE, build on that page.

**Output**: a link to the Figma board (include the page's `node-id` so the link lands on the right page).

## Step 1 — Enumerate the views

Find every distinct URL a stakeholder would look at:

1. `grep -n` the route base in `packages/demos/src/App.tsx`. Read the surrounding route comments — they document which segments are tabs and which are drill-downs.
2. A "view" is each route plus each named tab value of a `:view?` param (the comments name them, e.g. `/publication` = gates, `/publication/consumers`, `/publication/history`).
3. **Skip drill-down record routes** (`/:feedId?`, `/record/:id`) — drawers over a tab are not separate screens for review purposes. Include them only if the user asks for drill-downs.
4. List the views to the user before capturing, in sidebar-navigation order. That order is also the section order later.

## Step 2 — Capture screenshots (Playwright MCP)

Follow the CLAUDE.md dev-server and browser rules. In short:

1. `curl -s -o /dev/null -w "%{http_code}" http://localhost:5181/` — if it does not respond, ask the user to start `npm run dev -w @cdl/demos`. Never start or kill a server on the fixed port yourself.
2. Batch-load the Playwright tools in ONE `ToolSearch` call: `browser_navigate`, `browser_take_screenshot`, `browser_resize`, `browser_wait_for`, `browser_evaluate`, `browser_close`.
3. `browser_resize` to **1440×900**.
4. For each view: navigate → `browser_wait_for` ~1s (lets React render) → screenshot to `.playwright-mcp/<demo>-NN-<slug>.png` (`scale: "css"`, viewport — never `fullPage`, see below).
5. **Tall pages — capture the full height by resizing the viewport, not with `fullPage`.** These app layouts scroll inside internal containers (`CdlPageContainer`, `CdlDataTable`), so the page body never scrolls and `fullPage: true` captures nothing extra. Instead, measure the hidden overflow with `browser_evaluate`:

```js
() => {
  const scrollables = [...document.querySelectorAll('*')].filter(e => {
    const s = getComputedStyle(e);
    return e.scrollHeight > e.clientHeight + 8 && /(auto|scroll)/.test(s.overflowY);
  });
  const extras = scrollables.map(e => e.scrollHeight - e.clientHeight);
  const docExtra = document.documentElement.scrollHeight - window.innerHeight;
  return { extra: Math.max(0, docExtra, ...extras), scrollableCount: scrollables.length };
}
```

   If `extra` > ~50: `browser_resize(1440, 900 + extra)` → wait ~1s (layout reflows) → re-run the measurement once (a taller viewport can reveal more rows in a nested scroller) → screenshot → `browser_resize` back to 1440×900 before the next view. Cap the height at ~2600 — beyond that the capture is unreadable on the board. Full-height images are 1440×H; see the tall-image note in Step 5.
6. `Read` one PNG to confirm the pages render (catches a broken dev server or auth wall once, not eight times).
7. `browser_close` when done.

## Step 3 — Pick the Figma target

Use the **official Figma MCP** (`mcp__figma__*`). Do not start with the `figma-console` Desktop Bridge — it requires the user to manually run a plugin in Figma Desktop and is usually not connected.

- If the tools fail with an auth error, ask the user to run `/mcp` and authenticate Figma.
- Extract `fileKey` from the board URL (`figma.com/board/<fileKey>/...`).
- If the URL has a `node-id`, resolve it with a read-only `use_figma` — if it is a PAGE, build there. If it is empty/missing, look for an existing page named after the demo, else use the current page. **`figma.createPage()` throws in FigJam** — never call it; ask the user to create a page if a fresh one is needed.
- No URL at all → `mcp__figma__create_new_file` (FigJam) and use its link.

**MANDATORY before any `use_figma` call**: read both MCP resources `skill://figma/figma-use/SKILL.md` and `skill://figma/figma-use-figjam/SKILL.md` (one parallel batch), and pass `skillNames: "resource:figma-use,resource:figma-use-figjam"` on every call.

## Step 4 — Upload the images

`upload_assets` is the ONLY way to get images into FigJam (`figma.createImage`/`createImageAsync` are unsupported there).

1. Call `mcp__figma__upload_assets` with `count: <N>`.
2. POST each PNG with curl, multipart with a `file` field (the filename becomes the layer name). URLs are single-use and expire in 10 minutes, so upload immediately. Run the POSTs in parallel and save each response to a scratch file:

```bash
curl -s -X POST -F "file=@<name>.png;type=image/png" "<submitUrl>" > up1.json &
# ... one per image ...
wait; cat up*.json
```

3. Each response has `placedOnNodeId` — **map it back to the file you POSTed to that URL** (responses land on whatever page is current in no particular node-id order). Keep this mapping; it drives every later step.
4. Delete the `up*.json` scratch files when done.

## Step 5 — Arrange the board

Group screens by functional area (one section per sidebar nav item), sections stacked vertically in nav order. Work in small `use_figma` calls; **one `setCurrentPageAsync` per call**; fan independent per-section calls out in parallel in a single message.

**Before arranging anything, `Read` [references/section-layout.png](references/section-layout.png)** — it is the ground-truth picture of one finished unit. Your output must match it.

One unit, to scale (all coordinates are section-relative):

```
x:  80                        1520 1560      1976 2016      2432
    │                            │ │            │ │            │
    <Area> — <Tab>          (y 40, Inter Medium 36)
    ┌────────────────────────┐   ┌────────────┐  ┌────────────┐   (y 100)
    │                        │   │ Notes      │  │ Action     │
    │   screenshot           │   │ (yellow,   │  │ items      │
    │   1440 × 900           │   │  wide)     │  │ (salmon,   │
    │                        │   └────────────┘  │  wide)     │
    │                        │    416 × 240      └────────────┘
    │                        │   ← stickies grow DOWNWARD as
    │                        │     notes are typed; the empty
    └────────────────────────┘     space below is deliberate
```

**Stickies sit side by side, never stacked.** A sticky grows taller as text is typed into it; a sticky placed below another would collide mid-meeting. Both stickies are wide (`isWideWidth = true`, 416×240) — plugin API cannot resize stickies to arbitrary sizes, wide is the only wider option.

Geometry recipe (screenshots 1440×900):

| Thing | Value |
|---|---|
| Unit width | 2352 (= 1440 image + 40 + 416 sticky + 40 + 416 sticky) |
| Unit pitch | 2512 (unit + 160 gap); unit `i` at `x0 = 80 + i*2512` |
| Section width | `n_units × 2512` |
| Section height | 1100; vertical gap between sections 240 |
| Label | `(x0, 40)`, Inter Medium 36 |
| Image | `(x0, 100)` |
| Notes sticky | `(x0+1480, 100)`, `isWideWidth = true`, fill `{r:1, g:0.85, b:0.4}` (yellow), text "Notes" |
| Action items sticky | `(x0+1936, 100)`, `isWideWidth = true`, fill `{r:1, g:0.69, b:0.64}` (salmon), text "Action items" |

**Tall images** (full-height captures from Step 2, 1440×H with H > 900): keep every x/y above unchanged — only the section grows. Section height = tallest image in the section + 200 (never below 1100). Compute each section's y cumulatively: previous section's y + its height + 240. After upload, `resize(1440, H)` each tall node to its true PNG height, not 900.

Sequence:

1. **Move + name**: `page.appendChild(imageNode)` for each upload, rename to `NN <Area> — <Tab>`.
2. **Sections**: `figma.createSection()`, name per area, `resizeWithoutConstraints(w, h)`.
3. **Fill sections** (one parallel `use_figma` call per section): `section.appendChild(node)` then set `x/y` — **section children use section-relative coordinates**, so always position after reparenting. Create labels (`figma.createText`) and stickies (`figma.createSticky`; set `isWideWidth = true`, then text via `sticky.text.characters`). `await figma.loadFontAsync({family:'Inter', style:'Medium'})` before setting any text.
4. Return all created/mutated node IDs from every call.

## Step 6 — Verify and report

1. Screenshot at least two sections (`await section.screenshot()` inline). To screenshot loose page content with no section, temporarily `figma.group(page.children.slice(), page)` → `group.screenshot()` → `figma.ungroup(group)`.
2. **Compare against [references/section-layout.png](references/section-layout.png)** and check every line of this list:
   - Label above the image, image below it at full size.
   - Notes and Action-items stickies **side by side** to the right of the image, tops aligned with the image top. Stacked stickies = wrong, fix before reporting.
   - Both stickies are wide (416 wide, not 240).
   - Empty space below the stickies (growth room) — the section is much taller than the stickies.
   - Sections in sidebar-nav order, nothing overlapping.
3. If the screenshot does not match the reference, fix and re-verify before reporting. Do not report a board that fails the checklist.
4. Report the board link **with the page's `node-id`** (`https://www.figma.com/board/<fileKey>/<name>?node-id=<page-id-with-dash>`), the section list, and where the PNGs live (`.playwright-mcp/`).

## Playwright setup & recovery

Commands and fixes for when the browser side misbehaves:

- **Headless config**: the `--headless` flag lives in the plugin's `.mcp.json` (marketplace copy and the cache copy under `~/.claude/plugins/`). A plugin update can overwrite the file and drop the flag — if a visible window appears, re-add the flag instead of working headed.
- **Missing browser binary**: an error like `Executable doesn't exist … run "npx playwright install"` means the Playwright browser is not installed. Run `npx playwright install chromium` once, then retry the call.
- **"Browser is already in use for ~/Library/Caches/ms-playwright-mcp/mcp-chrome-<hash>"** on every call: the MCP server lost its handle, but its Chrome still holds the profile lock. Find it with `pgrep -fl "ms-playwright-mcp/mcp-chrome"`, then `kill` only the main Chrome PID — the one whose command line starts with `/Applications/Google Chrome.app/…/MacOS/Google Chrome` and carries `--user-data-dir=` for that profile. Helpers exit with it. This is Playwright's own automation profile, never the user's browser or a dev server, so the kill is safe. The next `browser_navigate` relaunches cleanly.
- **Blank screenshots after a failure**: a failed `browser_take_screenshot` leaves the page on `about:blank`. Navigate again before the retry, or the retry captures a blank image.
- **Transform check without a browser**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5181/src/pages/<file>.tsx` — Vite returns 500 on a transform error, 200 when the module compiles.

## Gotchas learned the hard way

- The `figma-console` (Desktop Bridge) MCP fails with "No active file connected" unless the user manually runs its plugin in Figma Desktop. The official `figma` MCP needs only `/mcp` auth — prefer it.
- `get_metadata` does not work on FigJam files; use a read-only `use_figma` script (or `get_figjam`) to inspect.
- Upload responses tell you `placedOnNodeId` but nothing about which page — the images land on the file's current page, wherever that is. Always move them explicitly to the target page.
- Sticky/label text without a prior `loadFontAsync` throws `Cannot write to node with unloaded font`.
- `fullPage: true` never helps on these demos — the page body does not scroll, the inner containers do. The only way to capture hidden rows is the viewport-resize recipe in Step 2.
- Stickies have no `resize()` in the plugin API. `isWideWidth = true` (416×240) is the only size lever. They auto-grow taller as text is typed — which is why the layout puts them side by side with empty space below, never stacked.
- Do not try to pull a PNG out of Figma via `exportAsync` + `figma.base64Encode` in a `use_figma` return value — the tool result truncates at ~20 KB, so anything but a tiny image comes back unusable.

<!-- Mirrored from compassanalytics/compass-design-library (.claude/skills/cdl-demo-review-board) retrieved: 2026-11-22.
Refresh: re-run the fetch in CLAUDE.md's App style standard section. -->
