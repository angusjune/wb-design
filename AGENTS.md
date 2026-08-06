# Repo guide

This repo is for developing `wb-design` plugin.

## Project structure

- `./skills/brainstorm`: the `/brainstorm` skill directory
  - `profile/`: the bundled default product profile
- `./skills/setup-profile`: copies the bundled profile to the fixed workspace seam and adds user-provided templates
- `./wb-design-profile`: the optional workspace profile created at runtime; it is not committed to this plugin repo
