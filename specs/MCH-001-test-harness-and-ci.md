---
id: MCH-001
title: Test harness and CI
status: backlog
impacts: [frontend, backend]
who: [pentchomakov]
source: human
branch:
deps: []
created: 2026-11-22
paths: []
---

## Summary
Add a unit-test runner and the CI pipeline the spec-kit's own guards expect, so every later ticket has real gates to verify against. The Compass standards require automated tests before deploy; today the repo has lint and `check:cdl` but no test runner and no CI.

## Requirements
- Add `vitest` with `test` and `test:watch` scripts in `package.json`, plus one trivial passing test so the harness is proven. Backend tests (MCH-002 onward) use the same runner.
- Add `.github/workflows/ci.yml` in the shape `tools/docs-site/scripts/check-workflows.mjs` asserts. Try `/spec-init` repair first, since it scaffolds this pipeline; hand-write it only if repair does not.
  - Triggers: push to `main` and `develop`; pull_request into `main` and `develop`.
  - Four jobs:
    - `workflows-intact` runs `npm run check:workflows` in `tools/docs-site`.
    - `source-is-integration` runs `tools/docs-site/scripts/check-trunk-from-integration.mjs`.
    - `verify` runs `npm ci`, `npm run lint`, `npm run check:cdl`, `npm run build`, `npm test`.
    - `deploy` needs the other three, runs only on a push to `refs/heads/main`, and is a no-op step stating that no deploy is configured, until the Cloudflare ticket exists.
  - `concurrency` with a group and `cancel-in-progress: false`; `fetch-depth: 0` on the checkout of `source-is-integration`, `verify` and `deploy`; `permissions: contents: read` and no write scopes.
- Install `tools/docs-site` dependencies so the pre-push hook runs its checks instead of skipping them, and document that step.
- Document in `README.md` how to run each gate locally.

## Acceptance
- `npm test` runs vitest and exits 0; a deliberately failing test makes it exit non-zero (verify once, then revert).
- `npm run check:workflows` and `npm run check:workflows -- --self-test` in `tools/docs-site` both pass.
- A push to `develop` runs `workflows-intact`, `source-is-integration` and `verify`; `deploy` is skipped.
- Pushing `develop` no longer prints "skipping the board and workflow checks".
- README lists the gate commands.

## Notes
- Standards reference: `docs/reference/application-development-standards.md` section 4.5 (CI/CD) and section 4.6 (AI-generated code must pass the same gates).
- Why the four-job shape: the pre-push hook runs `check-workflows.mjs` before any push to `main`, so a simpler pipeline would make `/spec-ship` refuse to publish.
- Open question: whether to apply branch protection (`tools/githooks/setup-branch-protection.sh`) once CI exists, so a green CI becomes a required check.
