import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// POST /api/stripe/webhook
// Stripe Webhook — verarbeitet Subscription-Events
// ============================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
]);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!relevantEvents.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await updateSubscription(subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await updateSubscription(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleCancellation(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;
        if (subscriptionId) {
          await handlePaymentFailed(subscriptionId);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}

// ============================================================
// Helper: Subscription in Supabase aktualisieren
// ============================================================

async function updateSubscription(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // User anhand stripe_customer_id finden
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!sub) {
    // Fallback: metadata
    const userId = subscription.metadata?.supabase_user_id;
    if (!userId) {
      console.error("No user found for customer:", customerId);
      return;
    }
    await upsertSubscription(userId, subscription);
    return;
  }

  await upsertSubscription(sub.user_id, subscription);
}

async function upsertSubscription(userId: string, subscription: Stripe.Subscription) {
  const priceItem = subscription.items?.data?.[0];
  const interval = priceItem?.price?.recurring?.interval || "month";

  const tier = (subscription.status === "active" || subscription.status === "trialing")
    ? "pro"
    : "free";

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        tier,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceItem?.price?.id || null,
        billing_interval: interval,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        status: subscription.status,
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("Failed to upsert subscription:", error);
  }
}

async function handleCancellation(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!sub) return;

  await supabaseAdmin
    .from("subscriptions")
    .update({
      tier: "free",
      status: "canceled",
      cancel_at_period_end: false,
    })
    .eq("user_id", sub.user_id);
}

async function handlePaymentFailed(subscriptionId: string) {
  await supabaseAdmin
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("stripe_subscription_id", subscriptionId);
}
