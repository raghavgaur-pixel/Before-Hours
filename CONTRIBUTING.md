# Contributing to AFTERHOURS

Welcome! AFTERHOURS is built collaboratively. This guide keeps parallel work predictable and protects `main`.

## Before starting

1. Read the [MVP scope](docs/game-design/mvp-scope.md).
2. Read the [technical architecture](docs/architecture/technical-architecture.md).
3. Find an existing issue or discuss a proposal with the maintainer.
4. Ask to be assigned before beginning substantial work.

Do not begin a large feature that has not been agreed upon.

## Branching

Create a focused branch from the latest `main`:

```bash
git switch main
git pull origin main
git switch -c feat/short-description
```

Prefixes: `feat/` new functionality; `fix/` bug fixes; `docs/` documentation; `refactor/` restructuring; `test/` tests; `chore/` tooling.

Examples: `feat/settlement-inventory`, `fix/construction-cost-validation`.

Do not push directly to `main`. Do not work directly on another contributor's branch unless the maintainer explicitly coordinates it.

## Commits

Use clear imperative messages with a conventional prefix:

```text
feat: add settlement inventory endpoint
fix: prevent duplicate construction completion
docs: explain local development setup
test: cover offline production calculation
```

Keep commits focused. Never commit secrets, local environment files, build output, or unrelated formatting changes.

## Pull requests

- Open a PR against `main`.
- Link the issue using `Closes #123` when the PR fully resolves it.
- Explain what changed and why.
- Include screenshots/recording for visible UI changes.
- Include tests and commands used to run them.
- Call out schema, migration, configuration changes, and limitations.
- Keep PRs small enough to review.

A PR is not ready to merge while checks fail, requested changes remain unresolved, or review conversations are unresolved.

## Reviews and merges

The maintainer owns final review and merge decisions. Expect at least one approval before merging. Default merge strategy: **Squash and merge**.

Contributors should respond to feedback and push follow-up commits to the same PR branch.

## Updating a branch / resolving conflicts

```bash
git fetch origin
git switch feat/your-branch
git merge origin/main
```

Resolve conflicts locally, run relevant tests, then push the updated branch. Do not force-push shared branches. Ask the maintainer for help if a conflict changes shared contracts, migrations, or architecture.

## Engineering rules

- PostgreSQL is authoritative for game state.
- Never trust the browser to set balances, ownership, production rates, or completion outcomes.
- Keep domain calculations in shared, testable functions where practical.
- Use transactions for resource spending and construction completion.
- Make background work safe to retry.
- Add tests for game rules and important edge cases.
- Coordinate changes to shared contracts and database schema before implementation.

## Definition of done

A contribution is complete when acceptance criteria are met, tests pass, documentation is updated where necessary, and the maintainer has approved and merged the PR.
