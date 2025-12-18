# Release Pipeline Architecture

## Overview

This document describes the complete architecture of the automated release pipeline for AutoChat.

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Developer Actions                         │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
          ┌──────────────────┐      ┌──────────────────┐
          │  Create Feature  │      │  Manual Trigger  │
          │     Branch       │      │  (Actions Tab)   │
          └────────┬─────────┘      └────────┬─────────┘
                   │                         │
                   ▼                         │
          ┌──────────────────┐              │
          │  Make Changes &  │              │
          │  Commit (conv.)  │              │
          └────────┬─────────┘              │
                   │                         │
                   ▼                         │
          ┌──────────────────┐              │
          │   Create PR to   │              │
          │      main        │              │
          └────────┬─────────┘              │
                   │                         │
                   ▼                         │
          ┌──────────────────┐              │
          │    CI Tests      │              │
          │    (PR checks)   │              │
          └────────┬─────────┘              │
                   │                         │
                   ▼                         │
          ┌──────────────────┐              │
          │   Merge to main  │              │
          └────────┬─────────┘              │
                   │                         │
                   └────────┬────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Release Pipeline Start                        │
│                  (.github/workflows/release.yml)                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
          ┌──────────────────────────────┐
          │  1. Checkout & Setup Node    │
          │     - Fetch full git history │
          │     - Setup Node.js 18.x     │
          │     - Install dependencies   │
          └────────────┬─────────────────┘
                       │
                       ▼
          ┌──────────────────────────────┐
          │  2. Quality Checks           │
          │     - Run linter             │
          │     - Run tests (204)        │
          └────────────┬─────────────────┘
                       │
                       ▼
          ┌──────────────────────────────┐
          │  3. Determine Version Bump   │
          │     - Analyze last 20 commits│
          │     - major: → +1.0.0        │
          │     - feat: → +0.1.0         │
          │     - other → +0.0.1         │
          └────────────┬─────────────────┘
                       │
                       ▼
          ┌──────────────────────────────┐
          │  4. Bump Version Numbers     │
          │     - npm version {type}     │
          │     - Update package.json    │
          │     - Update manifest.json   │
          │     - Update package-lock    │
          └────────────┬─────────────────┘
                       │
                       ▼
          ┌──────────────────────────────┐
          │  5. Commit Version Changes   │
          │     - git add changed files  │
          │     - git commit -m "bump"   │
          └────────────┬─────────────────┘
                       │
                       ▼
          ┌──────────────────────────────┐
          │  6. Create & Push Tag        │
          │     - git tag v{version}     │
          │     - git push origin main   │
          │     - git push origin tag    │
          └────────────┬─────────────────┘
                       │
                       ▼
          ┌──────────────────────────────┐
          │  7. Build & Package          │
          │     - npm run build:prod     │
          │     - npm run package        │
          │     - Creates .zip file      │
          └────────────┬─────────────────┘
                       │
                       ▼
          ┌──────────────────────────────┐
          │  8. Generate Release Notes   │
          │     - Get commits since tag  │
          │     - Format as markdown     │
          │     - Add install instructions│
          └────────────┬─────────────────┘
                       │
                       ▼
          ┌──────────────────────────────┐
          │  9. Create GitHub Release    │
          │     - Use tag name           │
          │     - Attach release notes   │
          │     - Upload .zip artifact   │
          │     - Publish release        │
          └────────────┬─────────────────┘
                       │
                       ▼
          ┌──────────────────────────────┐
          │  10. Upload Artifacts        │
          │     - Store .zip for 90 days │
          │     - Store dist/ folder     │
          └────────────┬─────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Release Complete! 🎉                         │
│                                                                  │
│  - New version published                                         │
│  - Tag created: v{version}                                       │
│  - Release available at: /releases/tag/v{version}                │
│  - Artifacts ready for download                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Trigger Mechanisms

**Automatic Trigger:**
- Event: `push` to `main` branch
- Source: Merged pull requests
- Frequency: Every merge

**Manual Trigger:**
- Event: `workflow_dispatch`
- Source: GitHub Actions UI
- Parameters: Version bump type (patch/minor/major)

### 2. Version Detection Logic

```bash
# Analyze last 20 commits
COMMITS=$(git log --format=%B -n 20)

# Detection priority:
1. "BREAKING CHANGE:" or "major:" → Major (4.5.3 → 5.0.0)
2. "feat:" or "feature:"         → Minor (4.5.3 → 4.6.0)
3. Everything else               → Patch (4.5.3 → 4.5.4)
```

### 3. Version Update Process

