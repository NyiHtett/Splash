# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Splash is a Chrome Extension (Manifest V3) for aesthetic, context-aware note-taking with local backup support. It is built with vanilla JavaScript, HTML, and CSS — no build tools, no npm, no framework.

## Loading & Testing

Since there is no build step, load directly into Chrome:
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory

To test changes: reload the extension on `chrome://extensions/` after editing any file.

## Architecture // update it with modern tech stack like react or next, but make sure it's compatible for chrome extension

### Entry Points 

| File | Purpose |
|------|---------|
| `popup.html/js` | Extension popup — note selection, backup file management, course listing |
| `notes.html/js` | Main editor — rich text editing, themes, autosave, snapshot history |
| `blocked.html/js` | Focus mode — blocks disallowed sites, redirects to active course URL |
| `background.js` | Service worker — storage init, data migration on install |

### Storage Model

All state lives in `chrome.storage.local`:
- `courses` — array of course objects with schedules
- `activeCourseId` — currently active course
- `notesByCourse` — map of courseId → note content
- `notesBackgroundMode` — active theme (`"floating"` | `"midnight"` | `"fire"` | `"neoClassic"`)
- `lockEnabled` / `focusEnabled` — forced to `false` in background.js at startup (live build behavior)

### Notes Editor (`notes.js`)

- `contenteditable` div as the rich text editor
- Autosave debounced at 1200ms; writes to `chrome.storage.local` and optionally to a linked backup file via the File System Access API
- Snapshot history: up to `MAX_HISTORY=40` snapshots stored per note
- Images: max 5MB each, max 12 per note, embedded as base64 in storage
- Four CSS background themes applied as a class on `<body>`

### Data Migration

`background.js` handles legacy storage format migration on `chrome.runtime.onInstalled` — important to preserve when changing storage schema.

### Frontend Design

<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design,this creates what users call the "AI slop" aesthetic. Avoid this: make creative,distinctive frontends that surprise and delight. 

Focus on:
- Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.
- Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.
- Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.
- Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>

### Avoid Overeagerness

Avoid over-engineering. Only make changes that are directly requested or clearly necessary. Keep solutions simple and focused:

- Scope: Don't add features, refactor code, or make "improvements" beyond what was asked. A bug fix doesn't need surrounding code cleaned up. A simple feature doesn't need extra configurability.

- Documentation: Don't add docstrings, comments, or type annotations to code you didn't change. Only add comments where the logic isn't self-evident.

- Defensive coding: Don't add error handling, fallbacks, or validation for scenarios that can't happen. Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs).

- Abstractions: Don't create helpers, utilities, or abstractions for one-time operations. Don't design for hypothetical future requirements. The right amount of complexity is the minimum needed for the current task.

### Create Subagents

<use_parallel_tool_calls>
If you intend to call multiple tools and there are no dependencies between the tool calls, make all of the independent tool calls in parallel. Prioritize calling tools simultaneously whenever the actions can be done in parallel rather than sequentially. For example, when reading 3 files, run 3 tool calls in parallel to read all 3 files into context at the same time. Maximize use of parallel tool calls where possible to increase speed and efficiency. However, if some tool calls depend on previous calls to inform dependent values like the parameters, do NOT call these tools in parallel and instead call them sequentially. Never use placeholders or guess missing parameters in tool calls.
</use_parallel_tool_calls>


### Avoid overthinking and excessive thoughtness

When you're deciding how to approach a problem, choose an approach and commit to it. Avoid revisiting decisions unless you encounter new information that directly contradicts your reasoning. If you're weighing two approaches, pick one and see it through. You can always course-correct later if the chosen approach fails.