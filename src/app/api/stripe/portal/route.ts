import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// ============================================================
// POST /api/stripe/portal
// Erstellt eine Stripe Customer Portal Session
// (Abo verwalten, kündigen, Zahlungsmethode ändern)
// ============================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: NextRequest) {
  try {
    const { customerId } = await req.json();

    if (!customerId) {
      return NextResponse.json({ error: "Kein Stripe-Customer" }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
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
