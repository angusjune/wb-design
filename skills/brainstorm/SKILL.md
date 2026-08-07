---
name: brainstorm
description: 用于基于当前产品档案进行移动端 UI 头脑风暴：生成3个方案、迭代完整流程，并在定稿后继续精简、校验细节或推送 Figma。Use when exploring or finishing mobile screens with the active workspace or bundled product profile.
---

# Design Brainstorm

Interactive design and finishing workflow for mobile screens. Users describe ideas, compare solution options in phone mockups, pick a direction, iterate via terminal feedback with live hot-reload preview, then choose whether to keep editing or push to Figma.

Resolve this skill directory as `skillDir` and the current project root as `projectDir`. The preview server selects `projectDir/wb-design-profile` whenever that directory exists, even when incomplete; otherwise it selects `skillDir/profile`. Save the selected `profileDir` and its diagnostics from the server response. Paths named with the profileDir prefix are under the selected profile; all other relative paths are under `skillDir`.

**This file is the method — it names no product.** Every product-specific fact (which screens exist, the design laws, the palette, the passes to run) lives in the selected profile. Use `$setup-profile` to create `projectDir/wb-design-profile` or add production templates without editing the installed plugin.

**The product profile** (in `profileDir`) — everything specific to this product:
- `PROFILE.md` — **Read this at Step 3.** Its frontmatter is the machine-readable profile config (product, platform, page class, token prefix); its body carries the screen table, template routing, design language, product laws, passes, and quick reference
- `screens/` — Production screen templates (the ground truth)
- `design-system/` — `tokens.css` (the single source of truth), `components.css`, and profile icons
- `knowledge/` — Optional bundled product-knowledge bridge and read-only caches
- `quality/` — Optional product rules, passes, deterministic tools, and benchmark data
- `branches/` — Optional product-owned Step 6 branch documents declared by the profile's Branches table

**Platform packs** (in `platforms/`) — the surface's furniture, shared by any product on it. The profile's `platform` field selects exactly one:
- `wechat/` — WeChat Mini Program navbar
- `ios/` — iOS navbar
- Each pack is a single `chrome.html` — one style block plus the nav markup the server stamps into each `<preview-chrome>` tag.

**Shared machinery**:
- `assets/page-template.html` — Canonical scaffold for every generated HTML file. Copy it before adding screen content.
- `assets/frame.css` — Preview-only reset, frame, phone mockup, and gallery styles. The server links it automatically; generated files never copy or link it.
- `assets/live-reload.js` — Browser-side SSE client auto-injected by the preview server.
- `assets/annotate.js` — Browser-side click-to-annotate client auto-injected by the preview server.
- `scripts/serve-preview.cjs` — Local preview server with SSE hot reload.
- `scripts/run-qa-gate.mjs` — Deterministic universal checks plus optional product rules.

The profile's screen table lists every production template on disk, and `npm run validate` checks the two against each other in both directions.

**Brainstorm-specific references**:
- `references/solution-archetypes.md` — UX and visual exploration archetypes for diversifying 3-solution sets
- `references/branches/push-to-figma.md` — Shared Push to Figma branch
- **Playwright MCP / Chrome dev tool MCP / browser tool** — Used for screenshot verification when available. If no browser automation tool is available in the current provider, skip verification for that session and tell the user.

---

## Workflow

