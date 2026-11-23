# ModelToImage

A browser-first React/Vite app: one local OBJ ZIP becomes a PNG and a turntable GIF on every run. No accounts, server catalog, uploads, or batch queue.

## Run locally

Requires Node.js 20+ and the dependencies from `package-lock.json`.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Select one ZIP, optionally adjust **Render settings**, and choose **Generate PNG + GIF**. Keep the tab open while processing. Download each artifact using its link; links remain usable until another file/run replaces the results or the app unmounts. Settings persist in browser local storage; imported packages and result URLs do not.

## Input and output

- Exactly one OBJ per ZIP, optionally one MTL and companion PNG/JPEG/TGA textures. Companion paths must stay within the package; external resources are rejected.
- Limits: 64 MiB compressed, 128 entries, 64 MiB per expanded entry, 128 MiB expanded total.
- Both PNG and GIF are always generated; there is no output-format selector. Existing saved format preferences are ignored.
- Use at least two whole animation frames (the existing PNG encoder takes the second frame), positive FPS and positive whole output dimensions.
- Rendering/encoding uses the existing Three.js and gif.js pipeline. WebGL support and enough browser memory are required. Processing is local and not durable across tab closure.
- Existing `public/assets` models remain reference assets, not an automatically loaded catalog.

## Checks

```sh
npm test
npm run test:spa
npm run typecheck
npm run lint
npm run build
```

The test suite uses Node's built-in runner via tsx for importer/resource-loading checks. It does not exercise browser image decoding, WebGL, or complete PNG/GIF export; verify those manually in a browser.

## Static deployment

`npm run build` produces the static SPA in `build/client` (including its GIF worker). Serve that directory with a static web server; no Remix/Node application server or filesystem model API is used. `npm start` runs Vite's preview server for local build inspection, not a production server. Docker packaging and end-to-end deployment verification are deferred to T5.

The Remix server entry, catalog routes and batch UI have been removed. The existing `public/assets` models remain available as reference fixtures, not an automatically loaded catalog.
