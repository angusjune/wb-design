# Repo guide

This repo is for developing `wb-design` plugin.

## Project structure

- `./skills/brainstorm`: the `/brainstorm` skill directory
  - `profile/`: the bundled default product profile
- `./skills/setup-profile`: copies the bundled profile to the fixed workspace seam and adds user-provided templates
- `./wb-design-profile`: the optional workspace profile created at runtime; it is not committed to this plugin repo
- `./wb-design-brainstorms`: generated Brainstorm runs named `<YYYYMMDD-HHmmss>-<run-label>`; each run keeps design HTML under `screens/` and workflow data under `state/`

## Package scripts

- `npm run changeset`: interactively creates a Changesets release note describing the packages to bump and the change type.
- `npm run version-packages`: applies pending changesets, refreshes `package-lock.json` without running install scripts, and synchronizes the resulting root package version to the Codex and Claude plugin manifests and the Claude marketplace entry.
- `npm run sync:version`: copies the root `package.json` version to `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, and this plugin's entry in `.claude-plugin/marketplace.json`.
- `npm run check:version`: checks that those plugin and marketplace versions match the root `package.json`; it reports mismatches without modifying files.
- `npm run preview -- --project-dir <path> --run-label <kebab-case-label> <options>`: starts the Brainstorm local preview server. The run label is required; optional flags include `--port <number>` and `--use-bundled-profile`.
- `npm run session:report -- <run-dir|state-dir|session-events.jsonl>`: summarizes performance telemetry for one Brainstorm run; add `--json` for machine-readable output.
- `npm run benchmark:report -- <run-dir>`: runs the QA gate and renders the cases in a UI-quality benchmark run, writing `report.json` and `report.md`; it also accepts `--compare <other-run-dir>` and `--port <number>`.
- `npm run validate`: verifies manifest versions first, then validates the packaged Brainstorm skill's required files, internal references, size, profile screen table, asset paths, and page scaffold contract.
- `npm test`: runs the Brainstorm skill's Node test suite serially.
