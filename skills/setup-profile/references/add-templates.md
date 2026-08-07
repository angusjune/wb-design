# Add HTML templates

Use this branch to turn user-supplied design evidence into additive production templates. The active target is always `<workspaceDir>/wb-design-profile`; preserve every unrelated file already there.

## 1. Read the active profile and sources

Read each available workspace-profile file before drafting HTML; record missing or invalid entries instead of stopping immediately:

- `PROFILE.md`, including its frontmatter, screen table, routing table, design language, product laws, canonical actions, and platform chrome rules
- `design-system/tokens.css` and `design-system/components.css`
- the closest existing files under `screens/`
- any mapped product knowledge or required quality passes relevant to the requested screen

Extract the screen evidence from any source the user supplied:

- **Figma URL:** inspect the specified node and relevant children, design context, screenshot, variables, styles, component instances, text, and exportable assets. Work from the named node instead of an entire-page thumbnail.
- **Screenshot or image:** inspect the original-resolution image. Separate visible facts from inferred interaction or product behavior.
- **Existing HTML or local implementation:** read its structure, styles, assets, states, and data before adapting it.
- **Written brief or product document:** combine it with the closest existing template; mark product behavior that the source does not establish as unresolved.

Before asking the user anything, prepare a concrete inventory for each requested screen: name, purpose/state, source, closest available template, required copy/data, reusable components, candidate assets, and confidence. Use supplied evidence and whatever the workspace profile already establishes. Ask one minimal question only when a source is inaccessible, the intended production frame is ambiguous, or a product fact required for a faithful template is absent.

Do not treat an incomplete profile as failure by itself. Continue when the requested template can still be created, registered, validated, and previewed. If a missing `PROFILE.md`, required stylesheet, usable page class/platform definition, or writable template location makes that outcome impossible, return to `SKILL.md`'s explicit choice: bundled profile for the current Brainstorm run, or user-approved workspace repair before adding templates.

**Completion criterion:** every requested screen has an evidence-backed inventory, and each unresolved product fact is either confirmed by the user or explicitly left unchanged from the closest existing template.

## 2. Prepare additive templates

Choose semantic filenames. Read an existing file before replacing it; require explicit user confirmation before overwriting a template or asset with the same path.

Create each candidate in a temporary workspace location, then shape it as a production template:

- Begin with a comment describing the screen, purpose/state, structure, background, source, and important preserved facts.
- Include exactly one root element using the active profile's `pageClass`.
- Use the platform's supported `<preview-chrome>` form from `PROFILE.md` or the closest template.
- Keep the file as an HTML fragment. Phone mockups, galleries, `<!DOCTYPE>`, `<html>`, `<head>`, and `<body>` belong to the preview layer.
- Reuse active tokens, shared component classes, DOM patterns, spacing, CTA forms, and terminology before adding screen-local classes.
- Keep screen-local CSS in one trailing `<style>` block.
- Preserve visible text, values, selected states, timestamps, legal/compliance copy, and real organization or product identities from the source.
- Treat behavior absent from the evidence as unresolved rather than inventing it.
- Reference runtime resources only through `/profile/`, `/platform/`, or `/assets/` URLs.
- Copy required icons and images into `design-system/assets/`; use original exports when available and stable semantic filenames.
- Make the workspace profile self-contained. Copy source material needed at runtime instead of retaining absolute local paths, external repositories, or synchronization dependencies.

When a new pattern appears in one screen, keep it local. Update `components.css` or `tokens.css` only when the supplied evidence establishes a reusable product-wide pattern, and summarize that broader change for user confirmation.

**Completion criterion:** every candidate is a self-contained fragment using the active page class and design system; every asset reference resolves inside the plugin, workspace profile, or active platform pack; no unconfirmed product facts were introduced.

## 3. Register the templates

After the candidates are ready:

1. Copy the confirmed HTML files into `wb-design-profile/screens/` and their assets into `wb-design-profile/design-system/assets/`.
2. Add one row per HTML file to `PROFILE.md`'s **Screen templates** table with a user-facing screen name, exact filename, and specific description.
3. Add or refine rows under **Which template to read** so user intent deterministically reaches each new template.
4. Update canonical-template or CTA guidance only when the new source establishes it.
5. Preserve the order and content of all unrelated rows and sections.

**Completion criterion:** the screen table and `screens/` directory match in both directions, and each new template has at least one clear routing rule.

## 4. Validate and preview

Run the workspace profile validator:

```bash
node "<brainstormSkillDir>/scripts/validate-skill.mjs" \
  --profile "<workspaceDir>/wb-design-profile"
```

Run the QA gate on every new or changed template:

```bash
node "<brainstormSkillDir>/scripts/run-qa-gate.mjs" \
  --profile "<workspaceDir>/wb-design-profile" \
  "<workspaceDir>/wb-design-profile/screens/<template>.html"
```

Fix every error before preview. Then start the preview server with the workspace profile:

```bash
node "<brainstormSkillDir>/scripts/serve-preview.cjs" \
  --project-dir "<workspaceDir>" \
  --run-label "<template-purpose>-profile-preview"
```

Use a short lowercase kebab-case `<template-purpose>`, then use the returned `screenDir` to prepare a preview document from Brainstorm's `assets/page-template.html`: place the fragment markup at `<!-- SCREEN CONTENT -->` and its trailing style block at `<!-- SCREEN STYLES -->`. Render every requested screen. When browser automation is available, inspect a full-page screenshot for chrome, spacing, clipping, text, assets, colors, and source fidelity; otherwise give the preview URL to the user.

Apply corrections and rerun the affected checks until they pass. Ask the user to confirm the rendered screens, not the implementation details.

**Completion criterion:** validation and QA return zero errors, every screen renders with the active workspace profile and platform chrome, and the user's visual corrections are applied.
