"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useHouseholdStore } from "@/stores/household-store";
import { useAuthStore } from "@/stores/auth-store";

export default function JoinPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const { joinByToken, isLoading, error, household } = useHouseholdStore();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");

  useEffect(() => {
    if (authLoading) return; // Warte auf Auth-Check

    if (!isAuthenticated) {
      // User nicht angemeldet → Login mit redirect
      const returnUrl = `/join?token=${token}`;
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (!token) {
      setStatus("no-token");
      return;
    }

    const doJoin = async () => {
      try {
        await joinByToken(token);
        setStatus("success");
        setTimeout(() => router.push("/konto"), 2000);
      } catch {
        setStatus("error");
      }
    };

    doJoin();
  }, [token, isAuthenticated, authLoading, joinByToken, router]);

  return (
    <div style={{
      backgroundColor: "#FFF3EB", minHeight: "100vh",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      {status === "loading" && (
        <>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, #F3E5F5, #E1BEE7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 24,
          }}>
            <div style={{ width: 24, height: 24, border: "3px solid #E0D5CA", borderTopColor: "#7B2D7D", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#4B164C", fontFamily: "'Montserrat', sans-serif", marginBottom: 8 }}>
            Einladung wird verarbeitet...
          </h2>
          <p style={{ fontSize: 14, color: "#9193A0" }}>Einen Moment bitte</p>
        </>
      )}

      {status === "success" && (
        <>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            backgroundColor: "#E8F5E9",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 24,
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#2E7D32", fontFamily: "'Montserrat', sans-serif", marginBottom: 8 }}>
            Willkommen im Haushalt!
          </h2>
          <p style={{ fontSize: 14, color: "#9193A0" }}>
            {household?.name ? `Du bist "${household.name}" beigetreten.` : "Du wirst weitergeleitet..."}
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            backgroundColor: "rgba(230,73,73,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 24,
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E64949" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#E64949", fontFamily: "'Montserrat', sans-serif", marginBottom: 8 }}>
            Einladung fehlgeschlagen
          </h2>
          <p style={{ fontSize: 14, color: "#9193A0", textAlign: "center", lineHeight: 1.5, marginBottom: 20 }}>
            {error || "Die Einladung ist ungültig oder abgelaufen."}
          </p>
          <button
            onClick={() => router.push("/konto")}
            style={{
              padding: "14px 32px", borderRadius: 12,
              backgroundColor: "#F2894F", color: "white", fontWeight: 700,
              fontSize: 15, border: "none", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Zum Profil
          </button>
        </>
      )}

      {status === "no-token" && (
        <>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#212022", fontFamily: "'Montserrat', sans-serif", marginBottom: 8 }}>
            Kein Einladungslink
          </h2>
          <p style={{ fontSize: 14, color: "#9193A0", marginBottom: 20 }}>
            Bitte verwende einen gültigen Einladungslink.
          </p>
          <button
            onClick={() => router.push("/konto")}
            style={{
              padding: "14px 32px", borderRadius: 12,
              backgroundColor: "#F2894F", color: "white", fontWeight: 700,
              fontSize: 15, border: "none", cursor: "pointer",
            }}
          >
            Zum Profil
          </button>
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
