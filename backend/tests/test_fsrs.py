"""Tests for the FSRS v4.5 spaced repetition algorithm."""
from datetime import datetime, timedelta, timezone

import pytest

from app.services.fsrs import (
    AGAIN,
    EASY,
    GOOD,
    HARD,
    LEARNING_STEPS,
    RELEARNING_STEPS,
    STATE_LEARNING,
    STATE_NEW,
    STATE_RELEARNING,
    STATE_REVIEW,
    CardState,
    ReviewResult,
    _clamp,
    _initial_difficulty,
    _initial_stability,
    _next_difficulty,
    _next_interval,
    preview_intervals,
    retrievability,
    review,
)

NOW = datetime(2026, 1, 15, 12, 0, 0, tzinfo=timezone.utc)


def _new_card(**overrides) -> CardState:
    defaults = dict(
        stability=0.0,
        difficulty=0.0,
        interval_days=0,
        repetitions=0,
        lapses=0,
        state=STATE_NEW,
        next_review=None,
        last_review=None,
        learning_step=0,
    )
    defaults.update(overrides)
    return CardState(**defaults)


# ── Helper function tests ──


class TestHelpers:
    def test_clamp_within_range(self):
        assert _clamp(5.0, 1.0, 10.0) == 5.0

    def test_clamp_below_min(self):
        assert _clamp(-1.0, 0.0, 10.0) == 0.0

    def test_clamp_above_max(self):
        assert _clamp(15.0, 0.0, 10.0) == 10.0

    def test_initial_stability_per_rating(self):
        s1 = _initial_stability(AGAIN)
        s4 = _initial_stability(EASY)
        assert s1 > 0
        assert s4 > s1

    def test_initial_difficulty_decreases_with_rating(self):
        d1 = _initial_difficulty(AGAIN)
        d4 = _initial_difficulty(EASY)
        assert d1 > d4

    def test_initial_difficulty_clamped(self):
        d = _initial_difficulty(AGAIN)
        assert 1.0 <= d <= 10.0
        d = _initial_difficulty(EASY)
        assert 1.0 <= d <= 10.0

    def test_next_difficulty_decreases_on_easy(self):
        d = 5.0
        d_new = _next_difficulty(d, EASY)
        assert d_new < d

    def test_next_difficulty_increases_on_again(self):
        d = 5.0
        d_new = _next_difficulty(d, AGAIN)
        assert d_new > d

    def test_retrievability_at_zero_elapsed(self):
        r = retrievability(0.0, 10.0)
        assert r == pytest.approx(1.0, abs=0.01)

    def test_retrievability_decreases_over_time(self):
        r1 = retrievability(1.0, 10.0)
        r30 = retrievability(30.0, 10.0)
        assert r1 > r30

    def test_retrievability_zero_stability(self):
        assert retrievability(5.0, 0.0) == 0.0

    def test_next_interval_positive(self):
        interval = _next_interval(10.0)
        assert interval >= 1

    def test_next_interval_increases_with_stability(self):
        i1 = _next_interval(1.0)
        i10 = _next_interval(10.0)
        i100 = _next_interval(100.0)
        assert i1 <= i10 <= i100


# ── New card review tests ──


class TestNewCardReview:
    def test_again_stays_in_learning(self):
        card = _new_card()
        result = review(card, AGAIN, NOW)
        assert result.state == STATE_LEARNING
        assert result.graduated is False
        assert result.learning_step == 0
        assert result.again_in_minutes == LEARNING_STEPS[0]
        assert result.interval_days == 0
        assert result.lapses == 1

    def test_hard_stays_in_learning(self):
        card = _new_card()
        result = review(card, HARD, NOW)
        assert result.state == STATE_LEARNING
        assert result.graduated is False
        assert result.learning_step == 0

    def test_hard_average_timing(self):
        card = _new_card()
        result = review(card, HARD, NOW)
        expected = (LEARNING_STEPS[0] + LEARNING_STEPS[1]) // 2
        assert result.again_in_minutes == expected

    def test_good_advances_to_step_1(self):
        card = _new_card()
        result = review(card, GOOD, NOW)
        assert result.state == STATE_LEARNING
        assert result.graduated is False
        assert result.learning_step == 1
        assert result.again_in_minutes == LEARNING_STEPS[1]

    def test_easy_immediately_graduates(self):
        card = _new_card()
        result = review(card, EASY, NOW)
        assert result.state == STATE_REVIEW
        assert result.graduated is True
        assert result.interval_days > 0
        assert result.again_in_minutes == 0

    def test_stability_set_on_first_review(self):
        card = _new_card()
        result = review(card, GOOD, NOW)
        assert result.stability > 0

    def test_difficulty_set_on_first_review(self):
        card = _new_card()
        result = review(card, GOOD, NOW)
        assert 1.0 <= result.difficulty <= 10.0

    def test_repetitions_increment(self):
        card = _new_card()
        result = review(card, GOOD, NOW)
        assert result.repetitions == 1

    def test_last_review_set(self):
        card = _new_card()
        result = review(card, GOOD, NOW)
        assert result.last_review == NOW

    def test_next_review_set_for_learning(self):
        card = _new_card()
        result = review(card, GOOD, NOW)
        expected = NOW + timedelta(minutes=LEARNING_STEPS[1])
        assert result.next_review == expected


