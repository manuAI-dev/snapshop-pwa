"use client";

import { useState } from "react";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { useAuthStore } from "@/stores/auth-store";
import { PLANS, FEATURE_GATES } from "@/lib/subscription";

// ============================================================
// Paywall Modal — Wird angezeigt wenn Feature-Limit erreicht
// Zwei Varianten:
// 1. "paywall" → Free-User hat Limit erreicht → Upgrade anbieten
// 2. "soft_limit" → Pro-User hat Soft-Limit erreicht → Morgen wieder
// ============================================================

export default function PaywallModal() {
  const { showPaywall, paywallFeature, paywallGateResult, dismissPaywall, upgradeTo } = useSubscriptionStore();
  const { user } = useAuthStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<"month" | "year">("year");

  if (!showPaywall || !paywallGateResult) return null;

  const isSoftLimit = paywallGateResult.reason === "soft_limit";
  const gate = paywallFeature ? FEATURE_GATES[paywallFeature] : null;
  const pro = PLANS.pro;

  // Contextual messaging based on which feature triggered the paywall
  const getMessage = () => {
    if (isSoftLimit) {
      return {
        title: "Tageslimit erreicht",
        subtitle: `Du hast ${gate?.label || "dieses Feature"} diesen Monat schon ${paywallGateResult.currentUsage}× genutzt. Morgen geht's weiter!`,
        emoji: "☕",
      };
    }

    // Honeymoon paywall messages
    switch (paywallFeature) {
      case "recipeStore":
        return {
          title: "Deine Sammlung wächst!",
          subtitle: `Du hast bereits ${paywallGateResult.currentUsage} Rezepte gespeichert. Schalte unbegrenzte Rezepte frei.`,
          emoji: "📚",
        };
      case "aiPlanner":
        return {
          title: "Hat dir der Wochenplan gefallen?",
          subtitle: "Mit Pro planst du jede Woche automatisch — abgestimmt auf deinen Haushalt.",
          emoji: "📅",
        };
      case "recipeImport":
        return {
          title: "Noch mehr Rezepte importieren?",
          subtitle: "Mit Pro importierst du unbegrenzt Rezepte aus Fotos und Webseiten.",
          emoji: "📷",
        };
      case "fridgeScan":
        return {
          title: "Kühlschrank-Scanner gefällt dir?",
          subtitle: "Mit Pro scannst du jederzeit deinen Kühlschrank und bekommst passende Rezeptvorschläge.",
          emoji: "🧊",
        };
      case "caloriePhoto":
        return {
          title: "Kalorien im Blick behalten?",
          subtitle: "Mit Pro trackst du jede Mahlzeit per Foto — einfach und schnell.",
          emoji: "🍽️",
        };
      case "ingredientAlt":
        return {
          title: "Zutaten-Alternativen entdecken?",
          subtitle: "Mit Pro findest du für jede Zutat den perfekten Ersatz.",
          emoji: "🔄",
        };
      case "cookingMode":
        return {
          title: "Kochmodus ausprobiert?",
          subtitle: "Mit Pro kochst du immer im Fullscreen-Modus — Schritt für Schritt, hands-free.",
          emoji: "👨‍🍳",
        };
      default:
        return {
          title: "Upgrade auf Pro",
          subtitle: "Schalte alle Features frei für das beste Koch-Erlebnis.",
          emoji: "✨",
        };
    }
  };

  const msg = getMessage();

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
      // Fallback: direktes Upgrade wenn Stripe nicht erreichbar
      upgradeTo("pro");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div
      onClick={dismissPaywall}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "white", borderRadius: "28px 28px 0 0",
          padding: "28px 24px", width: "100%", maxWidth: 480,
          paddingBottom: "calc(28px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0" }} />
        </div>

        {/* Emoji + Title */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{msg.emoji}</div>
          <h2 style={{
            fontFamily: "'Montserrat', sans-serif", fontSize: 22, fontWeight: 700,
            color: "#212022", marginBottom: 8,
          }}>
            {msg.title}
          </h2>
          <p style={{
            fontSize: 14, color: "#7A6E6E", lineHeight: 1.5,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {msg.subtitle}
          </p>
        </div>

        {!isSoftLimit && (
          <>
            {/* Pro Feature List */}
            <div style={{
              backgroundColor: "#FFF8F3", borderRadius: 16, padding: "16px 18px",
              marginBottom: 20,
            }}>
              <p style={{
                fontSize: 11, fontWeight: 700, color: "#F2894F",
                textTransform: "uppercase", letterSpacing: 1, marginBottom: 10,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                Was du mit Pro bekommst
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pro.features.slice(0, 6).map((feat, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2.5">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span style={{ fontSize: 13, color: "#525154", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {/* Monthly */}
              <div
                onClick={() => setSelectedInterval("month")}
                style={{
                  flex: 1, padding: "14px 12px", borderRadius: 14,
                  border: selectedInterval === "month" ? "2px solid #F2894F" : "1.5px solid #E0D5CA",
                  textAlign: "center", cursor: "pointer",
                  backgroundColor: selectedInterval === "month" ? "#FFFAF7" : "white",
                }}>
                <p style={{ fontSize: 11, color: "#9193A0", fontWeight: 600, marginBottom: 4 }}>Monatlich</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#212022", fontFamily: "'Montserrat', sans-serif" }}>
                  {pro.priceMonthly.toFixed(2).replace(".", ",")}
                </p>
                <p style={{ fontSize: 11, color: "#9193A0" }}>CHF / Monat</p>
              </div>
              {/* Yearly */}
              <div
                onClick={() => setSelectedInterval("year")}
                style={{
                  flex: 1, padding: "14px 12px", borderRadius: 14,
                  border: selectedInterval === "year" ? "2px solid #F2894F" : "1.5px solid #E0D5CA",
                  textAlign: "center", cursor: "pointer",
                  position: "relative",
                  backgroundColor: selectedInterval === "year" ? "#FFFAF7" : "white",
                }}>
                <div style={{
                  position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                  backgroundColor: "#F2894F", color: "white", fontSize: 10, fontWeight: 700,
                  padding: "2px 10px", borderRadius: 10,
                }}>
                  SPAR 33%
                </div>
                <p style={{ fontSize: 11, color: "#9193A0", fontWeight: 600, marginBottom: 4 }}>Jährlich</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#212022", fontFamily: "'Montserrat', sans-serif" }}>
                  {(pro.priceYearly / 12).toFixed(2).replace(".", ",")}
                </p>
                <p style={{ fontSize: 11, color: "#9193A0" }}>CHF / Monat</p>
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
                marginBottom: 12,
              }}
            >
              {isCheckingOut ? "Weiterleitung..." : "Pro freischalten"}
            </button>
          </>
        )}

        {/* Dismiss */}
        <button
          onClick={dismissPaywall}
          style={{
            width: "100%", padding: 12, background: "none", border: "none",
            color: "#9193A0", fontSize: 14, cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {isSoftLimit ? "Verstanden" : "Später"}
        </button>
      </div>
    </div>
  );
}
