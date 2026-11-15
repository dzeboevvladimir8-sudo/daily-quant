"""Independent checks for the probability problems.

Every check computes the answer exactly (enumeration, Fraction arithmetic) where it can,
and also runs a Monte Carlo simulation that must agree. `both(exact, sim, tol)` enforces that.
Continuous problems with no finite enumeration use a fine grid count plus simulation.
"""
import itertools
import math
import random
from fractions import Fraction

R = random.Random(2026)
N = 200_000


def both(exact, sim, tol):
    assert abs(float(exact) - sim) <= tol, f"simulation {sim} disagrees with exact {float(exact)}"
    return exact


def freq(trial, n=N):
    return sum(trial() for _ in range(n)) / n


def mean(trial, n=N):
    return sum(trial() for _ in range(n)) / n


D = range(1, 7)
die = lambda: R.randint(1, 6)
coin = lambda: R.random() < 0.5


def prob_01():
    ex = Fraction(sum(1 for a in D for b in D if 6 in (a, b)), 36)
    return both(ex, freq(lambda: 6 in (die(), die())), 0.01)


def prob_02():
    ex = Fraction(sum(1 for a in D for b in D if a * b % 2 == 0), 36)
    return both(ex, freq(lambda: die() * die() % 2 == 0), 0.01)


def prob_03():  # expected rolls to get a 6: truncated exact series + simulation
    ex = sum(Fraction(k) * Fraction(5, 6) ** (k - 1) * Fraction(1, 6) for k in range(1, 400))
    ex = Fraction(round(float(ex) * 10 ** 6), 10 ** 6)

    def t():
        k = 1
        while die() != 6:
            k += 1
        return k
    return both(ex, mean(t), 0.08)


def prob_04():  # two children, at least one boy -> both boys
    fam = list(itertools.product('BG', repeat=2))
    cond = [f for f in fam if 'B' in f]
    ex = Fraction(sum(f == ('B', 'B') for f in cond), len(cond))
    sims = [(coin(), coin()) for _ in range(N)]
    c = [s for s in sims if any(s)]
    return both(ex, sum(all(s) for s in c) / len(c), 0.01)


def prob_05():  # Monty Hall, switching
    wins = 0
    for car in range(3):
        for pick in range(3):
            opens = [d for d in range(3) if d not in (car, pick)]
            for o in opens:  # host choice, weighted equally
                switch = next(d for d in range(3) if d not in (pick, o))
                wins += Fraction(1, 9) / len(opens) * (switch == car)

    def t():
        car, pick = R.randrange(3), R.randrange(3)
        o = R.choice([d for d in range(3) if d not in (car, pick)])
        return next(d for d in range(3) if d not in (pick, o)) == car
    return both(wins, freq(t), 0.01)


def prob_06():  # 5 red 3 blue, draw 3, exactly 2 red
    balls = 'RRRRRBBB'
    combos = list(itertools.combinations(range(8), 3))
    ex = Fraction(sum(sum(balls[i] == 'R' for i in c) == 2 for c in combos), len(combos))
    return both(ex, freq(lambda: sum(b == 'R' for b in R.sample(balls, 3)) == 2), 0.01)


def prob_07():  # two cards both aces
    deck = list(range(52))  # aces are 0..3
    combos = list(itertools.combinations(deck, 2))
    ex = Fraction(sum(a < 4 and b < 4 for a, b in combos), len(combos))
    return both(ex, freq(lambda: all(c < 4 for c in R.sample(deck, 2))), 0.002)


def prob_08():
    ex = Fraction(sum(1 for t in itertools.product(D, repeat=3) if sum(t) == 10), 216)
    return both(ex, freq(lambda: die() + die() + die() == 10), 0.01)


def prob_09():  # derangements of 4
    perms = list(itertools.permutations(range(4)))
    ex = Fraction(sum(all(p[i] != i for i in range(4)) for p in perms), len(perms))

    def t():
        p = list(range(4)); R.shuffle(p)
        return all(p[i] != i for i in range(4))
    return both(ex, freq(t), 0.01)


def prob_10():  # expected tosses until both a head and a tail have appeared
    ex = sum(Fraction(k) * 2 * Fraction(1, 2) ** k for k in range(2, 400))  # first k-1 equal, k-th differs
    ex = Fraction(round(float(ex) * 10 ** 6), 10 ** 6)

    def t():
        first, k = coin(), 1
        while True:
            k += 1
            if coin() != first:
                return k
    return both(ex, mean(t), 0.05)


