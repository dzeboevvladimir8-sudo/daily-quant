"""Gate for data/problems.json: schema checks, then every answer recomputed by its check.

Run from anywhere:  python verify/verify_all.py
Exit code 0 only if every problem marked "verified" matches its check.
"""
import json
import sys
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import mental, olympiad, probability  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
CHECKS = {**olympiad.CHECKS, **probability.CHECKS, **mental.CHECKS}
REQUIRED = ["id", "category", "topic", "difficulty", "statement", "hint", "answer", "solution", "source", "verification"]
CATS = {"olympiad": "oly", "probability": "prob", "mental": "mm"}


def fail(msg):
    print("FAIL", msg)
    return 1


def main():
    problems = json.loads((ROOT / "data" / "problems.json").read_text(encoding="utf-8"))
    errors = 0
    ids = [p.get("id") for p in problems]
    if len(ids) != len(set(ids)):
        errors += fail("duplicate ids")
    for cat, prefix in CATS.items():
        n = sum(p.get("category") == cat for p in problems)
        if n != 30:
            errors += fail(f"{cat}: {n} problems, expected 30")

    verified = 0
    for p in problems:
        pid = p.get("id", "?")
        missing = [k for k in REQUIRED if k not in p]
        if missing:
            errors += fail(f"{pid}: missing {missing}"); continue
        if not pid.startswith(CATS.get(p["category"], "?") + "-"):
            errors += fail(f"{pid}: id does not match category {p['category']}")
        if p["difficulty"] not in ("easy", "medium"):
            errors += fail(f"{pid}: difficulty {p['difficulty']}")
        # JSON escapes like \t, \f, \b, \n, \r inside LaTeX mean a single backslash slipped through (\times, \frac ...)
        for k in ("statement", "hint", "solution"):
            if any(c in p[k] for c in "\t\f\b\r"):
                errors += fail(f"{pid}: control character in {k} (single backslash in LaTeX?)")
        if p["verification"].get("status") != "verified":
            print("SKIP", pid, "unverified: not served"); continue

        a = p["answer"]
        try:
            got = CHECKS[pid]()
        except KeyError:
            errors += fail(f"{pid}: no check"); continue
        except AssertionError as e:
            errors += fail(f"{pid}: check assertion: {e}"); continue

        if a["type"] == "exact":
            want = Fraction(a["value"])
            ok = got == want if not isinstance(got, float) else abs(got - float(want)) < 1e-9
            if not ok:
                errors += fail(f"{pid}: answer {a['value']} but check gives {got}"); continue
        elif a["type"] == "approx":
            tol = a["tolerance"]
            if not (0 < tol <= 0.1):
                errors += fail(f"{pid}: tolerance {tol} outside (0, 0.1]")
            if abs(a["value"] - got) > 1e-3 * abs(got):
                errors += fail(f"{pid}: stored value {a['value']} vs true {got}"); continue
        elif a["type"] == "proof":
            if got is not True:
                errors += fail(f"{pid}: claim check returned {got}"); continue
        else:
            errors += fail(f"{pid}: unknown answer type {a['type']}"); continue
        verified += 1
        print("ok  ", pid, a.get("value", "proof claim"))

    extra = set(CHECKS) - set(ids)
    if extra:
        errors += fail(f"checks with no problem: {sorted(extra)}")
    print(f"\n{verified}/{len(problems)} verified, {errors} errors")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
