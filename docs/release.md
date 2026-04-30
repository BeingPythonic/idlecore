# Release Guide

## Verification

Run the full verification path before cutting a version:

```bash
pnpm verify
```

## Versioning

- Use semver.
- Keep breaking changes for major versions.
- Keep additive, backward-compatible API changes for minor versions.
- Keep fixes and non-breaking cleanup for patch versions.

## Release Checklist

1. Update `CHANGELOG.md`.
2. Ensure `pnpm verify` passes.
3. Bump the package version.
4. Commit the version and changelog update.
5. Create a git tag that matches the package version.
6. Publish from a clean worktree.
