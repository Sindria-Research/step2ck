"""
FSRS v4.5 — Free Spaced Repetition Scheduler.

Implements the DSR (Difficulty, Stability, Retrievability) memory model
with Anki-style learning/relearning steps for intra-session repetition.

Reference: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Optional

# Rating constants (Anki-style: 1-4)
AGAIN = 1
HARD = 2
GOOD = 3
EASY = 4
RATINGS = (AGAIN, HARD, GOOD, EASY)

# Card states
STATE_NEW = "new"
STATE_LEARNING = "learning"
STATE_REVIEW = "review"
STATE_RELEARNING = "relearning"

# Learning / relearning steps in minutes
LEARNING_STEPS = [1, 10]
RELEARNING_STEPS = [10]

# FSRS-4.5 default parameters (17 weights)
W = [
    0.4872, 1.4003, 3.7145, 13.8206,  # w0-w3: initial stability per rating
    5.1618,  # w4: initial difficulty for Again
    1.2298,  # w5: difficulty scaling for first rating
    0.8975,  # w6: difficulty delta per rating
    0.031,   # w7: mean-reversion weight
    1.6474,  # w8: stability increase base
    0.1367,  # w9: stability power factor
    1.0461,  # w10: retrievability weight
    2.1072,  # w11: post-lapse stability base
    0.0793,  # w12: post-lapse difficulty weight
    0.3246,  # w13: post-lapse stability power
    1.587,   # w14: post-lapse retrievability weight
    0.2272,  # w15: hard penalty
    2.8755,  # w16: easy bonus
]

DECAY = -0.5
FACTOR = 19.0 / 81.0

REQUEST_RETENTION = 0.9
MAX_INTERVAL = 3650


@dataclass
class CardState:
    stability: float
    difficulty: float
    interval_days: int
    repetitions: int
    lapses: int
    state: str
    next_review: Optional[datetime]
    last_review: Optional[datetime]
    learning_step: int = 0


@dataclass
class ReviewResult:
    stability: float
    difficulty: float
    interval_days: int
    repetitions: int
    lapses: int
    state: str
    next_review: datetime
    last_review: datetime
    learning_step: int = 0
    again_in_minutes: int = 0
    graduated: bool = False


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def _initial_stability(rating: int) -> float:
    """S_0(G) = w[G-1]"""
    return max(0.01, W[rating - 1])


def _initial_difficulty(rating: int) -> float:
    """D_0(G) = w4 - (G-3) * w5"""
    return _clamp(W[4] - (rating - 3) * W[5], 1.0, 10.0)


def _next_difficulty(d: float, rating: int) -> float:
    """D'(D,G) = w7 * D_0(3) + (1-w7) * (D - w6*(G-3))"""
    d_prime = d - W[6] * (rating - 3)
    d_new = W[7] * _initial_difficulty(GOOD) + (1 - W[7]) * d_prime
    return _clamp(d_new, 1.0, 10.0)


def retrievability(elapsed_days: float, stability: float) -> float:
    """R(t,S) = (1 + FACTOR * t/S)^DECAY"""
    if stability <= 0:
        return 0.0
    return (1 + FACTOR * elapsed_days / stability) ** DECAY


def _next_interval(stability: float, retention: float = REQUEST_RETENTION, max_ivl: int = MAX_INTERVAL) -> int:
    """I(r,S) = S/FACTOR * (r^(1/DECAY) - 1), clamped to [1, max_interval]"""
    interval = stability / FACTOR * (retention ** (1 / DECAY) - 1)
    return _clamp(round(interval), 1, max_ivl)


def _stability_after_recall(
    d: float, s: float, r: float, rating: int
) -> float:
    """
    S'_r(D,S,R,G) = S * (e^w8 * (11-D) * S^(-w9) * (e^(w10*(1-R))-1)
                      * w15(if G=2) * w16(if G=4) + 1)
    """
    hard_penalty = W[15] if rating == HARD else 1.0
    easy_bonus = W[16] if rating == EASY else 1.0
    sinc = (
        math.exp(W[8])
        * (11 - d)
        * s ** (-W[9])
        * (math.exp(W[10] * (1 - r)) - 1)
        * hard_penalty
        * easy_bonus
    )
    return max(0.01, s * (sinc + 1))


def _stability_after_forgetting(d: float, s: float, r: float) -> float:
    """S'_f(D,S,R) = w11 * D^(-w12) * ((S+1)^w13 - 1) * e^(w14*(1-R))"""
    return max(
        0.01,
        W[11]
        * d ** (-W[12])
        * ((s + 1) ** W[13] - 1)
        * math.exp(W[14] * (1 - r)),
    )


