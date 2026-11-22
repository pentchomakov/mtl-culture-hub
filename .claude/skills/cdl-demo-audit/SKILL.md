---
name: cdl-demo-audit
description: Audit a demo at both ends of the build. Mode 1 turns a client brief, requirements document, or wireframe deliverable into an approved route map before any code is written. Mode 2 verifies a built demo against that map, cdl-demo-conventions, and cdl-design-standards. Never writes application code.
user-invocable: true
---

# Demo Audit

## Purpose

A demo can fail at two points. It can start from the wrong page boundaries, and it can drift away from the plan while it is built. This skill guards both ends.

**It writes Markdown files only.** It never writes or edits application code. Mode 2 reports; `cdl-build` applies the fixes.

## The two modes

| Mode | Input | Output | When |
|---|---|---|---|
| **1 — Brief audit** | A brief, requirements doc, or ticket that describes screens | A plan file with a route map, then a stop for approval | Before any code |
| **2 — Build audit** | The plan file, plus the built routes on disk | A findings report, and a reconciled plan file | After the build, and before a demo is shown |

Pick the mode from what the user gives you. A brief or a requirements document means mode 1. A route base, a page path, or a request to check a demo means mode 2. When the user names neither, ask which one.

Mode 2 does not need a plan file. Most demos in this repo predate mode 1. Without a plan, mode 2 skips checks 1 and 2 and runs the rest.

---

# Mode 1 — Brief audit

Client briefs are written by consultants. They interview the business, and they are accurate about the process, the fields, and the pain. They are not interface specifications, and their authors are not designers. Their screen boundaries follow the shape of the interview or of the current Excel file — not the shape of the task.

A demo built straight from a brief inherits those boundaries. The result is awkward: one page that carries three unrelated jobs, a workflow split across pages in an order nobody works in, and a screen count chosen to fill a review session.

Mode 1 runs **before** any code. It reads the brief, separates the business intent from the accidental layout, and produces a route map for the user to approve. `cdl-build` then builds the approved map.

## When to run mode 1

Run it once per demo, at the start:

- A new demo begins from a brief, a requirements document, or a wireframe deliverable.
- A brief is revised, or a revised extract of one screen arrives, and the route map may change.
- An existing demo feels awkward and you want to re-derive its structure from the source.

Skip it for a small change to a page that already exists.

---

## Three rules that govern the whole audit

**1 — Never drop content.** The audit moves and regroups. Every field, KPI, table, chart, and interaction in the brief must appear somewhere in the route map. If something looks unnecessary, keep it and raise it as an open question. The decision to cut is the client's.

**2 — Never add scope.** The audit adds structure, not business functions. New routes, a landing page, and a drill-down are structure. A new process, a new data source, or a new team's workflow is scope — raise it as an open question instead.

**3 — Add the pages the experience needs.** The brief's screen list is coverage, never a page budget. When the user experience reads better across more routes, use more routes. Two clear pages always beat one crowded page.

**Why rule 3 matters.** These demos exist to get people on board, not to ship a final product. Success is a client who follows the flow, understands each screen, and sees their own process in it. A demo that holds every requirement but loses the client has failed, and a page compressed to respect a screen count is the most common way that happens. So spend routes freely on clarity. A new route costs one entry in `packages/demos/src/App.tsx`; a confused client costs the demo.

Rules 2 and 3 do not conflict. A route, a landing page, a drill-down, and a split of one screen into two are all structure, and structure is the audit's job. A new process or a new team's workflow is scope. Record every added route as a deviation in Step 6 so the user sees the change and can accept or reject it.

---

## Step 0 — Name the audience

Before anything else, decide whether this is a **client demo** or a **showcase demo**
(`cdl-demo-conventions` Convention 30). A named client, a business process, a brief or a
requirements document means a client demo, and every rule below applies in full. A
one-line ask to show what the library can do means a showcase, and rule 3 below is
capped: build the routes the story needs and skip the five conventions that add routes
on their own — Overview, monitoring, register, change log, and the About page.

