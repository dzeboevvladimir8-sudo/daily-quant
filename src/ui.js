// Rendering and event handling. All rules live in store.js / checker.js / export.js.
import { checkAnswer } from './checker.js';
import { dateKey, ensureDay, setsForDay, isFinal, isDayComplete, streak, mistakes, load, save } from './store.js';
import { toMarkdown, prettyDate } from './export.js';

const LABEL = { olympiad: 'Olympiad', probability: 'Probability', mental: 'Mental math' };
const STATUS = { solved: 'Solved', solved_hint: 'Solved with hint', partial: 'Partial', missed: 'Missed' };

let problems, byId, sets, state;
const ui = { hints: new Set(), fb: {}, saveFailed: false };
const app = () => document.getElementById('app');

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Tiny markdown: paragraphs, "- " bullets, **bold**. Math stays as $...$ for KaTeX.
function md(text) {
  return esc(text).split(/\n{2,}/).map((block) => {
    const lines = block.split('\n');
    const bold = (s) => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    if (lines.every((l) => l.startsWith('- '))) return `<ul>${lines.map((l) => `<li>${bold(l.slice(2))}</li>`).join('')}</ul>`;
    return `<p>${bold(lines.join('<br>'))}</p>`;
  }).join('');
}

function renderMath(el) {
  window.renderMathInElement?.(el, {
    delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
    throwOnError: false,
  });
}

function commit(next) {
  state = next;
  ui.saveFailed = !save(state);
  render();
}

// ---- records: today's results or a redo, same shape ----
const getRec = (ctx, id) => (ctx.mode === 'redo' ? state.redo[id] : state.days[ctx.date]?.results[id]) || { status: 'pending', tries: 0 };
function setRec(ctx, id, patch) {
  const rec = { ...getRec(ctx, id), ...patch };
  if (ctx.mode === 'redo') return commit({ ...state, redo: { ...state.redo, [id]: rec } });
  const day = state.days[ctx.date];
  commit({ ...state, days: { ...state.days, [ctx.date]: { ...day, results: { ...day.results, [id]: rec } } } });
}

function chip(status) {
  return status && STATUS[status] ? `<span class="chip ${status}">${STATUS[status]}</span>` : '<span class="chip todo">Not done</span>';
}

function card(p, ctx) {
  const rec = getRec(ctx, p.id);
  const final = isFinal(rec);
  const proof = p.answer.type === 'proof';
  const fb = ui.fb[p.id];
  const hintShown = rec.hintUsed || ui.hints.has(p.id);
  const data = `data-id="${p.id}" data-mode="${ctx.mode}" data-date="${ctx.date || ''}"`;
  let body = '';

  if (proof) {
    if (!rec.attempted) body = `<div class="row"><button class="primary" data-action="attempted" ${data}>I've attempted it</button>${hintShown ? '' : `<button data-action="hint" ${data}>Hint</button>`}</div>`;
    else if (!final) body = `<div class="row" role="group" aria-label="Mark yourself"><span class="muted">How did it go?</span>
      <button data-action="mark" data-value="solved" ${data}>Solved</button>
      <button data-action="mark" data-value="partial" ${data}>Partial</button>
      <button data-action="mark" data-value="missed" ${data}>Missed</button></div>`;
  } else {
    const ph = p.answer.type === 'approx' ? 'Your estimate' : 'e.g. 42, 3/8, 0.375';
    const left = 2 - (rec.tries || 0);
    body = `<form class="row" data-action="check" ${data}>
      <label class="sr-only" for="in-${p.id}">Your answer</label>
      <input type="text" id="in-${p.id}" inputmode="decimal" autocomplete="off" placeholder="${ph}" ${final ? `disabled value="${esc(rec.lastAnswer || '')}"` : ''}>
      <button type="submit" class="primary" ${final ? 'disabled' : ''}>Check</button>
      ${hintShown || final ? '' : `<button type="button" data-action="hint" ${data}>Hint</button>`}
      ${rec.solutionSeen ? '' : final ? `<button type="button" class="ghost" data-action="solution" ${data}>Show solution</button>`
        : rec.tries ? `<button type="button" class="ghost" data-action="solution" ${data}>Give up and show solution</button>`
          : '<button type="button" class="ghost" disabled title="Unlocks after you try">Solution</button>'}
    </form>
    <div class="feedback ${fb?.cls || ''}" aria-live="polite">${fb ? esc(fb.text)
      : rec.status === 'missed' ? `<span class="chip missed">Missed</span> The answer is <strong>${esc(p.answer.value)}</strong>.`
        : final ? chip(rec.status) : rec.tries ? `${left} ${left === 1 ? 'try' : 'tries'} left.` : ''}</div>`;
  }
  if (proof && final) body += `<div class="feedback">${chip(rec.status)}</div>`;

  return `<article class="card ${final ? 'final' : ''}" aria-labelledby="t-${p.id}">
    <div class="meta"><span class="cat" id="t-${p.id}">${LABEL[p.category]} · ${esc(p.topic)} · ${p.difficulty}</span><span class="src">${esc(p.source)}</span></div>
    <div class="statement">${md(p.statement)}</div>
    ${body}
    ${hintShown ? `<div class="reveal"><h3>Hint</h3>${md(p.hint)}</div>` : ''}
    ${rec.solutionSeen ? `<div class="reveal"><h3>Solution</h3>${md(p.solution)}${proof ? '<p class="muted">Claim checked by computer; proof written by hand.</p>' : ''}</div>` : ''}
  </article>`;
}

