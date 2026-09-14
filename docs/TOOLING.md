# Tooling

## Visual QA — Playwright

Playwright is a dev dependency and drives `npm run shoot` (see the
[README](../README.md#visual-qa)). This is the primary way to check a design
change: render the site and look at it, rather than reading JSX and hoping.

It is also the right tool for *measuring* a layout bug. Two real bugs in this
codebase were invisible in source and obvious in `getComputedStyle`:

- `tailwind-merge` silently stripping `text-display-*` font sizes.
- Mask reveals never firing because the IntersectionObserver was watching a
  fully clipped element.

```js
await page.evaluate(() => getComputedStyle(document.querySelector('h1')).fontSize);
```

`npm run shoot:face` is the same idea taken further: rather than producing
images for a human to judge, it asserts on measured transforms — how far the
irises actually moved, whether the lid actually closed, whether the blink gaps
actually differ. Behaviour that only exists at runtime needs a runtime test.

`scripts/extract-frames.mjs` pulls frames out of a video through headless
Chromium, since there is no ffmpeg on this machine and Playwright was already
installed. `scripts/check-character-video.py` scores those frames against the
requirements in [CHARACTER_VIDEO_BRIEF.md](CHARACTER_VIDEO_BRIEF.md). Together
they answer "can this clip carry the interactive character?" in one command,
which is worth far more than looking at it and guessing.

## MCP servers

`.mcp.json` declares two project-scoped MCP servers. Claude Code will ask you
to approve them the first time you open the project after adding the file.

### `playwright`

Interactive browser control — navigate, click, read the accessibility tree,
screenshot. Needs no setup beyond approval; it runs via `npx`.

Use it for exploratory checks ("what does the hover state actually look like").
Use `npm run shoot` for repeatable capture.

### `figma`

Figma's **Dev Mode MCP server**, which runs locally inside the Figma desktop
app at `http://127.0.0.1:3845/mcp`. It is not a hosted service, so it only
responds while Figma is open.

To enable it:

1. Open the **Figma desktop app** (the browser version cannot host the server).
2. Figma menu → **Preferences** → **Enable Dev Mode MCP Server**.
3. Confirm it is up: `curl -i http://127.0.0.1:3845/mcp` should answer rather
   than refuse the connection.
4. Select a frame in Figma, then ask for its spec or code.

Requires a Figma seat with Dev Mode (Professional or above). If step 3 refuses
the connection, Figma is closed or the setting is off — the config in
`.mcp.json` is correct either way.

## Design discipline — the `taste-review` skill

`.claude/skills/taste-review/SKILL.md` is a project-local skill that encodes
the critique process used to build this site: an Impeccable pass over
hierarchy, type, spacing and composition, then an Emil Kowalski pass over
motion. Invoke it with `/taste-review`, or just ask for a design critique —
it triggers on its own before front-end work ships.
