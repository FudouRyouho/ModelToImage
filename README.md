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

## Docker deployment

```sh
docker compose up --build -d
```

Open `http://localhost:8080`; override the host port with `MODELTOIMAGE_PORT`. The multi-stage image runs tests and the production SPA build in Node, then serves only `build/client` with Nginx. `/healthz` is the container health check. No Node application server, filesystem model API, or uploaded-file storage is used. `docker compose logs -f` follows logs; `docker compose down` stops the service.

Run `npm run test:docker` to build the image and smoke-check the root page, health endpoint, emitted app bundle/GIF worker, and missing-worker 404. This requires Docker and curl. It does not simulate a WebGL browser; select a local ZIP in the browser, generate both artifacts, and verify/download the PNG and GIF. `.dockerignore` excludes build caches and dependencies but intentionally preserves `public/assets` reference models when present in the build context.

The Remix server entry, catalog routes and batch UI have been removed. The existing `public/assets` models remain available as reference fixtures, not an automatically loaded catalog.
