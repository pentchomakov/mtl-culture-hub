---
name: cdl-demo
description: One entry point for demo work. Loads the right skills in the right order for the phase you are in — plan a demo from a brief, build a page, or check a built demo. Also routes new guidance the user gives into the skill that owns it, so a rule stated once is written down once. Use it instead of invoking cdl-demo-conventions, cdl-design-standards, cdl-demo-audit, and the client overlay one at a time. Accepts "plan <brief>", "build <route or page>", or "check <route base>".
user-invocable: true
---

# CDL Demo

## Purpose

Demo work spans four rule files and one client overlay. This skill is the single entry point. It holds **no rules of its own** — it decides which files the current phase needs, reads them in precedence order, then runs that phase's skill.

Use it so no phase starts with half its rules loaded.

## Pick the phase

The user's argument names the phase:

| Argument | Phase | Example |
|---|---|---|
| `plan <brief path>` | Turn a brief into an approved route map | `plan docs/briefs/air-canada/fee-accrual/requirements-wireframe.md` |
| `build <route or page>` | Write or modify a demo page | `build /demo/air-canada/navigation-fees` |
| `check <route base>` | Verify a built demo | `check /demo/air-canada/navigation-fees` |

With no argument, infer the phase from what the user gave you:

- A `.md` brief, a requirements document, or a ticket that lists screens → **plan**.
- A demo page path, or a request to build, add, or change a view → **build**.
- A route base with a request to check, audit, or review → **check**.
- Nothing that fits → ask which phase. Do not guess, because each phase reads different files.

## The precedence chain

Every phase applies the same four layers. Later layers win on conflict:

1. The brief, ticket, or ad-hoc instruction — what the demo covers.
2. `cdl-design-standards` — how CDL components are used.
3. `cdl-demo-conventions` — what every demo must contain.
4. The client overlay skill for the suite — that suite's exceptions and reference files.

State this once here. The loaded files do not need to restate it.

## Find the client overlay

Take the client segment from the route (`/demo/<client>/...`) or from the brief's directory (`docs/briefs/<client>/`). Then look for `.claude/skills/guidance-<client>/SKILL.md`.

- It exists → read it, and treat it as the last word.
- It does not exist → `cdl-demo-conventions` is the whole rule set. Do not invent an overlay, and do not borrow another client's.

Air Canada's overlay is `guidance-air-canada`.

---

## Phase — plan

Read, in this order:

1. `.claude/skills/cdl-demo-conventions/SKILL.md`
2. The client overlay, when one exists
3. `.claude/skills/cdl-demo-audit/SKILL.md`

Then run **cdl-demo-audit mode 1** on the brief. It ends by writing the plan file and stopping for approval. Do not build in the same turn.

Skip `cdl-design-standards` here. Mode 1 produces a route map, not code. The one exception is its Rule 2 and Rule 2a, which mode 1 already cites where they matter.

---

## Phase — build

Read, in this order:

1. `.claude/skills/cdl-design-standards/SKILL.md` — every rule in the catalog
2. `.claude/skills/cdl-demo-conventions/SKILL.md`
3. The client overlay, when one exists
4. The plan file at `docs/briefs/<client>/<demo>/plan.md`, when one exists

Then run `cdl-build`. Two reminders that come up in every build:

- When the work starts from a brief and no plan file exists, stop and run the **plan** phase first.
- `cdl-build` Step 6 runs the **check** phase on the route base. A build is not finished until it runs clean, or until the user accepts the findings that remain.

### Build order — process pages first, About last

A demo is built in three waves, and each wave stops for the user's approval before the next
one starts. Never build the whole demo in one pass.

| Wave | Pages | Why here |
|---|---|---|
| **1 — Process** | The independent work sections: master data, month-end, outlook, and any other section the user works in directly | They own the demo's data and its field names. Nothing else can be right until these are. |
| **2 — Derived** | Overview, analysis, monitoring, scenarios, and every page that reads a process page | They read wave 1. A change to a process page in review moves them, so building them first means building them twice. |
| **3 — About** | The About page | It describes what was built. It cannot be written before the build it describes. |

**The test for which wave a page belongs to:** does it read data, field names, or shape from
another page of this demo? No → wave 1. Yes → wave 2. Does it describe the demo itself →
wave 3.

**Why the waves matter.** Two reasons, and both are load-bearing:

