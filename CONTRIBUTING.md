# Contributing to AutoChat Enhanced

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/autochat.git
   cd autochat
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original/autochat.git
   ```

## Development Setup

### Prerequisites
- Node.js 16+ and npm
- Google Chrome browser
- Git

### Install Dependencies
```bash
npm install
```

### Build the Extension
```bash
# Development build
npm run build

# Production build
npm run build:prod

# Watch mode (auto-rebuild on changes)
npm run watch
```

### Load Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the `dist/` directory

## Development Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates

### Making Changes

1. **Create a branch**:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes**:
   - Write clean, readable code
   - Follow the coding standards (see below)
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**:
   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

   Use conventional commits:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation only
   - `style:` - Formatting, missing semicolons, etc.
   - `refactor:` - Code restructuring
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Writing Tests
- Place unit tests in `tests/unit/`
- Place integration tests in `tests/integration/`
- Follow the existing test structure
- Aim for >80% code coverage
- Test edge cases and error conditions

### Test Example
```javascript
describe('MyFeature', () => {
  test('should do something', () => {
    const result = myFunction();
    expect(result).toBe(expectedValue);
  });
});
```

## Coding Standards

### JavaScript Style
- Use ES6+ features
- Use `const` by default, `let` when reassignment needed
- Use arrow functions for callbacks
- Use template literals for string concatenation
- Add JSDoc comments for functions
- Keep functions small and focused

### Code Formatting
We use Prettier and ESLint:
```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### JSDoc Example
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

### File Organization
```
autochat/
├── src/              # Source files (future)
├── tests/            # Test files
│   ├── unit/        # Unit tests
│   └── integration/ # Integration tests
├── scripts/         # Build scripts
├── dist/            # Build output
└── docs/            # Documentation
```

## Submitting Changes

### Pull Request Process

1. **Update your fork**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/my-new-feature
   ```

3. **Create Pull Request**:
   - Go to GitHub and create a PR
   - Fill out the PR template
   - Link related issues
   - Add screenshots/GIFs for UI changes
   - Request review from maintainers

### PR Requirements
- ✅ All tests pass
- ✅ Code is linted and formatted
- ✅ No merge conflicts
- ✅ Documentation updated
- ✅ Changelog updated (for significant changes)
- ✅ Screenshots provided (for UI changes)

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] All tests passing

## Screenshots (if applicable)
Add screenshots here

## Related Issues
Closes #123
```

## Reporting Bugs

### Before Submitting
- Check existing issues to avoid duplicates
- Test with the latest version
- Gather all relevant information

### Bug Report Template
```markdown
**Describe the bug**
Clear description of what the bug is

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment:**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 120]
- Extension Version: [e.g., 4.0.0]

**Additional context**
Any other relevant information
```

## Feature Requests

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of what you want to happen

**Describe alternatives you've considered**
Other solutions you've thought about

**Additional context**
Mockups, examples, or other relevant information
```

## Questions?

- Open an issue for questions
- Check existing documentation
- Review closed issues for similar questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to AutoChat Enhanced! 🎉
