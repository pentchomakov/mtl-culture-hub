---
name: spec-recap
description: >
  Rewrite <specsDir>/RECAP.md, the rolling exec summary of where this project actually stands: Now (in
  flight), Just done (about the last working day's worth of work), Next (deps-ready backlog, ordered). Use
  when the user says "what's the status", "give me a recap", "summarize where we are", "update the recap",
  "write the standup", or "/spec-recap". Reads ticket front-matter, the integration branch's git log, and
  the coordinator's live sessions; overwrites the file whole because it is generated content. Rendered by
  the spec board's Summary button, which has a Copy button for pasting it into a status update.
argument-hint: "[optional: focus note, e.g. 'for the client call' or 'just the UI work']"
allowed-tools: Bash, Read, Write, Glob, Grep
---

# spec-recap — keep the recap current

One file, rewritten whole: `<SPECS>/RECAP.md`. Its job is to answer "where are we?" in a form someone can
paste into a message without editing it. The board's **Summary** button renders it; the Copy button hands
over the raw markdown.

**Loopable**: `/loop /spec-recap`. It re-reads the config each pass, derives everything from ticket state
and git, writes no ticket and no branch, and needs no cleanup, so an unattended loop just keeps the summary
warm.

## Step 0 — Read the config (required)
Read **`spec-kit.config.json`** at the repo root. If it is missing, tell the user to run `/spec-init` and
**stop**. Bind:

- **`PREFIX`** = `prefix` · **`SPECS`** = `specsDir` · **`NAME`** = `name`.
- **`LIFECYCLE`** = `lifecycle[]` — which statuses count as in-flight, done, and not-started.
- **`INTEGRATION`** = `branching.integration || branching.trunk` — the branch whose log is the record of
  what happened.

## Sources (all three, every run)

1. **Ticket front-matter** under `<SPECS>/`: `id`, `title`, `status`, `who`, `deps`, `impacts`, and any
   `## Notes` outcome or publish line. This is the authority for what a ticket **is**.
2. **`git log` on INTEGRATION** since the last recap: use the previous file's `updated:` stamp as the
   window start (`git log --since=<stamp> --oneline origin/<INTEGRATION>`, or local if there is no
   remote), falling back to about one working day when there is no previous recap. This is the authority
   for what actually **happened**.
3. **`bash tools/spec-coord/coord.sh status --json`** for live sessions: who is working on what right now,
   which is often newer than any commit.

## The file

Overwrite `<SPECS>/RECAP.md` in full. Two stamp lines, then three sections, nothing else:

```markdown
updated: 2026-03-04T16:20:00Z
window: ~last working day

## Now
- <PREFIX>-041 · Session refresh on the API edge · @ana-lopez · staging deploy failing on the token TTL, being reworked.
- <PREFIX>-044 · Billing export · @sam-ok · in flight, no blockers.

## Just done
- <PREFIX>-039 · Login rate limit · shipped, live since Tuesday; no rollback.
- <PREFIX>-040 · Schema migration for sessions · merged and verified on staging, waiting on sign-off.

## Next
- <PREFIX>-045 · Invoice PDF renderer · deps clear.
- <PREFIX>-046 · Retry queue · deps clear, follows 045 in practice.
```

- **`## Now`** — tickets genuinely in flight (an in-progress-class status in LIFECYCLE, or a live coord
  session). One line each: id, title, `who`, and the single most useful sentence, which is usually the
  blocker rather than the plan.
- **`## Just done`** — recently flipped or shipped work, sized by **volume of work rather than strict clock
  time**: roughly the last working day's WORKLOAD. A quiet week ago and a busy hour ago are not equally
  interesting. Each with a one-line outcome (what changed, and whether it is live).
- **`## Next`** — backlog whose `deps` are satisfied, ordered as you would actually pick it up. Leave out
  anything blocked, and say what blocks it only if it is the thing everyone keeps asking about.

Honor a focus note passed as an argument by narrowing the selection, never by changing the shape.

## Rules
- **Plain exec language.** No hedging, no jargon, no status theatre. The reader wants to know what is
  moving, what landed, and what is next.
- **No invented facts.** Every line traces to a ticket, a commit, or a live session. If a ticket's state
  is unclear, say the state is unclear and name the ticket rather than guessing a percentage.
- **Cite ticket ids** in every bullet. An id makes a line checkable; a description without one does not.
- **Keep it under about 40 lines.** The value is that it fits on a screen. If it does not fit, the project
  has too much declared in flight, and that is worth saying out loud.
- **Overwrite the whole file.** It is generated content: never append, never patch, never keep a stale
  section because it looked fine. The `updated:` stamp is what makes the next window correct.
- **Never edit a ticket.** This skill reads tickets and writes one generated file. No status flips, no
  branches, no deploys.

## Closing
Commit the recap on INTEGRATION (`docs: refresh recap`) if the project commits generated files, and push
when an `origin` exists. Then tell the user it is current and that the board's **Summary** button renders
it with a Copy button.
