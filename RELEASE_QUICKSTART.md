# Quick Start: Using the Release Pipeline

## For Developers

### Making Changes That Will Trigger a Release

When you merge a PR to `main`, the release pipeline automatically runs. The version bump is determined by your commit messages.

#### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <description>

[optional body]

[optional footer]
```

#### Examples

**Patch Release** (4.5.3 → 4.5.4):
```bash
git commit -m "fix: resolve typing delay issue"
git commit -m "docs: update installation guide"
git commit -m "chore: update dependencies"
```

**Minor Release** (4.5.3 → 4.6.0):
```bash
git commit -m "feat: add dark mode support"
git commit -m "feature: add emoji picker"
```

**Major Release** (4.5.3 → 5.0.0):
```bash
git commit -m "major: redesign storage API"
# or
git commit -m "feat: new feature

BREAKING CHANGE: This removes the old storage format"
```

### Release Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make changes and commit with conventional format**
   ```bash
   git add .
   git commit -m "feat: add my new feature"
   ```

3. **Push and create PR**
   ```bash
   git push origin feature/my-new-feature
   ```

4. **Merge PR to main**
   - The release pipeline automatically runs
   - Version is bumped based on commits
   - Tag is created (e.g., v4.6.0)
   - Extension is built and packaged
   - GitHub release is created

5. **Check the release**
   - Go to [Releases](https://github.com/sushiomsky/autochat/releases)
   - Download and test the new version

### Manual Release Trigger

If you need to manually trigger a release:

1. Go to **Actions** tab on GitHub
2. Select **Release Pipeline** workflow
3. Click **Run workflow** button
4. Choose version bump type (patch/minor/major)
5. Click **Run workflow**

### What Gets Updated

The pipeline automatically updates:
- `package.json` - version field
- `package-lock.json` - version field
- `manifest.json` - version field
- `README.md` - current release version
- Git tag (e.g., v4.6.0)
- GitHub release with release notes

### Release Artifacts

Each release includes:
- `autochat-v{version}.zip` - Ready-to-install extension package
- Auto-generated release notes from commits
- Installation instructions

### Checking Pipeline Status

Monitor the pipeline:
1. Go to **Actions** tab
2. Look for **Release Pipeline** runs
3. Click on a run to see detailed logs
4. Green checkmark = success, red X = failure

### Common Issues

**Pipeline failed on version bump?**
- Ensure package.json and manifest.json have matching versions before merge

**Tag already exists?**
- Delete the tag: `git tag -d v4.5.4 && git push origin :refs/tags/v4.5.4`
- Re-run the workflow

**Tests failing?**
- The pipeline runs all tests before releasing
- Fix failing tests before merging to main

**Wrong version bump?**
- Check your commit messages follow conventional format
- First matching commit type determines bump:
  - `major:` or `BREAKING CHANGE:` → major
  - `feat:` or `feature:` → minor
  - Everything else → patch

### Best Practices

1. ✅ Use conventional commit format consistently
2. ✅ Test your changes locally before pushing
3. ✅ Review release notes after they're generated
4. ✅ Keep commits focused and atomic
5. ✅ Update CHANGELOG.md for major releases
6. ❌ Don't manually edit version numbers
7. ❌ Don't skip tests
8. ❌ Don't merge breaking changes without discussion

### Pipeline Files

- `.github/workflows/release.yml` - Release pipeline definition
- `.github/workflows/ci.yml` - CI testing (runs on PRs)
- `RELEASE_PIPELINE.md` - Detailed documentation

### Need Help?

- Read [RELEASE_PIPELINE.md](RELEASE_PIPELINE.md) for detailed documentation
- Check [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- Open an issue with the `ci/cd` label
- Ask in GitHub Discussions

---

**Happy Releasing! 🚀**
