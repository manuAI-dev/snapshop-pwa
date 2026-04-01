"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

function SnapShopLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 109 / 81)} viewBox="0 0 81 109" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M24.1218 6.7171C25.2449 2.0201 29.9733 -0.879592 34.683 0.240449L70.0729 8.6567C74.7827 9.77675 77.6902 14.4924 76.5671 19.1894L74.0867 29.5634C72.9636 34.2604 68.2352 37.1601 63.5255 36.0401L30.2764 28.133C28.5361 27.7191 26.865 29.035 26.865 30.8192C26.865 31.8321 27.421 32.7637 28.3136 33.2466L74.0059 57.9682C78.3158 60.3001 81 64.7978 81 69.6879V76.0267C81 80.8554 77.075 84.7698 72.2332 84.7698H63.717C59.5766 84.7698 56.0006 87.6587 55.1411 91.698L52.9341 102.07C51.929 106.794 47.2747 109.81 42.5384 108.808L6.94873 101.276C2.21243 100.273 -0.812319 95.6316 0.192766 90.9081L2.37661 80.6449C3.38169 75.9214 8.03601 72.9048 12.7723 73.9072L50.9098 81.9784C52.636 82.3437 54.2613 81.0307 54.2613 79.2708C54.2613 78.2557 53.704 77.322 52.8093 76.8379L7.12036 52.1181C2.81042 49.7863 0.126259 45.2885 0.126259 40.3984V33.4039C0.126259 28.5752 4.05129 24.6608 8.89307 24.6608H12.9093C16.9677 24.6608 20.4956 21.8828 21.437 17.9457L24.1218 6.7171Z" fill="url(#paint0_logo)"/>
      <defs>
        <linearGradient id="paint0_logo" x1="40.5631" y1="2.14683" x2="40.5631" y2="107.501" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD5D5"/>
          <stop offset="1" stopColor="#F2894F"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export { SnapShopLogo };

export default function AppHeader({ title, subtitle, rightAction, transparent }: AppHeaderProps) {
  const { user } = useAuthStore();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("snapshop_profile_image");
      if (saved) setProfileImage(saved);
    }
    // Listen for storage changes (from other tabs / profile page)
    const handler = () => {
      const saved = localStorage.getItem("snapshop_profile_image");
      setProfileImage(saved);
    };
    window.addEventListener("storage", handler);
    // Also listen for custom event (same-tab updates)
    window.addEventListener("profileImageChanged", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("profileImageChanged", handler);
    };
  }, []);

  const initials = user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div style={{
      padding: "52px 20px 12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: transparent ? "transparent" : undefined,
    }}>
      {/* Left: Logo + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <SnapShopLogo size={24} />
        {title && (
          <div>
            <h1 style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: "#4B164C",
              lineHeight: 1.2,
            }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: 12, color: "#9193A0", marginTop: 2 }}>
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right: Custom action or Profile avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {rightAction}
        <Link
          href="/konto"
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            backgroundColor: profileImage ? "transparent" : "#F2894F",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(242,137,79,0.25)",
            overflow: "hidden",
            border: profileImage ? "2px solid rgba(242,137,79,0.4)" : "none",
          }}
        >
          {profileImage ? (
            <img src={profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{
              fontSize: 15,
              fontWeight: 700,
              color: "white",
              fontFamily: "'Montserrat', sans-serif",
            }}>
              {initials}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
