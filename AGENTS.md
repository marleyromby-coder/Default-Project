# Project Overview

This repository holds two independent projects:

- `index.html` – a single-file Three.js demo (CDN-loaded r128, no build step).
- `fixmatch/` – **FixMatch**, an Expo (SDK 58) / React Native iPhone app for finding and comparing Danish craftsmen and mechanics. See `fixmatch/README.md` and `fixmatch/AGENTS.md`.

## Structure

- `index.html` - The Three.js demo. Contains embedded CSS and JavaScript.
- `fixmatch/` - The FixMatch app (own `package.json`, tests and lint config).
- `opencode.json` - OpenCode configuration with custom agents and permissions.
- `.opencode/` - Custom agents, skills, and commands.

## Development

- Three.js demo: no build step. Open `index.html` in a browser.
- FixMatch: `cd fixmatch && npm install && npx expo start`. Run `npm run check` (typecheck, lint, Jest) before committing.

## OpenCode Configuration

Custom agents defined in `opencode.json`:
- `code-reviewer` - Reviews code quality (read-only, cannot edit files)
- `doc-writer` - Writes documentation
- `test-writer` - Creates test suites (FixMatch uses Jest via `jest-expo`)

Permissions: Git, npm, npx, node, python, pip, ls, cat commands are auto-approved. Other bash commands require approval. File edits require approval.

## Conventions

Git workflow uses conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`

## Gotchas

- The root has no `package.json`; all Node tooling lives in `fixmatch/`.
- The `lint-fix` command applies to `fixmatch/` (ESLint via `npx expo lint`). The Three.js demo has no linter.
- FixMatch ships demo data by default. App Store builds must use `EXPO_PUBLIC_FIXMATCH_DATA=live` (see `fixmatch/eas.json`).