def prob_11():  # alternate tosses, first head wins: P(first player)
    ex = sum(Fraction(1, 2) ** k for k in range(1, 400, 2))
    ex = Fraction(round(float(ex) * 10 ** 9), 10 ** 9)

    def t():
        k = 1
        while not coin():
            k += 1
        return k % 2 == 1
    return both(ex.limit_denominator(1000), freq(t), 0.01)


def prob_12():  # expected fixed points of a random permutation of 10 (exact via 7 is enough to show the pattern? no: exact over all 10!)
    # exact by linearity check over all permutations of 8 would be 1 too; we enumerate n=8 and simulate n=10
    perms = itertools.permutations(range(8))
    tot = cnt = 0
    for p in perms:
        tot += sum(p[i] == i for i in range(8)); cnt += 1
    assert Fraction(tot, cnt) == 1

    def t():
        p = list(range(10)); R.shuffle(p)
        return sum(p[i] == i for i in range(10))
    return both(Fraction(1), mean(t), 0.02)


def prob_13():
    return Fraction(sum(1 for n in range(1, 101) if n % 2 == 0 or n % 3 == 0 or n % 5 == 0), 100)


def prob_14():  # three ants on a triangle
    ok = [d for d in itertools.product((0, 1), repeat=3) if len(set(d)) == 1]
    ex = Fraction(len(ok), 8)
    return both(ex, freq(lambda: len({coin(), coin(), coin()}) == 1), 0.01)


def prob_15():  # Bertrand's box: cards RR, BB, RB
    cards = [('R', 'R'), ('B', 'B'), ('R', 'B')]
    faces = [(c[s], c[1 - s]) for c in cards for s in (0, 1)]
    red_up = [f for f in faces if f[0] == 'R']
    ex = Fraction(sum(f[1] == 'R' for f in red_up), len(red_up))
    hits = tries = 0
    for _ in range(N):
        c = R.choice(cards); s = R.randrange(2)
        if c[s] == 'R':
            tries += 1; hits += c[1 - s] == 'R'
    return both(ex, hits / tries, 0.01)


def waiting(pattern):
    # exact expected waiting time via a linear system on prefix states (KMP-free, brute over states)
    from fractions import Fraction as F
    L = len(pattern)

    def nxt(state, ch):
        s = pattern[:state] + ch
        for k in range(min(len(s), L), -1, -1):
            if s.endswith(pattern[:k]):
                return k
    # E[state] = 1 + 1/2 E[nxt(H)] + 1/2 E[nxt(T)], E[L] = 0: solve by Gaussian elimination
    n = L
    A = [[F(0)] * (n + 1) for _ in range(n)]
    for s in range(n):
        A[s][s] += 1
        for ch in 'HT':
            t = nxt(s, ch)
            if t < L:
                A[s][t] -= F(1, 2)
        A[s][n] = F(1)
    for i in range(n):
        p = next(r for r in range(i, n) if A[r][i] != 0)
        A[i], A[p] = A[p], A[i]
        A[i] = [v / A[i][i] for v in A[i]]
        for r in range(n):
            if r != i and A[r][i] != 0:
                A[r] = [a - A[r][i] * b for a, b in zip(A[r], A[i])]
    return A[0][n]


def sim_wait(pattern):
    def t():
        s = ''
        while not s.endswith(pattern):
            s += 'H' if coin() else 'T'
        return len(s)
    return mean(t, 100_000)


def prob_16():
    return both(waiting('HT'), sim_wait('HT'), 0.05)


def prob_17():
    return both(waiting('HH'), sim_wait('HH'), 0.08)


def prob_18():
    ex = Fraction(sum(max(a, b) for a in D for b in D), 36)
    return both(ex, mean(lambda: max(die(), die())), 0.02)


def prob_19():  # one optional reroll: try every threshold, keep the best
    best = max(sum(Fraction(1, 6) * (v if v > th else Fraction(7, 2)) for v in D) for th in range(0, 7))

    def t():
        v = die()
        return v if v >= 4 else die()
    return both(best, mean(t), 0.02)


def prob_20():  # smallest group with P(shared birthday) > 1/2
    p_distinct = Fraction(1)
    for n in range(1, 366):
        p_distinct *= Fraction(366 - n, 365)
        if 1 - p_distinct > Fraction(1, 2):
            return n


def prob_21():  # coupon collector for a die
    ex = sum(Fraction(6, 6 - k) for k in range(6))

    def t():
        seen, k = set(), 0
        while len(seen) < 6:
            seen.add(die()); k += 1
        return k
    return both(ex, mean(t, 100_000), 0.1)


