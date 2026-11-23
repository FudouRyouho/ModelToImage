import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { relative, sep } from 'node:path';
import { test } from 'node:test';

const client = 'build/client';

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

test('SPA build output contains no stale, unreferenced assets', () => {
  const manifest = JSON.parse(
    readFileSync(`${client}/.vite/manifest.json`, 'utf8'),
  );
  const referenced = new Set();
  for (const entry of Object.values(manifest)) {
    for (const file of [
      entry.file,
      ...(entry.css ?? []),
      ...(entry.assets ?? []),
    ]) {
      if (file) referenced.add(file);
    }
  }
  const assets = filesUnder(`${client}/assets`)
    .filter((path) => /\.(?:js|css)$/.test(path))
    .map((path) => relative(client, path).split(sep).join('/'));
  assert.deepEqual(
    assets.filter((path) => !referenced.has(path)),
    [],
  );
});

test('SPA entry references the emitted GIF worker', () => {
  const html = readFileSync(`${client}/index.html`, 'utf8');
  assert.match(html, /id="root"/);
  const entry = html.match(/src="([^"]+\.js)"/)?.[1];
  assert.ok(entry);
  const bundle = readFileSync(`${client}${entry}`, 'utf8');
  const worker = bundle.match(/\/assets\/gif\.worker-[\w-]+\.js/)?.[0];
  assert.ok(worker);
  assert.ok(existsSync(`${client}${worker}`));
  assert.doesNotMatch(
    bundle,
    /fetch\(["']\/models["']\)|Error scanning models|RemixBrowser/,
  );
});
