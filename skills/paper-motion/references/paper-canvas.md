# Working with the Paper Desktop canvas (optional)

[Paper](https://paper.design) is a design canvas built on real HTML/CSS, with
Paper Shaders built in (press `S` in the app). Its MCP server lets an agent read
and write the file that is open in Paper Desktop. paper-motion works without it.
Use it when the user wants to see and adjust the look by hand. The canvas is
where the **look** is decided; the scene is where it **moves**.

## Connecting

Paper Desktop must be installed and open, with a file open.

- **Claude Code:**
  - Official plugin: `claude plugin marketplace add paper-design/agent-plugins && claude plugin install paper-desktop@paper`
  - Or plain HTTP: `claude mcp add --transport http paper http://127.0.0.1:29979/mcp`
  - Then start a new session and check `/mcp`.
- **Codex:** `codex mcp add paper -- /path/to/paper mcp`. The path is shown in Paper's MCP panel.
- **Cursor:** Cursor Marketplace → Paper.
- **Anything else:** the stdio command `/path/to/paper mcp`, or the HTTP endpoint above.

**Budget.** The free plan allows 100 MCP tool calls a week; Pro allows far
more. Plan sessions accordingly: one style-frame round is about 20–40 calls.
Tell the user the rough cost before a long session on the free plan.

**Tools change between versions.** List what the server exposes before planning.
As of Paper Desktop 0.5.18 the useful ones are:

| Purpose | Tools |
|---|---|
| Context | `get_guide` (call `paper-mcp-instructions` once per session), `get_basic_info`, `get_selection`, `get_tree_summary`, `get_children`, `get_node_info` |
| Exact values | `get_jsx` (pass `includeNodeIds: false`), `get_computed_styles`, `get_fill_image`, `get_tokens` |
| Seeing | `get_screenshot` (for review only, never as a source of values) |
| Writing | `create_file`, `create_page`, `create_artboard`, `write_html`, `update_styles`, `set_text_content`, `duplicate_nodes`, `move_nodes`, `finish_working_on_nodes` (always call it at the end) |
| Feedback | `list_comment_threads`, `get_comment_thread`, `set_comment_thread_status` |
| Output | `export` (png/jpg/webp/svg/pdf, and **video**: mp4, or webm with transparency, with `durationSeconds`) |
| Assets | `paper-gen://` image URLs inside `write_html` (AI images; only when asked, they count against usage), `paper-asset:///abs/path.png` for local files |

## The workflow: look in Paper, motion in paper-motion

This replaces or strengthens **Gate A (style frames)** when Paper is connected.

1. **Brief first.** Post the brief in chat before any write: mood, palette,
   type, direction. The skill's intake does this; Paper's guide also requires it.
2. **One page per piece.** Create a new file or a new page, such as
   `<piece> · style frames`, so you never edit the user's existing work. Use one
   artboard per direction, sized like the video (1920×1080, 1080×1920, …).
3. **Build each frame in small steps.** Each `write_html` call adds one visual
   group, so the user watches it appear. Check fonts with
   `get_font_family_info` first. Review with `get_screenshot` against Paper's
   checklist (spacing, type, contrast, alignment).
4. **The user adds and tunes the shaders.** `write_html` places the layout and
   type. Shader layers are added in the app (`S`) and tuned with sliders by the
   user, who knows best when it looks right. Ask them to do it and say which
   layer it is for.
5. **Feedback on the canvas.** Ask the user to leave comments on the frames.
   Read them with `list_comment_threads` / `get_comment_thread`, apply the
   changes, and resolve each thread with `set_comment_thread_status`.
6. **Read exact values back.** Use `get_jsx` (`includeNodeIds: false`) on the
   approved artboard. Shader nodes come out as `@paper-design/shaders-react`
   components with their props, which are the same props `s.shader(el,
   'Name', props)` takes. Positions, sizes, fonts and colors come from the JSX or
   `get_computed_styles`. Never estimate from a screenshot.
7. **Animate in the scene.** Port the static layout into `scene.html`, keeping
   the user's exact values, then animate it as usual. Record the decisions in
   `brief.md`.
8. **Review on the canvas (optional).** Place stills or contact sheets from
   `still` on a `review` page with `paper-asset://`. The user comments there;
   loop back to step 5.

## A personal shader library

A library lets the user's taste carry across videos without spending Paper
calls every time.

1. **Set up the page.** Create a `Shader library` page with one 640×360
   artboard per slot, named for its role: `02 · MeshGradient — atmosphere`,
   `05 · Water — image filter`, and so on.
2. **The user fills it in.** In each slot they add a shader (`S`) and tune it.
3. **Read and cache it.** Read each artboard with `get_jsx` (one call per slot)
   and cache the result in the project as `library/shaders.json`, in this shape:
   `{ id, swatch, shader, props, background }`. Drop the `frame` prop.
4. **Use it in scenes.** Load it in a scene with
   `const lib = await (await fetch('/library/shaders.json')).json()`, then call
   `s.shader(el, item.shader, item.props)` with the entry you want, on its
   `background`.
5. **Show it at Gate A.** Render `library/preview/` as a contact sheet so the
   user can pick from their own materials before you propose new ones.
6. **Re-sync when they change it.** Only re-read when the user says they edited
   the library.

Notes:
- **Cloning works:** `<x-paper-clone node-id="…">` inside `write_html` places a
  copy of an existing shader node, with its props, in a new artboard. A clone
  can sit inside a clipping frame (`overflow:hidden` with `border-radius` for
  an arch or a circle) to make layouts from the user's library.
- **Local images:** `<img src="paper-asset:///abs/path.png">` places a still
  (from `still`) on the canvas, ready for the user to add an image filter.
- **Creating does not:** a shader written as a tag (`<MeshGradient …>`) is
  ignored. Shaders can only be created and tuned by the user in the app.
- **Props are read-only over the MCP:** `update_styles` on a shader node is
  accepted but leaves its props unchanged. To build shaders from the user's
  instructions, do it in the engine (`library/shaders.json` + previews).
- **Video export is paid:** `export` with `type: "video"` only works on paid
  plans. The engine renders video regardless.

## Other uses

- **Shader loops as footage.** `export` with `type: "video"` turns a tuned
  shader artboard into an mp4/webm. Use it in a scene as
  `<video data-pm-sync>`. This depends on the user's plan: try it, and fall back
  to `s.shader` with the same props.
- **Assets for image shaders.** Images composed or generated in Paper (exported
  png) make good inputs for Water, FlutedGlass, ImageDithering, Halftone*,
  LiquidMetal and LensDistortion, which look most designed on real material.
- **Tokens.** If the file has design tokens (`get_tokens`), use them for the
  scene's palette and type scale.

## Rules

- The canvas is a sketchbook; `scene.html` is the source of truth once you animate.
- Only write to the user's Paper file when they've asked for it. Create new
  files, pages or artboards; never edit their existing work.
- Don't show node IDs to the user. Refer to layer names.
- Always end a writing session with `finish_working_on_nodes`.
