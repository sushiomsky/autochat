# Modernization Plan

## Initial Assessment
- **Language/runtime**: JavaScript (ES6+) for Chrome/Firefox extension, Node.js toolchain (no engine pinned).
- **Build**: Custom Node scripts (`scripts/build.js`, `scripts/build-firefox.js`), manual packaging steps; no containerized build.
- **Dependencies**: npm with `package-lock.json`; install currently fails offline due to `chromedriver` binary download.
- **Testing**: Jest unit/integration scaffolding; coverage configured but not enforced in CI.
- **CI/CD**: Multiple overlapping workflows (`ci.yml`, `ci-simple.yml`, `publish.yml`) without caching, security gates, or automated releases.
- **Security**: No automated dependency or secret scanning beyond default GitHub features.
- **Manual steps**: Local setup relies on manual `npm install`/`build`; no one-command bootstrap or pre-commit automation.

## Modernization Goals
- Pin and document a current LTS Node.js toolchain; make installs reproducible and offline-friendly.
- Provide one-command developer bootstrap (lint, test, build) with pre-commit checks.
- Add security automation: dependency audit, secret scanning, and SAST in CI.
- Streamline CI: single cached workflow for lint/test/build/coverage on PRs.
- Establish automated release pipeline (versioning, changelog, packaged artifacts).
- Add containerized build/test environment for parity across developers and CI.

## Planned Changes
- Tooling: add `.nvmrc`/engine metadata, `.npmrc` for deterministic installs, Makefile/task runner, and environment flags to skip binary downloads when offline.
- Quality gates: enforce lint/format/test targets, add coverage artifact, and introduce pre-commit hooks via `husky` + `lint-staged`.
- Security: integrate `npm audit` (or `audit-ci`), CodeQL SAST, and secret scanning (`gitleaks`) in CI.
- CI/CD: replace fragmented workflows with a unified CI pipeline plus release automation (release-please) and packaged artifacts on tag.
- Reproducibility: introduce Dockerfile/devcontainer for isolated builds and document usage.
- Documentation: update README/CONTRIBUTING with the new workflows, commands, and release process.

## Automation Outcomes
- CI runs on PRs and main: install (cached), lint, format-check, tests with coverage, security scans, and build artifacts.
- CD: automated version bumps and changelog via release-please; tagged builds produce signed artifacts.
- Local: `make setup` / `npm run verify` perform lint+test+build with the same flags as CI; pre-commit enforces staged checks.
