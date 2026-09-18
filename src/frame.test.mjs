import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampTime, formatTime, extensionFor, frameFileName } from './frame.ts';

test('clampTime keeps a time within [0, duration]', () => {
  assert.equal(clampTime(-5, 10), 0);
  assert.equal(clampTime(15, 10), 10);
  assert.equal(clampTime(5, 10), 5);
});

test('clampTime handles a non-finite duration by not upper-clamping', () => {
  assert.equal(clampTime(5, Infinity), 5);
  assert.equal(clampTime(5, NaN), 5);
});

test('clampTime treats a non-finite time as 0', () => {
  assert.equal(clampTime(NaN, 10), 0);
});

test('formatTime renders m:ss.ss', () => {
  assert.equal(formatTime(0), '0:00.00');
  assert.equal(formatTime(65.5), '1:05.50');
  assert.equal(formatTime(9.1), '0:09.10');
});

test('extensionFor maps format to file extension', () => {
  assert.equal(extensionFor('image/png'), 'png');
  assert.equal(extensionFor('image/jpeg'), 'jpg');
});

test('frameFileName builds a descriptive name including the timestamp', () => {
  assert.equal(frameFileName('holiday.mp4', 12.3, 'image/png'), 'holiday-frame-12-30s.png');
  assert.equal(frameFileName('clip', 0, 'image/jpeg'), 'clip-frame-0-00s.jpg');
});
