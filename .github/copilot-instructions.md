**Project Overview**

AutoChat is a Chrome Extension (Manifest V3) that automates sending messages with realistic typing simulation, anti-detection, and scheduling. Key runtime pieces:
- `background.js` — service worker for badge/notifications and central background tasks.
- `content-enhanced.js` — main automation logic injected into pages (typing simulation, template vars, send methods).
- `popup-enhanced.*` — the extension UI and controller.
- `src/` — reusable utility modules (state, i18n, preview helpers, etc.).

**Why this structure**
- UI (popup) is separate from page automation (content scripts) and background state (service worker). Changes that affect runtime behaviour often span `content-enhanced.js` + `background.js`.
- Files with `-enhanced` suffix are the current v4+ implementation; legacy `content.js` / `popup.js` are kept for reference.

**Developer workflows (commands you will use)**
- Install dependencies: `npm install`
- Development build: `npm run build` (runs `node scripts/build.js`, copies static files to `dist/`).
- Production build: `npm run build:prod` (sets `NODE_ENV=production` then runs the same script; build script performs a lightweight minification by regex).
- Watch for edits: `npm run watch` (runs `scripts/build.js --watch`; note: the script uses `fs.watch` with `recursive: false` and only rebuilds files listed inside the script).
- Package for store: `npm run package` -> runs `build:prod` then `node scripts/package.js` (creates `autochat-v<version>.zip` from `dist/`).
- Tests: `npm test`, `npm run test:watch`, `npm run test:coverage` (Jest with `jest-environment-jsdom`, setup in `tests/setup.js`).
- Lint/format: `npm run lint`, `npm run format`.

**Important build details & gotchas**
- `scripts/build.js` is a simple Node script that copies files listed in `filesToCopy` and processes `jsFiles` listed in the script. If you add a new runtime file, add it there so it lands in `dist/`.
- The build is NOT a full webpack/babel pipeline despite devDependencies; it performs regex-based stripping of comments/empty lines for `production`.
- `manifest.json` is copied into `dist/` and its `version_name` is updated by the build script.
- Watch mode only monitors top-level directory changes for files enumerated in the script; if you change code inside `src/` utilities, ensure your final build step copies/merges them as expected.

**Testing conventions**
- Tests live under `tests/unit` and `tests/integration`. Jest config is in `package.json` and uses `tests/setup.js` to mock `global.chrome` APIs.
- `jest-webextension-mock` and custom mocks are used; prefer using the provided `global.chrome` mocks in `tests/setup.js` when writing new tests.

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

**If something is unclear**
- Ask: which runtime (popup, background, content) the change touches — I will point to the smallest set of files and tests to update.

---

If you'd like, I can: open PR-ready changes to `scripts/build.js` (to use a proper bundler), add a CONTRIBUTING snippet for test patterns, or expand this file with more inline examples. What should I clarify or add next?
