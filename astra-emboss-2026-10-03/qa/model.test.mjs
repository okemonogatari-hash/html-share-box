import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_CHARACTERS, DEFAULT_TEXT, characterCount, graphemes, normalizeText, wrapText, lightVector } from '../model.mjs';

test('sample and literal markup remain plain text', () => {
  assert.equal(normalizeText(DEFAULT_TEXT), DEFAULT_TEXT);
  assert.equal(normalizeText('<img src=x onerror=alert(1)>'), '<img src=x onerror=alert(1)>');
});
test('Japanese long text is limited to 42 visible characters', () => {
  assert.equal(characterCount(normalizeText('あ'.repeat(10000))), MAX_CHARACTERS);
});
test('extra newlines become counted spaces and cannot overflow 42', () => {
  const text = 'あ'.repeat(11) + '\n' + 'い'.repeat(11) + '\n' + 'う'.repeat(11) + '\n' + 'え'.repeat(11);
  const normalized = normalizeText(text);
  assert.equal(characterCount(normalized), 42);
  assert.equal(normalized.split('\n').length, 3);
  assert.equal(characterCount(normalizeText('\n'.repeat(50))), 42);
});
test('emoji and combining marks are counted and preserved as whole graphemes', () => {
  const unit = '👨‍👩‍👧‍👦';
  assert.equal(normalizeText(unit.repeat(50)), unit.repeat(42));
  assert.equal(graphemes('か\u3099').length, 1);
});
test('line ending and nonprinting control cleanup', () => {
  assert.equal(normalizeText('春\r\n夏\r秋\t冬\u0000'), '春\n夏\n秋 冬');
  assert.equal(normalizeText(''), '');
});
test('wrap keeps closing punctuation with prior glyph and measures within the boundary', () => {
  const measure = text => graphemes(text).length * 10;
  const rows = wrapText('光を、ひと押し。', 30, measure);
  assert.ok(rows.every(row => measure(row) <= 30));
  assert.ok(rows.every(row => !/^[、。]/.test(row)));
  assert.equal(rows.join(''), '光を、ひと押し。');
});
test('long Latin words wrap without losing characters', () => {
  const text = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdef';
  const rows = wrapText(text, 90, s => graphemes(s).length * 10);
  assert.equal(rows.join(''), text);
  assert.ok(rows.every(row => row.length <= 9));
});
test('all light positions produce finite normalized vectors', () => {
  for (const x of [-Infinity, -100, -1, 0, 1, 100, Infinity, NaN]) for (const y of [-1, 0, 1, NaN]) {
    const vector = lightVector(x, y);
    assert.ok(vector.every(Number.isFinite));
    assert.ok(Math.abs(Math.hypot(...vector) - 1) < 1e-12);
    assert.ok(vector[2] > 0);
  }
});