# ── Learning card review tests ──


class TestLearningCardReview:
    def _learning_card(self, step=0, **overrides):
        defaults = dict(
            stability=3.7,
            difficulty=5.16,
            interval_days=0,
            repetitions=1,
            lapses=0,
            state=STATE_LEARNING,
            next_review=NOW + timedelta(minutes=10),
            last_review=NOW,
            learning_step=step,
        )
        defaults.update(overrides)
        return CardState(**defaults)

    def test_again_resets_to_step_0(self):
        card = self._learning_card(step=1)
        result = review(card, AGAIN, NOW + timedelta(minutes=10))
        assert result.learning_step == 0
        assert result.state == STATE_LEARNING
        assert result.graduated is False
        assert result.again_in_minutes == LEARNING_STEPS[0]

    def test_hard_stays_at_current_step(self):
        card = self._learning_card(step=1)
        result = review(card, HARD, NOW + timedelta(minutes=10))
        assert result.learning_step == 1
        assert result.graduated is False

    def test_good_at_step_0_advances_to_step_1(self):
        card = self._learning_card(step=0)
        result = review(card, GOOD, NOW + timedelta(minutes=1))
        assert result.learning_step == 1
        assert result.state == STATE_LEARNING
        assert result.graduated is False

    def test_good_at_last_step_graduates(self):
        last_step = len(LEARNING_STEPS) - 1
        card = self._learning_card(step=last_step)
        result = review(card, GOOD, NOW + timedelta(minutes=10))
        assert result.state == STATE_REVIEW
        assert result.graduated is True
        assert result.interval_days > 0

    def test_easy_immediately_graduates(self):
        card = self._learning_card(step=0)
        result = review(card, EASY, NOW + timedelta(minutes=1))
        assert result.state == STATE_REVIEW
        assert result.graduated is True
        assert result.interval_days > 0

    def test_no_lapse_increment_in_learning(self):
        card = self._learning_card(step=0, lapses=2)
        result = review(card, AGAIN, NOW + timedelta(minutes=1))
        assert result.lapses == 2


# ── Review card tests ──


class TestReviewCardReview:
    def _review_card(self, **overrides):
        defaults = dict(
            stability=10.0,
            difficulty=5.0,
            interval_days=10,
            repetitions=5,
            lapses=0,
            state=STATE_REVIEW,
            next_review=NOW,
            last_review=NOW - timedelta(days=10),
            learning_step=0,
        )
        defaults.update(overrides)
        return CardState(**defaults)

    def test_again_enters_relearning(self):
        card = self._review_card()
        result = review(card, AGAIN, NOW)
        assert result.state == STATE_RELEARNING
        assert result.graduated is False
        assert result.lapses == 1
        assert result.again_in_minutes == RELEARNING_STEPS[0]

    def test_hard_stays_in_review(self):
        card = self._review_card()
        result = review(card, HARD, NOW)
        assert result.state == STATE_REVIEW
        assert result.graduated is True
        assert result.interval_days >= 1

    def test_good_stays_in_review(self):
        card = self._review_card()
        result = review(card, GOOD, NOW)
        assert result.state == STATE_REVIEW
        assert result.graduated is True

    def test_easy_stays_in_review_with_longer_interval(self):
        card = self._review_card()
        good_result = review(card, GOOD, NOW)
        easy_result = review(card, EASY, NOW)
        assert easy_result.interval_days >= good_result.interval_days

    def test_again_decreases_stability(self):
        card = self._review_card()
        result = review(card, AGAIN, NOW)
        assert result.stability < card.stability

    def test_easy_increases_stability_more_than_good(self):
        card = self._review_card()
        good = review(card, GOOD, NOW)
        easy = review(card, EASY, NOW)
        assert easy.stability >= good.stability

    def test_again_increases_difficulty(self):
        card = self._review_card()
        result = review(card, AGAIN, NOW)
        assert result.difficulty > card.difficulty

    def test_easy_decreases_difficulty(self):
        card = self._review_card()
        result = review(card, EASY, NOW)
        assert result.difficulty < card.difficulty

    def test_late_review_still_works(self):
        card = self._review_card(
            last_review=NOW - timedelta(days=60),
            next_review=NOW - timedelta(days=50),
        )
        result = review(card, GOOD, NOW)
        assert result.state == STATE_REVIEW
        assert result.interval_days >= 1