1. **Dependency.** The Overview summarises the process pages, the analysis explains their
   numbers, and the monitoring page lists the feeds they consume. Every one of those reads
   the process pages' shape. When a process page changes in review — and it does — a
   derived page built before it is rework.
2. **Context.** One wave is a readable review and a bounded amount of context. A whole
   demo in one turn spends context on pages the user has not agreed to yet, and it puts a
   20-page review in front of them at once.

**At each gate**, report the routes built in that wave and stop. Do not begin the next wave
until the user approves. Run `cdl-demo-audit` mode 2 once, after the last wave — not once
per wave, per `cdl-build` Step 6.

**The plan file states the waves.** `cdl-demo-audit` mode 1 writes a `## Build order`
section into `plan.md`, so the sequence is agreed at plan time rather than argued at build
time. When the plan has no such section, derive the waves with the test above and say so.

---

## Phase — check

Read `.claude/skills/cdl-demo-audit/SKILL.md`, then run **mode 2** on the route base.

Load nothing else up front. Mode 2 pulls what it needs: it walks `cdl-demo-conventions` across the demo, reads the client overlay, and calls `cdl-design-standards` review mode on each page, then folds every finding into one report.

Mode 2 reports and reconciles the plan file. It does not fix. The fixes go back through the **build** phase.

---

## Capturing new guidance

The user's guidance arrives mid-task, in the middle of a build or a review. A rule stated
once and never written down gets stated again three demos later. So capture it as it arrives.

A `UserPromptSubmit` hook watches for guidance-shaped prompts and reminds you to do this.
It lives at `.claude/hooks/capture-demo-guidance.sh` and is registered in
`.claude/settings.json`. It is advisory: it never blocks a prompt, and it never edits a
file. You judge, and you write.

**Judge first.** One-off instructions about the work in front of you ("move this card
left", "use blue here") are not guidance. Guidance holds for the next demo too — it names
a class of thing, not one element. When the user phrases a correction as a rule ("we
should label them as such", "never stack those"), treat it as guidance.

**Route it to the one file that owns it.** This is the precedence chain, read as a routing
table:

| The guidance is about… | It belongs in |
|---|---|
| How a CDL component is used on a page | `cdl-design-standards` |
| What a demo must contain — structure, routing, section naming, period controls, baselines, narrative, seeded data | `cdl-demo-conventions` |
| How to read a brief, or what an audit checks | `cdl-demo-audit` |
| One suite's paths, reference files, or stated exceptions | that suite's overlay, e.g. `guidance-air-canada` |
| Phase orchestration — which phase runs when, build order, where a gate sits | **this file** |

One rule, one file. When guidance seems to fit two files, pick the one whose question it
answers, and cite it from the other rather than copying it.

**Then write it.** Follow four steps, in order:

1. Confirm the pattern against real code in the demo pages of this repo. Never write a
   rule you have not verified. Count the pages that already follow it, and the pages that
   deviate — the deviations become the convergence clause.
2. Append it in the target file's own format, through its `Adding a rule` /
   `Adding a convention` / `Adding to this file` section. Keep it client-agnostic unless
   it is going into an overlay.
3. Update whatever enforces it. A new convention needs a line in `cdl-demo-audit` mode 1
   Step 5 and mode 2 Check 3, or no audit will ever catch it.
4. Apply the rule to the work in front of you, in the same turn.

Report in one line: the file, and the rule. Do not ask permission first, and do not stop
the task to do it.

**When the guidance contradicts an existing rule**, do not append a second rule beside it.
Edit the existing one, and say in the report what changed. Two rules that disagree are
worse than the older rule alone.

---

## What this skill must not do

- It must not restate a rule. A rule lives in exactly one file, and this skill points at that file. The routing table under "Capturing new guidance" points; it does not hold rules.
- It must not skip a file to save context. A phase that reads three of its four layers produces work that fails the fourth.
- It must not run two phases in one turn. Plan stops for approval, and check stops for a decision on its findings.
- It must not defer a capture. Guidance written down next turn is guidance lost, so capture it in the turn it arrives. Capture is not a phase, and it never stops the task.

<!-- Mirrored from compassanalytics/compass-design-library (.claude/skills/cdl-demo) retrieved: 2026-11-22.
Refresh: re-run the fetch in CLAUDE.md's App style standard section. -->
