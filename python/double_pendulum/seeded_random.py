"""Deterministic, seedable PRNG (mulberry32).

This is a bit-exact port of the JavaScript ``mulberry32`` used on the live site.
JavaScript performs all bitwise work on 32-bit integers with *unsigned* right
shifts (``>>>``); replicating that here means masking every intermediate to 32
bits.  Because the original code never uses an arithmetic (sign-propagating)
shift, keeping every value as an unsigned 32-bit integer reproduces the exact
same bit patterns — and therefore the exact same random sequence — as the
browser.  This bit-for-bit match is what lets the random-forcing scenarios be
compared against the JS implementation in the parity harness.
"""

from __future__ import annotations

from typing import Callable

_U32 = 0xFFFFFFFF


def _imul(a: int, b: int) -> int:
    """Equivalent of JavaScript ``Math.imul``: low 32 bits of the product.

    The low 32 bits are independent of how the operands are interpreted as
    signed or unsigned, so masking the operands and the result to 32 bits
    reproduces ``Math.imul`` exactly.
    """

    return ((a & _U32) * (b & _U32)) & _U32


def mulberry32(seed: int) -> Callable[[], float]:
    """Return a function producing reproducible floats in ``[0, 1)``.

    Mirrors the JS generator step-for-step; the returned closure holds the
    32-bit state ``a`` just like the JavaScript version.
    """

    a = seed & _U32  # a >>> 0

    def _next() -> float:
        nonlocal a
        a &= _U32                       # a |= 0  (kept unsigned here)
        a = (a + 0x6D2B79F5) & _U32     # a = (a + 0x6d2b79f5) | 0
        t = _imul(a ^ (a >> 15), 1 | a)
        t = ((t + _imul(t ^ (t >> 7), 61 | t)) ^ t) & _U32
        return ((t ^ (t >> 14)) & _U32) / 4294967296

    return _next


__all__ = ["mulberry32"]
