---
name: docs-lookup
description: >
  Retrieve relevant project documentation for a question/topic, returning the matching doc section(s) +
  their repo path. Searches the config-derived docs corpus — docs.recurseDirs/**/*.md, docs.rootFiles, and
  the specs tickets (<specsDir>/*.md) — and returns ranked excerpts. Use when you need to ground an answer
  or a plan in the real docs: "how does X work", "what does the doc say about Y", or "/docs-lookup <topic>".
  Built to be invoked by the spec skills (spec-new / spec-start / spec-ideate) so planning references the
  actual docs. Read-only.
argument-hint: "<topic or question, e.g. 'auth refresh flow' or 'staging vs prod env'>"
allowed-tools: Bash, Read, Glob, Grep
---

# docs-lookup — retrieve docs for a topic

Find the documentation most relevant to `$ARGUMENTS` and return it concisely, so the caller (you, or a spec
skill) can ground its work in the real docs instead of guessing. **Read-only** — never edits docs or git.

## Step 0 — Config (do this first)
Read **`spec-kit.config.json`** at the repo root. If it is missing, say so and stop (suggest `/spec-init`).
Derive the corpus from its `docs` block + `specsDir`:
- **`docs.recurseDirs[]`** — recurse each for `*.md` (e.g. `docs/**/*.md`).
- **`docs.rootFiles[]`** — individual root-level docs (e.g. `README.md`, `CLAUDE.md`).
- **`<specsDir>/*.md`** — the feature-library tickets (always part of the corpus).
- **`docs.home`** — the master index doc; skim it first to map the topic to the right section/doc.
- **`docs.groups[]`** — optional `{match, label}` rules describing how docs are sectioned; use the labels to
  pick the canonical area for a topic.

**Never return a hit from an archive tree.** By convention a superseded page moves to `docs/_archive/`
rather than being deleted, so nothing is lost. Its content has been **replaced** somewhere else in the
corpus, which means grounding new work in it reintroduces a number or a decision the project already
retired. Exclude the prefix from every search:

```
--glob '!docs/_archive/**'
```

If the only match for a topic is archived, **say so and name the page that superseded it** rather than
quoting the archive. "The answer is in a retired page, and here is what replaced it" is useful; a silent
quote from the archive is worse than no answer, because it reads as current.

### Two kinds of source, kept apart in what you return

Most projects carry both, and they answer different questions:

| Kind | Answers | Label it as |
|---|---|---|
| **Evidence corpus** | what this project/system actually does today, and what was decided | project docs, with the path |
| **Reference material** | how we build things: standards, conventions, platform choices, style | reference, not evidence |

Return them under separate headings, and never merge a reference claim into an evidence claim. "The system
does X" and "we would build X this way" are different assertions, and conflating them is how a convention
ends up cited as a fact about the running system.

**`docs/reference/` is the reference tree.** It holds the Compass standards `standards-sync` mirrors from
`compassanalytics/compass-standards`, each with provenance front matter (`repo`, `path`, `ref`,
`retrieved`), plus any engagement-level reference pages. Whenever the topic involves building something
(a pipeline, a data layer, an app, an API, a dashboard, naming, CI, testing) search `docs/reference/`
**in parallel** with the evidence corpus, not as a fallback, and label every hit from it as reference.
It is usually the only source in the corpus for medallion layering, CI/CD, testing and logging
conventions. When the tree is absent, say so once; it means the project mirrors no standards.

## Steps
1. **Map the topic.** Read `docs.home` (the index) to identify the 1–3 most likely docs for the topic, using
   `docs.groups[]` labels to locate the right section.
2. **Search.** `Grep`/ripgrep the corpus for the topic's key terms (case-insensitive) across
   `docs.recurseDirs[]`, `docs.rootFiles[]`, and `<specsDir>/`, always with
   `--glob '!docs/_archive/**'`. Rank hits by how central the term is (a section heading > a passing
   mention).
3. **Read the best matches** (the specific section, not the whole file) with `Read`.
4. **Return** a tight result: for each relevant doc — its **repo path**, the **section heading**, and a
   short excerpt or summary that answers the topic. Note if coverage is thin or missing (a doc gap →
   candidate for `docs-update`). Don't dump entire files.

## Guardrails
- Read-only: never modify docs, the index, or git.
- Prefer the canonical doc for the area (use `docs.groups[]` labels to decide). If nothing matches, say so
  plainly rather than inventing an answer.
- **Nothing from `docs/_archive/`, ever.** If that is the only hit, name the superseding page instead.
- **Label evidence and reference separately** in every return. Conflating the two is the failure mode the
  labelling exists to prevent.
- When invoked by a spec skill, keep the return brief and path-anchored so it slots into a plan/ticket.
