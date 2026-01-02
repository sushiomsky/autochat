# Contributing Guide

## Environment

- Node.js >= 20.19 (Node 22 LTS recommended; `.nvmrc` provided)
- npm 9+ with `--legacy-peer-deps` (handled by `.npmrc` and `Makefile`)
- Chrome/Firefox only needed when running browser integration tests locally.

## Setup

```bash
make setup          # installs dependencies with binary downloads skipped
npm run verify      # lint + format check + tests (with coverage) + build
```

## Pre-commit

- Hooks are installed via `npm run prepare` and run `lint-staged` on staged files.
- To run manually: `npm run lint-staged`.
- Keep commits small; use conventional commit prefixes (e.g., `feat:`, `fix:`, `chore:`).

## Testing

- Unit/integration tests: `npm run test` (or `npm run test:ci` for coverage).
- Linting: `npm run lint:ci`
- Formatting: `npm run format:check`
- Security audit: `npm run audit:ci`

## CI/CD

- PRs run lint, format check, tests with coverage, audit, and build on Node 22 (see `.github/workflows/ci.yml`).
- Secret scanning via Gitleaks and SAST via CodeQL.
- Releases are automated with release-please; approved release PRs create tags and trigger packaging via `publish.yml`.

## Releases

- Do not manually bump versions. Release-please manages versioning and changelog updates.
- Tagged releases automatically package artifacts and attach zips to the GitHub Release.
