import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeErrorReason } from './normalizeErrorReason';

void test('preserves existing Error instances', () => {
  const error = new Error('frame failed');

  assert.strictEqual(normalizeErrorReason(error, 'unused fallback'), error);
});

void test('converts non-Error reasons using the caller-specific fallback', () => {
  const reason = { kind: 'image-load-event' };
  const processingError = normalizeErrorReason(reason, 'Unable to process ZIP');
  const previewError = normalizeErrorReason(reason, 'Unknown error');

  assert.equal(processingError.message, 'Unable to process ZIP');
  assert.equal(processingError.cause, reason);
  assert.equal(previewError.message, 'Unknown error');
  assert.equal(previewError.cause, reason);
});
