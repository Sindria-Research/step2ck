"""Billing endpoints — Stripe Checkout, webhook, Customer Portal."""
import logging
from datetime import datetime, timezone

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.config import get_settings
from app.db import get_db
from app.models import User
from app.services.plans import PLAN_FREE, PLAN_PRO

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_stripe() -> None:
    """Ensure stripe API key is configured."""
    settings = get_settings()
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Billing is not configured")
    stripe.api_key = settings.STRIPE_SECRET_KEY


def _get_or_create_customer(user: User, db: Session) -> str:
    """Return existing Stripe customer ID or create a new one."""
    if user.stripe_customer_id:
        return user.stripe_customer_id
    customer = stripe.Customer.create(
        email=user.email,
        name=user.display_name or user.email,
        metadata={"user_id": user.id},
    )
    user.stripe_customer_id = customer.id
    db.commit()
    return customer.id


@router.post("/checkout/{interval}")
def create_checkout_session_with_interval(
    interval: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a Stripe Checkout session for a specific billing interval."""
    _get_stripe()
    settings = get_settings()

    if interval not in ("month", "year"):
        raise HTTPException(status_code=400, detail="interval must be 'month' or 'year'")

    price_id = (
        settings.STRIPE_PRO_MONTHLY_PRICE_ID
        if interval == "month"
        else settings.STRIPE_PRO_ANNUAL_PRICE_ID
    )
    if not price_id:
        raise HTTPException(status_code=503, detail=f"Price ID for {interval} billing not configured")

    customer_id = _get_or_create_customer(current_user, db)

    origin = request.headers.get("origin", "http://localhost:5173")
    session = stripe.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        subscription_data={"trial_period_days": 7},
        success_url=f"{origin}/settings?checkout=success",
        cancel_url=f"{origin}/pricing",
        metadata={"user_id": current_user.id},
    )
    return {"checkout_url": session.url}


@router.post("/portal")
def create_portal_session(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a Stripe Customer Portal session for self-serve management."""
    _get_stripe()
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No billing account found")

    origin = request.headers.get("origin", "http://localhost:5173")
    session = stripe.billing_portal.Session.create(
        customer=current_user.stripe_customer_id,
        return_url=f"{origin}/settings",
    )
    return {"portal_url": session.url}


@router.get("/subscription")
def get_subscription(
    current_user: User = Depends(get_current_user),
):
    """Return current subscription details."""
    _get_stripe()

    if not current_user.stripe_subscription_id:
        return {
            "plan": current_user.plan,
            "status": None,
            "interval": None,
            "current_period_end": None,
            "cancel_at": None,
            "trial_end": None,
        }

    try:
        sub = stripe.Subscription.retrieve(current_user.stripe_subscription_id)
        return {
            "plan": current_user.plan,
            "status": sub.status,
            "interval": sub["items"]["data"][0]["price"]["recurring"]["interval"] if sub["items"]["data"] else None,
            "current_period_end": datetime.fromtimestamp(sub.current_period_end, tz=timezone.utc).isoformat() if sub.current_period_end else None,
            "cancel_at": datetime.fromtimestamp(sub.cancel_at, tz=timezone.utc).isoformat() if sub.cancel_at else None,
            "trial_end": datetime.fromtimestamp(sub.trial_end, tz=timezone.utc).isoformat() if sub.trial_end else None,
        }
    except stripe.StripeError as e:
        logger.warning("Failed to retrieve subscription: %s", e)
        return {
            "plan": current_user.plan,
            "status": None,
            "interval": current_user.plan_interval,
            "current_period_end": current_user.plan_expires_at.isoformat() if current_user.plan_expires_at else None,
            "cancel_at": None,
            "trial_end": None,
        }


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events. No auth — verified via signature."""
    _get_stripe()
    settings = get_settings()

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.SignatureVerificationError) as e:
        logger.warning("Webhook signature verification failed: %s", e)
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    data = event["data"]["object"]
    logger.info("Stripe webhook: %s", event_type)

    if event_type == "checkout.session.completed":
        _handle_checkout_completed(data, db)
    elif event_type == "customer.subscription.updated":
        _handle_subscription_updated(data, db)
    elif event_type == "customer.subscription.deleted":
        _handle_subscription_deleted(data, db)
    elif event_type == "invoice.paid":
        _handle_invoice_paid(data, db)

    return {"status": "ok"}


def _find_user_by_customer_id(customer_id: str, db: Session) -> User | None:
    return db.query(User).filter(User.stripe_customer_id == customer_id).first()


def _handle_checkout_completed(data: dict, db: Session) -> None:
    customer_id = data.get("customer")
    subscription_id = data.get("subscription")
    user_id = data.get("metadata", {}).get("user_id")

    user = None
    if customer_id:
        user = _find_user_by_customer_id(customer_id, db)
    if not user and user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user and customer_id:
            user.stripe_customer_id = customer_id

    if not user:
        logger.warning("checkout.session.completed: no user found for customer=%s", customer_id)
        return

    user.plan = PLAN_PRO
    user.stripe_subscription_id = subscription_id

    if subscription_id:
        try:
            sub = stripe.Subscription.retrieve(subscription_id)
            if sub["items"]["data"]:
                user.plan_interval = sub["items"]["data"][0]["price"]["recurring"]["interval"]
            if sub.current_period_end:
                user.plan_expires_at = datetime.fromtimestamp(sub.current_period_end, tz=timezone.utc)
        except stripe.StripeError:
            pass

    db.commit()
    logger.info("User %s upgraded to pro via checkout", user.id)


def _handle_subscription_updated(data: dict, db: Session) -> None:
    customer_id = data.get("customer")
    user = _find_user_by_customer_id(customer_id, db) if customer_id else None
    if not user:
        return

    status = data.get("status")
    user.stripe_subscription_id = data.get("id")

    if status in ("active", "trialing"):
        user.plan = PLAN_PRO
    elif status in ("past_due", "unpaid"):
        pass  # keep pro during grace period
    else:
        user.plan = PLAN_FREE

    items = data.get("items", {}).get("data", [])
    if items:
        user.plan_interval = items[0].get("price", {}).get("recurring", {}).get("interval")

    period_end = data.get("current_period_end")
    if period_end:
        user.plan_expires_at = datetime.fromtimestamp(period_end, tz=timezone.utc)

    db.commit()
    logger.info("Subscription updated for user %s: status=%s", user.id, status)


def _handle_subscription_deleted(data: dict, db: Session) -> None:
    customer_id = data.get("customer")
    user = _find_user_by_customer_id(customer_id, db) if customer_id else None
    if not user:
        return

    user.plan = PLAN_FREE
    user.stripe_subscription_id = None
    user.plan_interval = None
    user.plan_expires_at = None
    db.commit()
    logger.info("Subscription deleted for user %s — downgraded to free", user.id)


def _handle_invoice_paid(data: dict, db: Session) -> None:
    customer_id = data.get("customer")
    user = _find_user_by_customer_id(customer_id, db) if customer_id else None
    if not user:
        return

    subscription_id = data.get("subscription")
    if subscription_id:
        try:
            sub = stripe.Subscription.retrieve(subscription_id)
            if sub.current_period_end:
                user.plan_expires_at = datetime.fromtimestamp(sub.current_period_end, tz=timezone.utc)
            db.commit()
        except stripe.StripeError:
            pass
