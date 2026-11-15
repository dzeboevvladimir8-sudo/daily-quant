// Answer parsing and comparison. Pure functions: no DOM, so Node tests can import them.

const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };

function parseDecimal(s) {
  const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(s);
  if (!m || (m[2] === '' && !m[3])) return null;
  const frac = m[3] || '';
  const n = BigInt((m[2] || '0') + frac) * (m[1] === '-' ? -1n : 1n);
  return { n, d: 10n ** BigInt(frac.length) };
}

// "3/8", "-6/4", "0.375", "42" -> reduced {n, d} with d > 0, or null.
export function parseRational(str) {
  const parts = String(str).replace(/\s+/g, '').split('/');
  if (parts.length > 2) return null;
  const a = parseDecimal(parts[0]);
  const b = parts.length === 2 ? parseDecimal(parts[1]) : { n: 1n, d: 1n };
  if (!a || !b || b.n === 0n) return null;
  let n = a.n * b.d, d = a.d * b.n;
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}

// true / false, or null when the input can't be read (doesn't cost a try).
export function checkAnswer(answer, input) {
  if (answer.type === 'exact') {
    const got = parseRational(input), want = parseRational(answer.value);
    if (!got) return null;
    return got.n === want.n && got.d === want.d;
  }
  if (answer.type === 'approx') {
    const s = String(input).replace(/[\s,]+/g, '');
    if (s === '') return null;
    let x = Number(s);
    if (!Number.isFinite(x)) { const r = parseRational(s); if (!r) return null; x = Number(r.n) / Number(r.d); }
    return Math.abs(x - answer.value) <= answer.tolerance * Math.abs(answer.value);
  }
  return null;
}
