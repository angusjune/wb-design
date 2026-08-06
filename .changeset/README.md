# Changesets

Every user-facing change must include a changeset. Run `npm run changeset`, choose the release type, and describe the change in language suitable for the changelog.

`npm run version-packages` consumes pending changesets, updates `package.json` and `CHANGELOG.md`, and synchronizes the same version to `.codex-plugin/plugin.json`.