# ── Relearning card tests ──


class TestRelearningCardReview:
    def _relearning_card(self, step=0, **overrides):
        defaults = dict(
            stability=2.0,
            difficulty=6.0,
            interval_days=0,
            repetitions=6,
            lapses=1,
            state=STATE_RELEARNING,
            next_review=NOW + timedelta(minutes=10),
            last_review=NOW,
            learning_step=step,
        )
        defaults.update(overrides)
        return CardState(**defaults)

    def test_again_stays_in_relearning(self):
        card = self._relearning_card()
        result = review(card, AGAIN, NOW + timedelta(minutes=10))
        assert result.state == STATE_RELEARNING
        assert result.graduated is False
        assert result.learning_step == 0

    def test_again_increments_lapses_in_relearning(self):
        card = self._relearning_card(lapses=1)
        result = review(card, AGAIN, NOW + timedelta(minutes=10))
        assert result.lapses == 2

    def test_good_graduates_from_relearning(self):
        card = self._relearning_card(step=0)
        result = review(card, GOOD, NOW + timedelta(minutes=10))
        assert result.state == STATE_REVIEW
        assert result.graduated is True
        assert result.interval_days >= 1

    def test_easy_graduates_from_relearning(self):
        card = self._relearning_card(step=0)
        result = review(card, EASY, NOW + timedelta(minutes=10))
        assert result.state == STATE_REVIEW
        assert result.graduated is True


# ── Full learning flow tests ──


