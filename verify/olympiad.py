"""Independent checks for the olympiad problems.

Each check recomputes the answer from scratch (brute force where possible).
Exact answers return int/Fraction (or a float when the computation is geometric).
Proof problems return True if the claim holds on every case tested.
"""
import itertools
import math
import random
from fractions import Fraction


def shoelace(pts):
    return abs(sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]))) / 2


def oly_01():  # last two digits of 7^2026
    return (7 ** 2026) % 100


def oly_02():  # 4-digit numbers with strictly increasing digits
    return sum(1 for n in range(1000, 10000) if all(a < b for a, b in zip(str(n), str(n)[1:])))


def oly_03():  # x + 1/x = 3 -> x^4 + 1/x^4
    x = (3 + math.sqrt(5)) / 2
    assert abs(x + 1 / x - 3) < 1e-12
    return x ** 4 + x ** -4


def oly_04():  # inradius of the 20-21-29 right triangle, via coordinates
    A, B, C = (0, 0), (20, 0), (0, 21)
    a, b, c = math.dist(B, C), math.dist(A, C), math.dist(A, B)
    assert abs(a - 29) < 1e-12
    return shoelace([A, B, C]) / ((a + b + c) / 2)


def oly_05():  # 30 | n^5 - n
    return all((n ** 5 - n) % 30 == 0 for n in range(-5000, 5001))


def oly_06():  # trailing zeros of 2026!
    n, z = math.factorial(2026), 0
    while n % 10 == 0:
        n //= 10; z += 1
    return z


def oly_07():  # a+b=5, ab=3 -> a^3+b^3
    d = math.sqrt(25 - 12)
    a, b = (5 + d) / 2, (5 - d) / 2
    return a ** 3 + b ** 3


def oly_08():  # square side 6, E midpoint of BC, F = AE ∩ BD, area BEF
    A, B, C, D = (0, 0), (6, 0), (6, 6), (0, 6)
    E = (6, 3)
    # intersect A + t(E-A) with B + s(D-B) by solving 2x2 system
    (x1, y1), (x2, y2) = E, (D[0] - B[0], D[1] - B[1])
    det = x1 * (-y2) - (-x2) * y1
    t = ((B[0]) * (-y2) - (-x2) * (B[1])) / det
    F = (t * x1, t * y1)
    return shoelace([B, E, F])


def oly_09():  # subsets of {1..10} with no two consecutive
    return sum(1 for m in range(1 << 10) if m & (m >> 1) == 0)


def oly_10():  # n ≡ 2 (3), 3 (5), 2 (7)
    return next(n for n in itertools.count(1) if n % 3 == 2 and n % 5 == 3 and n % 7 == 2)


def oly_11():  # sum of real solutions of |x-1| + |x-3| = 6; scan a fine rational grid
    sols = [Fraction(k, 100) for k in range(-10000, 10001) if abs(Fraction(k, 100) - 1) + abs(Fraction(k, 100) - 3) == 6]
    assert len(sols) == 2
    return sum(sols)


def oly_12():  # 13-14-15 triangle, altitude to side 14
    s = Fraction(13 + 14 + 15, 2)
    area2 = s * (s - 13) * (s - 14) * (s - 15)
    area = math.isqrt(int(area2))
    assert area * area == area2
    return Fraction(2 * area, 14)


def oly_13():  # any 5 lattice points: two have a lattice midpoint (check all parity patterns)
    classes = [(0, 0), (0, 1), (1, 0), (1, 1)]
    return all(len(set(p)) < 5 for p in itertools.product(classes, repeat=5))


def oly_14():
    return sum(Fraction(1, k * (k + 1)) for k in range(1, 100))


def oly_15():  # divisors of 10!
    n = math.factorial(10)
    return sum(1 for d in range(1, n + 1) if n % d == 0)


def oly_16():  # domino tilings of 2x10 by explicit search over cells
    W = 10

    def count(filled):
        free = next(((r, c) for c in range(W) for r in range(2) if (r, c) not in filled), None)
        if free is None:
            return 1
        r, c = free
        total = 0
        for cell in ((r + 1, c), (r, c + 1)):
            if cell[0] < 2 and cell[1] < W and cell not in filled:
                total += count(filled | {free, cell})
        return total
    return count(frozenset())


def oly_17():  # common external tangent of circles r=5, r=3, centres 10 apart: squared length
    # line n·p = 5 (unit normal n) is tangent to circle 1; tangent to circle 2 on the same side needs n·(10,0) - 5 = -3
    th = math.acos(0.2)
    n = (math.cos(th), math.sin(th))
    P1, P2 = (5 * n[0], 5 * n[1]), (10 + 3 * n[0], 3 * n[1])
    assert abs(n[0] * P2[0] + n[1] * P2[1] - 5) < 1e-12  # P2 lies on the same line
    return math.dist(P1, P2) ** 2


