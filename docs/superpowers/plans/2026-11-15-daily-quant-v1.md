# Daily Quant v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A local web app serving three verified problems a day (olympiad, probability, mental math) with hints, solutions, answer checking, streak, history, mistakes and markdown export.

**Architecture:** Static site, no build. Pure ES modules (`checker`, `store`, `export`) hold all logic and are tested under Node; `ui.js` renders three hash-routed screens. Problems live in `data/problems.json`; Python scripts in `verify/` recompute every answer and gate the bank.

**Tech Stack:** HTML, CSS, vanilla JS (ES modules), KaTeX 0.16.9 (cdnjs), Geist fonts (Google Fonts), Node 24 `node:test` for JS tests, Python 3.14 (+ `fractions`, `itertools`, `random`) for verification.

**Spec:** `docs/superpowers/specs/2026-11-15-daily-quant-design.md`

## Global Constraints
- Runs with `python -m http.server` from the project root; no npm, no build, no server code.
- Progress only in localStorage key `dailyquant.v1`.
- The app serves only problems whose `verification.status` is `"verified"`.
- `verify/verify_all.py` must exit 0 before any commit that touches `data/problems.json`.
- Day n uses the n-th olympiad, n-th probability, n-th mental problem (order in the JSON). 30 of each.
- Numeric answers: two tries. Solution unlocks only after a submitted answer or "I've attempted it".
- Visual: dark, Geist / Geist Mono, FourCondition navy / cream / coral tokens; no purple, no gradients-as-decoration.

