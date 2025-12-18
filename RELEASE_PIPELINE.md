# Release Pipeline Documentation

## Overview

AutoChat uses an automated release pipeline that handles version bumping, tagging, building, packaging, and publishing releases to GitHub. This pipeline runs automatically when branches are merged to main.

## How It Works

### Automatic Releases (on merge to main)

When a pull request is merged into the `main` branch:

1. **Version Detection**: The pipeline analyzes recent commit messages to determine the version bump type:
   - `BREAKING CHANGE:` or `major:` → Major version bump (e.g., 4.5.3 → 5.0.0)
   - `feat:` or `feature:` → Minor version bump (e.g., 4.5.3 → 4.6.0)
   - Any other commits → Patch version bump (e.g., 4.5.3 → 4.5.4)

2. **Version Bump**: Updates version in:
   - `package.json`
   - `package-lock.json`
   - `manifest.json`

3. **Git Operations**:
   - Commits the version changes
   - Creates a git tag (e.g., `v4.5.4`)
   - Pushes both the commit and tag to the repository

4. **Build & Package**:
   - Runs tests to ensure quality
   - Builds the extension (`npm run build:prod`)
   - Creates release package (`npm run package`)
   - Generates `autochat-v{version}.zip`

5. **GitHub Release**:
   - Creates a new GitHub release
   - Generates release notes from commits
   - Uploads the packaged zip file
   - Marks the release as the latest

### Manual Releases (workflow dispatch)

You can also trigger releases manually from GitHub Actions:

1. Go to **Actions** → **Release Pipeline**
2. Click **Run workflow**
3. Select version bump type:
   - `patch` - Bug fixes (4.5.3 → 4.5.4)
   - `minor` - New features (4.5.3 → 4.6.0)
   - `major` - Breaking changes (4.5.3 → 5.0.0)
4. Click **Run workflow**

## Commit Message Convention

To control version bumping, use conventional commit format:

```
feat: add new emoji picker
^     ^
|     └─ Description (triggers minor bump)
└─ Type
```

### Commit Types

- `feat:` or `feature:` - New feature (minor version bump)
- `fix:` - Bug fix (patch version bump)
- `docs:` - Documentation only (patch version bump)
- `style:` - Code formatting (patch version bump)
- `refactor:` - Code restructuring (patch version bump)
- `test:` - Adding tests (patch version bump)
- `chore:` - Maintenance (patch version bump)
- `BREAKING CHANGE:` or `major:` - Breaking change (major version bump)

### Examples

```bash
# Patch bump (4.5.3 → 4.5.4)
git commit -m "fix: resolve typing delay issue"

# Minor bump (4.5.3 → 4.6.0)
git commit -m "feat: add dark mode support"

# Major bump (4.5.3 → 5.0.0)
git commit -m "major: redesign storage API"
# or
git commit -m "feat: new feature

BREAKING CHANGE: This removes the old storage format"
```

## Workflow Files

### `.github/workflows/release.yml`

Main release pipeline that:

- Triggers on merges to `main`
- Can be manually triggered via workflow_dispatch
- Handles version bumping
- Creates tags
- Builds and packages
- Publishes GitHub releases

### `.github/workflows/ci.yml`

Continuous integration pipeline that:

- Runs on pull requests to `main` and `develop`
- Runs on pushes to `develop`
- Performs testing and validation
- Does NOT run on `main` (to avoid conflicts with release pipeline)

## Release Artifacts

Each release includes:

- **autochat-v{version}.zip** - Ready-to-install Chrome extension package
- **Release Notes** - Auto-generated from commit messages
- **Installation Instructions** - How to install the extension

## Permissions

The release pipeline requires these GitHub permissions:

- `contents: write` - To create releases and push tags
- `pull-requests: write` - To update PR descriptions (if needed)

These are configured in the workflow file.

## Testing the Pipeline

To test the release pipeline:

1. Create a feature branch:

   ```bash
   git checkout -b test-release-feature
   ```

2. Make a change and commit with conventional format:

   ```bash
   echo "# Test" >> TEST.md
   git add TEST.md
   git commit -m "feat: add test feature"
   ```

3. Push and create a PR:

   ```bash
   git push origin test-release-feature
   ```

4. Merge the PR to main (this triggers the release pipeline)

5. Check Actions tab for pipeline execution

6. Verify the release appears in the Releases page

## Troubleshooting

### Pipeline Fails on Version Bump

**Problem**: Version numbers conflict or don't update

**Solution**:

- Ensure `package.json` and `manifest.json` have matching versions
- Check that no manual version changes are pending
- Verify git is configured correctly

### Pipeline Fails on Tag Creation

**Problem**: Tag already exists

**Solution**:

- Delete the tag locally and remotely:
  ```bash
  git tag -d v4.5.3
  git push origin :refs/tags/v4.5.3
  ```
- Re-run the workflow

### Pipeline Fails on Release Creation

**Problem**: Release already exists for the tag

**Solution**:

- Delete the release from GitHub Releases page
- Delete the tag (see above)
- Re-run the workflow

### No Version Bump Detected

**Problem**: Version stays the same after merge

**Solution**:

- Check commit messages use conventional format
- Ensure commits are in the last 20 commits analyzed
- Use manual workflow dispatch to force a specific bump type

## Best Practices

1. **Always use conventional commits** for clear version history
2. **Review release notes** after they're generated
3. **Test releases** by downloading and installing them
4. **Keep changelog updated** for major releases
5. **Tag pre-releases** appropriately if testing features
6. **Coordinate releases** to avoid conflicts with other PRs

## Security Considerations

- The pipeline uses `GITHUB_TOKEN` which is automatically provided by GitHub
- No additional secrets are required
- All version changes are committed and visible in git history
- Release artifacts are built from verified source code

## Monitoring

Monitor the release pipeline:

1. **GitHub Actions Tab**: View workflow runs and logs
2. **Releases Page**: Verify releases are created correctly
3. **Package Download Stats**: Track release adoption
4. **Issue Tracker**: Monitor reports related to releases

## Related Documentation

- [Contributing Guide](CONTRIBUTING.md)
- [CI/CD Pipeline](CI_CD_FIXES.md)
- [Package Script](scripts/package.js)
- [Build Script](scripts/build.js)

## Support

If you encounter issues with the release pipeline:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the workflow logs in GitHub Actions
3. Open an issue with the `ci/cd` label
4. Contact the maintainers

---

**Last Updated**: 2025-12-18
**Pipeline Version**: 1.0
