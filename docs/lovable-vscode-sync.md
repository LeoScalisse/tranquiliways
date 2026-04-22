# Lovable ↔ VS Code Sync

## Source of truth

- This project treats `main` as the single source of truth for everything that must appear in Lovable.
- Lovable must be connected to `LeoScalisse/tranquiliways`.
- Lovable must sync against the default branch `main`.
- This is an ordered GitHub workflow, not simultaneous live co-editing in the same file.

## Daily workflow

### When work starts in VS Code

1. Run `npm run sync:status`.
2. Confirm you are on `main`, the worktree is clean, and `origin` points to `https://github.com/LeoScalisse/tranquiliways.git`.
3. Make the local changes.
4. Commit small, focused changes on `main`.
5. Push with `git push origin main`.
6. Wait for Lovable to refresh from GitHub.

### When work starts in Lovable

1. Wait until Lovable finishes syncing its change to GitHub.
2. In VS Code, run `npm run sync:now`.
3. Confirm local `main` matches `origin/main`.
4. Continue editing locally only after the pull/rebase completes cleanly.

## Local helper commands

- `npm run sync:status`
  Shows branch, remote URL, clean/dirty state, local commit, remote commit, and ahead/behind counts.
- `npm run sync:now`
  Safely runs `git fetch origin --prune` followed by `git pull --rebase origin main`, but only when the checkout is clean and already on `main`.

## Rules of operation

- Any change that should appear in Lovable must land in `main`.
- Do not expect Lovable previews to track feature branches day to day.
- Do not use auto-commit or auto-push watchers.
- Do not pull/rebase while you have uncommitted local changes.
- Open the repository root directly in VS Code, not a nested folder or worktree, when you are doing Lovable-visible work on `main`.

## Recovery checklist

Follow this order when sync looks broken:

1. Run `npm run sync:status` and confirm local `main` is clean.
2. Confirm `origin` is `https://github.com/LeoScalisse/tranquiliways.git`.
3. Compare the local `origin/main` commit with the commit visible in Lovable.
4. In Lovable, confirm the connected GitHub repository is `LeoScalisse/tranquiliways`.
5. In GitHub and Lovable, confirm the default branch is `main`.
6. Confirm the repository owner/path was not renamed or moved.
7. Re-authorize or reconnect the Lovable GitHub integration if the repository is correct but sync is stale.
8. Only consider remixing or recreating the Lovable project if reconnecting the current project fails.

## Expected behavior

- Local changes do not appear in Lovable until they are pushed to `origin/main`.
- Lovable changes do not appear in VS Code until GitHub receives them and you pull/rebase locally.
- Changes made on any branch other than `main` will not reliably appear in Lovable until they are merged into `main`.
