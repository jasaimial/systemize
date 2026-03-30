# Branching Strategy

## Overview

Multiple agents (AI and human) work on this project concurrently. To avoid conflicts, all work happens on feature branches. `main` is protected.

## Rules

1. **Never push directly to `main`**
2. **One branch per task** — short-lived, merged when done
3. **Only the project owner merges to `main`** — via GitHub PR
4. **Pull latest `main` before creating a branch**
5. **Delete branch after merge**

## Branch Naming

```
<type>/<short-description>

feat/calendar-page
fix/xp-calculation-bug
chore/update-dependencies
refactor/auth-middleware
```

**Types:**
- `feat/` — new feature or functionality
- `fix/` — bug fix
- `chore/` — maintenance, config, tooling
- `refactor/` — code restructuring (no behavior change)
- `docs/` — documentation only

## Workflow

```bash
# 1. Start from latest main
git checkout main
git pull

# 2. Create feature branch
git checkout -b feat/your-feature-name

# 3. Work, commit as you go
git add -A
git commit -m "feat: description of change"

# 4. Push branch
git push -u origin feat/your-feature-name

# 5. Create PR on GitHub (or tell the project owner)
# 6. Owner reviews and merges
# 7. Delete branch after merge
```

## For AI Agents

- **Always check which branch you're on** before making changes: `git branch --show-current`
- **Always create a feature branch** before starting work — never commit to `main`
- **Run tests before pushing:** `cd apps/backend && pnpm test`
- **Keep branches small** — one feature or fix per branch, merge often
- **If another branch has changes you need**, rebase: `git rebase main`
- **Write clear commit messages** — other agents and humans read them

## Resolving Conflicts

If your branch conflicts with `main` after someone else merged:

```bash
git checkout your-branch
git fetch origin
git rebase origin/main
# Fix conflicts if any, then:
git push --force-with-lease
```

## Branch Protection (GitHub Settings)

`main` branch rules:
- Require pull request before merging
- Require status checks to pass (tests)
- No direct pushes
