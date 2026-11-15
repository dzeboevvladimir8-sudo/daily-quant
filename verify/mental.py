"""Independent checks for the mental-math problems.

Exact problems return int/Fraction. Estimation problems return the true value as a float;
verify_all checks the stored value matches it and the tolerance is sensible.
"""
import math
from fractions import Fraction as F

CHECKS = {
    "mm-01": lambda: 47 * 53,
    "mm-02": lambda: F(15, 100) * 360,
    "mm-03": lambda: 99 ** 2,
    "mm-04": lambda: 365 * 24 * 60 * 60,
    "mm-05": lambda: 125 * 48,
    "mm-06": lambda: F(3, 7) + F(2, 5),
    "mm-07": lambda: math.sqrt(50),
    "mm-08": lambda: 68 * 72,
    "mm-09": lambda: F("0.35") * F("0.4"),
    "mm-10": lambda: 7346 * 11,
    "mm-11": lambda: math.log(2) / math.log(1.07),
    "mm-12": lambda: 25 ** 2 + 35 ** 2,
    "mm-13": lambda: F(84) / F("0.07"),
    "mm-14": lambda: math.exp(3),
    "mm-15": lambda: 999 * 999,
    "mm-16": lambda: sum(range(1, 100, 2)),
    "mm-17": lambda: 1.1 ** 5,
    "mm-18": lambda: 2 ** 10 * 5 ** 7,
    "mm-19": lambda: F(72 * 1000, 3600),
    "mm-20": lambda: math.sqrt(2) * math.sqrt(3),
    "mm-21": lambda: 13 * 17,
    "mm-22": lambda: round(64 ** (2 / 3)),
    "mm-23": lambda: 1000 / 7,
    "mm-24": lambda: 17 ** 3,
    "mm-25": lambda: F(1, 16),
    "mm-26": lambda: 3.9 * 4.1 * 5.2,
    "mm-27": lambda: 45 ** 2,
    "mm-28": lambda: float(2 ** 30),
    "mm-29": lambda: 1.05 ** 10,
    "mm-30": lambda: math.log10(2026),
}