State which one it is in the plan file's first paragraph. Getting this wrong is the most
expensive error mode 1 has: it turns a four-line request into a twelve-route map.

## Step 1 — Read the source material

Read in this order:

1. The brief itself, in full. Do not skim to the screen list.
2. Any revised extract of a single screen sitting beside the brief under its own export name. The extract wins for the screen it names; the brief stays the source of record for the rest. The client overlay names where such a file lives.
3. Any companion assumptions or open-questions file next to it.
4. `cdl-demo-conventions` — what every demo must contain. Its conventions outrank both the brief and this skill, and several of them add routes the brief never lists.
5. The client overlay skill for the suite, when one exists (e.g. `guidance-air-canada` for `/demo/air-canada/*`). It outranks everything above, and it names the suite's file locations and reference pages.
6. `cdl-design-standards` — the project-agnostic design rules the route map must satisfy.
7. One or two sibling demos in the same suite, to match established structure.

---

## Step 2 — Build the job list

A job is one decision that one person makes. Write the list as: **actor → decision → what they need to see to make it.**

Take jobs from the whole brief, not from the screen headings. The brief's process narrative, its "what changes for the user" section, and its interaction lists usually name more jobs than its screen list does.

Mark each job as primary (the demo's story) or supporting.

---

## Step 3 — Build the coverage ledger

List every concrete thing the brief asks to see or do:

- Fields and data objects
- KPIs and figures
- Tables, charts, and their series
- Interactions — filters, edits, approvals, exports, drill-downs
- Roles and permissions

This ledger is the proof of Rule 1. Every entry gets assigned to a route in Step 4. An unassigned entry is an error in the map, not an item to drop.

---

## Step 4 — Draft the route map

Group the jobs into routes. **One route per job.** The brief's screen count sets coverage, not page count.

- A brief screen that holds two or more unrelated jobs becomes two or more routes.
- Several brief screens that are steps of one task become one route with a clear order, or a route plus its own drill-downs.
- A brief screen that is only a control or a filter becomes a control on another route.
- A brief screen that is a report with no decision becomes a drill-down, not a top-level page.
- A brief screen that would stack three or more unrelated tables becomes several routes, or sections within one route. Do not hide the extra tables behind a tab bar to keep the page count down — see Rule 2 in `cdl-design-standards`.
- Add the supporting routes the brief omits — a landing page, a drill-down for each summary, a detail route for each row a user would click.

The map may hold more routes than the brief holds screens. That is the expected outcome, not an exception to justify. Count the routes, list them, and let the user decide.

For each route record: the path, the job it serves, the ledger entries it carries, and the brief screen it comes from.

---

## Step 5 — Check the map against the house rules

Walk the draft map against `cdl-demo-conventions`, the client overlay skill, and `cdl-design-standards`. Common checks — the first five come from `cdl-demo-conventions` and the Demo Routing rules in `CLAUDE.md`:

- The root route is a landing overview, not one specific function.
- Every summary on the overview links to a route that holds the detail.
- Every view is reachable by URL. Nothing is reachable only by a click from another view.
- Every dated or forecast view has a period control and a named baseline.
- A section that is the month-end close is named `month-end`; a forward-planning section is named `outlook`. No section is named after the artifact it produces (`accrual`, `forecast`, `journal`, `variance`, `close`, `plan`).
- Every flagged item has a control that commits the action.
- A demo that ingests feeds has a monitoring route, and each feed has its own log route.
- No page stacks several tab bars, and no KPI row mixes unrelated subjects.
- No route carries a stack of unrelated tables, and no tab bar groups tables that share nothing.
- A section that holds editable master data has a `change-log` view, and the approver commits from it.
- A step-by-step process page whose last step commits the instance names that step for the commit, puts it last, and gates the bar on it (Convention 20).
- Every table on a master-data screen edits in place, and any read-only table names the outside owner that holds its values (Convention 22).
- On a **showcase** demo (Step 0), none of the route-adding conventions were applied by reflex: no Overview over a single page, no monitoring page for feeds nobody named, no register or change log invented to justify an editable table (Convention 30).

Fix the map here, before the user reads it.

---

## Step 6 — List the deviations and the open questions

**Deviations** — each place the map differs from the brief's literal structure. Record what the brief says, what the map does, and why.

**Open questions** — the questions the brief itself raises, plus every question the audit surfaces. Mark each open or answered. A question never blocks the map; state an assumption and continue.

---

## Step 7 — Write the plan file and stop

Write to `docs/briefs/<client>/<demo>/plan.md`. Use this shape:

```markdown
# <Process> — build plan

Derived from `<brief filename>` by `cdl-demo-audit` mode 1 on <date>.
Approved by: <pending>
Build audit: <pending>

## Jobs
| # | Actor | Decision | Primary? |

## Route map
| Route | Job | Carries | From brief screen |

## Brief screen → route mapping
| Brief screen | Routes | Note |

## Deviations from the brief
### D1 — <title>
- **Brief says:**
- **Map does:**
- **Why:**

## Open questions
### Q1 — <question>
- **Status:** open
- **Assumption used:**

## Coverage ledger
| Item | Route | Status |

## Build order
| Wave | Routes | Gate |
```

**Assign every route to a build wave.** The map says what to build; the wave says when. Three waves, and the build stops for the user's approval at each gate:

| Wave | Routes | Test |
|---|---|---|
| 1 — Process | The independent work sections: master data, month-end, outlook, and any other section the user works in directly | It reads no data, field name, or shape from another page of this demo |
| 2 — Derived | Overview, analysis, monitoring, scenarios, and every page that reads a process page | It reads a wave 1 page |
| 3 — About | The About page | It describes the demo itself |

A page's own row-detail and drawer routes ride in the same wave as their parent. Redirects ride in the wave of their target.

The order is dependency-driven, not preference: a derived page built before the process page it reads gets built twice, once now and once after the process page changes in review. It also bounds each review and each turn's context. `cdl-demo` Phase — build holds the full statement of this rule.

Then **stop**. Report the route count against the brief's screen count, the wave counts, the deviations, and the open questions. Wait for the user to approve or change the map.

Do not start the build in the same turn.

---

## Step 8 — Hand off

After approval:

1. Mark the plan file approved, with the date and the name of who approved it.
2. Hand the approved route map to `cdl-build`.
3. When the map changes during the build, update the plan file in place and say so.
4. When the build finishes, run mode 2 on the same route base.

**One record, not two.** The plan file carries the deviations and the open questions until the build ends. Mode 2 then reconciles it and appends the final entries to the demo's assumptions file (`docs/briefs/<client>/<demo>/assumptions.md`), which is the long-lived record. Do not copy the two lists into the assumptions file before then. One list in two files will drift.

---

## Appendix to mode 1 — brief smells and their fixes

A quick catalog of what to look for in Step 4.

### The screen count is a session format

**Smell:** "Design principles, application map, and 4 screens for ...". The number matches the length of a review session, not the number of jobs.

**Fix:** Treat the count as a floor for coverage. Build the routes the jobs need. Report the difference in the plan file. A map with twelve routes against a four-screen brief is a valid result when the client can follow it.

### One screen, several jobs

**Smell:** A screen title joined by "and" or "&", or a Key Data list whose items serve different actors.

**Fix:** Split by actor and decision. Keep a shared route only when the same person does both jobs in one sitting.

### The screen is a stack of tables

**Smell:** One screen's Key Data list names three or more record sets that share no subject and no reader.

**Fix:** Split by reader and decision into separate routes, or into sections of one route when one reader needs them in sequence. Keep tables stacked only when they read as one story. Do not group them under a tab bar to preserve the screen count.

### The screen is an Excel tab

**Smell:** The screen boundary matches a file, a tab, or a data source named in the current-state description.

**Fix:** Regroup by decision. A data source is a feed, not a page.

### The workflow is out of order

**Smell:** Steps of one task are spread across screens that the brief numbers in reporting order, not work order.

**Fix:** Put the task on one route in work order, and give each step its own drill-down if it is deep.

### A control described as a screen

**Smell:** A screen whose whole content is a filter, a period selector, or a toggle.

**Fix:** Make it a control in the page header of the route it filters.

### A report with no decision

**Smell:** A screen that only displays. No interaction list, or an interaction list of "view" and "export".

**Fix:** Make it a drill-down from the route whose decision it supports.

### No landing page

**Smell:** The screen list starts with a specific function, such as monitoring or a workbench.

**Fix:** Add an overview at the root. It summarizes each area and links to it.

### A flag with no action

**Smell:** "Items flagged for review" with no review step in the interactions.

**Fix:** Add the control that commits the action, and raise the missing business rule as an open question.

### A number with no window and no comparator

**Smell:** A forecast, a variance, or a delta with no stated period and no named baseline.

**Fix:** Add a period control and name the baseline in full. Ask the client which baseline is correct.

---

# Mode 2 — Build audit

Mode 1 states what the demo owes. The build then drifts: a route gets renamed, a ledger entry gets forgotten, a convention gets missed on the fifth page after it was honoured on the first four. Mode 2 finds that drift before a client does.

## When to run mode 2

- `cdl-build` finishes a demo, or finishes a batch of pages in one. This is the normal trigger.
- Before a demo is shown to a client, or before a review board is captured.
- The user asks to check, audit, or review a demo, or names a route base or page path.
- An existing demo needs an assessment, and no plan file exists.

Skip it after a one-line copy change.

## Inputs

Take the route base from the user (e.g. `/demo/air-canada/navigation-fees`). Then gather:

1. The plan file at `docs/briefs/<client>/<demo>/plan.md`, when one exists.
2. Every route under that base in this repo's routes file.
3. The page file behind each route, plus its shared data and helper files.
4. `cdl-demo-conventions`, and the client overlay skill for the suite.
5. The demo's assumptions file, when one exists.

## Check 1 — Route conformance

Compare the plan's route map against `App.tsx`. Report three kinds of mismatch:

- **Missing** — the map holds a route that `App.tsx` does not define.
- **Extra** — `App.tsx` defines a route under the base that the map does not list. It may be a good addition, so report it as a plan update, not as an error.
- **Renamed** — a route exists at a different path than the map states. Deep links in the plan and in any shared link are then wrong.

Also confirm each route renders its own page, and that no route redirects to a view the map treats as distinct.

Skip this check when no plan file exists. Say in the report that you skipped it.

## Check 2 — Ledger coverage

Walk the plan's coverage ledger. For each entry, confirm it appears on the route it was assigned to, and mark it:

| Status | Meaning |
|---|---|
| `built` | The entry appears on its route |
| `moved` | It appears on a different route — record which one |
| `missing` | It appears nowhere in the demo |

Every `missing` entry is a finding. It is the direct failure of mode 1's Rule 1, and it is invisible without this check. Do not accept "the page covers it in spirit" — the ledger entry names a field, a figure, a table, or an interaction, so look for that thing.

Skip this check when no plan file exists.

## Check 3 — Convention compliance

Walk every convention in `cdl-demo-conventions` — 1 to 7, 11, 12, 17, and 20 — across the whole demo, then the client overlay's reference shapes and exceptions. Check at the level of the demo, not the page — several conventions can only fail across pages:

- Convention 1 and 3 — the root route is an Overview, and it links to every deep area.
- Convention 2 — a demo with feeds has a monitoring route, and each feed has a log route.
- Convention 4 — every dated view has a period control, and the control changes the data.
- Convention 5 — every delta names its baseline, in the same unit across the list and detail screens.
- Convention 6 — the seeded feeds load clean, and the exceptions block has a positive empty state.
- Convention 7 — every flag has a control that commits, and the commit changes what is on screen.
- Convention 11 — the close section is `month-end`, the planning section is `outlook`, and an analysis view that reads either one carries the same name.
- Convention 12 — a rate, factor or assumption a source system holds is picked by basis on its own row, never typed, and the row drills through to the grid behind the figure: the units down, the periods across, on the row's own path segment. Check that the drill-through reads the picked basis rather than offering a second picker, and that a long window offers a coarser grain in a search param.
- Convention 17 — a section with editable master data carries a `change-log` view whose card lets the approver approve or reject, and `cdl-design-standards` Rule 17 — no editable table also opens a drawer from its row.
- Convention 22 — every table on a master-data register carries editable columns; a read-only table names its outside owner in the block `info` and as a column, and the register's Add-a-row and bulk-edit controls are hidden on that view. Check it column by column: a table whose rows arrive on a feed still edits the values the process owner states.
- Convention 20 — a process page with a commit step renders `navVariant="gated"`, the commit step is last and carries `gate`, every other tab reports `done`, a deep link to the shut gate redirects with a toast, and the commit step lists its own preconditions as a table.
- Convention 27 — on a page parameterized by a query selection, click every tab and every drill-down and read the URL each time. Every param the page renders on must still be there. A selection screen that reopens on a tab click is the failure this catches, and it never shows up in a typecheck.
- Convention 28 — where a process page is parameterized by a run-level choice, confirm the chooser sits in front of the step bar and not on the step that first reads the value. Ask the three tests in the convention: does more than one step read it, does the page have a rerun, and are two values two records?
- Convention 29 — where a section was built to another section's standard, diff the two route surfaces and view sets. A missing step or a renamed view is a finding unless the page comment names the divergence and its reason.
- Convention 30 — check the conventions this demo owes against its audience. On a showcase demo, a missing Overview, monitoring page, register, change log or About page is not a finding; on a client demo it is. Read the audience from the plan file's Step 0 statement, not from the route count.

Convention 4's "the control changes the data" needs a real check, not a glance at the props. Read the data path from the control to the series. A control wired to state that no series reads is the most common miss in this repo.

## Check 4 — Page rules

Run `cdl-design-standards` in review mode on each page file, then fold the results into one list. Deduplicate a rule that fires on many pages into one finding with all the locations, so the report stays readable.

**Then look at the pages.** Checks 1 to 4 read source, and several findings exist only once the page renders — a KPI row whose values sit on two baselines, a table that overflows its block, a tab bar that floats outside the panel, a chart with no room for its legend. Screenshot the demo's main routes and read them. Follow the browser rules in `CLAUDE.md`: `curl` the port first and reuse the user's dev server, drive Playwright headless, and write to `.playwright-mcp/`. One shot per top-level route is enough; add a tab or a drawer only when a finding points at it. Say in the report which routes you looked at, and which you read as source only.

## Report

Report in this order, most severe first:

1. **Blocking** — a missing ledger entry, a route in the map that does not exist, a period control that changes nothing, a flag with no commit.
2. **Convention** — each convention miss, with the route and the fix.
3. **Page rules** — the folded `cdl-design-standards` findings.
4. **Plan updates** — routes and content that the build added beyond the map.

Give each finding a location as `file:line` and a concrete fix. State the counts at the top: routes checked, ledger entries built against missing, findings by severity.

**Report only.** Do not fix the findings in this mode. When the user asks for the fixes, hand the list to `cdl-build`.

## Reconcile the records

After the report, and only when the demo is complete:

1. Update the plan file in place — mark the ledger statuses, add the routes the build added, and stamp the build-audit date.
2. Append the final deviations and open questions to `docs/briefs/<client>/<demo>/assumptions.md`. Update an entry that a later decision changed. Do not delete it.
3. Leave the plan file as the record of what was planned. Leave the assumptions file as the record of what was built and why.

When no plan file exists, write the report into the assumptions file instead, under a dated heading. Do not invent a plan file after the fact.

<!-- Mirrored from compassanalytics/compass-design-library (.claude/skills/cdl-demo-audit) retrieved: 2026-11-22.
Refresh: re-run the fetch in CLAUDE.md's App style standard section. -->