// ---- screens ----
function todayView() {
  const key = dateKey();
  const r = ensureDay(state, key, sets.length);
  if (r.state !== state) { state = r.state; ui.saveFailed = !save(state); }
  if (r.set === null) {
    return `<div class="page-head"><h1>Today</h1></div><div class="notice">You've used all ${sets.length} days in the problem bank. Time to add more problems.</div>`;
  }
  const ctx = { mode: 'today', date: key };
  const set = sets[r.set];
  const done = set.filter((p) => isFinal(getRec(ctx, p.id))).length;
  const complete = isDayComplete(state.days[key]);
  return `<div class="page-head"><h1>Day ${r.set + 1}</h1><span class="sub">${prettyDate(key)} · ${done} / 3 done</span></div>
    ${set.map((p) => card(p, ctx)).join('')}
    <div class="bar"><span class="muted">${complete ? 'Day complete. See you tomorrow.' : 'Export works any time; unfinished problems show as not done.'}</span>
      <span class="row" style="margin:0"><button data-action="copy">Copy markdown</button><button data-action="download">Download .md</button></span></div>
    <div class="feedback" id="export-fb" aria-live="polite"></div>`;
}

function historyView() {
  const keys = Object.keys(state.days).sort().reverse();
  if (!keys.length) return '<div class="page-head"><h1>History</h1></div><p class="empty">No days yet.</p>';
  return `<div class="page-head"><h1>History</h1><span class="sub">${keys.length} ${keys.length === 1 ? 'day' : 'days'}</span></div>
    <ul class="list">${keys.map((k) => {
      const day = state.days[k];
      const set = sets[day.set] || [];
      const solved = set.filter((p) => ['solved', 'solved_hint'].includes(day.results[p.id]?.status)).length;
      return `<li><div class="li-head"><span class="li-title">Day ${day.set + 1} · ${prettyDate(k)}</span><span class="sub">${solved}/3 solved${isDayComplete(day) ? '' : ' · unfinished'}</span></div>
        <div class="li-items">${set.map((p) => `<div class="li-item"><span>${LABEL[p.category]} · ${esc(p.topic)}</span>${chip(day.results[p.id]?.status)}</div>`).join('')}</div></li>`;
    }).join('')}</ul>`;
}

function mistakesView() {
  const list = mistakes(state, byId);
  if (!list.length) return '<div class="page-head"><h1>Mistakes</h1></div><p class="empty">Nothing to redo. Missed and partial problems show up here.</p>';
  return `<div class="page-head"><h1>Mistakes</h1><span class="sub">${list.length} to redo</span></div>
    <ul class="list">${list.map(({ problem: p, date, status }) => `<li>
      <div class="li-head"><span class="li-title">${LABEL[p.category]} · ${esc(p.topic)}</span><span>${chip(status)} <span class="sub">${prettyDate(date)}</span></span></div>
      <div class="excerpt">${md(p.statement.split('\n')[0])}</div>
      <a class="btn" href="#/redo/${p.id}">${state.redo[p.id] ? 'Continue redo' : 'Redo'}</a></li>`).join('')}</ul>`;
}

function redoView(id) {
  const p = byId[id];
  if (!p) return '<p class="empty">Problem not found. <a href="#/mistakes">Back to mistakes</a></p>';
  const rec = state.redo[id];
  const cleared = ['solved', 'solved_hint'].includes(rec?.status);
  const again = isFinal(rec) && !cleared;
  return `<div class="page-head"><h1>Redo</h1><a class="sub" href="#/mistakes">← Mistakes</a></div>
    ${card(p, { mode: 'redo' })}
    ${cleared ? '<div class="notice">Solved. It\'s off your mistakes list.</div>' : ''}
    ${again ? `<div class="row"><button data-action="reset" data-id="${id}">Try again from scratch</button></div>` : ''}`;
}

