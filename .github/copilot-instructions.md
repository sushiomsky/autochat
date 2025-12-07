# AutoChat Enhanced - Copilot Instructions

## Project Overview

AutoChat is a Chrome Extension (Manifest V3) that automates sending messages with realistic typing simulation, anti-detection, and scheduling. Key runtime pieces:

- `background.js` — service worker for badge/notifications and central background tasks.
- `content-enhanced.js` — main automation logic injected into pages (typing simulation, template vars, send methods).
- `popup-enhanced.*` — the extension UI and controller.
- `src/` — reusable utility modules (state, i18n, preview helpers, etc.).

**Why this structure**

- UI (popup) is separate from page automation (content scripts) and background state (service worker). Changes that affect runtime behaviour often span `content-enhanced.js` + `background.js`.
- Files with `-enhanced` suffix are the current v4+ implementation; legacy `content.js` / `popup.js` are kept for reference.

## Guiding Principles

**Make Minimal Changes**

- Only modify files and lines directly related to the task
- Preserve existing working code and tests
- Don't refactor unrelated code or fix unrelated bugs
- Don't remove or modify working code unless absolutely necessary
- If unsure about scope, ask before making changes

**Security First**

- Never commit secrets, API keys, or credentials
- Validate all user inputs
- Use secure Chrome extension APIs appropriately
- Check dependencies for known vulnerabilities before adding them
- Report any security concerns immediately

## Developer Workflows

**Installation**

```bash
npm install --legacy-peer-deps
```

Note: Use `--legacy-peer-deps` due to jest-chrome peer dependency compatibility with Jest 29. The project uses jest-chrome@0.8.0 which expects Jest 26-27, but the codebase uses Jest 29 for better features and support.

**Build Commands**

- `npm run build` — Development build (runs `node scripts/build.js`, copies static files to `dist/`)
- `npm run build:prod` — Production build (sets `NODE_ENV=production`, performs lightweight regex-based minification)
- `npm run watch` — Watch mode (auto-rebuild on changes; note: uses `fs.watch` with `recursive: false`, only rebuilds files listed in script)
- `npm run package` — Package for Chrome Web Store (runs `build:prod` then creates `autochat-v<version>.zip` from `dist/`)
- `npm run clean` — Remove build artifacts (`dist/`, `build/`, `coverage/`)

**Testing**

- `npm test` — Run all tests
- `npm run test:watch` — Run tests in watch mode
- `npm run test:coverage` — Run tests with coverage report
- All tests use Jest with `jest-environment-jsdom`, setup in `tests/setup.js`
- Tests must pass before submitting changes

**Code Quality**

- `npm run lint` — Check for linting errors (ESLint)
- `npm run lint:fix` — Auto-fix linting errors
- `npm run format` — Format code (Prettier)
- `npm run format:check` — Check code formatting
- **Always run lint and format before committing**

**Important build details & gotchas**

- `scripts/build.js` is a simple Node script that copies files listed in `filesToCopy` and processes `jsFiles` listed in the script. If you add a new runtime file, add it there so it lands in `dist/`.
- The build is NOT a full webpack/babel pipeline despite devDependencies; it performs regex-based stripping of comments/empty lines for `production`.
- `manifest.json` is copied into `dist/` and its `version_name` is updated by the build script.
- Watch mode only monitors top-level directory changes for files enumerated in the script; if you change code inside `src/` utilities, ensure your final build step copies/merges them as expected.

## Testing Conventions

**Test Organization**

- Unit tests: `tests/unit/` — Test individual functions and modules
- Integration tests: `tests/integration/` — Test component interactions
- Jest config in `package.json`, setup in `tests/setup.js`

**Writing Tests**

- Use `jest-webextension-mock` and custom mocks provided in `tests/setup.js`
- Mock `global.chrome` APIs using the provided setup
- Aim for >80% code coverage for new code (check with `npm run test:coverage`)
- Test edge cases and error conditions
- Follow existing test patterns in the repository
- Coverage reports are generated in the `coverage/` directory

**Test Example**

```javascript
describe('Feature', () => {
  test('should handle expected case', () => {
    const result = myFunction(validInput);
    expect(result).toBe(expectedValue);
  });

  test('should handle edge case', () => {
    const result = myFunction(edgeCaseInput);
    expect(result).toBeDefined();
  });
});
```