def oly_18():  # IMO 1959 P1: gcd(21n+4, 14n+3) = 1
    return all(math.gcd(21 * n + 4, 14 * n + 3) == 1 for n in range(1, 200001))


def oly_19():  # min x^2 + y^2 on x + 2y = 10, exact scan over rationals near the optimum
    best = min((Fraction(10) - 2 * y) ** 2 + y ** 2 for y in (Fraction(k, 1000) for k in range(-10000, 10001)))
    return best


def oly_20():  # lattice paths (0,0)->(6,4) avoiding (3,2), by enumeration
    total = 0
    for ups in itertools.combinations(range(10), 4):
        x = y = 0
        ok = True
        for step in range(10):
            if step in ups:
                y += 1
            else:
                x += 1
            if (x, y) == (3, 2):
                ok = False
                break
        total += ok
    return total


def oly_21():  # regular hexagon: area(ACE) / area(hexagon)
    P = [(math.cos(k * math.pi / 3), math.sin(k * math.pi / 3)) for k in range(6)]
    return shoelace([P[0], P[2], P[4]]) / shoelace(P)


def oly_22():
    return pow(2, 100, 7)


def oly_23():  # a^2+b^2+c^2 >= ab+bc+ca, random and integer tests
    rnd = random.Random(1)
    ok = all(a * a + b * b + c * c >= a * b + b * c + c * a
             for a, b, c in itertools.product(range(-15, 16), repeat=3))
    return ok and all(
        (lambda a, b, c: a * a + b * b + c * c - (a * b + b * c + c * a) >= -1e-9)(*(rnd.uniform(-100, 100) for _ in range(3)))
        for _ in range(100000))


def oly_24():  # 10 identical sweets, 4 boxes, each at least one
    return sum(1 for t in itertools.product(range(1, 11), repeat=4) if sum(t) == 10)


def oly_25():  # British flag: PA=3, PB=4, PC=5 -> PD^2, with an explicit rectangle
    y1 = 1.0
    x1 = math.sqrt(9 - y1 ** 2)
    x2 = math.sqrt(16 - y1 ** 2)
    y2 = math.sqrt(25 - x2 ** 2)
    P, A, B, C, D = (0, 0), (-x1, -y1), (x2, -y1), (x2, y2), (-x1, y2)
    assert abs(math.dist(P, A) - 3) < 1e-12 and abs(math.dist(P, B) - 4) < 1e-12 and abs(math.dist(P, C) - 5) < 1e-12
    return math.dist(P, D) ** 2


def oly_26():  # no n ≡ 7 (mod 8) is a sum of three squares
    sums = {a * a + b * b + c * c for a in range(60) for b in range(60) for c in range(60)}
    return all(n not in sums for n in range(7, 3000, 8))


def oly_27():  # AIME 1999 P3
    return sum(n for n in range(1, 10000) if (v := n * n - 19 * n + 99) >= 0 and math.isqrt(v) ** 2 == v)


def oly_28():  # interior intersection points of diagonals of a convex 10-gon (random, general position)
    rnd = random.Random(7)
    angles = sorted(rnd.uniform(0, 2 * math.pi) for _ in range(10))
    P = [(math.cos(a), math.sin(a)) for a in angles]

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    diags = [(i, j) for i in range(10) for j in range(i + 2, 10) if not (i == 0 and j == 9)]
    pts = set()
    for (a, b), (c, d) in itertools.combinations(diags, 2):
        if len({a, b, c, d}) < 4:
            continue
        p1, p2, p3, p4 = P[a], P[b], P[c], P[d]
        if cross(p1, p2, p3) * cross(p1, p2, p4) < 0 and cross(p3, p4, p1) * cross(p3, p4, p2) < 0:
            # intersection point, rounded, to detect accidental concurrency
            den = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0])
            t = ((p1[0] - p3[0]) * (p3[1] - p4[1]) - (p1[1] - p3[1]) * (p3[0] - p4[0])) / den
            pts.add((round(p1[0] + t * (p2[0] - p1[0]), 9), round(p1[1] + t * (p2[1] - p1[1]), 9)))
    return len(pts)


def oly_29():
    return sum(1 for n in range(1, 1001) if (n % 3 == 0 or n % 5 == 0) and n % 15 != 0)


def oly_30():  # any 7 integers: two with sum or difference divisible by 10 (all residue multisets)
    def good(rs):
        return any((a + b) % 10 == 0 or (a - b) % 10 == 0 for a, b in itertools.combinations(rs, 2))
    return all(good(rs) for rs in itertools.combinations_with_replacement(range(10), 7))


CHECKS = {f"oly-{i:02d}": globals()[f"oly_{i:02d}"] for i in range(1, 31)}
