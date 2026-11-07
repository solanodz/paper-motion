# A shader library tuned in Paper

The recommended source for a shader set: the user tunes each shader by hand on the Paper Desktop canvas, and you read
the exact values back. Needs the Paper Desktop MCP connected (see the user's setup); never required.

**Budget.** The free plan allows 100 MCP calls a week. Setting up the page costs about 2 + one per slot, and reading
the values back costs one `get_jsx` per slot. Tell the user the rough count before starting.

1. **Set up the page.** In a new file or a new page named `<brand> · shader library` (never the user's existing
   pages), create one artboard per slot at the set's aspect (640×360 for 16:9), named for its role:
   `01 · MeshGradient · atmosphere`, `05 · Water · image filter`. A placeholder text in each says which shader to add.
2. **The user fills it in.** In each slot they press `S`, add the shader, and tune it with the brand's palette.
   For image filters, place the material first with `<img src="paper-asset:///<absolute path>">`.
3. **Read it back.** `get_jsx` on each artboard (`includeNodeIds: false`). A shader node comes out as a
   `@paper-design/shaders-react` component; its props are exactly the entry's `props`. Drop `frame`; keep everything
   else as written, colors included.
4. **Write the entries** to `brand/shader-set/set.json` with `"source": "paper"`, then build and render as usual.
5. **Re-sync only when the user says they changed a slot.**

Notes:
- **Cloning works:** `<x-paper-clone node-id="…">` inside `write_html` places a copy of an existing shader node,
  with its props, in another artboard, even inside a clipping frame (`overflow:hidden` + `border-radius`).
- **Creating does not:** a shader written as a tag (`<MeshGradient …>`) is ignored, and `update_styles` on a shader
  node leaves its props unchanged. Shaders are created and tuned only by the user in the app; to build them from
  the user's words instead, write the entry yourself (the agent source).
- **Video export is paid:** `export` with `type: "video"` only works on paid plans. The engine renders the loops.
