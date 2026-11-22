---
name: cdl-demo-conventions
description: Structural and narrative conventions every client demo must satisfy — Overview landing page, dispatcher-plus-drill-down routing, period controls, named baselines, committable actions, seeded-data posture, and process-named sections (month-end, outlook). Load when planning, building, modifying, or reviewing any demo under /demo/*.
user-invocable: true
---

# Demo Conventions

## Purpose

Conventions that govern what a client demo must contain to be credible, whatever the client is. They apply to every client suite under `/demo/*`, and to any suite added later.

This skill answers **what the demo must contain**. Two sibling skills answer the other questions:

| Skill | Question | When you read it |
|---|---|---|
| `cdl-demo-audit` mode 1 | What routes does this demo need? | Before any code, as a gate |
| **`cdl-demo-conventions`** | What must the demo contain to be credible? | At plan time, and again at review |
| `cdl-design-standards` | How do I build this page with CDL components? | While you write the code |
| `cdl-demo-audit` mode 2 | Did the build deliver it? | After the build, as a gate |

Mode 2 of `cdl-demo-audit` checks this file's conventions across the whole demo. So every convention here must be checkable from the built pages, not only from a plan.

## Precedence

The four layers that govern a demo page, and the order they win in, are stated once in `cdl-demo`. This file is layer 3.

Two consequences of that order are this file's own business. A brief never overrides a convention here: when a brief asks for something that breaks one — a landing page that drops into monitoring, a forecast with no period control — follow the convention and tell the user about the conflict, and deviate only after the user confirms it. A client overlay, by contrast, may override any default in this file; when it does, the overlay states which convention it changes and why.

## Client overlays

Each suite may keep a short overlay skill that holds only what that suite answers differently: its route prefix, its brief directory, its reference implementations, and its exceptions. Load the overlay for the suite you work in, together with this file. An overlay is named `guidance-<client>`.

When a suite has no overlay, this file is the whole rule set.

## Gaps in the brief: assumptions and open questions

Briefs do not cover everything, and the conventions here fill those gaps. A brief may flag items for review without naming a review action, but Convention 7 requires one, so the demo gets one. To fill a gap this way is expected, not a deviation.

Write down every assumption you make beyond the brief, so a reviewer can check it later.

Every demo owns one folder of documents, named after its route base — `docs/briefs/<client>/<demo>/`. It holds up to four files, always under the same names:

| File | What it holds |
|---|---|
| `requirements-wireframe.md` | The wireframe brief from the client |
| `requirements-solution.md` | The solution-requirements document, when one exists |
| `plan.md` | The approved route map from `cdl-demo-audit` mode 1 |
| `assumptions.md` | The living record of assumptions and open questions |

Keep the assumptions file at `docs/briefs/<client>/<demo>/assumptions.md`, beside the brief it answers. Record two lists:

- **Assumptions** — each thing you built that the brief does not specify: what you assumed, which convention or judgment drove it, and where it appears in the demo.
- **Open questions** — the questions the brief raises, plus the questions the build surfaces. Mark each open or answered.

Create the file at the first assumption for that demo, and append to it later. When a revised brief answers a question or overrides an assumption, update the entry and note what changed. Do not delete it.

## Convention format

Each convention states the rule, the reason, and what to do in the common borderline case. Keep that shape when you add one.

---

## Conventions

### 1 — The landing page of a demo is always an Overview

**Rule:** Each demo's root route (e.g. `/demo/<client>/<process>`) lands on an Overview page — a high-level summary of everything the demo covers. It never lands on a specific function such as Data Quality & Monitoring or a workbench.

**Why:** The landing page is the first thing a client sees from a shared link. It must orient them across the whole demo. It must not drop them into one corner of it.

**Borderline case:** When a demo currently lands on a specific view, restructure it. Move that view to its own route and put an Overview at the root. Keep the old link working with a redirect if the URL changes, per the Demo Routing rules in `CLAUDE.md`.

Convention 13 refines this one: a section whose whole output is one artifact published on a repeating cycle lands on the register of those publications, named `Home`.

### 2 — When a demo ingests data feeds, monitoring gets its own page

**Rule:** This convention applies to any demo whose story includes ingested data — feeds, files, interfaces, or scheduled loads. Monitoring of those feeds gets a dedicated route (e.g. `.../feeds` or `.../ingestion`). It is never the landing page, and it is never folded entirely into the Overview. Build it as a feed-status table and an exceptions list that share one tab bar, with the active tab as a route. A feed row opens that feed's ingestion log on its own `.../feeds/:feedId` route.

**Why:** This is the page where feed health is actually worked, so it needs full space for the tables, the exception list, and the drill-down. One shared shape across suites also means a client who has read one monitoring page can read the next without relearning it.

**Borderline case:** A demo with no ingested data skips this convention entirely — do not invent feeds to satisfy it. When an existing monitoring page deviates from this shape, converge it the next time you modify it. Do not extend the deviation. Your client overlay names the reference implementation to copy.

### 3 — The Overview is the dispatcher; drill-downs live on their own routes

**Rule:** The Overview directs the user to the correct drill-down page. It shows a high-level slice of each area — for example, a compact feed-health summary that links to the monitoring page — and every deep area of the demo has its own route that the Overview links to.

**Why:** The Overview answers "where do I look?". The drill-down pages answer the actual question. Detail on dedicated routes keeps the Overview scannable and makes every view deep-linkable for clients.

**Borderline case:** A detail view reachable only by a click from the Overview is a bug. Give it a route and link to it. The Overview may summarize an area, but the full detail always lives on that area's own page.

### 4 — Every forecast, scenario, or dated view has a time-period control

**Rule:** Any page, tab, or block about a forecast, an outlook, a projection, or a scenario carries a time-period control. Put it in the `CdlPageHeader` `actions` slot, at the top of the view, before the KPI row. Use `Tabs` for a short fixed set of horizons (Week / Month / Quarter / Full year) and `Select` for a list of named periods (`Jul 2026`, `Q3 FY26`). Store the value in a URL search param. The same applies to any chart or table of dated data: it gets a period control, or it visibly inherits the page's.

**Why:** A forecast number means nothing without the window it covers. A client reads "$4.2M projected" and asks "over what period?" first. The control also carries the demo's main story — the analyst moves the horizon and watches the number move. These demos are financial and operational tools, so a stated window on every number is a base rule of the trade. It is also the rule we miss most often, so check for it on every view.

**Borderline case:** When a view has exactly one fixed period, and a selector would hold one option, still label the period. Show it as read-only text in the page or block header (`Period: Jul 2026`), and state the window in the block's `info` tooltip. A view nested inside a page that already has a period selector inherits it. Do not add a second one.

**Also required:** The control must change the data. A control that leaves every number the same reads as broken. Every series, KPI, and table on the view responds to it.

### 5 — Every forecast or scenario view names its baseline

**Rule:** State the comparator in words on the view, and show the difference against it as its own column, card, or series. Name it in full — `Baseline: Approved Budget FY26`, `Baseline: Jul 2026 close`, `Baseline: USD 92.40/bbl Jet Fuel (NY Barge)`. Label the difference column `vs baseline`, and give the baseline row itself an empty cell rather than a zero.

**Why:** A delta with no named comparator is unreadable. A client sees `+$310K` and cannot tell whether the scenario beats the budget, the prior month, or another scenario. The baseline is the whole claim the view makes.

**Borderline case:** When the baseline is the current period close, say so and lock it. It is not an editable scenario — it is the fact the scenarios move away from. When a view compares several scenarios and none of them is a plan, pick one as the baseline and label it. Do not show deltas between neighbours.

### 6 — Seeded data shows a system in control

**Rule:** By default, the seeded data of a demo shows healthy operations. Every feed on a monitoring page loads clean, on time, and complete — status `Loaded`, full record counts, no failed or pending feeds, and no open data-quality exceptions.

**Why:** The demo's story is control, not firefighting. A red feed pulls the client's eye to a fake problem, and the conversation turns to "what is wrong with the data?" instead of the product.

**Borderline case:** Keep the exceptions structure on the page — the tab, the table, the columns — and give it a positive empty state ("No open exceptions this period"). The client then still sees where a real problem would surface. This convention covers feed health, not business exceptions. When exceptions are the demo's story, seed them.

**Override:** Some demos exist to show detection — fraud, exception handling, or a remediation walkthrough. There a clean feed defeats the purpose. That is a deliberate override, not a default: state it in the client overlay or raise it with the user, and keep the failure count small and explained.

### 7 — Every action the demo asks for can be committed on screen

**Rule:** When a page flags an item for action — approve, reject, review, confirm, resolve — the demo gives the user a working control to commit that action. The commit visibly changes state: the badge clears, the row moves, the count drops. Never show a "needs review" flag, an alert, or an instruction with no way to act on it.

**Why:** A flag with no action reads as a broken product. The story is that the analyst works the item to done, and the client has to see that loop close.

**Borderline case:** When the real product would route the action to another role, still build the control — active for the role that owns it, and disabled with a note for read-only roles. When a real commit is out of the demo's scope, an optimistic local-state commit is enough. The point is that the click works and the screen responds.

---

## Conventions 8, 9, and 10 moved

Earlier work cited these numbers from a client overlay file. They now live where they belong, and the numbers are retired here:

| Former convention | New home |
|---|---|
| 8 — Read the brief as intent, not as a layout | `cdl-demo-audit` — Purpose, plus audit rules 1 and 2 |
| 9 — The brief's screen count is not a page budget | `cdl-demo-audit` — audit rule 3, and `cdl-design-standards` Rule 2a |
| 10 — A KPI band reads as one sentence | `cdl-design-standards` Rule 11 |

Conventions 1 to 7 keep the numbers they had, so existing citations in briefs stay correct.

The next convention added after that move starts at 11, so no retired number is reused.

---

### 11 — Name a section after the process it serves, not after the artifact it produces

**Rule:** When a section of a demo *is* one of the finance calendar's named processes, the route segment and the sidebar label say so. Two names are fixed across every suite:

| The section is… | Route segment | Sidebar label |
|---|---|---|
| The month-end close — accruals, journal entries, reconciliation, posting, sign-off for a closed period | `month-end` | `Month-end close` |
| Forward planning — outlook, budget, LRP, any forecast cycle | `outlook` | `Outlook & budget`, or `Outlook, budget & LRP` when all three cadences apply |

The same two names label a **view** inside another section when that view reads one of those processes. An analysis section that compares closed periods holds an `analysis/month-end` view; one that compares forecast versions holds an `analysis/outlook` view.

Do not name the section after its output or its mechanism — `accrual`, `forecast`, `journal`, `variance`, `plan`, `close`. Those name one artifact of the process, and a section that carries five artifacts then takes the name of one of them.

**Why:** The client reads the sidebar against their own calendar. They say "month-end" and "outlook", so those words let them find the screen without a translation step. The names also make sibling demos comparable: a reviewer who has read one demo's `month-end` knows what the next demo's `month-end` holds. A demo that calls it `accrual` and the next that calls it `close` cost the reader that transfer for nothing.

**Borderline case:** A section that holds only part of a close still takes the process name, and the artifact becomes a view beneath it — `month-end/periods/:period/accrual`, not `accrual/periods/:period`. A demo whose whole story is one artifact is not an exception; the artifact is still a step of a named process. When a process genuinely has no calendar name in the client's own words, name it after the decision, never after the file it writes.

**Convergence:** rename a section that predates this convention the next time you modify it, and keep a redirect from the old segment — a single legacy constant when one segment retires, a map when more than one does. A retired segment that later becomes a live view again leaves the map.

---

### 12 — A rate the source system holds is picked by basis, never typed in

**Rule:** When a demo shows a rate, a factor, or an assumption that a source system already holds — FX rates, standard costs, headcount factors, escalation rates — the screen gives the process owner a control to pick **which set** applies, and reads the values from that set. It never gives them a field to type the number into.

Most such values are held on more than one basis, because the same figure differs by the activity it serves. The three that recur are **actual** (closing a period), **budget** (building the annual budget), and **outlook** (refreshing the in-year forecast). Name the choice after what it selects — `FX rate basis`, `Cost basis` — and label each option with the activity it serves, so the owner matches the basis to the work in front of her rather than to a table name.

**Where the control goes.** When the screen is a parameter or assumption register, the basis is a **row in that register**, not a dropdown in the block header. The basis is a parameter of the calculation like any other, so it carries the same columns the other rows carry — owner, effective from, source, and its own drill-through to the basis behind it. A control parked above the table states the same choice with none of that record.

That extends to every editable value on such a register: the in-force cell holds the dropdown, so the reader picks the value on the row it belongs to. Stage the pick and commit it with a `CdlActionBar` (Convention 7) — a parameter change is a decision, not a keystroke. A row whose value comes from a source system and is not the owner's to change keeps a plain text cell, which is what separates "picked" from "read".

The basis is also a dataset switch, so its committed value lives in the URL per the demo-routing rule in `CLAUDE.md` — a path segment where one is free, a search param where the path segment is taken. State the source table and its load date in the block's `info`, so the reader can see the values came from the system.

**What the drill-through holds.** The register states one figure per row, because that is the figure the cycle is loaded on and the figure every other screen prices from. It is not the whole record: a source system refreshes the value across the window the row prices, and most processes carry the value in more than one unit — several currencies, several fleet types, several bands. So the row drills into that grid: the units down, the periods across, on the row's own path segment (`.../<table>/:recordId`). Two things keep it honest. It **reads** the basis the register picked and never picks one, so the two screens cannot disagree. And a coarser grain is offered where the window is long enough to need one — carried in a search param, per `cdl-design-standards` Rule 16 — with the roll-up stated as a mean where the value averages and a total where it sums.

**Why:** A typed rate has no record of which set it came from, so a figure calculated on it cannot be re-derived or defended later. A demo that offers a text field is showing the manual step the client wants removed, not the product that removes it. The selector is also the honest one: the values exist upstream, and the owner's real decision is which set to run on.

**Borderline case:** A value the source system does **not** hold — a one-off override, a negotiated rate agreed in the room — is genuinely entered, and it takes a reason capture with it (Convention 7). The test is where the number lives: if a query would return it, it is picked; if only a person can state it, it is entered with a reason. When only one basis exists today, still build the control and show the one option, rather than hard-coding the set.

---

### 13 — When a section publishes one artifact per cycle, its landing page is the register of those publications

**Rule:** When everything a section does leads to **one** artifact published on a repeating cycle — an annual rate, a monthly close pack, a quarterly plan — the section lands on the register of those publications rather than on a status summary. Name that page `home`, labelled `Home`, so a reader who has seen one such section recognizes the next. It holds one row per cycle, newest first, with the cycle in flight as the first row, marked as the working version. Each row states the cycle, its state, the date it published, the headline figure it carried, and its movement against the cycle published before it (Convention 5). A published row is read-only and shows it — a lock icon on the row, before the row is opened. A row opens the work: the working row opens the screen where that cycle is calculated, and a published row opens what was published.

**The register is also the gate.** A screen that reads one cycle — the files that landed for it, the parameters in force for it, the figure it calculates, what it published, what it moved against — opens INSIDE a cycle, so the cycle is a path segment: `<section>/cycles/:cycleId/<screen>`. Until a cycle is open, the sidebar shows those screens disabled and muted, which states that the reader picks a cycle first. Give `CdlSidebarNavItem` no `href` and no `onClick` and the sidebar renders exactly that. Keep the section's own orientation screens — About, and the register itself — enabled at all times, and redirect the flat screen paths into the cycle so a link shared before the change still lands.

Only the cycles the demo can honestly fill open this way. When the seeded data covers one cycle, only that cycle opens, and a closed cycle opens its publication instead of a screen of figures the source material does not support.

This refines Convention 1 rather than replacing it. The page still orients across the section: the register states every cycle, its figure, and its movement, and it dispatches into the cycle that holds the work.

**Why:** The client's own calendar is the cycle. They ask "what did we publish last year, and what will we publish this year?", and a register answers both in one screen while a summary of the cycle in flight answers only the second. It also gives the demo somewhere honest to put the history: without the register, the publishing screen grows a history table, and two screens then hold the same rows.

**Borderline case:** A section whose cycle produces many artifacts, or whose work is never published outward, keeps an Overview per Convention 1. A register that is not the section's output — a register of forecast cycles inside a section that also runs a close — stays its own screen, and the landing page stays an Overview. When the register lands, the screen that publishes gives up its history: the register is the one place those rows live.

---

### 14 — A month-end variance is measured against a plan, not only against the month before

**Rule:** When a demo carries an `analysis/month-end` view (Convention 11), the baseline set it offers includes the plan the close is judged against — the approved budget, or a published outlook cycle. A prior closed period may sit in the same set, but it never stands alone as the only comparator.

The plan the reader picks is a named baseline in the sense Convention 5 means: state its full name, the date it published, and which months it already had closed to actual. A plan published after some of the year closed forecast fewer months than the budget did, and a reader comparing against it has to know which.

The comparator rides in the URL beside the period, so a shared link opens on the comparison it was shared for (Convention 4).

Build the table as one additive tree and let the reader open it in place with `CdlDataTable`'s `getSubRows`, rather than as a table per level or a route per level. Every level is the sum of its children on both the actual and the plan, so a subtotal ties out and the reader can stop at whatever depth answers the question. Rule 14 in `cdl-design-standards` governs how that table is sized on the page.

**Why:** The month the business is answerable for is the month against plan. "We spent more than last month" is a fact about seasonality; "we spent more than we said we would" is the fact that starts a conversation, and it is the one the close pack has to carry. A variance screen offering only a prior close makes the reader do the comparison they actually came for somewhere else.

**Borderline case:** A process whose plan genuinely has no monthly phasing — no budget stated at the month grain, no outlook that re-forecasts by month — compares closes, and the screen says so where the baseline is named. That is the exception, not the default: check the seeded plan data before concluding it.


---

### 15 — Name an in-year forecast cycle `n+m`, never by the month it published

**Rule:** An outlook or forecast cycle that re-forecasts the current year is named for the months it closes and the months it still forecasts: `6+6`, `7+5`, `3+9`, `1+11`. Six months of actual and six of forecast is a `6+6`. Write it into the cycle's own name — `FY2026 Outlook 7+5` — and use the bare `n+m` as the short form in a column header, a chip, or a selector.

Do not name the cycle after the month it published — `Aug 2026 Outlook`, `May outlook`. That names the calendar event, not the number, and it leaves a reader unable to tell how much of the year is still a guess.

Carry the expansion beside the name wherever the cycle is the subject of the screen: `Jan to Jul 2026 actual, Aug to Dec 2026 forecast`. State it in the page's `titleInfo`, or as a field on the cycle record. The `n+m` is a label, and it needs its key stated once.

A cadence that closes no months of the year it plans does not take the form. A budget and an LRP keep their own names — `FY27 Budget`, `LRP 2026-2030` — and state their basis in words instead.

**Why:** The client says "the six-and-six" out loud. It is how they refer to the cycle in the room, and it carries the one fact that decides how much weight the number bears — a `1+11` is almost all forecast, an `11+1` is almost all actual. A publish month carries neither: two cycles published a month apart can close the same number of months, and the same cycle re-published carries the same name.

**Borderline case:** A cycle that re-forecasts a window other than the fiscal year — a rolling twelve months, a part-year reforecast — states the window and the split it has, rather than being forced into an `n+m` that implies a fiscal year. A demo with exactly one outlook cycle still names it `n+m`: the form is what makes the next demo's cycle comparable.


---

### 16 — A reference view that only one process reads is a tab of that process, not a section beside it

**Rule:** A sidebar section is a process the client runs, or a reference table several processes read. A view that one process alone reads is a step of that process. Put it on that process's page as the first page-level tab, before the tab that holds the process's own work.

Test it by counting the readers. A rate table the close and the outlook both price from stays a section: neither owns it, and each links to it. A mapping, an allocation basis, or a driver table that only the outlook reads belongs on the outlook, because a reader who opens it outside the outlook has no reason to be there.

Route the tab in the same path segment the process's own views use, and reserve one value of that segment for it. Keep the old section link alive as a redirect onto the tab, so a link already sent to a client still lands.

Each tab owns its own KPI row when the two tabs state different figures — the reference tab states the reference subject's figures, and the work tab states the cycle's.

**Why:** A sidebar of eight sections reads as eight things the client does. A step listed beside the process it feeds makes the client count one more process than they run, and it hides the order: the reader has no signal that the mapping is read before the cycle is priced. A tab states the order on the screen itself.

**Borderline case:** A step two processes read is a section, even when one reads it far more. Splitting a shared table onto one process's page makes the other process link sideways into a page that is not about it.

**Count writers before readers.** A screen that only reads is placed by its readers, per the test above. A screen that **produces** a figure is placed by the process that figure belongs to, however many processes go on to read it, and it sits under the record that carries the figure rather than beside the process. A rate card several processes price from is read-only reference and stays a section. A build-up — a screen that works a figure out from historicals and writes it onto a cycle or a period — is a drill-down of the row it writes: reach it from that row, and put a button back to it on the row, so the two screens state one figure and the reader can see where it came from. The other processes read the figure where they always did; they do not need the builder.

**A builder opens over the row it writes, on that row's route.** A build-up is not a page beside the record and it is not a page under it: it is the record with its workings open. Render it as a dialog over the row's own view, and keep the route — `.../accounts/:accountId/builder` — so the dialog is still a link a client can be sent, and closing it navigates back to the row. The reader then sees the figure change on the summary behind the dialog, which is the point of putting the two together. Size the dialog to the work, not to the form default: a month grid needs a wide `CdlDialogContent` (`w-[min(1500px,94vw)] max-w-none`) and a capped body height, so the grid scrolls inside the dialog instead of the dialog running off the screen.

Hide the row's own button to the builder while the builder is open. A control the reader cannot reach is not a control.

**Convergence:** the Components T&M builder. It was a step of the close, then a section beside both processes on this convention's reader test, and on Aug 31, 2026 it moved under the Maintenance T&M account inside Outlook, because it writes that account's forecast. It opens as a dialog over that account, on the account's own `/builder` route. `/components/time-and-material` and `/components/month-end/tnm` both redirect onto it.


---

### 17 — A master-data register carries a change log, and the approver approves each change there

**Rule:** Any section that holds editable master data — rates, mappings, drivers, parameters — carries a change log as its last view, named `change-log`, labelled `Change log`. It is a register of change requests, not an audit stream of individual cells. One row per request, newest first, stating: the change id, the object it touches, the change type (`Update` / `Insert` / `Delete`), its status (`Applied` / `Pending approval` / `Rejected` / `Reverted`), its origin, the row and entry counts it moves, its change owner, requestor, approver and executor, and when it was submitted.

Every edit belongs in the log, whichever way it arrived. Name the origin after the way it was raised — a person editing a cell in place, or a periodic reload from the governing source system — so the reader can tell a judgment from a feed.

A log row opens that request's own card in a `CdlDialog`: a meta bar of status, requestor, owner, approver and submission, the affected rows as a row-level difference with the prior value beside the new one, and the request's note. The approver approves or rejects from the card's footer, and the commit clears the tab's badge (Convention 7). Gate those two controls on the role that owns the approval, and show the card without them to anyone else.

Route the view like every other tab, and put the open request in the path — `<section>/master-data/change-log/:changeId` — so a link opens on the request it was shared for.

**Why:** A register the client can edit raises the question "who changed this, and who agreed?" before it raises any other. Without the log, the edit control reads as a way to move a governed number with no record, which is the opposite of the story. The log is also where a rate's history lives, which is what lets the register itself state one period and stay readable.

**Borderline case:** A register nobody edits — every value read from a source system — needs no log, and inventing change requests for it is fabricating an audit trail. When the demo's inline edits do not yet write to the log, seed the log and say so in the page comment rather than leaving the tab out; the reader has to see the loop exists.


> `cdl-design-standards` Rule 17 governs the tables beside it: once a column is editable, the row click belongs to the cell editor, so a per-row drawer comes off and its content moves here.

---

## Adding a convention

1. Confirm the pattern against a real page in this repo before you write the rule.
2. Decide which file owns it. A rule about demo structure, routing, or narrative belongs here. A rule about how to use a CDL component belongs in `cdl-design-standards`. A rule about how to read a brief belongs in `cdl-demo-audit` mode 1.
3. Keep it client-agnostic. When a rule holds for one suite only, put it in that suite's overlay skill instead.
4. Append it in the format above, and state the borderline case.

---

### 18 — An About page is written from its own process owner's side of the handoff

**Rule:** Every About page names one process owner it is built for. Write the whole narrative from that owner's side: the headline, the three outcome claims, the current-state figures, and the Today column of the change table all describe work that owner performs. An upstream or downstream team's pain belongs on the page only as context for where the owner's work starts and stops — never as the headline promise.

When the built screens and the source brief disagree, the screens win. Describe what the demo does, name the divergence in the FAQ, and record the reason in the page comment. A brief written before the build is a starting point, not the specification the page reports on.

**Why:** A brief is written by consultants who interviewed every team in the process, so its own emphasis follows the widest pain, not one owner's day. Lead an About page with an upstream team's week and the reader — who is the owner — reads a business case for somebody else's problem, then discounts the screens that follow. The claims also stop being testable: an outcome the owner cannot verify from their own cycle cannot be confirmed or challenged in the review session.

**Borderline case:** A step the owner performs for an upstream team stays on the page as the owner's own row — packaging a file and emailing it is their work, even though the benefit lands elsewhere. A step the upstream team performs and hands over is context: state it in one sentence, and describe only the check the owner runs on what arrives.


---

### 19 — A page that runs one period titles itself with the period, not with the step the reader is on

**Rule:** When a page works one dated instance of a process — a month-end close, a forecast cycle, a settlement run — the `CdlPageContainer` `title` names that instance ("Jul 2026 close", "Budget 2027"), not the step, tab, or view inside it. The step keeps its own name in two places that already exist: the tab or gated step bar, and the `CdlBlockHeader` over its own table, which also carries the step's `info`. The `titleInfo` then describes the whole run — what it covers, which working day it sits on, its deadline, and whether it is signed off — rather than the step.

**Why:** Which period a reader is looking at is the one fact they carry from screen to screen, and the one that makes a figure right or wrong. A title that reads "Invoice routing" or "Calendarization" states what the highlighted tab already states, and drops the period into a breadcrumb crumb or a dropdown where a client scanning a shared link will miss it. Two screens from different closes then look identical in a screenshot.

**Borderline case:** A page that is not scoped to one instance — a master-data table maintained continuously, a register listing every period — titles itself with what it holds, because there is no instance to name. A register's rows carry the periods; its title does not.


---

### 20 — A process page whose last step commits the period or the cycle carries a gated step bar

**Rule:** When a page works one dated instance of a process step by step, and one of those steps commits the instance — closes the period, submits the cycle, publishes the version — that step is the last tab, it is named for the commit (`Event close`, `Submission`), and the tab bar renders as `navVariant="gated"`. Give every other tab a `done` flag and, where it holds decisions, a `badge` with its open count; give the commit step `gate: true`. The commit step then stays locked until every earlier step reports `done`, and its own commit button lives on it rather than on the summary.

**The order of the tabs is the order of the work, and the landing tab is the first step, not the summary.** Inputs first — the schedule, the extract, the feed the rest is priced from. Decisions next. The summary sits second to last, after the steps that move it and before the commit, because it is the output the work produces and the last thing checked before the instance goes. The commit step is last. Point the register's row link and the page's default view at the first step, so opening an instance starts the reader where the work starts.

Two things follow. A deep link that names the gated step while the gate is shut redirects to the first step that still has work, with a `toast.info` that names it — a locked tab cannot be the active tab. And the gated step states its own preconditions as a table, one row per precondition, each naming the step that clears it, so a reader who lands on it sees why it is shut without opening another screen.

A step that holds no decision — a summary, a schedule, a reference table — reports `done` from the start. It is the input the decided steps recalculate, not work.

**Why:** A step bar with no gate reads as a set of tabs, which invites the client to ask why they cannot just press submit. Landing on the summary compounds it: the reader opens on a finished number, and the steps that produced it read as detail they may skip. The gate is the control the demo is claiming: the cycle cannot go to the source system on a decision nobody made, and the screen says so before anyone tries. It also gives the review session its order — the presenter walks left to right and the bar states how far the instance has got, which no badge count on its own conveys.

**When the commit holds no work of its own, it is a button and the last step is its output.** A commit step earns its place on the bar when the reader works it — a list of events to match, a submission to check line by line. When the commit is one act with nothing to work — press it and the period closes — a step for it is an empty screen, and the client asks what the tab is for. Then: drop the step, put the commit in the page action row as the primary action, disable it until every step reports `done` with a `title` naming what it waits for, and confirm it in a dialog that states what commits and what locks. Make the **last step the output the commit produces** — the accrual it posts, the file it generated — `locked` until the commit happens, and hold the export there. Every step before it goes read-only once the commit lands, and the page title carries a `Closed` badge.

**Borderline case:** A page whose steps carry no commit — a reference screen, an analysis view, a register — takes the plain bar. Do not invent a commit step to justify a gate. A page with exactly one gated step is the shape; two gates on one bar is not, because `gate` marks the final tab and only the final tab. To hold a **middle** step shut, use `locked` rather than a second `gate` — Convention 24 covers the sequence that needs it. A bar whose commit is a page action carries no `gate` at all: its locks are all `locked`.

**Convergence:** a section that ends on a summary view with no commit step, or that renders the commit as a plain bar, converges the next time it is modified. Do not rewrite an untouched page only to converge it.

---

### 21 — A work queue lists every record in its scope; status separates them, a tab does not

**Rule:** A queue a person works — invoices to route, exceptions to clear, lines to confirm — holds every record in its scope for the period, whatever the system already did with it. The records the rules resolved sit in the same table as the ones that need a decision, and a Status column tells them apart. Do not give the resolved records their own tab. Every record in the queue opens the same detail view and takes the same corrections, so a wrong automatic decision has a way back into the work.

A tab beside the queue is for a different subject — an audit trail, a set of rules, a reference table — never for a slice of the queue's own rows.

**Why:** A reviewer's job is not only to work the exceptions. It is to be able to say the period is right, and nobody can say that from a screen that hides what passed. Splitting the queue by status also states, wrongly, that an automatic decision is final: the client asks what happens when a rule is wrong, and the answer on that screen is nothing. One exhaustive queue answers both — the count in the tab badge still names how many need a review, so the work to do is not lost in the volume.

**Borderline case:** A queue whose scope is genuinely large enough that the resolved rows bury the open ones takes a filter or a default sort, not a tab. Mutually exclusive slices of a dataset nobody works down — Open / Disputed / Settled on a report — are alternate views and take tabs, per `cdl-design-standards` Rule 2. The test is whether a reader ever needs to correct a resolved record: if yes, it belongs in the queue.


---

### 22 — A table on a master-data register is maintained on screen; read-only is the exception and names its owner

**Rule:** Every table on a master-data screen edits in place by default. The reader opened that screen to maintain the reference data, so a register of tables none of them can change states that the process still runs somewhere else.

Read-only is allowed, and it is the exception. A table earns it only when a named party outside the process owns the value — an OEM maintenance programme, a policy clause, a governing source system — and that owner is stated in the block `info` and as a column the reader can turn on.

**A source system owning the record does not make the record read-only.** The test is who owns each *value*, column by column. A feed can own what happened while the process owner still owns how it is classified and what it is worth: a schedule the planning system writes can carry an accounting classification and an estimate that only finance can state. Split the table by column rather than declaring the whole table read because the rows arrived on a feed. Convention 12 then decides how each editable value is entered — picked from a loaded set, or typed with a reason.

Hold the correction against the record's own key rather than the row's position, so the next load of the feed rewrites the record and the register keeps the decision.

**Why:** The demo's claim is that reference data is maintained once, in one place, and every process reads it from there. A read-only register makes the opposite claim — that the screen reports a value somebody else maintains — and the client asks where the real edit happens. Splitting by column is also the honest answer to "can we fix it here?": yes for the columns the owner owns, and no for the ones they do not, with the reason on screen.

**Borderline case:** A table whose every column belongs to an outside owner is genuinely read-only, and it keeps its row click for a drawer (`cdl-design-standards` Rule 6). Hide the register's Add-a-row and bulk-edit controls on that view only, so the page does not offer an insert the process cannot make. When no outside owner can be named, the table is editable.

**Convergence:** where one page's columns are owned by two different teams, split them explicitly — read-only for the fields the other team owns, editable for the ones this team owns, both held against the same record.

---

### 23 — A demo illustrates the screen, not the data path behind it

**Rule:** The deliverable of a demo is what the reviewer sees and clicks. Build the screen, the control and the visible response. Do not model the plumbing behind them: no real file schema, no ledger that balances, no lineage from a feed to a figure, no correctness in a calculation the reviewer cannot see.

An export downloads a plausible file and says so in a toast. A journal entry names the accounts it moves without balancing debits against credits. A commit changes the row, the badge and the count in session state, and stops there.

Spend the effort on the visible layer instead: the column set, the flag, the empty state, the wording of the status and the tooltip that explains it.

**Why:** The review session judges the interface. A reviewer reads a column heading, a status word and a button label, and never opens the file or checks the arithmetic. Depth behind the screen costs build time and buys no feedback, and it hardens a data model that the next review will move anyway.

**Borderline case:** Figures on one screen still agree with each other. A total equals the rows above it, a count equals the flagged rows, and a delta equals the two numbers it sits between — an inconsistent number on screen reads as a bug and takes the session off course. Consistency across screens is the same rule: one shared seed, read by every page that shows the figure.

**Convergence:** a demo keeps its session-local state in one shared object that every page of the suite writes to, and nothing posts anywhere. Convention 7 gives the same answer from the action's side: the click has to work and the screen has to respond.

---

### 24 — A step that consumes another step's output is locked until that step signs off, and the sign-off is a close-out

**Rule:** When a step runs on what an earlier step produced — a calendarization on corrected coding, a submission on a validated plan, a settlement on a confirmed split — the later step is `locked` in the gated bar until every step it consumes has been **closed out**. The close-out is an explicit action at the end of each feeding step (`Close out step`), not a derived state: it is the sign-off that carries that step's corrections forward.

Four things this needs:

- **The close-out names what it carries.** The button's toast, and the step's own state once signed off, say what moved forward — the routed events and cost centres, the confirmed expendables — so the sign-off is a statement, not a checkbox.
- **A step can be closed out with items still open, and the screen asks first.** A dialog names how many items stay open and where they will not reach. Blocking the close-out instead moves the judgment from the user to the demo.
- **A closed-out step reports `done`; an empty queue does not.** `done` follows the sign-off, so a step whose queue happens to be clear still reads as unfinished until someone signs it.
- **The lock states what opens it, and a deep link is redirected.** Pass `lockedReason` naming the next step to close out, and redirect a link that names the locked step to that step with a `toast.info` — a locked tab cannot be the active tab.

**The user can walk it back.** The consuming step carries a `Rerun`, which drops the close-outs before it, locks the step again, and lands the user on the first feeding step. The consuming step then states that it was reproduced, and how many reruns it took, so a figure in a screenshot can be traced to the run that produced it.

**Why:** Without the lock, a step bar reads as a set of tabs and the client asks why the order matters at all. The close-out is what makes the order real: it says the corrections are finished and the next step may consume them. Deriving that from an open count instead is wrong in both directions — a queue can be empty because nobody has looked at it, and a period can be signed off with a known exception still open. The rerun is what keeps the lock honest: a sequence you cannot walk back is a sequence people work around.

**The words are the same in every module of the same process.** A close page reads `Close out step` and `Close the period`, whatever module it belongs to. Do not give one module a bespoke commit — a routed request, a named approver's sign-off — where its sibling carries a close-out. A brief's open question about future governance is recorded in the assumptions, not built as a second vocabulary on the bar: two modules of one close that commit in different words read as two different processes.

**Borderline case:** A step that holds no decisions of its own — a reference table, a schedule the rest is priced from — takes no close-out and locks nothing. And do not lock a step merely because it reads better after another one; lock it only where its output would be wrong if the earlier step were still moving.

**Convergence:** `demo-techops-airframe-close.tsx` and `demo-techops-components-month-end.tsx` both carry it as of Sep 1, 2026 — each working step ends in `Close out step`, the gated step opens on those close-outs, and the period closes from the same bar. Components previously committed with a `Request sign-off` routed to a named Director, which gave one close two vocabularies. Components carries no Rerun yet: its consuming step is not in the current review pass.

---

### 25 — A page scoped to one instance has no instance picker; the register is the picker

**Rule:** A page that runs **one** instance of a repeating record — one close period, one forecast cycle, one publication — carries no selector for that instance in its `actions` slot. The register that lists the instances is where the reader picks one (Convention 13), the instance is named in the page title (Convention 19), and the back link and the breadcrumb return to the register. Keep the URL param, so a deep link still lands on the right instance.

Every other control on the page stays where it is. A filter that narrows what one step shows — a reconciliation window, a fleet, a station — is a parameter of the view and not a change of record, so it keeps its place in the header.

**Why:** A picker in the header says the page is a report you re-run over a period. A close is not that: it is one record with its own state, its own sign-offs and its own lock, and the register is the list of those records. Two ways to reach the same record also give a client two mental models to hold, and the picker is the one that hides the register's own columns — the state, the open items, the figure and the sign-off date.

**Borderline case:** A continuously-maintained page — a master-data register, an analysis view, a monitoring screen — is not scoped to an instance, so Convention 4 applies in full and it keeps its period control. A page reached from a register but showing several periods at once (a trend, a rolling view) keeps its own horizon control, because the horizon is not the record.

**Convergence:** a close page reached from its own register carries it. Do not rewrite an untouched page only to converge it.

---

### 26 — The action that commits a whole page sits on a bar flush to the bottom of the content area

**Rule:** The one action that commits the page or the step — a close-out, a sign-off, a submission — goes in the `CdlPageContainer` `footer` slot, not in the header `actions` slot. The slot renders a bar flush to the bottom of the content area, below the scroll region, so the action stays in view however far the reader has scrolled. The bar holds a fixed height, so the page does not move when the commit turns into a status line after it fires. It holds the button and nothing else — what the commit carries forward is stated by the step's own block header, and a sentence on the bar is the commentary Rule 10 of `cdl-design-standards` sends home.

Keep the header `actions` slot for controls that set up the view — a filter, an export, a horizon. An action that works on one table belongs on that table's own block header (`cdl-design-standards`), not on either bar.

**Why:** A commit read as one more header button reads as one more filter. Putting it at the end of the page matches the order of the work: the reader works the table down and signs it at the bottom, which is what a paper close does. A header button also scrolls out of a client's screenshot, so the reviewed screen shows the work with no visible way to finish it.

**Borderline case:** A page with no commit takes no footer — do not invent one to fill the bar. Bulk actions that appear on selection stay on `CdlActionBar`, which floats over the table and is about the rows, not the page. A page whose commit is already the last gated step (Convention 20) puts the commit on that step's footer, not on every step's.

---

### 27 — A selection carried in the URL survives every move between sibling views

**Rule:** When a page parameterizes itself on a choice held in the query string — a scenario, a version, a baseline, a focus year, a grain — every link between that page's own views carries the whole query forward. Build a step link from the current search string, not by re-deriving the one param the link is about. One helper on the page, used by the tab bar, the row click, the drill-down's back link, and any redirect:

```tsx
const stepHref = (next: View, rowId?: string) => {
  const base = viewHref(next, rowId)
  const query = searchParams.toString()
  return query ? `${base}?${query}` : base
}
```

A control that deliberately drops a selection — a `Change selection` that reopens the chooser — deletes those params explicitly. Dropping them by omission is the bug this convention exists to stop.

**Why:** A selection screen that gates a view reads the params back on every render. Rebuild the URL with only the record id and the gate reopens, so the reader is thrown back to the chooser on every tab click and can never reach a second step. The failure is invisible in review — each screen looks right on its own, and only the sequence is broken — and it is invisible to `tsc`, because the href is a well-typed string either way.

**Borderline case:** A link that leaves the record — back to the register, out to a master-data tab, across to another section — starts a new query and carries nothing. A param that is genuinely scoped to one view (an open drawer's row id, a table's search term) is dropped on the way out of that view, and the helper drops it by naming it, not by rebuilding the string.

**Convergence:** a step bar over a page parameterized on a query string carries it. A page that rebuilds the URL from the record id alone converges the next time it is modified.

---

## Concrete pointers live outside this file

This catalog names no file, no client, and no dated decision, so it can be copied into any
project that consumes CDL. A repo that wants concrete pointers — the page that already
implements a rule correctly, and the backlog of pages that still deviate — keeps them in a
local companion file instead. In this repo that is `docs/skill-reference-implementations.md`.

When you add a rule, keep the rule itself agnostic and put the example in the companion
file. Never move a file path, a client name, or a date back into this catalog.

### 28 — A parameter of the whole run is chosen on the way in, not at the step that first reads it

**Rule:** When a process page is parameterized by a choice that identifies the *run* — the source version it was built from, the base it was built against, the scenario it prices on — put that choice in front of the whole page, before the step bar renders. The step bar appears once the choice is made, the choice is named in the page's `actions` row, and one control there drops it and reopens the chooser.

The test is not "which step reads it first". It is **how much of the page it identifies**. A choice is run-shaped when any of these hold:

- More than one step reads it, and the steps that do are downstream of the steps that do not.
- The page has a rerun, a reproduce, or a recalculate action. "Reproduce the output" has no answer if the parameter can change between one step and the next.
- Two runs of the page with different values are two different records, not two views of one.

A choice that fails all three is a view filter, and it stays on the step or the block that reads it — a reconciliation window, a focus year, a grain toggle.

**Why:** A parameter asked for at the step that first consumes it reads as a property of that step, so a reader assumes the steps before it were unaffected — and on a sequenced page they were not: they fed the step that did read it. It also breaks the record. A close run against Gantt v3 and the same close run against v4 are two different closes, and a page that lets the version change halfway through has no single answer to what it produced.

The steps that do not read the parameter are still behind the gate, and that is the point: what the screen is naming is the run, the same way a register names the period before any step renders.

**Borderline case:** A page reached from a register that already fixes the run — the register row *is* the choice — needs no gate; the parameter is in the URL and stated in the title (Convention 25). A page with exactly one step is not a sequence, so its parameter belongs on that step's own header.

**Convergence:** `demo-techops-airframe-outlook.tsx` and `demo-techops-airframe-close.tsx` both carry it as of Sep 1, 2026 — the Gantt version and base scenario open the module, and every step link carries them (Convention 27). The close previously gated only its calendarization step, which left invoice routing and expendables running against an unstated version and made its Rerun ambiguous.

### 29 — A section built "to the standard of" an existing one copies its structure; only the tables differ

**Rule:** When a brief adds a section and says to build it to another section's standard, copy that section's route surface, view set, step order and screen shapes exactly. Do not re-derive them from the new section's process, and do not drop a step because the new section seems not to need it. What changes is the data: the tables, their keys, and the column names. What stays is the shape.

Where a table's **key** genuinely differs, say so in the page comment and name the reason — that is the one divergence worth writing down, because it is the one a reader will otherwise take for a mistake.

State every table's provenance at the top of its data module when the rows are yours rather than the client's, and keep the module separate from the pages so a real extract replaces it without touching a screen.

**Why:** A section's structure is the part the client already reviewed and agreed. Re-deriving it turns a copy into a second design, and every difference then has to be defended on its own — including the ones that came from the builder guessing at a process they have not seen. Dropping a step is the most expensive guess: the reviewer reads the gap as a claim that their process does not have that work.

It also protects the swap. A section built as a copy takes real data as a data change; a section built from first principles takes it as a rebuild.

**Borderline case:** A step that cannot exist in the new section — one that operates on a record the section has no equivalent of — is still built, and its screen states what it is waiting on. Raise the divergence with the client rather than deciding it in code. A shared reference table (a policy, a rate set, an approver's change log) is read from the section that owns it rather than copied, and the copying section's tab says so.

**Convergence:** `demo-techops-engine-master-data.tsx` and `demo-techops-engine.tsx` carry it as of Sep 1, 2026 — engine mirrors airframe tab for tab, and its two real divergences (a price keyed by visit type, a register keyed by serial number) are named in the page comment. Its rows live in `techops-engine-data.ts`, marked placeholder.

---

### 30 — A showcase demo is scoped to the story it tells; the route-adding conventions are for client demos

**Rule:** A demo has one of two audiences, and the audience decides how much structure it
owes. A **client demo** is a consulting deliverable for a named business process, and
every convention in this file applies to it. A **showcase demo** exists to put the
component library in front of somebody — an internal walkthrough, a capability piece, a
sales artifact with no client process behind it — and it carries only the conventions its
own screens trigger.

Five conventions add routes a showcase demo does not owe by default: 1 (an Overview at
the root), 2 (a monitoring page), 13 (a publication register), 17 (a change log) and the
About page `cdl-demo` puts in wave 3. Do not add any of them to a showcase demo unless the
demo's own story asks for it. The conventions that govern what is already on the screen —
4, 5, 6, 7, 21, 23, 26 and 27 — apply to both kinds, because they are about whether a
screen is honest rather than about how many screens there are.

Read the audience from the ask, not from the length of it. A named client, a process, a
brief or a requirements document means a client demo. A one-line request to show what the
library can do means a showcase.

**Why:** `cdl-demo-audit` rule 3 is right that a brief's screen count is coverage rather
than a page budget — but it is written for a brief, where the routes are the client's own
process and every one of them earns its place. Applied to a one-line showcase ask, the
same reasoning manufactures a process the requester never described: a monitoring page for
feeds nobody mentioned, a master-data register to justify an editable table, an Overview
that dispatches to one page. The showcase then costs a review session to walk and buries
the one screen it was asked for.

**Borderline case:** A showcase demo that genuinely holds several unrelated jobs still
splits them across routes — this convention lifts the route floor, never the ceiling that
`cdl-design-standards` Rule 2 sets. And a showcase that later becomes a client demo takes
the full set: re-run `cdl-demo-audit` mode 1 against the real brief rather than growing the
page.

**Convergence:** every showcase demo in this repo already carries it — `metro`,
`novartis-mt2`, `seatmap`, `access`, `tables`, `usage` and `live-complex` are one route
each, with no Overview and no About. `bootcamp` was planned at twelve routes on 2026-09-10
against a four-line ask, and cut to two.

<!-- Mirrored from compassanalytics/compass-design-library (.claude/skills/cdl-demo-conventions) retrieved: 2026-11-22.
Refresh: re-run the fetch in CLAUDE.md's App style standard section. -->