class TestLearningFlow:
    def test_new_to_graduated_happy_path(self):
        """New card → Good (step 1) → Good (graduate)"""
        card = _new_card()

        r1 = review(card, GOOD, NOW)
        assert r1.state == STATE_LEARNING
        assert r1.learning_step == 1

        card2 = CardState(
            stability=r1.stability, difficulty=r1.difficulty,
            interval_days=r1.interval_days, repetitions=r1.repetitions,
            lapses=r1.lapses, state=r1.state,
            next_review=r1.next_review, last_review=r1.last_review,
            learning_step=r1.learning_step,
        )
        r2 = review(card2, GOOD, NOW + timedelta(minutes=10))
        assert r2.state == STATE_REVIEW
        assert r2.graduated is True
        assert r2.interval_days > 0

    def test_struggle_then_learn(self):
        """New card → Again → Again → Good (step 1) → Good (graduate)"""
        card = _new_card()

        r1 = review(card, AGAIN, NOW)
        assert r1.state == STATE_LEARNING
        assert r1.learning_step == 0

        c2 = CardState(
            stability=r1.stability, difficulty=r1.difficulty,
            interval_days=r1.interval_days, repetitions=r1.repetitions,
            lapses=r1.lapses, state=r1.state,
            next_review=r1.next_review, last_review=r1.last_review,
            learning_step=r1.learning_step,
        )
        r2 = review(c2, AGAIN, NOW + timedelta(minutes=1))
        assert r2.learning_step == 0
        assert r2.state == STATE_LEARNING

        c3 = CardState(
            stability=r2.stability, difficulty=r2.difficulty,
            interval_days=r2.interval_days, repetitions=r2.repetitions,
            lapses=r2.lapses, state=r2.state,
            next_review=r2.next_review, last_review=r2.last_review,
            learning_step=r2.learning_step,
        )
        r3 = review(c3, GOOD, NOW + timedelta(minutes=2))
        assert r3.learning_step == 1
        assert r3.state == STATE_LEARNING

        c4 = CardState(
            stability=r3.stability, difficulty=r3.difficulty,
            interval_days=r3.interval_days, repetitions=r3.repetitions,
            lapses=r3.lapses, state=r3.state,
            next_review=r3.next_review, last_review=r3.last_review,
            learning_step=r3.learning_step,
        )
        r4 = review(c4, GOOD, NOW + timedelta(minutes=12))
        assert r4.state == STATE_REVIEW
        assert r4.graduated is True

    def test_review_lapse_relearn_graduate(self):
        """Review card → Again (relearning) → Good (graduate back)"""
        card = CardState(
            stability=10.0, difficulty=5.0, interval_days=10,
            repetitions=5, lapses=0, state=STATE_REVIEW,
            next_review=NOW, last_review=NOW - timedelta(days=10),
            learning_step=0,
        )
        r1 = review(card, AGAIN, NOW)
        assert r1.state == STATE_RELEARNING
        assert r1.lapses == 1

        c2 = CardState(
            stability=r1.stability, difficulty=r1.difficulty,
            interval_days=r1.interval_days, repetitions=r1.repetitions,
            lapses=r1.lapses, state=r1.state,
            next_review=r1.next_review, last_review=r1.last_review,
            learning_step=r1.learning_step,
        )
        r2 = review(c2, GOOD, NOW + timedelta(minutes=10))
        assert r2.state == STATE_REVIEW
        assert r2.graduated is True
        assert r2.lapses == 1


# ── Preview intervals tests ──


class TestPreviewIntervals:
    def test_new_card_preview(self):
        card = _new_card()
        preview = preview_intervals(card, NOW)
        assert set(preview.keys()) == {1, 2, 3, 4}
        for rating, info in preview.items():
            assert "days" in info
            assert "minutes" in info
            assert "graduated" in info

    def test_new_card_easy_graduates(self):
        card = _new_card()
        preview = preview_intervals(card, NOW)
        assert preview[EASY]["graduated"] is True
        assert preview[EASY]["days"] > 0

    def test_new_card_again_does_not_graduate(self):
        card = _new_card()
        preview = preview_intervals(card, NOW)
        assert preview[AGAIN]["graduated"] is False
        assert preview[AGAIN]["minutes"] > 0

    def test_review_card_preview(self):
        card = CardState(
            stability=10.0, difficulty=5.0, interval_days=10,
            repetitions=5, lapses=0, state=STATE_REVIEW,
            next_review=NOW, last_review=NOW - timedelta(days=10),
            learning_step=0,
        )
        preview = preview_intervals(card, NOW)
        assert preview[AGAIN]["graduated"] is False
        assert preview[GOOD]["graduated"] is True
        assert preview[EASY]["graduated"] is True
        assert preview[EASY]["days"] >= preview[GOOD]["days"]


# ── Edge cases ──


class TestEdgeCases:
    def test_rating_clamped_below(self):
        card = _new_card()
        result = review(card, 0, NOW)
        assert result.state in (STATE_LEARNING, STATE_REVIEW)

    def test_rating_clamped_above(self):
        card = _new_card()
        result = review(card, 10, NOW)
        assert result.state == STATE_REVIEW
        assert result.graduated is True

    def test_zero_stability_treated_as_new(self):
        card = CardState(
            stability=0.0, difficulty=5.0, interval_days=5,
            repetitions=3, lapses=0, state=STATE_REVIEW,
            next_review=NOW, last_review=NOW - timedelta(days=5),
            learning_step=0,
        )
        result = review(card, GOOD, NOW)
        assert result.stability > 0

    def test_naive_datetime_handled(self):
        card = CardState(
            stability=10.0, difficulty=5.0, interval_days=10,
            repetitions=5, lapses=0, state=STATE_REVIEW,
            next_review=datetime(2026, 1, 15, 12, 0, 0),
            last_review=datetime(2026, 1, 5, 12, 0, 0),
            learning_step=0,
        )
        result = review(card, GOOD, NOW)
        assert result.interval_days >= 1
