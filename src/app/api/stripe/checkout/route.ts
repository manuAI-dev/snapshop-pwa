import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// POST /api/stripe/checkout
// Erstellt eine Stripe Checkout Session für Pro-Upgrade
// ============================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

// Admin-Client für serverseitige DB-Operationen
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { interval, userId, email } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ error: "User nicht authentifiziert" }, { status: 401 });
    }

    const priceId = interval === "year"
      ? process.env.STRIPE_PRICE_YEARLY!
      : process.env.STRIPE_PRICE_MONTHLY!;

    // Prüfe ob User schon Stripe-Customer hat
    let customerId: string | undefined;
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (sub?.stripe_customer_id) {
      customerId = sub.stripe_customer_id;
    } else {
      // Neuen Stripe-Customer erstellen
      const customer = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;

      // Customer-ID in Supabase speichern
      await supabaseAdmin
        .from("subscriptions")
        .upsert(
          { user_id: userId, stripe_customer_id: customerId },
          { onConflict: "user_id" }
        );
    }

    // Checkout Session erstellen
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.snapshop.ch"}/konto/upgrade?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.snapshop.ch"}/konto/upgrade?canceled=true`,
      subscription_data: {
        metadata: { supabase_user_id: userId },
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      locale: "de",
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Checkout fehlgeschlagen" },
      { status: 500 }
    );
  }
}
