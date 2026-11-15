import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRational, checkAnswer } from '../src/checker.js';

test('parseRational equal forms', () => {
  assert.deepEqual(parseRational('0.375'), parseRational('3/8'));
  assert.deepEqual(parseRational(' -6/4 '), { n: -3n, d: 2n });
  assert.deepEqual(parseRational('42'), { n: 42n, d: 1n });
  assert.deepEqual(parseRational('3/-4'), { n: -3n, d: 4n });
  assert.deepEqual(parseRational('.5'), { n: 1n, d: 2n });
});

test('parseRational rejects junk', () => {
  for (const s of ['3/0', 'abc', '', '1/2/3', '1.2.3', '-', '/', '1/']) assert.equal(parseRational(s), null, s);
});

test('checkAnswer exact', () => {
  const a = { type: 'exact', value: '3/8' };
  assert.equal(checkAnswer(a, '0.375'), true);
  assert.equal(checkAnswer(a, '6/16'), true);
  assert.equal(checkAnswer({ type: 'exact', value: '1/3' }, '0.333'), false);
  assert.equal(checkAnswer(a, 'x'), null);
});

test('checkAnswer approx', () => {
  const a = { type: 'approx', value: 4800, tolerance: 0.1 };
  assert.equal(checkAnswer(a, '5200'), true);
  assert.equal(checkAnswer(a, '5400'), false);
  assert.equal(checkAnswer(a, '5e3'), true);
  assert.equal(checkAnswer(a, ''), null);
  assert.equal(checkAnswer(a, 'abc'), null);
});
