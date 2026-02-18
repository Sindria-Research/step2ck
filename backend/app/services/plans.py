"""Plan/tier constants and helpers. Behavior (limits, feature gates) is added later."""

# Plan identifiers stored on User.plan
PLAN_FREE = "free"
PLAN_PRO = "pro"

# All valid plan values (for validation / migrations)
PLANS = (PLAN_FREE, PLAN_PRO)


def is_valid_plan(plan: str) -> bool:
    return plan in PLANS
