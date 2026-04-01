"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { useAuthStore } from "@/stores/auth-store";
import { PLANS, FEATURE_GATES, getStripeCustomerId } from "@/lib/subscription";

// ============================================================
// Upgrade / Pricing Page — Konto > Upgrade
// ============================================================

export default function UpgradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tier, upgradeTo, loadSubscription } = useSubscriptionStore();
  const { user } = useAuthStore();
  const pro = PLANS.pro;
  const free = PLANS.free;

  const isPro = tier === "pro";
  const [selectedInterval, setSelectedInterval] = useState<"month" | "year">("year");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle Stripe Redirect (success/cancel)
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setSuccessMessage("Willkommen bei SnapShop Pro! Dein Abo ist jetzt aktiv.");
      // Subscription aus Supabase neu laden (Webhook hat evtl. schon aktualisiert)
      setTimeout(() => loadSubscription(), 1500);
    }
  }, [searchParams, loadSubscription]);

  const handleUpgrade = async () => {
    if (!user) return;
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interval: selectedInterval,
          userId: user.id,
          email: user.email,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Fallback: direktes Upgrade (Dev-Modus / Stripe nicht konfiguriert)
        upgradeTo("pro");
      }
    } catch {
      upgradeTo("pro");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const customerId = await getStripeCustomerId();
      if (!customerId) return;

      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFF3EB" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", padding: "16px 20px",
        paddingTop: "calc(16px + env(safe-area-inset-top, 0px))",
      }}>
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#212022" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 style={{
          fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 700,
          color: "#212022", margin: 0, flex: 1, textAlign: "center",
        }}>
          {isPro ? "Dein Abo" : "Pro freischalten"}
        </h1>
        <div style={{ width: 38 }} />
      </div>

      <div style={{ padding: "0 20px 40px" }}>
        {/* Success Message */}
        {successMessage && (
          <div style={{
            padding: "14px 18px", borderRadius: 16, marginBottom: 20,
            background: "linear-gradient(135deg, #F2894F 0%, #E06930 100%)",
            color: "white", textAlign: "center",
            fontSize: 14, fontWeight: 600,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {successMessage}
          </div>
        )}

        {/* Current Status Badge */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 20px", borderRadius: 20,
            backgroundColor: isPro ? "#F2894F" : "#EDE5DA",
            color: isPro ? "white" : "#7A6E6E",
            fontSize: 13, fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {isPro ? "Pro aktiv" : "Free Plan"}
          </div>
        </div>

        {/* Pro Plan Card */}
        <div style={{
          backgroundColor: "white", borderRadius: 24, padding: "28px 22px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.06)", marginBottom: 20,
          border: isPro ? "2px solid #F2894F" : "none",
        }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🚀</div>
            <h2 style={{
              fontFamily: "'Montserrat', sans-serif", fontSize: 24, fontWeight: 700,
              color: "#212022", marginBottom: 4,
            }}>
              SnapShop Pro
            </h2>
            <p style={{
              fontSize: 13, color: "#9193A0", margin: 0,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              Das volle Koch-Erlebnis
            </p>
          </div>

          {/* Feature List */}
          <div style={{
            backgroundColor: "#FFF8F3", borderRadius: 16, padding: "18px 20px",
            marginBottom: 24,
          }}>
            <p style={{
              fontSize: 11, fontWeight: 700, color: "#F2894F",
              textTransform: "uppercase", letterSpacing: 1, marginBottom: 12,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              Alles inklusive
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pro.features.map((feat, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2.5">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span style={{
                    fontSize: 14, color: "#525154",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>
                    {feat}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing — nur für Free-User */}
          {!isPro && (
            <>
              <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                {/* Monthly */}
                <div
                  onClick={() => setSelectedInterval("month")}
                  style={{
                    flex: 1, padding: "16px 14px", borderRadius: 16,
                    border: selectedInterval === "month" ? "2px solid #F2894F" : "1.5px solid #E0D5CA",
                    textAlign: "center", cursor: "pointer",
                    backgroundColor: selectedInterval === "month" ? "#FFFAF7" : "white",
                  }}>
                  <p style={{ fontSize: 11, color: "#9193A0", fontWeight: 600, marginBottom: 6 }}>Monatlich</p>
                  <p style={{
                    fontSize: 28, fontWeight: 700, color: "#212022", margin: 0,
                    fontFamily: "'Montserrat', sans-serif",
                  }}>
                    {pro.priceMonthly.toFixed(2).replace(".", ",")}
                  </p>
                  <p style={{ fontSize: 12, color: "#9193A0", margin: "4px 0 0" }}>CHF / Monat</p>
                </div>
                {/* Yearly */}
                <div
                  onClick={() => setSelectedInterval("year")}
                  style={{
                    flex: 1, padding: "16px 14px", borderRadius: 16,
                    border: selectedInterval === "year" ? "2px solid #F2894F" : "1.5px solid #E0D5CA",
                    textAlign: "center", cursor: "pointer",
                    position: "relative",
                    backgroundColor: selectedInterval === "year" ? "#FFFAF7" : "white",
                  }}>
                  <div style={{
                    position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                    backgroundColor: "#F2894F", color: "white", fontSize: 10, fontWeight: 700,
                    padding: "3px 12px", borderRadius: 10,
                  }}>
                    SPAR 33%
                  </div>
                  <p style={{ fontSize: 11, color: "#9193A0", fontWeight: 600, marginBottom: 6 }}>Jährlich</p>
                  <p style={{
                    fontSize: 28, fontWeight: 700, color: "#212022", margin: 0,
                    fontFamily: "'Montserrat', sans-serif",
                  }}>
                    {(pro.priceYearly / 12).toFixed(2).replace(".", ",")}
                  </p>
                  <p style={{ fontSize: 12, color: "#9193A0", margin: "4px 0 0" }}>CHF / Monat</p>
                  <p style={{ fontSize: 10, color: "#C4B8AC", margin: "2px 0 0" }}>
                    ({pro.priceYearly.toFixed(2).replace(".", ",")} CHF/Jahr)
                  </p>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handleUpgrade}
                disabled={isCheckingOut}
                style={{
                  width: "100%", padding: 16, borderRadius: 16,
                  background: isCheckingOut
                    ? "#E0D5CA"
                    : "linear-gradient(135deg, #F2894F 0%, #E06930 100%)",
                  color: "white", fontWeight: 700, fontSize: 16, border: "none",
                  cursor: isCheckingOut ? "wait" : "pointer",
                  fontFamily: "'Montserrat', sans-serif",
                  boxShadow: isCheckingOut ? "none" : "0 4px 16px rgba(242,137,79,0.35)",
                }}
              >
                {isCheckingOut ? "Weiterleitung zu Stripe..." : "Jetzt Pro freischalten"}
              </button>
            </>
          )}

          {/* Pro-User: Abo verwalten */}
          {isPro && (
            <div style={{ textAlign: "center" }}>
              <p style={{
                fontSize: 14, color: "#7A6E6E", marginBottom: 16,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                Du nutzt alle Pro-Features. Danke für dein Abo!
              </p>
              <button
                onClick={handleManageSubscription}
                style={{
                  padding: "12px 24px", borderRadius: 12,
                  background: "none", border: "1.5px solid #F2894F",
                  color: "#F2894F", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  marginBottom: 10,
                }}
              >
                Abo verwalten
              </button>
            </div>
          )}
        </div>

        {/* Free Plan Comparison */}
        <div style={{
          backgroundColor: "white", borderRadius: 24, padding: "24px 22px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}>
          <h3 style={{
            fontFamily: "'Montserrat', sans-serif", fontSize: 16, fontWeight: 700,
            color: "#212022", marginBottom: 16,
          }}>
            Free Plan
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {free.features.map((feat, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4B8AC" strokeWidth="2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span style={{
                  fontSize: 13, color: "#9193A0",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Stats */}
        <div style={{
          marginTop: 20, backgroundColor: "white", borderRadius: 24, padding: "24px 22px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}>
          <h3 style={{
            fontFamily: "'Montserrat', sans-serif", fontSize: 16, fontWeight: 700,
            color: "#212022", marginBottom: 16,
          }}>
            Deine Nutzung
          </h3>
          <UsageStats tier={tier} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Usage Stats Component
// ============================================================

function UsageStats({ tier }: { tier: string }) {
  const { getUsage } = useSubscriptionStore();

  const features = [
    { key: "recipeStore", icon: "📚" },
    { key: "aiPlanner", icon: "📅" },
    { key: "recipeImport", icon: "📷" },
    { key: "fridgeScan", icon: "🧊" },
    { key: "caloriePhoto", icon: "🍽️" },
    { key: "ingredientAlt", icon: "🔄" },
    { key: "cookingMode", icon: "👨‍🍳" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {features.map(({ key, icon }) => {
        const gate = FEATURE_GATES[key];
        if (!gate) return null;
        const usage = getUsage(key);
        const limit = tier === "pro" ? gate.softLimit : gate.freeLimit;
        const limitLabel = limit === null ? "∞" : limit === 999 ? "∞" : String(limit);
        const pct = limit && limit < 999 ? Math.min(100, (usage / limit) * 100) : 0;

        return (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{
                  fontSize: 12, color: "#525154", fontWeight: 600,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  {gate.label}
                </span>
                <span style={{
                  fontSize: 11, color: "#9193A0",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  {usage} / {limitLabel}
                </span>
              </div>
              {limit !== null && limit < 999 && (
                <div style={{
                  height: 4, borderRadius: 2, backgroundColor: "#F0EBE5",
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", borderRadius: 2,
                    width: `${pct}%`,
                    backgroundColor: pct >= 90 ? "#E06930" : "#F2894F",
                    transition: "width 0.3s",
                  }} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
