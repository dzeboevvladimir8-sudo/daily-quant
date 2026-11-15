# Daily Quant

A small personal web app: three problems a day (one olympiad, one probability / quant-interview brainteaser, one mental-math or estimation), with a hint, a locked solution, answer checking, a streak, history, a mistakes list and a markdown export for the Obsidian vault. Built for Vladimir to practise inventing an approach when no known trick fits, in a small daily dose.

Design: `docs/superpowers/specs/2026-11-15-daily-quant-design.md`. Plan: `docs/superpowers/plans/2026-11-15-daily-quant-v1.md`.

## Run
```
python -m http.server 8000
```
then open http://localhost:8000. (Opening `index.html` directly won't work: browsers block `fetch` of local JSON.)

Tests: `node --test tests/*.test.mjs` · Bank check: `python verify/verify_all.py`

## Structure
- `data/problems.json`: the problem bank. Day n = n-th olympiad + n-th probability + n-th mental problem, in file order.
- `verify/`: Python that recomputes every answer. `verify_all.py` checks schema and runs every check.
- `src/checker.js`: answer parsing (exact rationals, approximate values). Pure.
- `src/store.js`: localStorage state, day assignment, streak, mistakes. Pure except `load`/`save`.
- `src/export.js`: today's results as markdown (same shape as the vault's Daily Integral day notes).
- `src/ui.js`, `src/main.js`, `index.html`, `styles.css`: rendering only.
- `tests/`: Node tests for the pure modules.

## Rule 1: verify every answer
No problem enters `problems.json` without a check in `verify/` that recomputes its answer independently (brute force, exact `fractions` arithmetic, Monte Carlo as a second check for probability). `python verify/verify_all.py` must pass before committing any change to the bank. If an answer can't be verified, set `verification.status` to `"unverified"`: the app will not serve it. Proof problems: the claim is checked by computer over many cases; the proof itself is written by hand and labelled so. On a mismatch, re-derive by hand and fix the problem, never bend the check to fit.

Problems are well-known types written in our own words; credit the competition in `source`.

## Rule 2: scope
v1 is the features in the design doc, nothing more. Don't add features without asking Vladimir first; he wants to be held to the scope.
