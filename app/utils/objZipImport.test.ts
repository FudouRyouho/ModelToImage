import assert from 'node:assert/strict';
import { test } from 'node:test';
import JSZip from 'jszip';
import { importObjZip, OBJ_ZIP_LIMITS } from './objZipImport';

async function archive(files: Record<string, string>, options = {}) {
  const zip = new JSZip();
  for (const [path, text] of Object.entries(files))
    zip.file(path, text, { createFolders: false });
  const bytes = await zip.generateAsync({
    type: 'uint8array',
    ...options,
  });
  return new Blob([new Uint8Array(bytes)]);
}
const valid = {
  'model/mesh.obj': 'mtllib materials/body.mtl\nv 0 0 0\nusemtl body\n',
  'model/materials/body.mtl': 'newmtl body\nmap_Kd ../textures/body.png\n',
  'model/textures/body.png': 'texture bytes',
};
const validTga = String.fromCharCode(
  0,
  0,
  2,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  0,
  1,
  0,
  24,
  0,
  1,
  2,
  3,
);
async function rejects(
  files: Record<string, string>,
  code: string,
  limits = {},
) {
  await assert.rejects(importObjZip(await archive(files), limits), { code });
}

void test('valid package preserves relative paths, isolates resolution and disposes all URLs', async () => {
  const pkg = await importObjZip(await archive(valid));
  const manager = pkg.createLoadingManager();
  let objUrl = '';
  try {
    objUrl = manager.resolveURL(pkg.model.objPath);
    assert.equal(pkg.model.objPath, 'model/mesh.obj');
    assert.equal(pkg.model.mtlPath, 'model/materials/body.mtl');
    const url = manager.resolveURL('model/materials/../textures/body.png');
    assert.equal(await (await fetch(url)).text(), 'texture bytes');
    assert.equal(manager.resolveURL('model/textures/body.png'), url);
    for (const path of [
      'https://example.com/x',
      '//host/x',
      'data:text/plain,x',
      'blob:foreign',
      'missing.png',
      '../../escape.png',
    ]) {
      assert.throws(() => manager.resolveURL(path), {
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    assert.ok(manager.getHandler('model/textures/body.tga'));
  } finally {
    pkg.dispose();
    pkg.dispose();
  }
  assert.throws(() => manager.resolveURL('model/mesh.obj'), {
    code: 'DISPOSED',
  });
  await assert.rejects(fetch(objUrl));
});

void test('OBJ-only catalog-style geometry remains accepted', async () => {
  const pkg = await importObjZip(await archive({ 'mesh.obj': 'v 0 0 0\n' }));
  assert.equal(pkg.model.mtlPath, null);
  pkg.dispose();
});

void test('exactly one OBJ and at most one MTL', async () => {
  await rejects({ 'a.png': '' }, 'OBJ_COUNT');
  await rejects({ 'a.obj': '', 'b.obj': '' }, 'OBJ_COUNT');
  await rejects({ 'a.obj': '', 'a.mtl': '', 'b.mtl': '' }, 'MTL_COUNT');
});

void test('unsafe and colliding entry paths fail closed', async () => {
  for (const name of [
    '../a.obj',
    '/a.obj',
    'C:/a.obj',
    '//host/a.obj',
    'a\\b.obj',
    'a/./b.obj',
    'a//b.obj',
    'a\u0001.obj',
    'a%2e.obj',
  ]) {
    await assert.rejects(
      importObjZip(await archive({ [name]: '' })),
      (error) => error instanceof Error,
      name,
    );
  }
  await assert.rejects(
    importObjZip(await archive({ 'A.obj': '', 'a.OBJ': '' })),
  );
  await assert.rejects(
    importObjZip(await archive({ 'a.obj': '', 'a.obj/x.png': '' })),
  );
  // Mutate both headers to produce a real duplicate (JSZip itself deduplicates).
  const data = new Uint8Array(
    await (await archive({ 'a.obj': '', 'b.obj': '' })).arrayBuffer(),
  );
  for (let i = 0; i < data.length - 4; i++) {
    if (
      data[i] === 98 &&
      new TextDecoder().decode(data.subarray(i, i + 5)) === 'b.obj'
    )
      data[i] = 97;
  }
  await assert.rejects(importObjZip(new Blob([data])));
});

void test('compressed, count, entry and aggregate limits include exact boundaries', async () => {
  assert.deepEqual(OBJ_ZIP_LIMITS, {
    maxZipBytes: 64 * 1024 ** 2,
    maxEntries: 128,
    maxEntryBytes: 64 * 1024 ** 2,
    maxTotalBytes: 128 * 1024 ** 2,
  });
  const blob = await archive({ 'a.obj': '1234', 'a.png': '1234' });
  await assert.rejects(importObjZip(blob, { maxZipBytes: blob.size - 1 }), {
    code: 'ZIP_LIMIT',
  });
  await assert.rejects(importObjZip(blob, { maxEntries: 1 }), {
    code: 'ENTRY_COUNT_LIMIT',
  });
  await assert.rejects(importObjZip(blob, { maxEntryBytes: 3 }), {
    code: 'ENTRY_LIMIT',
  });
  await assert.rejects(importObjZip(blob, { maxTotalBytes: 7 }), {
    code: 'TOTAL_LIMIT',
  });
  const pkg = await importObjZip(blob, {
    maxZipBytes: blob.size,
    maxEntries: 2,
    maxEntryBytes: 4,
    maxTotalBytes: 8,
  });
  pkg.dispose();
  const compressed = await archive(
    { 'a.obj': 'x'.repeat(10000) },
    { compression: 'DEFLATE' },
  );
  await assert.rejects(importObjZip(compressed, { maxEntryBytes: 100 }), {
    code: 'ENTRY_LIMIT',
  });
});

void test('companions and all material/texture URLs must exist locally', async () => {
  await rejects({ 'a.obj': 'mtllib missing.mtl' }, 'RESOURCE_NOT_FOUND');
  await rejects({ 'a.obj': 'usemtl body' }, 'RESOURCE_NOT_FOUND');
  await rejects(
    { ...valid, 'model/materials/body.mtl': 'newmtl body\nmap_Kd absent.jpg' },
    'RESOURCE_NOT_FOUND',
  );
  for (const url of [
    'https://host/x.png',
    '//host/x.png',
    'data:image/png,x',
    'file:/x.png',
    'C:/x.png',
    '../../../../x.png',
  ]) {
    await rejects(
      { ...valid, 'model/materials/body.mtl': `newmtl body\nmap_Kd ${url}` },
      'RESOURCE_NOT_FOUND',
    );
    await rejects({ 'a.obj': `mtllib ${url}` }, 'RESOURCE_NOT_FOUND');
  }
});

void test('supported texture extensions and loader map options resolve to package URLs', async () => {
  for (const ext of ['png', 'jpg', 'jpeg', 'tga']) {
    const pkg = await importObjZip(
      await archive({
        'a.obj': 'mtllib a.mtl',
        'a.mtl': `newmtl body\nmap_Kd -s 1 1 1 -o 0 0 0 tex.${ext}`,
        [`tex.${ext}`]: ext === 'tga' ? validTga : 'bytes',
      }),
    );
    assert.match(pkg.createLoadingManager().resolveURL(`tex.${ext}`), /^blob:/);
    pkg.dispose();
  }
});

void test('invalid TGA data rejects during import rather than failing silently in the loader', async () => {
  const blob = await archive({
    'a.obj': 'mtllib a.mtl',
    'a.mtl': 'newmtl body\nmap_Kd body.tga',
    'body.tga': 'bytes',
  });
  await assert.rejects(importObjZip(blob), { code: 'INVALID_TEXTURE' });
  const truncated = await archive({
    'a.obj': 'mtllib a.mtl',
    'a.mtl': 'newmtl body\nmap_Kd body.tga',
    'body.tga': validTga.slice(0, 19),
  });
  await assert.rejects(importObjZip(truncated), { code: 'INVALID_TEXTURE' });
  const oversizedBytes = Array.from(validTga, (char) => char.charCodeAt(0));
  oversizedBytes[12] = 0;
  oversizedBytes[13] = 32;
  oversizedBytes[14] = 1;
  oversizedBytes[15] = 8;
  const oversized = await archive({
    'a.obj': 'mtllib a.mtl',
    'a.mtl': 'newmtl body\nmap_Kd body.tga',
    'body.tga': String.fromCharCode(...oversizedBytes),
  });
  await assert.rejects(importObjZip(oversized), { code: 'TEXTURE_LIMIT' });
});

void test('indexed TGA validates palette origins and raw or RLE pixel indices', async () => {
  const makeArchive = async (name: string, tga: number[]) => {
    const zip = new JSZip();
    zip.file('a.obj', '');
    zip.file(name, Uint8Array.from(tga));
    const bytes = await zip.generateAsync({ type: 'uint8array' });
    return new Blob([new Uint8Array(bytes)]);
  };
  const header = [
    0, 1, 1, 0, 0, 1, 0, 24, 0, 0, 0, 0, 1, 0, 1, 0, 8, 0, 1, 2, 3,
  ];
  const valid = await importObjZip(
    await makeArchive('valid.tga', [...header, 0]),
  );
  valid.dispose();
  await assert.rejects(
    importObjZip(await makeArchive('bad-index.tga', [...header, 255])),
    { code: 'INVALID_TEXTURE' },
  );
  await assert.rejects(
    importObjZip(
      await makeArchive('bad-rle.tga', [
        ...header.slice(0, 2),
        9,
        ...header.slice(3),
        0x80,
        255,
      ]),
    ),
    { code: 'INVALID_TEXTURE' },
  );
  const nonzeroPaletteOrigin = [...header];
  nonzeroPaletteOrigin[3] = 1;
  await assert.rejects(
    importObjZip(
      await makeArchive('bad-origin.tga', [...nonzeroPaletteOrigin, 1]),
    ),
    { code: 'INVALID_TEXTURE' },
  );
});

void test('strict extraction rejects dishonest expanded sizes', async () => {
  const blob = await archive(
    { 'a.obj': 'x'.repeat(10000) },
    { compression: 'DEFLATE' },
  );
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < bytes.length - 46; i++) {
    const signature = view.getUint32(i, true);
    if (signature === 0x04034b50) view.setUint32(i + 22, 4, true);
    if (signature === 0x02014b50) view.setUint32(i + 24, 4, true);
  }
  await assert.rejects(
    importObjZip(new Blob([bytes]), { maxEntryBytes: 100 }),
    { code: 'INVALID_ZIP', message: 'Invalid uncompressed size' },
  );
  await assert.rejects(
    importObjZip(new Blob([bytes]), { maxTotalBytes: 100 }),
    { code: 'INVALID_ZIP', message: 'Invalid uncompressed size' },
  );
});

void test('explicit directory entries remain valid', async () => {
  const zip = new JSZip();
  zip.file('folder/a.obj', 'v 0 0 0');
  const pkg = await importObjZip(
    new Blob([new Uint8Array(await zip.generateAsync({ type: 'uint8array' }))]),
  );
  assert.equal(pkg.model.objPath, 'folder/a.obj');
  pkg.dispose();
});

void test('malformed, unsupported and corrupted archives reject without URL leaks', async () => {
  const created: string[] = [],
    revoked: string[] = [];
  const createDescriptor = Object.getOwnPropertyDescriptor(
    URL,
    'createObjectURL',
  )!;
  const revokeDescriptor = Object.getOwnPropertyDescriptor(
    URL,
    'revokeObjectURL',
  )!;
  const create = createDescriptor.value as (
    this: void,
    object: Blob | MediaSource,
  ) => string;
  const revoke = revokeDescriptor.value as (this: void, url: string) => void;
  URL.createObjectURL = (blob) => {
    const url = create(blob);
    created.push(url);
    return url;
  };
  URL.revokeObjectURL = (url) => {
    revoked.push(url);
    revoke(url);
  };
  try {
    await assert.rejects(importObjZip(new Blob(['not zip'])));
    await rejects({ 'a.obj': '', 'script.exe': '' }, 'UNSUPPORTED_ENTRY');
    await rejects(
      {
        ...valid,
        'model/materials/body.mtl': 'newmtl body\nmap_Kd missing.png',
      },
      'RESOURCE_NOT_FOUND',
    );
    const pkg = await importObjZip(await archive(valid));
    pkg.dispose();
    let allocations = 0;
    URL.createObjectURL = (blob) => {
      if (++allocations === 2) throw new Error('simulated allocation failure');
      const url = create(blob);
      created.push(url);
      return url;
    };
    await assert.rejects(importObjZip(await archive(valid)), {
      code: 'INVALID_ZIP',
    });
    assert.deepEqual(revoked.sort(), created.sort());
  } finally {
    Object.defineProperty(URL, 'createObjectURL', createDescriptor);
    Object.defineProperty(URL, 'revokeObjectURL', revokeDescriptor);
  }
});
