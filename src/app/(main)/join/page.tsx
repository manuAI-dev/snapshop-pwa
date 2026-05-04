"use client";

// Diese Seite wurde nach /join (top-level) verschoben,
// damit sie OHNE Auth-Guard erreichbar ist.
// Dieser Redirect fängt Altlinks ab, die noch auf (main)/join zeigen.

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function JoinRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");
    router.replace(token ? `/join?token=${token}` : "/join");
  }, [searchParams, router]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: "#FFF3EB",
    }}>
      <div style={{ width: 24, height: 24, border: "3px solid #E0D5CA", borderTopColor: "#7B2D7D", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
