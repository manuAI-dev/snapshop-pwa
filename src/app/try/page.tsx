"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// /try leitet direkt auf /register weiter.
// Keine AI-Nutzung ohne Account (Schutz vor Bot-Missbrauch & unkontrollierten API-Kosten).

export default function TryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/register");
  }, [router]);

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FFF3EB",
    }}>
      <div style={{
        width: 32, height: 32,
        border: "3px solid #FEF1E8",
        borderTopColor: "#F2894F",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
