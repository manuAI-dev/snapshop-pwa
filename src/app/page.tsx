"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function RootPage() {
  const { isAuthenticated, isLoading, checkSession } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Logged in → go to app
        router.push("/rezepte");
      } else {
        // Not logged in: check if they've been here before
        const onboarded = typeof window !== "undefined" && localStorage.getItem("snapshop_onboarded");
        if (onboarded) {
          // Returning user → login
          router.push("/login");
        } else {
          // First visit → landing page
          window.location.href = "/landing.html";
        }
      }
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FFF3EB",
    }}>
      {/* Logo */}
      <svg width="48" height="65" viewBox="0 0 81 109" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M24.1218 6.7171C25.2449 2.0201 29.9733 -0.879592 34.683 0.240449L70.0729 8.6567C74.7827 9.77675 77.6902 14.4924 76.5671 19.1894L74.0867 29.5634C72.9636 34.2604 68.2352 37.1601 63.5255 36.0401L30.2764 28.133C28.5361 27.7191 26.865 29.035 26.865 30.8192C26.865 31.8321 27.421 32.7637 28.3136 33.2466L74.0059 57.9682C78.3158 60.3001 81 64.7978 81 69.6879V76.0267C81 80.8554 77.075 84.7698 72.2332 84.7698H63.717C59.5766 84.7698 56.0006 87.6587 55.1411 91.698L52.9341 102.07C51.929 106.794 47.2747 109.81 42.5384 108.808L6.94873 101.276C2.21243 100.273 -0.812319 95.6316 0.192766 90.9081L2.37661 80.6449C3.38169 75.9214 8.03601 72.9048 12.7723 73.9072L50.9098 81.9784C52.636 82.3437 54.2613 81.0307 54.2613 79.2708C54.2613 78.2557 53.704 77.322 52.8093 76.8379L7.12036 52.1181C2.81042 49.7863 0.126259 45.2885 0.126259 40.3984V33.4039C0.126259 28.5752 4.05129 24.6608 8.89307 24.6608H12.9093C16.9677 24.6608 20.4956 21.8828 21.437 17.9457L24.1218 6.7171Z" fill="url(#splash_logo)"/>
        <defs>
          <linearGradient id="splash_logo" x1="40.5631" y1="2.14683" x2="40.5631" y2="107.501" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFD5D5"/>
            <stop offset="1" stopColor="#F2894F"/>
          </linearGradient>
        </defs>
      </svg>
      <h1 style={{
        fontFamily: "'Montserrat', sans-serif",
        fontSize: 32,
        fontWeight: 700,
        color: "#F2894F",
        marginTop: 12,
      }}>
        Snapshop
      </h1>
      <p style={{ color: "#9193A0", fontSize: 13, marginTop: 4 }}>AI Rezepte</p>
      <div style={{ marginTop: 32, width: 32, height: 32, border: "3px solid #FEF1E8", borderTopColor: "#F2894F", borderRadius: "50%" }} className="animate-spin" />
    </div>
  );
}
