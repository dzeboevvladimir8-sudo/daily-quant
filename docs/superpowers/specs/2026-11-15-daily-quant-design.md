# Daily Quant: design

Date: 2026-11-15. Status: draft, waiting for approval.

## Intent
Vladimir does a daily integral every day and sticks to it because it is small, daily and has a streak. He avoids olympiad problems in long sessions, and his weakest area is inventing an approach when no known trick fits. Daily Quant puts that weak area into the same format: three problems a day, a streak, and a log that goes into his Obsidian vault.

Secondary: his recurring slip is losing the last line (signs, constants, arithmetic). Exact-answer checking makes the final number count.

## Goals (v1)
1. Three problems per day: one olympiad-style (number theory, combinatorics, algebra, geometry; UKMT / BMO1 level), one probability puzzle or quant-interview brainteaser, one mental-math or estimation problem.
2. Per problem: a hint (always available) and a worked solution (locked until he has tried).
3. Numeric answers are checked automatically; proof problems are self-marked solved / partial / missed.
4. Streak counter and a history of past days.
5. Mistakes view: missed and partial problems, redoable.
6. Export today's results as a markdown note in the same shape as his Daily Integral day notes.
7. A bank of about 90 verified problems (30 days), easy to medium.

## Non-goals (v1)
Daily integral as a fourth problem (it already works in chat and in the vault). Accounts, sync, server, payments, deployment (Railway comes later, when he says so). Hard problems. Timers, spaced repetition, charts, settings. Any feature not listed above without asking him first.

## Anti-goals (a failure even if it works)
- A wrong answer or wrong solution in the bank. Correctness beats quantity: fewer problems is better than one unverified one.
- Scope creep into "v1.5". He tends to start many version-1s; this one must be finished.
- Feeling like a long session. A day is three problems, roughly 20-30 minutes.

## Constraints
- Runs locally, in `C:\Users\ASUS\OneDrive\Desktop\CLAUDE\Daily Quant`.
- No login, no database server. Progress lives in the browser's localStorage.
- Problem data is separate from the UI, so it could become a product later.
- Every answer verified by running Python where possible (brute force, exact computation, or simulation for probability). Unverifiable answers are marked unverified and not served.
- Problems are well-known types written in our own words; competition sources are credited.
- Visual: dark, minimal, Linear / Raycast feel, matching the FourCondition site (Geist + Geist Mono, navy / cream / coral). No purple gradients, no generic AI look.

## Approaches considered
- **A. Plain HTML + JS modules, no build step (chosen).** `index.html`, a few ES modules, `data/problems.json`, served with `python -m http.server`. Zero dependencies to install; every line readable; data and logic already separable for a future product. Trade-off: a real product would rewrite the UI in a framework (the data, checker and verification carry over).
- B. Vite + React. Closer to a product stack, but npm, a build step and node_modules for four screens.
- C. Flask + HTML. Fits Python and Railway, but adds a server process he asked not to have in v1.

He picked A.

## Behaviour (agreed with him)
- **Day assignment:** problem sets come in a fixed order. The first time the app opens on a new calendar date (local time), that date gets the next unused set. Skipping a day loses nothing: the next open gets the next set, not the skipped one.
- **Streak:** consecutive calendar dates whose day is complete. A day is complete when all three problems are checked or self-marked. Opening the app does not count. Today being unfinished does not break the streak until the date passes.
- **Hint then solution:** the hint is always available. The solution unlocks only after he has submitted an answer (numeric) or said "I've attempted it" (proof).
- **Numeric answers:** two tries. Correct counts as solved, recorded as solved-with-hint if the hint was opened. A wrong second try counts as missed.
- **Proof answers:** "I've attempted it" reveals the solution; he then marks solved / partial / missed.
- **Mistakes:** every missed or partial problem is listed. He can redo it there; it leaves the list when he solves it without opening the solution.
- **After 30 days:** the app says the bank is used up. It does not loop.

## Design decisions (builder's calls, marked as such)
- **Bank layout (call):** `data/problems.json`, one list. Day n gets the n-th olympiad, n-th probability and n-th mental problem, so no separate days file. Order runs roughly easy to medium.
- **Problem schema (call):** `id`, `category` (`olympiad` | `probability` | `mental`), `topic`, `difficulty` (`easy` | `medium`), `statement`, `hint`, `answer`, `solution`, `source`, `verification`. Text is Markdown with LaTeX (`$...$`), rendered with KaTeX.
- **Answer types (call):**
  - `{ "type": "exact", "value": "3/8" }`: integers, fractions, or terminating decimals, compared as exact rationals. `0.375` equals `3/8`; `0.333` does not equal `1/3`. Exact answers in the bank are kept rational so this works.
  - `{ "type": "approx", "value": 4800, "tolerance": 0.1 }`: for estimation, accepted within a relative tolerance (here 10%).
  - `{ "type": "proof" }`: self-marked.
- **Proof problems (call, agreed in principle):** at most about a third of the olympiad slot. One goes in only if Python confirms the claim over many cases; it is labelled "claim checked by computer; proof written by hand".
- **Verification (call):** `verify/` holds one Python script per problem (or per small group), each computing the answer independently: brute force, exact `fractions` arithmetic, and Monte Carlo as a second check on probability. `verify/verify_all.py` runs them all and fails if any result differs from `problems.json`. Each problem's `verification` field records `status` (`verified` | `unverified`), `method` and `script`. The app only serves `verified` problems.
- **Storage (call):** one localStorage key `dailyquant.v1` with `{ startDate, days: { "YYYY-MM-DD": { set, results: { problemId: { status, tries, hintUsed, solutionSeen, lastAnswer } } } }, redo: { problemId: { status } } }`. Mistakes and the streak are computed from this, not stored.
- **Export (call):** a "Copy markdown" button (plus download) producing frontmatter (`title`, `date`, `tags: [daily-quant, log]`), a Stats table `Problem | Result | Help needed | Notes` and a "Solved: x/3. Solved alone: y." line, the same shape as his Daily Integral day notes. Where it goes in the vault is his choice; nothing writes to the vault automatically.
- **Screens (call):** Today (default), History, Mistakes. A hash router, no library.
- **Code layout (call):** `index.html`, `src/checker.js` (answer parsing and comparison), `src/store.js` (localStorage and day/streak logic), `src/ui.js` (rendering), `src/export.js`, `styles.css`, `data/problems.json`, `verify/`, `tests/` (an assert-based test page for the checker and the streak/day logic, opened in the browser).
- **Libraries:** KaTeX from cdnjs, pinned version. Geist from Google Fonts. Nothing else.
- **CLAUDE.md** in the project: what it is, the structure, how to run it, and the "verify every answer" rule (no problem enters `problems.json` without a passing verify script).

## Known risks
- localStorage is per browser. Clearing site data, or switching browsers, loses history. The markdown export is the only backup in v1. (A progress export/import is a possible later addition, not v1.)
- Proof problems are only checked as claims, not as proofs; the written solutions rely on careful review.

## Left to the builder
Exact visual details within the style constraints, the problem selection within the limits above, and code structure inside the files listed.
