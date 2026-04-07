"use client";

import { useState, useEffect } from "react";

// Detect if running as installed PWA
function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

// Detect iOS
function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Full-screen popup shown once after onboarding.
 * Explains how to add the app to the home screen.
 */
export function PwaInstallPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already installed
    const dismissed = localStorage.getItem("snapshop_pwa_popup_dismissed");
    const onboarded = localStorage.getItem("snapshop_onboarded");
    if (onboarded && !dismissed) {
      // Show with slight delay so the main page loads first
      const t = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("snapshop_pwa_popup_dismissed", "true");
  };

  if (!show) return null;

  const ios = isIOS();

  return (
    <div
      onClick={dismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        animation: "pwa-fade-in 0.25s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420,
          backgroundColor: "#FFF3EB",
          borderRadius: "24px 24px 0 0",
          padding: "28px 24px calc(28px + env(safe-area-inset-bottom, 0px))",
          animation: "pwa-slide-up 0.3s ease-out",
        }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          style={{
            position: "absolute", top: 16, right: 16,
            width: 32, height: 32, borderRadius: "50%",
            backgroundColor: "rgba(0,0,0,0.06)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9193A0" strokeWidth="2.5">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "linear-gradient(135deg, #FFD5D5 0%, #F2894F 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", boxShadow: "0 4px 16px rgba(242,137,79,0.25)",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" /><path d="m19 12-7-7-7 7" /><path d="M5 20h14" />
          </svg>
        </div>

        <h3 style={{
          fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 700,
          color: "#4B164C", textAlign: "center", marginBottom: 8,
        }}>
          App installieren
        </h3>

        <p style={{
          fontSize: 14, color: "#73503D", textAlign: "center",
          lineHeight: 1.5, marginBottom: 24, maxWidth: 300, margin: "0 auto 24px",
        }}>
          Füge SnapShop zu deinem Homescreen hinzu für den vollen App-Effekt.
        </p>

        {/* Steps */}
        <div style={{
          backgroundColor: "white", borderRadius: 16, padding: "16px 18px",
          display: "flex", flexDirection: "column", gap: 14, marginBottom: 20,
        }}>
          {ios ? (
            <>
              <Step num={1} text={<>Tippe unten auf das <strong>Teilen-Symbol</strong> <ShareIcon /></>} />
              <Step num={2} text={<>Scrolle und wähle <strong>&quot;Zum Home-Bildschirm&quot;</strong></>} />
              <Step num={3} text={<>Tippe auf <strong>&quot;Hinzufügen&quot;</strong> — fertig!</>} />
            </>
          ) : (
            <>
              <Step num={1} text={<>Tippe oben rechts auf <strong>⋮</strong> (Menü)</>} />
              <Step num={2} text={<>Wähle <strong>&quot;Zum Startbildschirm hinzufügen&quot;</strong></>} />
              <Step num={3} text={<>Bestätige mit <strong>&quot;Hinzufügen&quot;</strong> — fertig!</>} />
            </>
          )}
        </div>

        <button
          onClick={dismiss}
          style={{
            width: "100%", padding: 16, borderRadius: 14,
            backgroundColor: "#F2894F", border: "none",
            color: "white", fontSize: 16, fontWeight: 700,
            fontFamily: "'Montserrat', sans-serif", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(242,137,79,0.25)",
          }}
        >
          Verstanden
        </button>
      </div>

      <style>{`
        @keyframes pwa-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pwa-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
}

/**
 * Small dismissible reminder banner for the profile page.
 */
export function PwaInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    const dismissed = localStorage.getItem("snapshop_pwa_banner_dismissed");
    if (!dismissed) setShow(true);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("snapshop_pwa_banner_dismissed", "true");
  };

  return (
    <div style={{
      margin: "0 20px", padding: "12px 14px",
      backgroundColor: "white", borderRadius: 14,
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
      position: "relative",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: "linear-gradient(135deg, #FFD5D5 0%, #F2894F 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M12 5v14" /><path d="m19 12-7-7-7 7" /><path d="M5 20h14" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#212022", margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          App installieren
        </p>
        <p style={{ fontSize: 11, color: "#9193A0", margin: "2px 0 0" }}>
          {isIOS() ? "Teilen → Zum Home-Bildschirm" : "Menü → Zum Startbildschirm"}
        </p>
      </div>
      <button
        onClick={dismiss}
        style={{
          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
          backgroundColor: "rgba(0,0,0,0.04)", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9193A0" strokeWidth="2.5">
          <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}

function Step({ num, text }: { num: number; text: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        backgroundColor: "#FEF1E8",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, color: "#F2894F",
        fontFamily: "'Montserrat', sans-serif",
      }}>
        {num}
      </div>
      <p style={{ fontSize: 13, color: "#525154", margin: 0, lineHeight: 1.4 }}>{text}</p>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 4 }}
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
