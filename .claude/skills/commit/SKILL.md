---
name: commit
description: Bump semver, stage all changes, propose a commit message for user approval, then commit and push to GitHub.
argument-hint: "[patch|minor|major]"
allowed-tools: Bash(git *) Read Edit
---

Follow these steps exactly. Do not skip ahead or commit without user approval.

## Step 1 — Inspect changes

Run in parallel:
- `git status`
- `git diff HEAD`

Also read `package.json` to get the current version.

## Step 2 — Determine semver bump

If the user passed an argument (`$ARGUMENTS`), use it as the bump type (`patch`, `minor`, or `major`).

Otherwise, infer from the diff:
- **major** — breaking navigation/API changes, complete rewrites
- **minor** — new screen, new feature, new user-visible capability
- **patch** — bug fix, style tweak, copy change, small UX improvement

## Step 3 — Draft and propose

Calculate the new version by applying the bump to the current version.

Write a concise commit message (imperative mood, ≤72 char subject, optional short body).

Present the following and **STOP — wait for the user to respond before doing anything else**:

```
Proposed version: X.Y.Z  (patch | minor | major)

Commit message:
<subject line>

<optional body>
```

Ask: "Approve as-is, or tell me any changes you'd like."

## Step 4 — Apply (only after explicit user approval)

1. Update `"version"` in `package.json` to the new version.
2. `git add -A`
3. Commit with the approved message via heredoc.
4. `git push origin main`
5. Report the commit hash and new version.