function render() {
  const hash = location.hash || '#/';
  const [, route, arg] = hash.split('/');
  const view = route === 'history' ? historyView() : route === 'mistakes' ? mistakesView() : route === 'redo' ? redoView(arg) : todayView();
  app().innerHTML = (ui.saveFailed ? '<div class="notice">This browser is blocking storage, so progress won\'t be saved.</div>' : '') + view;
  renderMath(app());
  const nav = route === 'history' || route === 'mistakes' ? route : route === 'redo' ? 'mistakes' : 'today';
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const s = streak(state, dateKey());
  const el = document.getElementById('streak');
  el.textContent = `${s}-day streak`;
  el.classList.toggle('on', s > 0);
  const m = mistakes(state, byId).length;
  document.getElementById('mistake-count').textContent = m ? m : '';
}

// ---- actions ----
function handle(action, el) {
  const id = el.dataset.id;
  const ctx = { mode: el.dataset.mode, date: el.dataset.date };
  const rec = id && el.dataset.mode ? getRec(ctx, id) : null;
  const p = byId[id];
  if (id) delete ui.fb[id];

  if (action === 'hint') {
    ui.hints.add(id);
    return isFinal(rec) ? render() : setRec(ctx, id, { hintUsed: true });
  }
  if (action === 'check') {
    if (isFinal(rec)) return;
    const input = el.querySelector('input');
    const ok = checkAnswer(p.answer, input.value);
    if (ok === null) { ui.fb[id] = { text: 'Couldn\'t read that. Try a whole number, a fraction like 3/8, or a decimal.', cls: 'bad' }; return render(); }
    if (ok) return setRec(ctx, id, { status: rec.hintUsed ? 'solved_hint' : 'solved', lastAnswer: input.value.trim() });
    const tries = (rec.tries || 0) + 1;
    if (tries >= 2) return setRec(ctx, id, { tries, status: 'missed', lastAnswer: input.value.trim() });
    ui.fb[id] = { text: 'Not quite. One try left.', cls: 'bad' };
    return setRec(ctx, id, { tries, lastAnswer: input.value.trim() });
  }
  if (action === 'solution') {
    // Opening the solution before getting it right ends the problem as missed.
    return setRec(ctx, id, isFinal(rec) ? { solutionSeen: true } : { solutionSeen: true, status: 'missed' });
  }
  if (action === 'attempted') return setRec(ctx, id, { attempted: true, solutionSeen: true });
  if (action === 'mark') {
    const v = el.dataset.value;
    return setRec(ctx, id, { status: v === 'solved' && rec.hintUsed ? 'solved_hint' : v });
  }
  if (action === 'reset') {
    const redo = { ...state.redo }; delete redo[id]; ui.hints.delete(id);
    return commit({ ...state, redo });
  }
  if (action === 'copy' || action === 'download') return exportDay(action);
}

function exportDay(how) {
  const key = dateKey();
  const day = state.days[key];
  if (!day) return;
  const set = sets[day.set];
  const text = toMarkdown({ date: key, dayNumber: day.set + 1, items: set.map((p) => ({ problem: p, result: day.results[p.id] })) });
  const out = document.getElementById('export-fb');
  if (how === 'download') {
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([text], { type: 'text/markdown' })), download: `Daily-Quant-${key}.md` });
    a.click(); URL.revokeObjectURL(a.href);
    out.textContent = 'Downloaded.';
    return;
  }
  navigator.clipboard?.writeText(text).then(() => { out.textContent = 'Copied. Paste it into your vault.'; },
    () => { out.textContent = 'Clipboard blocked. Use Download instead.'; });
}

export function start(bank) {
  problems = bank;
  byId = Object.fromEntries(problems.map((p) => [p.id, p]));
  sets = setsForDay(problems);
  state = load();
  app().addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (el && el.tagName !== 'FORM') handle(el.dataset.action, el);
  });
  app().addEventListener('submit', (e) => { e.preventDefault(); handle('check', e.target); });
  window.addEventListener('hashchange', () => { render(); app().focus(); window.scrollTo(0, 0); });
  // A tab left open overnight picks up the new day; only re-render then, so typed answers survive.
  let shown = dateKey();
  window.addEventListener('focus', () => { if (dateKey() !== shown) { shown = dateKey(); render(); } });
  render();
}
