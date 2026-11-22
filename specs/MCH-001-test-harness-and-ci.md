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
Add a unit-test runner and a GitHub Actions pipeline so every later ticket has real gates to verify against. The Compass standards require automated tests before deploy; today the repo has lint and `check:cdl` but no test runner and no CI.

## Requirements
- Add `vitest` (Vite-native) with a `test` script in `package.json`, plus a `test:watch` script. Include one trivial passing test so the harness is proven.
- Add `.github/workflows/ci.yml` triggered on push and pull request to `develop` and `main`. Steps: `npm ci`, `npm run lint`, `npm run check:cdl`, `npm run build`, `npm test`.
- Cache npm between runs.
- Document in `README.md` how to run each gate locally.

## Acceptance
- `npm test` runs vitest and exits 0.
- A deliberately failing test makes `npm test` exit non-zero (verify once, then revert).
- `ci.yml` runs on a pull request and shows lint, check:cdl, build and test as separate visible steps.
- README lists the four gate commands.

## Notes
- Backend tests (MCH-002 onward) will use the same runner; do not add a second one.
- Standards reference: `docs/reference/application-development-standards.md` section 4.5 (CI/CD) and section 4.6 (AI-generated code must pass the same gates).
- Open question: whether to apply branch protection (`tools/githooks/setup-branch-protection.sh`) once CI exists, so a green CI becomes a required check.
