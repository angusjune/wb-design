---
name: setup-profile
description: Sets up the WB design profile. Use when the user wants to copy or initialize the bundled profile in the current workspace, or add and import HTML screen templates from Figma URLs, screenshots, existing HTML, or other supplied design sources. Also use when Brainstorm needs a workspace profile before template customization.
---

# Setup Profile

Resolve this skill directory as `setupSkillDir`, the current project root as `workspaceDir`, and the sibling Brainstorm skill as `brainstormSkillDir = setupSkillDir/../brainstorm`. The workspace profile always lives at `workspaceDir/wb-design-profile`.

Choose exactly one branch from the user's request:

- **Copy profile** — create the workspace profile from Brainstorm's bundled profile.
- **Add templates** — add one or more supplied designs to the workspace profile. This branch first creates the workspace profile when it is absent.

An existing workspace profile may be incomplete. Treat the copy script's `incomplete` status as diagnostics, not automatic failure: inspect the files that do exist and continue whenever the requested branch can still meet its completion criterion. Do not silently mix bundled files into the workspace profile.

Only when a reported gap makes the current task impossible, offer the user these choices:

1. Use Brainstorm's bundled profile for now by starting its server with `--use-bundled-profile`; leave the workspace untouched.
2. Fix the workspace profile first. If the user chooses this, run the copy command with `--repair`; it copies only missing required entries from the bundled profile and never overwrites existing entries. Then run `brainstormSkillDir/scripts/validate-skill.mjs --profile "<workspaceDir>/wb-design-profile"` and use its findings to finish the non-destructive repair. If a path has the wrong type or cannot be repaired safely, report the exact path and ask the user to correct or move it.

## Copy profile

Run:

```bash
node "<setupSkillDir>/scripts/copy-bundled-profile.mjs" \
  --workspace "<workspaceDir>" \
  --json
```

The script preserves an existing workspace profile. It reports `incomplete` plus exact issues when required entries are absent or have the wrong type. Continue with available content unless those issues block the user's requested outcome.

**Completion criterion:** the command reports `created`, `existing`, `repaired`, or `incomplete`; no existing profile content was overwritten; and any task-blocking issue has been resolved by the user's chosen bundled or repair path.

## Add templates

First run the copy command above. Read [`references/add-templates.md`](references/add-templates.md) completely and execute its source-to-template workflow for every design the user requested. If the command reports `incomplete`, use the available workspace files and source evidence first; invoke the choice above only when a missing or invalid entry prevents the template from being created, registered, validated, or previewed.

**Completion criterion:** every requested screen has a confirmed HTML template under `wb-design-profile/screens/`; its local assets resolve; `PROFILE.md` lists and routes it; profile validation and the QA gate pass; and the user has reviewed the rendered result.
