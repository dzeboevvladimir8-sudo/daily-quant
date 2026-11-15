// Progress state and the rules around it. Pure except load/save.
// State: { version: 1, days: { "YYYY-MM-DD": { set, results: { id: { status, tries, hintUsed, solutionSeen, lastAnswer } } } }, redo: { id: { status } } }

const KEY = 'dailyquant.v1';
export const FINAL = ['solved', 'solved_hint', 'partial', 'missed'];
export const CATEGORIES = ['olympiad', 'probability', 'mental'];

const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function shiftKey(key, days) {
  const [y, m, d] = key.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export const emptyState = () => ({ version: 1, days: {}, redo: {} });

export function parseState(raw) {
  try {
    const s = JSON.parse(raw);
    if (s && s.version === 1 && s.days && typeof s.days === 'object' && !Array.isArray(s.days)) return { redo: {}, ...s };
  } catch { /* corrupt: fall through */ }
  return emptyState();
}

// Each new date gets the next unused set; the same date always keeps its set.
export function ensureDay(state, key, totalSets) {
  if (state.days[key]) return { state, set: state.days[key].set };
  const set = Object.keys(state.days).length;
  if (set >= totalSets) return { state, set: null };
  return { state: { ...state, days: { ...state.days, [key]: { set, results: {} } } }, set };
}

// [[olympiad, probability, mental], ...] using verified problems only, in file order.
export function setsForDay(problems) {
  const by = Object.fromEntries(CATEGORIES.map(c => [c, problems.filter(p => p.category === c && p.verification?.status === 'verified')]));
  const n = Math.min(...CATEGORIES.map(c => by[c].length));
  return Array.from({ length: n }, (_, i) => CATEGORIES.map(c => by[c][i]));
}

export const isFinal = (r) => !!r && FINAL.includes(r.status);
export const isDayComplete = (day) => !!day && Object.values(day.results).filter(isFinal).length >= 3;

// Consecutive complete days ending today, or yesterday if today isn't finished yet.
export function streak(state, todayKey) {
  let k = isDayComplete(state.days[todayKey]) ? todayKey : shiftKey(todayKey, -1);
  let n = 0;
  while (isDayComplete(state.days[k])) { n++; k = shiftKey(k, -1); }
  return n;
}

export function mistakes(state, problemsById) {
  const out = [];
  for (const date of Object.keys(state.days).sort().reverse()) {
    for (const [id, r] of Object.entries(state.days[date].results)) {
      if ((r.status === 'missed' || r.status === 'partial') && state.redo?.[id]?.status !== 'solved' && problemsById[id]) {
        out.push({ problem: problemsById[id], date, status: r.status });
      }
    }
  }
  return out;
}

export function load() {
  try { return parseState(localStorage.getItem(KEY)); } catch { return emptyState(); }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; }
}
