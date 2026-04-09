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
              <Step num={1} text={<>Tippe in Safari auf das <strong>Teilen-Symbol</strong> <ShareIcon /> (oben oder unten im Browser)</>} />
              <Step num={2} text={<>Scrolle nach unten und wähle <strong>&quot;Zum Home-Bildschirm&quot;</strong> <PlusIcon /></>} />
              <Step num={3} text={<>Tippe oben rechts auf <strong>&quot;Hinzufügen&quot;</strong> — fertig!</>} />
            </>
          ) : (
            <>
              <Step num={1} text={<>Tippe oben rechts auf <strong>⋮</strong> (drei Punkte)</>} />
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
          {isIOS() ? "Safari → Teilen → Zum Home-Bildschirm" : "Menü ⋮ → Zum Startbildschirm"}
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

/**
 * Smart Banner — fixed top bar shown on every page when running in browser.
 * Disappears after dismiss for 7 days, or forever after second dismiss.
 * Never shows when already installed as PWA.
 */
export function PwaSmartBanner() {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    const data = localStorage.getItem("snapshop_smart_banner");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        // If dismissed permanently, never show
        if (parsed.permanent) return;
        // If dismissed temporarily, check if 7 days passed
        if (parsed.until && new Date(parsed.until) > new Date()) return;
      } catch {}
    }
    // Small delay so page renders first
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    const data = localStorage.getItem("snapshop_smart_banner");
    let dismissCount = 0;
    try { dismissCount = data ? JSON.parse(data).count || 0 : 0; } catch {}
    dismissCount++;
    if (dismissCount >= 2) {
      // After 2nd dismiss, hide permanently
      localStorage.setItem("snapshop_smart_banner", JSON.stringify({ permanent: true, count: dismissCount }));
    } else {
      // After 1st dismiss, hide for 7 days
      const until = new Date();
      until.setDate(until.getDate() + 7);
      localStorage.setItem("snapshop_smart_banner", JSON.stringify({ until: until.toISOString(), count: dismissCount }));
    }
  };

  const ios = isIOS();

  return (
    <>
      {/* Banner bar */}
      <div
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9990,
          backgroundColor: "#4B164C",
          padding: "0 12px",
          boxShadow: "0 2px 12px rgba(75,22,76,0.2)",
          animation: "smartBannerIn 0.3s ease-out",
        }}
      >
        <div style={{
          maxWidth: 480, margin: "0 auto",
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 0",
        }}>
          {/* App icon */}
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, #FFD5D5 0%, #F2894F 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(242,137,79,0.3)",
          }}>
            <svg width="18" height="24" viewBox="0 0 81 109" fill="#fff">
              <path fillRule="evenodd" clipRule="evenodd" d="M24.1 6.7c1.1-4.7 5.9-7.6 10.6-6.5l35.4 8.4c4.7 1.1 7.6 5.8 6.5 10.5l-2.5 10.4c-1.1 4.7-5.8 7.6-10.5 6.5L30.3 28.1c-1.7-.4-3.4.9-3.4 2.7 0 1 .6 1.9 1.4 2.4l45.7 24.7c4.3 2.3 7 6.8 7 11.7v6.3c0 4.8-3.9 8.7-8.8 8.7h-8.5c-4.1 0-7.7 2.9-8.6 6.9l-2.2 10.4c-1 4.7-5.7 7.7-10.4 6.7L6.9 101.3c-4.7-1-7.7-5.6-6.7-10.4l2.2-10.3c1-4.7 5.7-7.7 10.4-6.7l38.1 8.1c1.7.4 3.4-.9 3.4-2.7 0-1-.6-2-1.5-2.4L7.1 52.1C2.8 49.8.1 45.3.1 40.4v-7c0-4.8 3.9-8.7 8.8-8.7h4c4.1 0 7.6-2.8 8.5-6.7l2.7-11.3z"/>
            </svg>
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "white", margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              SnapShop als App nutzen
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: "1px 0 0" }}>
              Zum Home-Bildschirm hinzufügen
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: "7px 14px", borderRadius: 8,
              backgroundColor: "#F2894F", border: "none",
              color: "white", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              flexShrink: 0, whiteSpace: "nowrap",
            }}
          >
            {expanded ? "Schliessen" : "So geht's"}
          </button>

          {/* Close X */}
          <button
            onClick={dismiss}
            style={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
              backgroundColor: "rgba(255,255,255,0.1)", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Expanded instruction area */}
        {expanded && (
          <div style={{
            maxWidth: 480, margin: "0 auto",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            padding: "14px 0 16px",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {ios ? (
              <>
                <SmartStep num={1} text={<>Tippe auf das <strong>Teilen-Symbol</strong> <SmartShareIcon /> im Browser (oben oder unten)</>} />
                <SmartStep num={2} text={<>Scrolle und wähle <strong>«Zum Home-Bildschirm»</strong> <SmartPlusIcon /></>} />
                <SmartStep num={3} text={<>Tippe auf <strong>«Hinzufügen»</strong> — fertig!</>} />
              </>
            ) : (
              <>
                <SmartStep num={1} text={<>Tippe oben rechts auf <strong>⋮</strong> (drei Punkte)</>} />
                <SmartStep num={2} text={<>Wähle <strong>«Zum Startbildschirm hinzufügen»</strong></>} />
                <SmartStep num={3} text={<>Bestätige mit <strong>«Hinzufügen»</strong> — fertig!</>} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Spacer so page content isn't hidden behind the banner */}
      <div style={{ height: expanded ? 160 : 56 , transition: "height 0.2s ease" }} />

      <style>{`
        @keyframes smartBannerIn {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

function SmartStep({ num, text }: { num: number; text: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        backgroundColor: "rgba(242,137,79,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: "#F2894F",
        fontFamily: "'Montserrat', sans-serif",
      }}>{num}</div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.4 }}>{text}</p>
    </div>
  );
}

function SmartShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle", margin: "0 2px" }}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function SmartPlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle", margin: "0 2px" }}>
      <rect x="3" y="3" width="18" height="18" rx="4" /><path d="M12 8v8" /><path d="M8 12h8" />
    </svg>
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

function PlusIcon() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 2 }}
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 8v8" /><path d="M8 12h8" />
    </svg>
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
