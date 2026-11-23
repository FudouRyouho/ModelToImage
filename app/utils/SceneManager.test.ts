import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { SceneManager } from './SceneManager';

class TestProgressEvent extends Event {
  readonly lengthComputable: boolean;
  readonly loaded: number;
  readonly total: number;

  constructor(
    type: string,
    init: { lengthComputable?: boolean; loaded?: number; total?: number } = {},
  ) {
    super(type);
    this.lengthComputable = init.lengthComputable ?? false;
    this.loaded = init.loaded ?? 0;
    this.total = init.total ?? 0;
  }
}
Object.assign(globalThis, { ProgressEvent: TestProgressEvent });

function scene(): SceneManager {
  return Object.assign(Object.create(SceneManager.prototype), {
    isDisposed: false,
    currentObject: null,
    scene: new THREE.Scene(),
    prepareModel() {},
  }) as SceneManager;
}

const config = { name: 'fixture', mtlPath: null };
const objText = 'v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n';

void test('concurrent catalog loads do not replace the shared LoadingManager callbacks', async () => {
  const manager = THREE.DefaultLoadingManager;
  const { onLoad, onError } = manager;
  const urls = [0, 1].map(() => URL.createObjectURL(new Blob([objText])));
  try {
    await Promise.all(
      urls.map((objPath) => scene().loadModel({ ...config, objPath })),
    );
    assert.equal(manager.onLoad, onLoad);
    assert.equal(manager.onError, onError);
  } finally {
    manager.onLoad = onLoad;
    manager.onError = onError;
    urls.forEach((url) => URL.revokeObjectURL(url));
  }
});

void test('an unrelated default-manager error does not fail a valid catalog load', async () => {
  const manager = THREE.DefaultLoadingManager;
  const { onLoad, onError } = manager;
  const objPath = URL.createObjectURL(new Blob([objText]));
  manager.itemStart('unrelated-preview-resource');
  try {
    const job = scene().loadModel({ ...config, objPath });
    manager.itemError('unrelated-preview-resource');
    manager.itemEnd('unrelated-preview-resource');
    await job;
  } finally {
    manager.onLoad = onLoad;
    manager.onError = onError;
    URL.revokeObjectURL(objPath);
  }
});
