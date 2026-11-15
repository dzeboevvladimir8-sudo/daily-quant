import test from 'node:test';
import assert from 'node:assert/strict';
import { dateKey, emptyState, parseState, ensureDay, setsForDay, isDayComplete, streak, mistakes } from '../src/store.js';

const done = (ids) => ({ results: Object.fromEntries(ids.map(i => [i, { status: 'solved' }])) });

test('dateKey is local YYYY-MM-DD', () => {
  assert.equal(dateKey(new Date(2026, 10, 5, 23, 59)), '2026-11-05');
});

test('ensureDay: same date twice -> same set, gaps do not skip sets, exhaustion', () => {
  let s = emptyState();
  let r = ensureDay(s, '2026-11-15', 2); assert.equal(r.set, 0); s = r.state;
  r = ensureDay(s, '2026-11-15', 2); assert.equal(r.set, 0); s = r.state;
  r = ensureDay(s, '2026-11-18', 2); assert.equal(r.set, 1); s = r.state;
  r = ensureDay(s, '2026-11-19', 2); assert.equal(r.set, null);
  assert.equal(Object.keys(r.state.days).length, 2);
});

test('parseState falls back on bad input', () => {
  assert.deepEqual(parseState('{bad'), emptyState());
  assert.deepEqual(parseState(null), emptyState());
  assert.deepEqual(parseState('[1,2]'), emptyState());
  const ok = { version: 1, days: { '2026-11-15': { set: 0, results: {} } }, redo: {} };
  assert.deepEqual(parseState(JSON.stringify(ok)), ok);
});

test('isDayComplete needs 3 final results', () => {
  assert.equal(isDayComplete(done(['a', 'b', 'c'])), true);
  assert.equal(isDayComplete(done(['a', 'b'])), false);
  assert.equal(isDayComplete({ results: { a: { status: 'solved' }, b: { status: 'missed' }, c: { status: 'pending', tries: 1 } } }), false);
  assert.equal(isDayComplete(undefined), false);
});

test('streak', () => {
  const st = { version: 1, redo: {}, days: {
    '2026-11-13': { set: 0, ...done(['a', 'b', 'c']) },
    '2026-11-14': { set: 1, ...done(['d', 'e', 'f']) },
    '2026-11-15': { set: 2, ...done(['g', 'h', 'i']) },
  } };
  assert.equal(streak(st, '2026-11-15'), 3);
  assert.equal(streak(st, '2026-11-16'), 3); // today unfinished keeps it
  st.days['2026-11-16'] = { set: 3, results: {} };
  assert.equal(streak(st, '2026-11-16'), 3);
  assert.equal(streak(st, '2026-11-17'), 0);
  delete st.days['2026-11-14'];
  assert.equal(streak(st, '2026-11-15'), 1);
  // across month boundary
  const m = { version: 1, redo: {}, days: { '2026-10-31': { set: 0, ...done(['a','b','c']) }, '2026-11-01': { set: 1, ...done(['d','e','f']) } } };
  assert.equal(streak(m, '2026-11-01'), 2);
});

test('mistakes lists partial/missed, newest first, minus redo-solved', () => {
  const byId = { a: { id: 'a' }, b: { id: 'b' }, c: { id: 'c' } };
  const st = { version: 1, days: {
    '2026-11-14': { set: 0, results: { a: { status: 'missed' }, b: { status: 'solved' } } },
    '2026-11-15': { set: 1, results: { c: { status: 'partial' } } },
  }, redo: {} };
  assert.deepEqual(mistakes(st, byId).map(m => m.problem.id), ['c', 'a']);
  st.redo.a = { status: 'missed' };
  assert.deepEqual(mistakes(st, byId).map(m => m.problem.id), ['c', 'a']);
  st.redo.c = { status: 'solved_hint' };
  assert.deepEqual(mistakes(st, byId).map(m => m.problem.id), ['a']);
});

test('setsForDay groups verified problems by index per category', () => {
  const P = (id, category, status = 'verified') => ({ id, category, verification: { status } });
  const sets = setsForDay([P('o1', 'olympiad'), P('p1', 'probability'), P('m1', 'mental'), P('o2', 'olympiad'), P('x', 'olympiad', 'unverified'), P('p2', 'probability'), P('m2', 'mental')]);
  assert.deepEqual(sets.map(s => s.map(p => p.id)), [['o1', 'p1', 'm1'], ['o2', 'p2', 'm2']]);
});