1. User describes idea
2. **Step 1:** Ask clarifying questions
3. **Step 2:** Start brainstorm server (`node scripts/serve-preview.cjs`)
4. **Step 3:** Read `profileDir/PROFILE.md`, then the production templates from `profileDir/screens/`
5. **Step 4:** Generate multiple solutions (3 by default, if the user didn't specify), then run Simplify and the profile's passes before showing them
6. User picks a direction (or request new options)
7. **Step 5:** Build full flow screens, then run Simplify and the profile's passes before showing them
8. **Step 6:** Assemble the available branches from Feedback, the shared Push to Figma branch, and the profile's Branches table; assign display letters when presenting them
9. Continue the chosen branch until its completion criterion is met.

---

## Page Template

**Every HTML file written to `screenDir` MUST start as a copy of `assets/page-template.html`.** Both the multi-solution page and individual screens use this one canonical scaffold:

```bash
cp "<skill-dir>/assets/page-template.html" "<screenDir>/<filename>.html"
```

Replace `<!-- SCREEN CONTENT -->` with the phone presentation markup. Replace `<!-- SCREEN STYLES -->` with any local `<style>` block copied and adapted from the production template, or remove that marker when no local styles are needed. Do not recreate or otherwise rewrite the surrounding scaffold.

Three URL prefixes are mapped by the server: `/profile/` is the product profile, `/platform/` is the active platform pack, and `/assets/` is shared machinery. Screens name neither the product nor the platform by identity, so swapping either needs no screen edits. The server also injects the platform pack's chrome styles, links `assets/frame.css`, and injects `assets/live-reload.js` plus `assets/annotate.js` — do not link or add those yourself.

**Preview chrome** is always written as `<preview-chrome variant="…" title="…">`. The server expands it using the active platform pack; which variants exist is the pack's business, and the profile documents which to use where.

**Generated-file names:** Name files in lowercase kebab-case by user-facing purpose:

- `solutions.html` — the Step 4 comparison page
- `<screen-purpose>.html` — one editable screen, such as `home.html` or `loan-detail.html`
- `<screen-purpose>-<state>.html` — a distinct state of that screen, such as `loan-detail-error.html`
- `flow.html` — the Step 5 journey overview

Keep editing the same filename during feedback. Create another file only for a different screen, state, or the flow overview.

---

## Steps

### Step 1: Understand the Idea

Interview the user relentlessly about every aspect of the plan until a shared understanding is reached. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer. Ask the questions one at a time, waiting for feedback on each question before continuing. Asking multiple questions at once is bewildering. 

Examples:

1. **What is the core user action?** — "A) Complete the primary task (default), B) Check status, C) …"
2. **How many screens?** — "A) One screen (default), B) 2-3 step flow, C) Home + detail pages"
3. **What data needs to be shown?** — Amounts, lists, forms, status results?

**Step 1 is complete when you can answer:** What screens? What's on each? What do buttons do?

**Before generating, write a brief snapshot for yourself:**
- Core user action
- Screen(s) and state(s) to show
- Data required on each screen
- Source production template(s)
- Product rules / pitfalls loaded, if any
- Non-goals or constraints from the user
- `runLabel`: 2–5 lowercase English words in kebab-case that identify this task, such as `loan-detail-redesign`

The `runLabel` names the whole brainstorm, not an individual screen. Continue only when it matches `^[a-z0-9]+(?:-[a-z0-9]+)*$`.

### Step 2: Start the Brainstorm Server

```bash
node "<skill-dir>/scripts/serve-preview.cjs" \
  --project-dir /path/to/project \
  --run-label "<runLabel>" \
  --port 3210
```

Each start creates `runDir` at `projectDir/wb-design-brainstorms/<YYYYMMDD-HHmmss>-<runLabel>/`; a same-second collision receives `-2`, then `-3`. The returned `screenDir` is `runDir/screens/`. Write every generated HTML file there; `profileDir/screens/` contains production templates. The returned `stateDir` is `runDir/state/` and holds `server-info.json`, annotation state, session telemetry, and the shutdown marker. Treat it as server-owned workflow state rather than generated design output.

Save `runDir`, `runName`, `runLabel`, `profileDir`, `profileSource`, `profileComplete`, `profileIssues`, `screenDir`, `stateDir`, `telemetryPath`, `annotationsPath`, and `url` from the JSON response. `profileSource` is `workspace` when `projectDir/wb-design-profile` is active and `bundled` otherwise. Use the returned paths rather than reconstructing them, and use `url` for all subsequent API calls. Tell user to open the URL; they can click the button at the bottom-right of the page to annotate an element directly instead of describing it in words.

If `profileComplete` is false, inspect every available workspace-profile file before deciding what the issues mean for this task. Continue with the workspace profile when its existing templates, design assets, rules, and the user's supplied evidence are enough to finish; missing unrelated or optional material is not a blocker. Never borrow missing bundled files silently.

Only if the current task cannot be grounded, generated, validated, or previewed with the available workspace material, stop before producing a design and offer two choices:

1. **Use bundled for this run** — restart the server with `--use-bundled-profile`; do not change the workspace profile.
2. **Fix workspace first** — invoke `$setup-profile`, preserve existing files, and resume after the blocking gaps are repaired.

Explain which exact issue blocks the current task and recommend the choice that best preserves the user's intended customization. A missing file alone is not enough reason to stop.

**Server features:** Serves newest `.html` from `screenDir`, injects the live-reload and annotation clients, links the preview frame stylesheet, injects the platform pack's chrome styles, hot-reloads via SSE, appends annotations to `annotationsPath`, serves shared machinery at `/assets/*` and the product profile at `/profile/*`, records session performance events at `telemetryPath`, auto-shuts down after 30 min idle. The telemetry is passive; do not add manual checkpoints during generation. It observes file writes, automatic QA gate runs, and page reads—not completion of Simplify, profile passes, or visual review. When diagnosing latency, summarize it with `node "<skill-dir>/scripts/report-session-telemetry.mjs" "<stateDir>"` after the session.

### Step 3: Read Production Templates

**CRITICAL — Do this before writing ANY screen HTML (including solutions).**

**Read `profileDir/PROFILE.md` now when it exists.** It carries this product's screen table, template routing, design language (colour/typography/component rules), product laws, preview-chrome placeholder, and passes. When it is absent or partial, inspect available templates and design-system files and apply the incomplete-profile decision from Step 2.

Then read the closest available matching template from `profileDir/screens/`, using the routing table when available.

**If no row matches:** list `profileDir/screens/` and read each file's header comment — every template self-describes its purpose, layout, and background. Only combine sections from multiple templates after confirming no single template covers the screen.

**The rule:** Every screen must be traceable to a production template. Copy and adapt — never invent from scratch. If no single template matches, combine sections from multiple templates.

**Preview chrome:** Use the placeholder form the profile specifies, taken from the production template. Do NOT write status bar, navbar, capsule, or back-arrow markup from scratch — the server expands the placeholder from the active platform pack, which also owns the chrome styles. This chrome is for presentation only, never production code.

**Screen-specific styles:** Each production template defines its own CSS classes in a `<style>` block at the bottom of the file. These are NOT in `profileDir/design-system/components.css`. When adapting a template, copy these local styles along with the HTML structure.

**Product rules and pitfalls:** Follow the profile's product-knowledge section — it names the bridge file, the filter rule, and the injection format. If a product rule conflicts with a template, the rule wins; flag the conflict to the user. If the profile maps no knowledge for this screen, skip silently.

### Shared Simplify Pass

Run after every generated `solutions.html` and after every flow screen.

**Completion criterion:** The file keeps all required product facts and legal/rate copy, has one clear primary action per screen, and contains no removable copy, decoration, or duplicate element that does not help the user complete the task.

1. Read the generated HTML.
2. If `profileDir/knowledge/` exists, read its bridge README and load matching pitfalls when the screen has a mapped component ID. Treat loaded rules as must-keep product constraints. If the directory or mapping is absent, skip silently.
3. Remove or merge anything that fails these checks:
   - The user does not need it to complete the task.
   - The text says something already obvious from nearby UI.
   - It competes with the one focal action or one focal number.
   - It is decorative rather than functional.
   - It can merge cleanly with an adjacent label, value, or row.
4. Never remove product rules, legal/compliance text, error states, navigation, selected user data, status indicators, tap targets, or the primary CTA.
5. Re-read the result and make sure the HTML still follows the production template's CTA form, background color, chrome, and tab bar rules.

### Step 4: Generate 3 Design Solutions

Read `references/solution-archetypes.md`, then choose a diversity mode from the user's wording:

| Mode | Use when | Required diversity |
|------|----------|--------------------|
| UX Strategy | New flow, unclear product direction, "best way", "how should this work" | Options differ by journey, information hierarchy, decision model, or state grouping |
| Visual Exploration | user asks for visual possibilities, style directions, "更有设计感", "换个视觉", or the flow is fixed | Options may keep the same structure but vary visual treatment, density, rhythm, emphasis, card treatment, or component styling |
| Mixed (default) | Intent is unclear | Two UX-meaningful variants + one visual-treatment variant |

Unless the user is explicitly exploring visual direction, the options must not differ only by surface styling. In Visual Exploration mode, style variation is allowed, but each option must name the visual hypothesis and stay within the profile's product laws.

**Visual-mode invariants:** every visual variant keeps, unchanged from the source template: the screen's canonical CTA form exactly as the template ships it (the profile lists the canonical form per screen — never swap one form for another), the preview chrome and tab bar, all legal/rate/disclaimer text, and all data values. Each caption's "What changes" names exactly what varies — everything not named stays as the template has it.

Write `solutions.html` to `screenDir` using the Page Template. Start from the selected production template's existing DOM and class names. Keep its local CSS once per document, then adapt the three screen copies; do not normalize or rename working production classes before exploring the actual solution differences. Inside `#frame-content`, use a `phone-gallery` with 3 phones:

```html
<h2 class="frame-title">3 Design Solutions</h2>
<p class="frame-subtitle">Pick one, or mix elements from multiple</p>

<div class="phone-gallery">
  <div class="phone-slide">
    <div class="phone-mockup">
      <div class="phone-screen">
        <div class="<page-class>"><!-- Solution A: adapted from production templates --></div>
      </div>
    </div>
    <div class="phone-caption">
      方案 A: Amount-first
      <span class="phone-caption-sub">Hypothesis: fastest path to borrowing · Tradeoff: less explanation upfront</span>
    </div>
  </div>
  <!-- Repeat phone-slide for B and C -->
</div>
```

`<page-class>` is the `pageClass` from `profileDir/PROFILE.md`'s frontmatter. Use that value verbatim.

Caption each solution with its intent:
- UX mode: `Hypothesis` + `Tradeoff`
- Visual mode: `Visual hypothesis` + `What changes`
- Mixed mode: label which options are UX variants and which one is visual

**Where a solution's flow has an obvious tap** (open a popup, expand options, switch a tab), wire it up with light interaction so the user can click through each option and feel the difference — see Design Principles. Pure-CSS patterns first, minimal native JS only if needed.

**Required passes:** Run the Shared Simplify Pass on `solutions.html`. Then run each pass listed in the profile's Passes table, in order, on the simplified file. Fix every clear issue in the HTML before user review. If a pass cannot complete for want of an input, leave the value unchanged and note the exact input needed.

Check if the server (the `url` saved from Step 2 — the port may differ from 3210 if it was busy) is still running. If not, start it again.

**Pre-user QA gate:** Before asking the user to open the browser, first run the automated gate on the generated file(s) and fix every reported error:

```bash
node "<skill-dir>/scripts/run-qa-gate.mjs" \
  --profile "<profileDir>" \
  "<screenDir>/solutions.html"
```

The gate is deterministic. It always runs universal checks (off-token colours, emoji, missing stylesheets, plus an advisory flag for authored `<script>` since light interaction is allowed), plus this profile's own rules if it ships `profileDir/quality/rules.mjs`. Exit code 1 means at least one error — fix the HTML and re-run until it exits 0. Warnings (including the `<script>` advisory) never fail the gate. Then eyeball the checks the gate cannot automate:
- Preview chrome uses the profile's placeholder, not hand-built navbar markup
- No overflow, clipped text, or unreadable captions
- Every product law in `profileDir/PROFILE.md` holds
- No interactions or motion that break layout, overflow the frame, or drag performance — light interaction (authored `<script>`, CSS transitions/animations) is allowed

**Verify screenshot:** Navigate to the saved `url` from Step 2 with Playwright MCP (`mcp__playwright__browser_navigate` + `mcp__playwright__browser_take_screenshot` with `fullPage: true`). Check for:
- Preview chrome renders correctly (matches the active platform pack's shell)
- All 3 phones visible and properly spaced
- Text readable, no overflow or clipping
- Colours match the profile's palette and quick reference

If issues found, fix the HTML, re-screenshot until clean. Tell user what you fixed before asking them to open.

Tell user to open the saved `url` to compare. Ask which they prefer. Only proceed after user chooses.

### Step 5: Build Flow Screens

For the chosen direction, build each screen as a separate HTML file in `screenDir`. All screens use the same `phone-slide` → `phone-mockup` → `phone-screen` → page-class nesting from Step 4, where the page class is the one the profile declares.

**Phone gallery variants:**

| Variant | Wrapper class | Extra markup |
|---------|--------------|-------------|
| Single phone | `<div class="phone-gallery presentation--single">` | One `phone-slide` with its `phone-mockup` (centers the phone) |
| Side-by-side | `<div class="phone-gallery">` | Multiple `phone-slide`s |
| Flow (journey) | `<div class="phone-gallery phone-gallery--flow">` | `<div class="phone-flow-arrow">→</div>` between slides |

**Presentation modifiers:** `presentation--single` (centers one phone), `presentation--dark` (dark bg for screenshots).

**File granularity (per-screen vs. flow):** Each screen is its own file (`detail.html`, `confirm.html`) — this is what the user iterates on in the Feedback branch, so one screen per file is the rule. The Flow (journey) variant is **not** a replacement for those files: build one additional presentation page (e.g. `flow.html`) that embeds each screen's `phone-slide` side by side with `phone-flow-arrow` between them, purely to show the journey. So a 2-step flow produces three files: two editable per-screen files plus one flow overview. Do not put flow arrows inside the individual per-screen files.

**For each screen:**
1. Copy closest matching production template and adapt
2. Write to `screenDir` (e.g., `home.html`, `detail.html`)
3. Run the Shared Simplify Pass
4. Run each pass in the profile's Passes table, in order
5. Run the Pre-user QA gate and copy quality pass
6. **Verify screenshot:** Same as Step 4 — navigate, screenshot, check navbar/layout/text/colors. Fix and inform user of any corrections.
7. Enter the branch loop (Step 6)

**Rules:** Always use phone frame · Chinese caption + English subtitle · Flow arrows between journey screens · Max 3-4 phones per row.

**CTA placement and form follow the source template**, not a default sticky footer — the profile lists the canonical CTA form per screen. When content ends high on the screen, the CTA sits right after the content; a CTA pinned to the screen bottom behind an empty region is a defect.

**Copy quality pass:** Use concise copy in the product's language, production terminology from templates, and task-specific CTA labels. Preserve any required rate, agreement, repayment, or risk text. Remove fake urgency and generic helper copy.

### Step 6: Choose the Next Branch

After the user has seen the approved screen or flow, assemble the available paths in this exact order:

1. **Feedback** — always available. Edit the current HTML in `screenDir`; the browser hot-reloads through SSE. Repeat until the user is satisfied.
2. **Push to Figma** — always available. Its branch document is `references/branches/push-to-figma.md`.
3. **Profile branches** — read the optional Branches table in `profileDir/PROFILE.md` and append every declared row in table order. Use the row's Branch value as the display name and its Doc value as the branch document. Resolve a `profile/`-prefixed Doc inside `profileDir`. If the section or table has no rows, append nothing.
Assign display letters (`A`, `B`, `C`, …) to the assembled list only when presenting it. Letters are presentation-local and never part of a branch document's identity. Show the description already available from this method or the profile row's Notes text; do not open any branch workflow document yet.

**Critical for A:** Before acting on feedback, read `annotationsPath`. For each file, find the greatest numeric ID in the `through` field of its `consumed` entries; annotations for that file with greater IDs are pending. Capture the last pending ID you actually read for each file. Annotations and typed feedback are the same input and may arrive together in one turn. Apply both directly without restating annotations; hot reload is the confirmation. Always edit the SAME file for iterative changes. Only create new files for new screens.

After the edit is written, acknowledge only the last ID you captured for that file:

```bash
node "<skill-dir>/scripts/acknowledge-annotations.cjs" "<stateDir>" "<screen-file>" "<through-id>"
```

Run it once per edited file that had pending annotations. Never acknowledge an ID that arrived after your read; file writes do not consume annotations automatically.

For per-screen feedback about preview chrome, change only the `variant` or `title` attributes on `<preview-chrome …>` in that screen file. Never edit `platforms/*/chrome.html`, `assets/page-template.html`, or `assets/frame.css` in response to per-screen feedback.

**Critical for non-Feedback branches:** After the user chooses, load only that branch's document. Do not load unselected shared or profile branch workflows into context. If the required input for the selected branch is missing, ask for it in one short message and do not substitute a screenshot-only or text-only deliverable unless that branch explicitly allows it.

---

## Design Principles

- **More on writing in design.** Words appear in a design for one reason: to make it easier to understand, and therefore easier to use. They are design material, not decoration. Bring the same intentionality to copy that you would bring to spacing and color. Before writing anything, ask what the design needs to say, and how it can best be said to help the person navigate the experience. If a design is good enough, it is self-explanatory without extra words. Don't add words that aren't 100% necessary
- **Stay in the design system.** Every component uses the profile's tokens and patterns. Never introduce a colour, radius, or font that isn't in `profileDir/design-system/tokens.css`.
- **Make it feel real with light interaction.** Where a flow has a natural tap — open a popup, expand an option group, switch a tab, toggle a filter, step a carousel — wire it up so the user can click through and feel the journey rather than reading a stack of static screens. Prefer pure CSS (`:checked` checkbox/radio hack, `:target` popovers, `<details>`, `@keyframes`), reach for minimal native JS only when CSS falls short. Encouraged, not required: add it when it aids understanding, never as decoration. Keep any motion short and contained inside the phone frame.

---

## Workflow Principles

- **One question per message, not a batch.** Wait for the answer before asking the next — resolve decisions one at a time.
- **Multiple choice > open-ended.** "A, B, or C?" not "What do you want?" Always give a recommendation.
- **Show, don't describe.** Build the screen, don't write paragraphs.
- **Always present in phone frames.** Never show bare HTML.
- **Encourage light interaction.** Simple UI interactions are welcome and on by default — opening a popup, expanding a section, switching a tab, toggling a state — so the user can feel the flow instead of staring at static screens. Prefer pure-CSS patterns (`:checked` checkbox/radio hack, `:target` popovers, `<details>`, light `@keyframes` transitions); fall back to minimal native JS only when CSS can't express it. This is a recommendation, not a mandate: add interaction when it helps the user understand the flow, not to every element. Keep JS small and self-contained; never ship a dependency.

---

## Common Mistakes

Method mistakes. **The profile's product laws are the other half of this table** — read them at Step 3.

| Mistake | Fix |
|---------|-----|
| Inventing layouts from scratch | Always copy from `profileDir/screens/` templates |
| Not reading `profileDir/PROFILE.md` before generating | Step 3 is mandatory; every product law lives there |
| Calling a generic simplify routine | Use the Shared Simplify Pass in this method |
| Skipping the profile's passes | Steps 4/5 run Simplify **and** every pass the profile declares |
| Custom/generic navbar | Use the preview-chrome placeholder from a production template |
| Writing navbar SVGs from scratch | Never hand-write chrome; the server expands it from the platform pack |
| Heavy motion or JS that overflows the frame or stalls rendering | Keep interaction light — CSS patterns first, minimal native JS; QA gate flags authored `<script>` only as a warning |
| Showing bare HTML pages | Always wrap in `.phone-mockup` |
| Calling old standalone skills from Step 4/5 | Use the Shared Simplify Pass and the profile-declared passes from this `brainstorm` skill |
| Hard-coding Step 6 letters | Assemble the branch list from shared and profile contributions, then assign letters for that presentation |
| Hardcoding a colour, radius, or font | Use a token from `profileDir/design-system/tokens.css` — it is the single source of truth |
| Adding frame styles manually | Server links `assets/frame.css` automatically — no manual linking or copying needed |
| CTA pinned to screen bottom behind a void | Place the CTA where the source template places it (often centered right after content) |
| Asking which element the user means while annotations are waiting | Read `annotationsPath` first |
| Editing a product fact in this file | Product facts belong in `profileDir`; this file names no product |

---

## Quick Reference

The active product's palette, typography, and chrome are in the Quick reference section of `profileDir/PROFILE.md`. `profileDir/design-system/tokens.css` is the single source of truth for every value.

**Production screens & terminology:** Read `profileDir/PROFILE.md` and the closest matching template in `profileDir/screens/`.
