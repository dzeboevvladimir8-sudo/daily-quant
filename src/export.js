// Today's results as a markdown note, same shape as the vault's Daily Integral day notes.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LABEL = { olympiad: 'Olympiad', probability: 'Probability', mental: 'Mental math' };
const ICON = { solved: '✅', solved_hint: '✅', partial: '🟡', missed: '❌' };

export const prettyDate = (key) => { const [y, m, d] = key.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');
const firstSentence = (s) => (s.match(/^[\s\S]*?[.?!](?=\s|$)/) || [s])[0].trim();

export function toMarkdown({ date, dayNumber, items }) {
  const pretty = prettyDate(date);
  const rows = items.map(({ problem: p, result: r }) => {
    const res = !r || !ICON[r.status] ? '⏳ Not done'
      : `${ICON[r.status]}${r.status === 'partial' ? ' Partial' : ''}${p.answer.type === 'proof' ? '' : ` ${r.status === 'missed' ? `(answer ${p.answer.value})` : r.lastAnswer}`}`;
    return `| ${cell(`${LABEL[p.category]} · ${p.topic}: ${firstSentence(p.statement)}`)} | ${cell(res)} | ${r?.hintUsed ? 'Hint' : 'None'} | ${cell(p.source)} |`;
  });
  const solved = items.filter(i => i.result?.status === 'solved' || i.result?.status === 'solved_hint').length;
  const alone = items.filter(i => i.result?.status === 'solved').length;
  return `---
title: Daily Quant - ${pretty}
date: ${date}
tags: [daily-quant, log]
---

# Daily Quant - Day ${dayNumber} (${pretty})

## Stats
| Problem | Result | Help needed | Notes |
|---|---|---|---|
${rows.join('\n')}

**Solved: ${solved}/${items.length}. Solved alone: ${alone}.**
`;
}
