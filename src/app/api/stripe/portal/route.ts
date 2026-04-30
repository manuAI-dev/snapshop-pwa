import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// POST /api/stripe/portal
// Erstellt eine Stripe Customer Portal Session
// (Abo verwalten, kündigen, Zahlungsmethode ändern)
// ============================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { customerId, email, userId } = await req.json();

    let resolvedCustomerId = customerId;

    // Fallback 1: Per userId aus DB holen
    if (!resolvedCustomerId && userId) {
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", userId)
        .single();
      resolvedCustomerId = sub?.stripe_customer_id;
    }

    // Fallback 2: Per Email in Stripe suchen
    if (!resolvedCustomerId && email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        resolvedCustomerId = customers.data[0].id;

        // Customer-ID in Supabase speichern für nächstes Mal
        if (userId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ stripe_customer_id: resolvedCustomerId })
            .eq("user_id", userId);
        }
      }
    }

    if (!resolvedCustomerId) {
      return NextResponse.json({ error: "Kein Stripe-Customer gefunden" }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: resolvedCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.snapshop.ch"}/konto/upgrade`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Portal error:", err);
    return NextResponse.json(
      { error: err.message || "Portal fehlgeschlagen" },
      { status: 500 }
    );
  }
}
