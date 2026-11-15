import test from 'node:test';
import assert from 'node:assert/strict';
import { toMarkdown } from '../src/export.js';

test('toMarkdown matches the Daily Integral note shape', () => {
  const p = (id, category, topic, statement, answer) => ({ id, category, topic, statement, answer, source: 'UKMT JMO 2015' });
  const md = toMarkdown({ date: '2026-11-15', dayNumber: 3, items: [
    { problem: p('o', 'olympiad', 'Number theory', 'Find the last digit of $7^{100}$. Show work.', { type: 'exact', value: '1' }), result: { status: 'solved', lastAnswer: '1' } },
    { problem: p('p', 'probability', 'Dice | sums', 'Two dice are rolled.', { type: 'exact', value: '1/6' }), result: { status: 'solved_hint', hintUsed: true, lastAnswer: '1/6' } },
    { problem: p('m', 'mental', 'Estimation', 'Estimate it.', { type: 'proof' }), result: undefined },
  ] });
  assert.match(md, /^---\ntitle: Daily Quant - 15 Nov 2026\ndate: 2026-11-15\ntags: \[daily-quant, log\]\n---/);
  assert.match(md, /# Daily Quant - Day 3 \(15 Nov 2026\)/);
  assert.match(md, /\| Problem \| Result \| Help needed \| Notes \|/);
  assert.match(md, /Find the last digit of \$7\^\{100\}\$\./);
  assert.match(md, /Dice \\| sums/);
  assert.match(md, /✅ 1 \| None/);
  assert.match(md, /⏳ Not done/);
  assert.match(md, /\*\*Solved: 2\/3\. Solved alone: 1\.\*\*/);
});
