---
name: test
description: Run the full test suite and report results. Write new tests for any untested logic before running.
allowed-tools: Bash(npx jest *) Read Write Glob Grep
---

Follow these steps exactly.

## Step 1 — Check for untested new logic

Review recent changes (from `git diff HEAD` or context) and identify any new logic in:
- `src/utils/`
- `src/stores/`
- `src/services/`
- `src/hooks/`

If new testable logic exists without corresponding tests, write them before proceeding.
Focus on unit-testable code (pure functions, store actions, service methods).
Skip UI/screen components — those require a component testing setup not yet in place.

## Step 2 — Run the suite

```
npx jest --passWithNoTests
```

## Step 3 — Report results

- If all tests pass: report the count and confirm ready to commit.
- If any tests fail: show the failure output, fix the code or tests, and re-run until green.
- Never proceed to `/commit` with a failing test suite.