def _learning_step_minutes(step_index: int, steps: list[int]) -> int:
    """Get the delay in minutes for a given step index, clamping to the last step."""
    if not steps:
        return 0
    return steps[min(step_index, len(steps) - 1)]


def review(
    card: CardState,
    rating: int,
    now: Optional[datetime] = None,
    *,
    learning_steps: Optional[list[int]] = None,
    relearning_steps: Optional[list[int]] = None,
    desired_retention: Optional[float] = None,
    max_interval: Optional[int] = None,
) -> ReviewResult:
    """Process a review and return the new card state.

    Optional overrides allow per-user settings for learning steps,
    desired retention, and max interval to be applied.

    For learning/relearning cards, scheduling works via steps:
      - Again -> back to step 0
      - Hard -> repeat current step (average of Again and Good timing)
      - Good -> advance to next step; if past the last step, graduate
      - Easy -> immediately graduate

    For review cards, standard FSRS scheduling applies.
    """
    now = now or datetime.now(timezone.utc)
    rating = _clamp(rating, AGAIN, EASY)

    l_steps = learning_steps if learning_steps is not None else LEARNING_STEPS
    r_steps = relearning_steps if relearning_steps is not None else RELEARNING_STEPS
    retention = desired_retention if desired_retention is not None else REQUEST_RETENTION
    max_ivl = max_interval if max_interval is not None else MAX_INTERVAL

    def _ivl(s: float) -> int:
        return _next_interval(s, retention, max_ivl)

    # ── NEW cards or cards with no stability (first time ever) ──
    if card.state == STATE_NEW or card.stability <= 0:
        s = _initial_stability(rating)
        d = _initial_difficulty(rating)
        lapses = card.lapses + (1 if rating == AGAIN else 0)

        if rating == EASY:
            interval = _ivl(s)
            return ReviewResult(
                stability=s, difficulty=d, interval_days=interval,
                repetitions=card.repetitions + 1, lapses=lapses,
                state=STATE_REVIEW,
                next_review=now + timedelta(days=interval),
                last_review=now,
                learning_step=0, again_in_minutes=0, graduated=True,
            )

        if rating == GOOD:
            step = 1
            if step >= len(l_steps):
                interval = _ivl(s)
                return ReviewResult(
                    stability=s, difficulty=d, interval_days=interval,
                    repetitions=card.repetitions + 1, lapses=lapses,
                    state=STATE_REVIEW,
                    next_review=now + timedelta(days=interval),
                    last_review=now,
                    learning_step=0, again_in_minutes=0, graduated=True,
                )
            delay = _learning_step_minutes(step, l_steps)
            return ReviewResult(
                stability=s, difficulty=d, interval_days=0,
                repetitions=card.repetitions + 1, lapses=lapses,
                state=STATE_LEARNING,
                next_review=now + timedelta(minutes=delay),
                last_review=now,
                learning_step=step, again_in_minutes=delay, graduated=False,
            )

        # Again or Hard -> stay at step 0
        step = 0
        delay = _learning_step_minutes(step, l_steps)
        if rating == HARD and len(l_steps) >= 2:
            delay = (l_steps[0] + _learning_step_minutes(1, l_steps)) // 2
        return ReviewResult(
            stability=s, difficulty=d, interval_days=0,
            repetitions=card.repetitions + 1, lapses=lapses,
            state=STATE_LEARNING,
            next_review=now + timedelta(minutes=delay),
            last_review=now,
            learning_step=step, again_in_minutes=delay, graduated=False,
        )

    # ── LEARNING / RELEARNING cards (in-session steps) ──
    if card.state in (STATE_LEARNING, STATE_RELEARNING):
        steps = r_steps if card.state == STATE_RELEARNING else l_steps
        current_step = card.learning_step

        elapsed = 0.0
        if card.last_review:
            lr = card.last_review if card.last_review.tzinfo else card.last_review.replace(tzinfo=timezone.utc)
            elapsed = max(0, (now - lr).total_seconds() / 86400)
        r = retrievability(elapsed, card.stability) if card.stability > 0 else 0.0
        d = _next_difficulty(card.difficulty, rating) if card.difficulty > 0 else _initial_difficulty(rating)
        s = card.stability

        if rating == AGAIN:
            if s > 0 and r > 0:
                s = _stability_after_forgetting(card.difficulty, s, r)
            step = 0
            delay = _learning_step_minutes(step, steps)
            lapses = card.lapses + (1 if card.state == STATE_RELEARNING else 0)
            return ReviewResult(
                stability=s, difficulty=d, interval_days=0,
                repetitions=card.repetitions + 1, lapses=lapses,
                state=card.state,
                next_review=now + timedelta(minutes=delay),
                last_review=now,
                learning_step=step, again_in_minutes=delay, graduated=False,
            )

        if rating == HARD:
            step = current_step
            delay = _learning_step_minutes(step, steps)
            if len(steps) >= 2:
                delay = (steps[0] + _learning_step_minutes(min(current_step + 1, len(steps) - 1), steps)) // 2
            return ReviewResult(
                stability=s, difficulty=d, interval_days=0,
                repetitions=card.repetitions + 1, lapses=card.lapses,
                state=card.state,
                next_review=now + timedelta(minutes=delay),
                last_review=now,
                learning_step=step, again_in_minutes=delay, graduated=False,
            )

        if rating == EASY:
            if s > 0 and r > 0:
                s = _stability_after_recall(card.difficulty, s, r, EASY)
            else:
                s = _initial_stability(EASY)
            interval = _ivl(s)
            return ReviewResult(
                stability=s, difficulty=d, interval_days=interval,
                repetitions=card.repetitions + 1, lapses=card.lapses,
                state=STATE_REVIEW,
                next_review=now + timedelta(days=interval),
                last_review=now,
                learning_step=0, again_in_minutes=0, graduated=True,
            )

        # GOOD -> advance step
        next_step = current_step + 1
        if next_step >= len(steps):
            if s > 0 and r > 0:
                s = _stability_after_recall(card.difficulty, s, r, GOOD)
            else:
                s = _initial_stability(GOOD)
            interval = _ivl(s)
            return ReviewResult(
                stability=s, difficulty=d, interval_days=interval,
                repetitions=card.repetitions + 1, lapses=card.lapses,
                state=STATE_REVIEW,
                next_review=now + timedelta(days=interval),
                last_review=now,
                learning_step=0, again_in_minutes=0, graduated=True,
            )
        delay = _learning_step_minutes(next_step, steps)
        return ReviewResult(
            stability=s, difficulty=d, interval_days=0,
            repetitions=card.repetitions + 1, lapses=card.lapses,
            state=card.state,
            next_review=now + timedelta(minutes=delay),
            last_review=now,
            learning_step=next_step, again_in_minutes=delay, graduated=False,
        )

    # ── REVIEW cards ──
    elapsed = 0.0
    if card.last_review:
        lr = card.last_review if card.last_review.tzinfo else card.last_review.replace(tzinfo=timezone.utc)
        elapsed = max(0, (now - lr).total_seconds() / 86400)

    r = retrievability(elapsed, card.stability)
    d = _next_difficulty(card.difficulty, rating)

    if rating == AGAIN:
        s = _stability_after_forgetting(card.difficulty, card.stability, r)
        delay = _learning_step_minutes(0, r_steps)
        return ReviewResult(
            stability=s, difficulty=d, interval_days=0,
            repetitions=card.repetitions + 1, lapses=card.lapses + 1,
            state=STATE_RELEARNING,
            next_review=now + timedelta(minutes=delay) if delay > 0 else now + timedelta(days=1),
            last_review=now,
            learning_step=0, again_in_minutes=delay, graduated=False,
        )

    s = _stability_after_recall(card.difficulty, card.stability, r, rating)
    interval = _ivl(s)
    return ReviewResult(
        stability=s, difficulty=d, interval_days=interval,
        repetitions=card.repetitions + 1, lapses=card.lapses,
        state=STATE_REVIEW,
        next_review=now + timedelta(days=interval),
        last_review=now,
        learning_step=0, again_in_minutes=0, graduated=True,
    )


def preview_intervals(
    card: CardState,
    now: Optional[datetime] = None,
    *,
    learning_steps: Optional[list[int]] = None,
    relearning_steps: Optional[list[int]] = None,
    desired_retention: Optional[float] = None,
    max_interval: Optional[int] = None,
) -> dict[int, dict]:
    """Return projected scheduling for each rating.

    Returns {rating: {"days": int, "minutes": int, "graduated": bool}}.
    For learning/relearning cards, minutes > 0 means the card repeats in-session.
    For review cards, days > 0 means the card is scheduled for a future date.
    """
    result = {}
    for r in RATINGS:
        res = review(
            card, r, now,
            learning_steps=learning_steps,
            relearning_steps=relearning_steps,
            desired_retention=desired_retention,
            max_interval=max_interval,
        )
        if res.graduated:
            result[r] = {"days": res.interval_days, "minutes": 0, "graduated": True}
        else:
            result[r] = {"days": 0, "minutes": res.again_in_minutes, "graduated": False}
    return result