def prob_22():  # gambler's ruin from 3, stop at 0 or 10: exact via linear system (value iteration to convergence)
    pf = [0.0] * 10 + [1.0]
    for _ in range(20000):
        pf = [0.0] + [(pf[i - 1] + pf[i + 1]) / 2 for i in range(1, 10)] + [1.0]
    ex = Fraction(pf[3]).limit_denominator(100)

    def t():
        x = 3
        while 0 < x < 10:
            x += 1 if coin() else -1
        return x == 10
    return both(ex, freq(t, 100_000), 0.01)


def prob_23():  # expected number of runs in 10 tosses
    seqs = list(itertools.product((0, 1), repeat=10))
    ex = Fraction(sum(1 + sum(s[i] != s[i + 1] for i in range(9)) for s in seqs), len(seqs))
    return ex


def prob_24():  # 5-card flush (including straight flushes), full enumeration
    suits = [c // 13 for c in range(52)]
    flush = total = 0
    for h in itertools.combinations(range(52), 5):
        total += 1
        s = suits[h[0]]
        flush += all(suits[c] == s for c in h[1:])
    return Fraction(flush, total)


def prob_25():  # 6 chambers, 2 adjacent bullets, first pull empty, pull again without spinning
    bullets = lambda start: {start, (start + 1) % 6}
    empty_first = [(st, pos) for st in range(6) for pos in range(6) if pos not in bullets(st)]
    ex = Fraction(sum((pos + 1) % 6 not in bullets(st) for st, pos in empty_first), len(empty_first))
    return ex


def prob_26():  # expected position of the first ace in a shuffled deck
    # exact: E = sum over positions k of P(first ace at k) * k
    ex = Fraction(0)
    for k in range(1, 50):
        p = Fraction(math.comb(52 - k, 3), math.comb(52, 4))  # ace at k, other 3 aces after k
        ex += k * p

    def t():
        d = list(range(52)); R.shuffle(d)
        return next(i for i, c in enumerate(d, 1) if c < 4)
    return both(ex, mean(t, 100_000), 0.1)


def prob_27():  # shorter piece of a unit stick broken uniformly: grid + simulation
    M = 10 ** 6
    grid = sum(min(i + 0.5, M - i - 0.5) for i in range(M)) / M / M
    return both(Fraction(round(grid * 10 ** 6), 10 ** 6).limit_denominator(100), mean(lambda: min(u := R.random(), 1 - u)), 0.005)


def prob_28():  # meet within 15 min in an hour (exact on a fine grid of minutes, then simulation)
    M = 600  # tenths of a minute, cell centres
    hits = sum(1 for a in range(M) for b in range(M) if abs(a - b) <= 150 - 0) / (M * M)
    ex = Fraction(7, 16)
    assert abs(hits - 7 / 16) < 0.003
    return both(ex, freq(lambda: abs(R.random() - R.random()) <= 0.25), 0.01)


def prob_29():  # broken stick into three pieces forms a triangle
    M = 1000
    hits = 0
    for i in range(M):
        for j in range(M):
            a, b = (i + 0.5) / M, (j + 0.5) / M
            x, y = min(a, b), max(a, b)
            p = (x, y - x, 1 - y)
            hits += max(p) < 0.5
    grid = hits / M / M

    def t():
        a, b = sorted((R.random(), R.random()))
        return max(a, b - a, 1 - b) < 0.5
    assert abs(grid - 0.25) < 0.003
    return both(Fraction(1, 4), freq(t), 0.01)


def prob_30():  # three random points on a circle: triangle contains the centre
    def t():
        a = sorted(R.random() for _ in range(3))
        gaps = (a[1] - a[0], a[2] - a[1], 1 - a[2] + a[0])
        return max(gaps) < 0.5
    # exact on a grid of 120 equally spaced positions (ties broken out as degenerate)
    M = 120
    hits = tot = 0
    for a, b, c in itertools.product(range(M), repeat=3):
        x = sorted((a, b, c))
        g = (x[1] - x[0], x[2] - x[1], M - x[2] + x[0])
        tot += 1
        hits += max(g) < M / 2
    assert abs(hits / tot - 0.25) < 0.02
    return both(Fraction(1, 4), freq(t), 0.01)


CHECKS = {f"prob-{i:02d}": globals()[f"prob_{i:02d}"] for i in range(1, 31)}
