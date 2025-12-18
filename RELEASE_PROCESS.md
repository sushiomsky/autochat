# AutoChat Release Process

This document outlines the complete process for creating and publishing new releases of AutoChat.

## Release Types

### Patch Release (x.x.X)
- Bug fixes
- Documentation updates
- Minor improvements
- No new features

### Minor Release (x.X.0)
- New features
- Non-breaking changes
- Enhancements
- Deprecations with backward compatibility

### Major Release (X.0.0)
- Breaking changes
- Major architectural changes
- Complete feature overhauls
- API changes

## Pre-Release Checklist

### 1. Code Quality
- [ ] All tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] Test coverage >80% for new code

### 2. Documentation
- [ ] Update CHANGELOG.md with all changes
- [ ] Update version in package.json
- [ ] Update version in manifest.json
- [ ] Update README.md if features changed
- [ ] Update relevant documentation in docs/

### 3. Testing
- [ ] Manual testing in Chrome
- [ ] Manual testing in Firefox (if applicable)
- [ ] Test all new features
- [ ] Test upgrade path from previous version
- [ ] Verify settings migration works

### 4. Build Verification
- [ ] Development build works (`npm run build`)
- [ ] Production build works (`npm run build:prod`)
- [ ] Firefox build works (`npm run build:firefox:prod`)
- [ ] Package creation works (`npm run package`)

## Release Steps

### Step 1: Update Version Numbers

```bash
# Update version in both files
# package.json
"version": "X.Y.Z"

# manifest.json
"version": "X.Y.Z"
```

### Step 2: Update CHANGELOG.md

Add new version entry at the top:

```markdown
## [X.Y.Z] - YYYY-MM-DD - Release Name

### Added
- List new features

### Changed
- List changes to existing features

### Fixed
- List bug fixes

### Deprecated
- List deprecated features

### Removed
- List removed features

### Security
- List security fixes
```

### Step 3: Update Documentation

- Update README.md version references
- Update relevant feature documentation
- Update roadmap if needed
- Create release notes in docs/releases/

### Step 4: Commit and Tag

```bash
# Stage all changes
git add .

# Commit with conventional commit message
git commit -m "release: version X.Y.Z - Release Name

- Summary of major changes
- Key features added
- Important fixes"

# Create annotated tag
git tag -a vX.Y.Z -m "Release vX.Y.Z: Release Name

Major changes:
- Feature 1
- Feature 2
- Fix 1"

# Push commits and tags
git push origin main
git push origin vX.Y.Z
```

### Step 5: Build Release Packages

```bash
# Clean previous builds
npm run clean

# Build Chrome package
npm run package

# Build Firefox package (if applicable)
npm run package:firefox

# Verify packages
ls -lh autochat-v*.zip
```

### Step 6: Create GitHub Release

1. Go to https://github.com/sushiomsky/autochat/releases/new
2. Select the tag you just created (vX.Y.Z)
3. Set release title: "vX.Y.Z - Release Name"
4. Copy CHANGELOG.md entry for this version to description
5. Upload both .zip files (Chrome and Firefox)
6. Check "Set as the latest release"
7. Publish release

### Step 7: Chrome Web Store (Optional)

If publishing to Chrome Web Store:

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Upload new package (autochat-vX.Y.Z.zip)
3. Update store listing if needed
4. Submit for review
5. Monitor review status

See [docs/archive/CHROME_STORE_SUBMISSION.md](docs/archive/CHROME_STORE_SUBMISSION.md) for details.

### Step 8: Firefox Add-ons (Optional)

If publishing to Firefox Add-ons:

1. Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
2. Upload new version
3. Fill in release notes
4. Submit for review
5. Monitor review status

See [docs/development/FIREFOX.md](docs/development/FIREFOX.md) for details.

## Post-Release

### 1. Announcements
- [ ] Update GitHub repository description
- [ ] Post in GitHub Discussions
- [ ] Update project website (if applicable)
- [ ] Announce on social media (if applicable)

### 2. Monitoring
- [ ] Watch for issues related to new release
- [ ] Monitor user feedback
- [ ] Check error reports
- [ ] Prepare hotfix if critical bugs found

### 3. Planning
- [ ] Review roadmap for next release
- [ ] Update TODO.md
- [ ] Create milestones for next version
- [ ] Gather community feedback

## Hotfix Process

For critical bugs in production:

1. Create hotfix branch from tag:
   ```bash
   git checkout -b hotfix/vX.Y.Z+1 vX.Y.Z
   ```

2. Fix the bug and test thoroughly

3. Update version to X.Y.Z+1 (patch increment)

4. Update CHANGELOG.md with hotfix entry

5. Follow normal release process from Step 4

6. Merge hotfix back to main:
   ```bash
   git checkout main
   git merge hotfix/vX.Y.Z+1
   git push origin main
   ```

## Version Numbering Guidelines

Follow [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR** version: Incompatible API changes or breaking changes
- **MINOR** version: Backward-compatible new functionality
- **PATCH** version: Backward-compatible bug fixes

### Examples
- `4.5.3` → `4.5.4`: Bug fixes, documentation
- `4.5.3` → `4.6.0`: New features, no breaking changes
- `4.5.3` → `5.0.0`: Breaking changes, major overhaul

## Release Schedule

### Regular Releases
- **Patch releases**: As needed for critical bugs
- **Minor releases**: Monthly or bi-monthly
- **Major releases**: 6-12 months apart

### Current Plan
- v4.5.4: December 2025 (Documentation & cleanup)
- v4.6.0: Q1 2026 (Minor improvements)
- v5.0.0: Q3 2026 (Major release - see ROADMAP_v5.0.md)

## Rollback Plan

If a release has critical issues:

1. **Immediate**: Revert to previous version in stores
2. **Communication**: Announce issue to users
3. **Fix**: Prepare hotfix with urgent fixes
4. **Release**: Follow hotfix process above
5. **Post-mortem**: Document what went wrong

## Emergency Contact

For release-related emergencies:
- Create issue with "release" label
- Tag @maintainers in GitHub Discussions
- Follow project's emergency response plan

## Release Checklist Template

Copy this for each release:

```markdown
## Release vX.Y.Z Checklist

### Pre-Release
- [ ] All tests pass
- [ ] Linting clean
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Versions updated (package.json, manifest.json)
- [ ] Manual testing complete

### Release
- [ ] Commit and tag created
- [ ] Pushed to GitHub
- [ ] GitHub Release created
- [ ] Packages built and attached
- [ ] Store submissions (if applicable)

### Post-Release
- [ ] Announcements made
- [ ] Monitoring active
- [ ] Next version planned
```

---

**Last Updated**: December 2025  
**Version**: 1.0  
**Maintained by**: AutoChat Development Team