```javascript
// Step 1: Bump package.json
npm version {type} --no-git-tag-version

// Step 2: Update manifest.json
const manifest = JSON.parse(fs.readFileSync('manifest.json'));
manifest.version = newVersion;
fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
```

### 4. Git Operations

```bash
# Configure git
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

# Commit changes
git add package.json package-lock.json manifest.json
git commit -m "chore: bump version to v{version}"

# Create and push tag
git tag -a "v{version}" -m "Release v{version}"
git push origin main
git push origin "v{version}"
```

### 5. Build Process

```bash
# Production build
NODE_ENV=production node scripts/build.js
# Output: dist/

# Package for distribution
node scripts/package.js
# Output: autochat-v{version}.zip
```

### 6. Release Notes Generation

```bash
# Get commits since last tag
LAST_TAG=$(git describe --tags --abbrev=0 HEAD^)
git log $LAST_TAG..HEAD --pretty=format:"- %s (%h)"

# Format as markdown with:
# - Version header
# - Commit list
# - Installation instructions
# - Documentation links
# - Changelog link
```

### 7. GitHub Release Creation

```yaml
- uses: softprops/action-gh-release@v1
  with:
    tag_name: v{version}
    name: v{version}
    body_path: release_notes.md
    files: autochat-v{version}.zip
    draft: false
    prerelease: false
```

## Security & Permissions

### Required Permissions

```yaml
permissions:
  contents: write        # For creating releases and pushing tags
  pull-requests: write   # For updating PR descriptions (future use)
```

### Token Usage

- Uses GitHub-provided `GITHUB_TOKEN`
- Automatically authenticated
- No manual secret management required
- Scoped to repository access only

### Security Checks

1. **CodeQL Scanning**: Runs before allowing release
2. **Test Suite**: All 204 tests must pass
3. **Linting**: Code quality checks (non-blocking)
4. **No Secrets**: No credentials in code or logs

## Integration with Existing Workflows

### CI/CD Pipeline (.github/workflows/ci.yml)

```yaml
on:
  push:
    branches: [ develop ]        # Not main
  pull_request:
    branches: [ main, develop ]  # PR checks only
```

**Division of Labor:**
- **CI Pipeline**: Tests PRs and develop branch
- **Release Pipeline**: Handles main branch releases

### No Conflicts

- CI doesn't run on main pushes
- Release doesn't run on PRs
- Both share same test suite
- Both use same build commands

## File Structure

```
autochat/
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI/CD for PRs and develop
│       └── release.yml         # Release automation for main
├── scripts/
│   ├── build.js                # Build script
│   └── package.js              # Package script
├── RELEASE_PIPELINE.md         # Detailed documentation
├── RELEASE_QUICKSTART.md       # Quick reference
└── package.json                # Version source of truth
```

## Error Handling

### Common Failure Points

1. **Tests Fail**: Pipeline stops, no release created
2. **Version Conflict**: Pipeline detects and reports
3. **Tag Exists**: Pipeline fails, needs manual cleanup
4. **Build Fails**: Pipeline stops, logs available
5. **Network Issues**: GitHub Actions retries automatically

### Recovery Procedures

See [RELEASE_PIPELINE.md](RELEASE_PIPELINE.md) troubleshooting section.

## Monitoring & Observability

### What to Monitor

1. **Workflow Runs**: Actions tab shows all executions
2. **Release Page**: Verify releases are created
3. **Download Stats**: Track adoption
4. **Error Logs**: Check failed runs

### Success Indicators

- ✅ Workflow completes (green checkmark)
- ✅ New tag appears in repository
- ✅ Release visible in Releases page
- ✅ Artifact downloadable
- ✅ Version numbers updated

## Performance

### Typical Execution Time

- Checkout & Setup: ~30 seconds
- Dependency Install: ~10 seconds
- Tests: ~6 seconds
- Version Bump: ~2 seconds
- Build & Package: ~5 seconds
- Release Creation: ~10 seconds

**Total: ~1-2 minutes** from merge to published release

## Future Enhancements

Possible improvements:

1. **Changelog Generation**: Auto-update CHANGELOG.md
2. **Pre-release Support**: Beta/RC versions
3. **Multi-platform**: Support Firefox releases
4. **Notification**: Slack/Discord notifications
5. **Rollback**: Automatic rollback on issues
6. **Analytics**: Release metrics dashboard

## References

- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [softprops/action-gh-release](https://github.com/softprops/action-gh-release)

---

**Last Updated**: 2025-12-18  
**Version**: 1.0  
**Status**: Production Ready ✅
