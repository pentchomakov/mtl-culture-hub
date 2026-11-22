---
name: standards-sync
description: >
  Refresh the Compass standards mirrored into docs/reference/ from compassanalytics/compass-standards,
  pinned to one commit recorded in spec-kit.config.json's `standards` block. Use when the user says
  "sync the standards", "refresh the standards", "are the standards current", "re-pin the standards",
  or "/standards-sync". Runs the project's tools/standards/sync.mjs: first `--check` to report drift
  between the pin, the repo head and each local mirror, then, on a yes, re-pins to the head and
  mirrors every document. Never edits a mirrored file by hand: the standard is edited in its own
  repo and mirrored again.
argument-hint: "[--check only]"
allowed-tools: Bash, Read, Edit
---

# standards-sync: keep the mirrored standards current

Loopable: idempotent, re-reads the config every run, and writes only on drift. `/loop /standards-sync`
is safe, and mostly reports "drift: no".

Compass's engineering standards live in `compassanalytics/compass-standards` and are published to
Confluence from there. A project mirrors the documents its domain names into `docs/reference/`, pinned
to one commit, so a future-state architecture, a wireframe requirements document or a roadmap can say
which version of the standard it was held to, and a reviewer can read it offline.

**Reference, not evidence.** `docs-lookup` searches `docs/reference/` as a parallel source and labels
its hits separately. A standard says how Compass builds things; it is never cited as a fact about the
client's current state, and a client-facing deliverable restates the relevant standard in its own words
rather than linking to it (the tree is withheld from the client portal by `docs.deployExclude`).

## Step 0: read the config

Read `spec-kit.config.json`. Bind **STD** = `standards` (`repo`, `ref`, `docs[]`). If the block is absent,
say so and stop: `spec-init` writes it from the domain's standards list, and a project with no block has
chosen to mirror nothing.

## Steps

1. **Report drift, writing nothing.**
   ```bash
   node tools/standards/sync.mjs --check
   ```
   The report names the pinned sha (`pin none` when init could not reach the repo and left the pin
   empty), the repo's head sha, and for each document whether the local mirror matches the pin (`ok`), is
   behind it (`stale`) or is `missing`, then one line: `drift: yes` or `no`.
   With `--check` in the arguments, or on `drift: no`, stop here and report.
2. **Ask before re-pinning.** Re-pinning changes which version of a standard the project is held to, so
   it is the user's call. Show the two shas and ask. On a no, stop.
3. **Re-pin and mirror.** Set `standards.ref` in `spec-kit.config.json` to the head sha the check printed
   (an `Edit`, keeping every `//` comment), then
   ```bash
   node tools/standards/sync.mjs
   ```
   Every document is fetched to a temp file first and lands only when all of them succeeded, so a path
   that no longer exists at the new head fails the run with its name and writes nothing. When that
   happens, the document was moved or renamed upstream: find its new path in the repo, update
   `standards.docs[].path`, and run again.
4. **Report.** The new pin, each mirrored path with its `retrieved` date, and the one-line reminder that
   the mirrors are read-only.

## Guardrails

- **Never edit a mirrored file.** The next sync overwrites it. Edit the standard in `compass-standards`
  (a pull request there), then re-sync.
- **The pin is in the config, not in the script.** A sync without a re-pin refreshes the same version,
  which is what repair after a bad merge needs.
- **No `gh` login, no sync.** The repo is private. Say so and stop; never ask for a token.
- Adding a standard is a config edit: append `{ "path", "to" }` to `standards.docs` and sync. The paths
  follow the repo's layout, `standards/<discipline>/<platform>/<name>.md`.
