# Contributing to GTM & GA4 Assistant

Thanks for your interest in contributing! This document describes the workflow for reporting bugs, proposing enhancements, and submitting code.

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Reporting bugs](#reporting-bugs)
- [Proposing features](#proposing-features)
- [Development setup](#development-setup)
- [Git workflow](#git-workflow)
- [Code style](#code-style)
- [Commit messages](#commit-messages)
- [Pull request process](#pull-request-process)

## Code of conduct

This project adheres to the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating, you agree to uphold a respectful and inclusive environment.

## Reporting bugs

Before opening an issue:

1. Check [existing issues](https://github.com/AxelTinoco/tag-assistant-firefox/issues) to avoid duplicates
2. Reproduce the bug on the latest available version
3. Open an issue using the **Bug report** template and include:
   - Firefox and extension version
   - Operating system
   - Steps to reproduce
   - Expected vs. actual behavior
   - Screenshots or console logs if applicable

## Proposing features

1. Review the [roadmap](./README.md#roadmap) and open issues labeled `enhancement`
2. Open an issue using the **Feature request** template describing:
   - The problem it solves
   - The proposed solution
   - Alternatives considered

For large changes, discuss first in an issue before implementing.

## Development setup

### Requirements

- **Node.js** ≥ 18
- **pnpm** ≥ 9 (this project only accepts pnpm as its package manager)
- **Firefox** (Developer Edition recommended)

### Install

```bash
git clone https://github.com/AxelTinoco/tag-assistant-firefox.git
cd tag-assistant-firefox
pnpm install
```

If you don't have pnpm:

```bash
corepack enable
# or
npm install -g pnpm
```

### Run the extension in development

```bash
pnpm start
```

This opens a Firefox instance with the extension loaded and **hot reload** enabled: saving a file reloads the extension automatically.

### Manual load (alternative)

1. Go to `about:debugging#/runtime/this-firefox`
2. Click **"Load Temporary Add-on..."**
3. Select `manifest.json`

## Git workflow

1. Fork the repository
2. Create a branch off `develop`:
   ```bash
   git checkout -b feat/my-feature develop
   ```
3. Make your changes with small, descriptive commits
4. Push to your fork and open a Pull Request against `develop`

### Branch naming conventions

- `feat/<name>` — new features
- `fix/<name>` — bug fixes
- `docs/<name>` — documentation only
- `refactor/<name>` — refactors without functional change
- `chore/<name>` — maintenance (deps, build, CI)

## Code style

- **ESLint** and **Prettier** are the source of truth
- Before committing:
  ```bash
  pnpm lint
  pnpm lint:ext
  pnpm format
  ```
- Use `const` by default, `let` only when reassigning
- Prefer small functions with descriptive names
- No obvious comments: explain **why**, not **what**

## Commit messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation
- `style` — formatting (no code changes)
- `refactor` — refactor without functional change
- `perf` — performance improvement
- `test` — add or fix tests
- `chore` — maintenance, build, deps

### Examples

```
feat(popup): add copy-to-clipboard button for GTM ID
fix(background): handle tabId=-1 in webRequest listener
docs(readme): update installation instructions for pnpm
```

## Pull request process

1. Make sure `pnpm lint`, `pnpm lint:ext`, and `pnpm format:check` pass
2. Update the docs if your change affects usage
3. Add an entry to `CHANGELOG.md` under `[Unreleased]`
4. Use the PR template and describe:
   - What problem it solves
   - How you tested it
   - Screenshots for UI changes
5. Wait for review — maintainers will respond as soon as they can

## Questions?

Open a [Discussion](https://github.com/AxelTinoco/tag-assistant-firefox/discussions) or an issue with the `question` label.