## Review Focus
1. Unparseable input ("abc", "", "3/0") must not use up a try: `checkAnswer` returns `null`. Test in Task 1.
2. Opening the app twice on the same date must not assign a second set; skipping dates must not skip sets. Test in Task 2.
3. Streak across a gap, and with today still unfinished, must follow the spec (today unfinished keeps yesterday's streak). Test in Task 2.
4. Bank exhausted (day 31) must show a "bank used up" state, not crash. Test in Task 2 (`ensureDay` returns `set: null`).
5. localStorage unavailable or corrupt JSON must fall back to an empty state, not a blank page. Test in Task 2 (`parseState`).

---

### Task 1: Scaffold, CLAUDE.md, answer checker

**Files:** Create `CLAUDE.md`, `.gitignore`, `src/checker.js`, `tests/checker.test.mjs`

**Interfaces:**
- Produces: `parseRational(str) -> {n: bigint, d: bigint} | null` (reduced, d > 0; accepts integers, `a/b`, terminating decimals, leading sign, surrounding spaces); `checkAnswer(answer, input) -> true | false | null` where `answer` is `{type:"exact", value:string}` or `{type:"approx", value:number, tolerance:number}`; `null` means unparseable.

- [ ] Step 1: tests: `parseRational("0.375")` equals `parseRational("3/8")`; `"-6/4"` → `{n:-3n,d:2n}`; `"3/0"`, `"abc"`, `""`, `"1/2/3"` → null. `checkAnswer({type:"exact",value:"3/8"},"0.375") === true`; `(...,"0.333")` vs `"1/3"` → false; `(...,"x")` → null; approx `{value:4800,tolerance:0.1}`: `"5200"` true, `"5400"` false, `"5e3"` true, `""` null.
- [ ] Step 2: `node --test tests/` → fails (module missing).
- [ ] Step 3: implement with BigInt; decimals → `digits / 10^k`; approx uses `Number()` and `Math.abs(x-v) <= tolerance*Math.abs(v)`.
- [ ] Step 4: `node --test tests/` → pass.
- [ ] Step 5: CLAUDE.md (what, structure, run, verify rule, scope rule), commit.

### Task 2: Store: state, day assignment, streak, mistakes

**Files:** Create `src/store.js`, `tests/store.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `dateKey(date: Date) -> "YYYY-MM-DD"` (local time)
  - `emptyState() -> {version:1, days:{}, redo:{}}`
  - `parseState(raw: string|null) -> state` (bad/missing → `emptyState()`)
  - `ensureDay(state, key, totalSets) -> {state, set: number|null}`; set index = number of days already assigned; `null` when `>= totalSets`. Same key twice → same set.
  - `setsForDay(problems) -> Array<[olympiad, probability, mental]>` (verified only, grouped by index)
  - `FINAL = ["solved","solved_hint","partial","missed"]`; `isDayComplete(day) -> bool` (3 results with a FINAL status)
  - `streak(state, todayKey) -> number`
  - `mistakes(state, problemsById) -> Array<{problem, date, status}>` (status partial/missed, excluding ids with `redo[id].status === "solved"`), newest first
  - `load() / save(state)` wrap localStorage in try/catch.

- [ ] Step 1: tests: ensureDay same key twice → same set; keys "2026-11-15" then "2026-11-18" → sets 0, 1; 2 sets total → third day null. Streak: complete 13,14,15 with today 15 → 3; today 16 unfinished → 3; today 17 → 0; gap at 14 → 1. `parseState("{bad")` → emptyState. mistakes excludes redo-solved.
- [ ] Step 2: run → fail. Step 3: implement. Step 4: run → pass. Step 5: commit.

### Task 3: Markdown export

**Files:** Create `src/export.js`, `tests/export.test.mjs`

**Interfaces:**
- Consumes: `FINAL` statuses from Task 2.
- Produces: `toMarkdown({date, dayNumber, items: [{problem, result}]}) -> string`.

Output: frontmatter `title: Daily Quant - 15 Nov 2026`, `date`, `tags: [daily-quant, log]`; `# Daily Quant - Day N (15 Nov 2026)`; `## Stats` table `| Problem | Result | Help needed | Notes |` (Problem = category · topic + first sentence of the statement; Result ✅ solved / 🟡 partial / ❌ missed / ⏳ not done, plus the answer for numeric problems; Help needed = None / Hint / Solution; Notes = source); then `**Solved: x/3. Solved alone: y.**`. Pipes in text escaped.

- [ ] Steps: test (contains title, table header, "Solved: 2/3. Solved alone: 1." for a fixture), fail, implement, pass, commit.

### Task 4: Problem bank and verification

**Files:** Create `data/problems.json`, `verify/olympiad.py`, `verify/probability.py`, `verify/mental.py`, `verify/verify_all.py`

**Interfaces:**
- Produces: `problems.json` = array of `{id, category, topic, difficulty, statement, hint, answer, solution, source, verification:{status, method, script}}`. ids `oly-01..30`, `prob-01..30`, `mm-01..30`.
- Each verify module exports `CHECKS: dict[id, callable]` returning a `Fraction`/int (exact), float (approx), or `bool` (proof claim holds over tested range). Probability checks also run a Monte Carlo and assert it lies within 0.01 of the exact value.
- `verify_all.py` loads the JSON, asserts schema (required fields, categories, 30 per category, unique ids), runs every check, compares with `answer` (exact: equal Fraction; approx: computed true value within the problem's tolerance of `value`... and `value` within tolerance of truth; proof: check returns True), prints one line per problem, exits 1 on any mismatch or missing check.

- [ ] Step 1: write verify scripts and verify_all with a 1-problem fixture → run, see failure for missing problems.
- [ ] Step 2: write problems in batches of 30 per category, running `python verify/verify_all.py` after each batch; fix the problem (never the check) on mismatch, after re-deriving by hand.
- [ ] Step 3: `python verify/verify_all.py` → `90/90 verified`, exit 0. Commit.

### Task 5: UI

**Files:** Create `index.html`, `styles.css`, `src/ui.js`, `src/main.js`

**Interfaces:**
- Consumes: all of Tasks 1-3; fetches `data/problems.json`.
- Routes: `#/` Today, `#/history`, `#/mistakes`, `#/redo/<id>`.

Behaviour per spec "Behaviour". Use the ui-ux-pro-max skill for tokens and layout. Problem card: meta line (category · topic · difficulty, source right-aligned), KaTeX-rendered statement, input + Check (numeric) or "I've attempted it" (proof), Hint toggle, Solution (locked until tried), result chip. Header: name, streak, nav. Footer of Today: Copy markdown / Download .md.

- [ ] Step 1: build, serve, open in a headless browser; walk a full day (wrong, right, hint, proof self-mark), confirm streak and history update, mistakes list and redo, export text.
- [ ] Step 2: check 375px width, keyboard (Enter submits), focus states. Commit.

### Task 6: Verification before completion
- [ ] `node --test tests/` all pass; `python verify/verify_all.py` exit 0; browser walk-through repeated from a cleared state; report how to run and anything unverified.
