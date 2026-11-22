## Spec-driven workflow

Spec-driven development is the default way to build **mtl-culture-hub**. Every feature and fix is a ticket in
`specs/` (`MCH-NNN-<slug>.md`), rendered by the read-only board (`/spec-board`). Lifecycle:
`backlog → in-progress → pending-review → shipped`, plus `proposed` / `rejected` for AI-authored ideas. This project's own skills:
`/autopilot`, `/cdl-build`, `/cdl-demo`, `/cdl-demo-audit`, `/cdl-demo-conventions`, `/cdl-demo-review-board`, `/cdl-design-standards`, `/cdl-primitive-sync`, `/cdl-use`, `/docs`, `/docs-lookup`, `/docs-update`, `/spec-approve`, `/spec-board`, `/spec-ideate`, `/spec-new`, `/spec-recap`, `/spec-ship`, `/spec-start`, `/spec-swarm`, `/spec-test`, `/standards-sync`.

Status is tracked by **direct edits on `develop`**: each flip is a committed edit to the
ticket's `status:` line there, and a feature branch never edits its own ticket's front-matter, which is
what keeps `specs/` conflict-free across parallel work. The thin coordinator
(`tools/spec-coord/`) provides session beacons, narrow locks and `coord.sh clean`; it does not own status,
because status is just a committed edit. Feature branches are `feat/<slug>`, cut off
`develop` and merged back into it.

The **impacts** axis says which surfaces a ticket touches. This project's surfaces:

- `frontend` — the UI: pages, components, styling, the CDL app shell.
- `backend` — server-side logic, APIs and integrations.
- `db` — schema, migrations and data access.

This project uses the **simple** profile: there is no deploy or simulator sign-off gate. `/spec-ship` merges the reviewed work and flips the ticket to `shipped`.

### Front-matter axes

- **`impacts:`** is mandatory and never empty. It drives verification and the ship gates, and it is what
  the board filters on, so a ticket without it is invisible to both.
- **`who:`** holds the GitHub logins that have touched the ticket, appended over its life on
  `develop` alongside the status flips.
- **`paths:`** says what the ticket gates on deploy. `paths: []` is a real answer meaning it gates
  nothing; write the empty list rather than omitting the key, so "nothing to gate" reads differently
  from "nobody thought about it".
- **`hotfix:`** skips the staging hop, and nothing else: not the review, not a sign-off gate.
- **`source:`** is `human` (default), `ai` (from `/spec-ideate`, lands `proposed` and waits for
  `/spec-approve`), or `annotation`.

### Loopable skills

A skill is **loopable** (safe under `/loop /<skill>`) when it satisfies all five:

1. **Idempotent re-entry**: it re-reads `spec-kit.config.json` at the top of every iteration.
2. **Self-selecting work queue**: it derives its next batch from ticket state, so re-invocation
   advances instead of repeating.
3. **A hard human stop inside the loop**: any human gate (approval, sign-off) halts and hands back;
   the skill never self-approves.
4. **Self-cleanup each pass**: it ends with `coord.sh clean` and `session-end` so iterations do not
   accumulate worktrees or beacons.
5. **Self-pacing**: it does its next unit of work at a natural boundary rather than assuming a fixed
   interval.

`/loop` is a Claude Code CLI built-in: universally available, zero install. The pairings that hold:
`/loop /autopilot`, `/loop /spec-swarm`, `/loop /spec-ideate`, `/loop /spec-recap`.

### App style standard

Any app, portal or prototype built in this project uses the **Compass Design Library** shell, with CDL
tokens synced from the registry (`npm run sync:cdl`, registry
`https://cdl-registry.compassdata.workers.dev`, override with `CDL_REGISTRY`) and the Tailwind v4
`@theme` idiom (no `tailwind.config.js`), on shadcn **new-york**.

These are rules, not preferences:

- **Every page uses `CdlPageContainer` as its outermost shell. No custom layout wrapper.** This is the
  hard rule from `cdl-build`, and `npm run check:cdl` fails the build when a page under `src/pages/`
  does not use it.
- **Sidebar footer order**: footer content, footer nav, Settings, Theme, user. That order is the
  product's, not a preference; a reordered footer reads as a different application.
- **Phosphor for nav icons.** Not lucide: `check:cdl` fails on a `lucide-react` import in the sidebar
  factory, and `components.json` must keep `"iconLibrary": "phosphor"`. The ban is scoped to the sidebar
  factory on purpose, because several CDL components type their own `icon` prop as `LucideIcon`
  (`CdlEmptyState` requires one), so a blanket ban would forbid using the library as published. A
  Phosphor icon satisfies that type structurally, which is why nav items can be Phosphor at all.
- **`var(--chart-n)` for series colours.** Never a hardcoded hex in a chart: the chart ramp is a themed
  token, so a client overlay recolours every series for free.
- **The as-of stamp goes in `titleInfo`; period controls go in `actions`; page tabs are `navLinks`.**
- **Overview is the landing page.** Every app opens on a dispatcher page that routes onward.

**Client branding is a theme overlay and a logo in the sidebar logo slot; it is never a reason to
replace the shell.**

Eight CDL skills are mirrored into `.claude/skills/`: `cdl-use`, `cdl-build`, `cdl-design-standards`,
`cdl-demo-conventions`, `cdl-demo`, `cdl-demo-audit` and `cdl-demo-review-board` from
`compassanalytics/compass-design-library`, plus `cdl-primitive-sync` from
`compassanalytics/compass-app-template` (that is its home; the URL below is not a typo to be fixed).
`cdl-use` prefers the registry's own published copy when it is reachable. Re-pull the mirrors with:

```bash
curl -fsS "https://cdl-registry.compassdata.workers.dev/cdl-skill.md" > ".claude/skills/cdl-use/SKILL.md" || gh api "repos/compassanalytics/compass-design-library/contents/.claude/skills/cdl-use/SKILL.md?ref=main" -q .content | base64 -d > ".claude/skills/cdl-use/SKILL.md"
for n in cdl-build cdl-design-standards cdl-demo-conventions cdl-demo cdl-demo-audit cdl-demo-review-board; do gh api "repos/compassanalytics/compass-design-library/contents/.claude/skills/$n/SKILL.md?ref=main" -q .content | base64 -d > ".claude/skills/$n/SKILL.md"; done
gh api "repos/compassanalytics/compass-app-template/contents/.claude/skills/cdl-primitive-sync/SKILL.md?ref=main" -q .content | base64 -d > ".claude/skills/cdl-primitive-sync/SKILL.md"
```