**Project-specific patterns**

- Template variables are processed in `content-enhanced.js` (look for `{time}`, `{date}`, `{random_emoji}`). Use the same token format when adding new templates.
- Anti-repetition relies on recent-message tracking (implemented in `src/anti-repetition`-like helpers). When modifying selection algorithms, update tests in `tests/unit/anti-repetition.test.js`.
- Internationalization: translations live under `_locales/` with `messages.json` per language. UI code references `i18n.js` and `popup-i18n.js`.

**Files to look at first when starting a task**

- `popup-enhanced.js` — UI flows and commands (start/stop, mark input field).
- `content-enhanced.js` — how typing simulation and sending are implemented.
- `background.js` — service worker state, badge updates and message counts.
- `scripts/build.js` & `scripts/package.js` — how build and packaging work.
- `tests/setup.js` — jest chrome mocks (use these for test implementations).

**When editing runtime behaviour**

- If change affects messaging between popup ↔ background ↔ content script, update all three: `popup-enhanced.js`, `background.js`, and `content-enhanced.js` and add/adjust unit tests.
- Keep messages and command names stable — background and popup expect specific shapes in `chrome.runtime.sendMessage` (see `tests/setup.js` for examples of mocked calls).

**Communication patterns / integration points**

- `chrome.storage` is used for persistence (local). Use the storage helpers in `src/state.js` to keep behaviour consistent.
- `scripting.executeScript` is used to inject logic into tabs — tests assume promises and callbacks both are supported in mocks.

**Examples**

- Rebuild and test quick cycle:
  1. `npm run build`
  2. Load `dist/` in `chrome://extensions` (developer mode) to validate UI/runtime
  3. `npm test` to run unit tests

## Code Style Guidelines

**JavaScript Standards**

- Use ES6+ features (const, let, arrow functions, template literals)
- Prefer `const` by default, `let` only when reassignment needed
- Use arrow functions for callbacks
- Add JSDoc comments for public functions
- Keep functions small and focused (single responsibility)

**JSDoc Example**

```javascript
/**
 * Sends a message to the chat input field
 * @param {string} text - The message text to send
 * @param {number} [retries=3] - Number of retry attempts
 * @returns {Promise<boolean>} - True if message sent successfully
 */
async function sendMessage(text, retries = 3) {
  // Implementation
}
```

**Formatting**

- Use Prettier for consistent formatting
- Follow existing code style in the file you're editing
- Use 2 spaces for indentation
- No trailing whitespace
- Add blank line at end of files

## Dependencies

**Adding Dependencies**

- Only add dependencies if absolutely necessary
- Check for security vulnerabilities first
- Prefer well-maintained packages with recent updates
- Update `package.json` and commit `package-lock.json`
- Document why the dependency is needed

**Updating Dependencies**

- Test thoroughly after updates
- Check for breaking changes in changelogs
- Update tests if behavior changes
- Run full test suite before committing

## Pull Request Guidelines

**Before Submitting**

- ✅ All tests pass (`npm test`)
- ✅ Code is linted (`npm run lint`)
- ✅ Code is formatted (`npm run format`)
- ✅ Build succeeds (`npm run build`)
- ✅ Manual testing completed for UI changes
- ✅ Documentation updated if needed
- ✅ No merge conflicts with main branch

**PR Description Should Include**

- Clear description of changes
- Link to related issue
- Testing completed
- Screenshots for UI changes
- Any breaking changes or migration notes

**Commit Messages**

Use conventional commits format:

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `style:` — Formatting, no code change
- `refactor:` — Code restructuring
- `test:` — Adding/updating tests
- `chore:` — Maintenance tasks

## When to Ask for Help

**Stop and ask if:**

- The task requires changing >10 files
- You need to modify core architecture
- Security implications are unclear
- The requirement is ambiguous
- You're unsure which approach is best
- Tests are failing in unexpected ways
- You encounter Chrome extension API limitations

**Questions to ask:**

- "Which runtime (popup/background/content) should this touch?"
- "Should this be a new feature or modify existing code?"
- "What's the expected behavior for edge case X?"
- "Is this security concern valid?"
