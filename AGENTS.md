# Project Overview

Single-file HTML project using Three.js for 3D graphics. No build system, no package manager, no dependencies beyond the CDN-loaded Three.js library.

## Structure

- `index.html` - The entire application. Contains embedded CSS and JavaScript.
- `opencode.json` - OpenCode configuration with custom agents and permissions.
- `.opencode/` - Custom agents, skills, and commands.

## Development

No build step required. Open `index.html` directly in a browser or use a local server.

## OpenCode Configuration

Custom agents defined in `opencode.json`:
- `code-reviewer` - Reviews code quality (read-only, cannot edit files)
- `doc-writer` - Writes documentation
- `test-writer` - Creates test suites

Permissions: Git, npm, npx, node, python, pip, ls, cat commands are auto-approved. Other bash commands require approval. File edits require approval.

## Conventions

Git workflow uses conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`

## Gotchas

- No git repo initialized yet. Run `git init` before first commit.
- No `package.json` or `node_modules`. Three.js is loaded via CDN (r128).
- No linter, formatter, or test framework configured. The `lint-fix` command references ESLint/Ruff/Prettier but none are installed.
- The `test-writer` agent exists but has no test framework to work with.
