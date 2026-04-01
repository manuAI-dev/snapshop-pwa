"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomNavProps {
  onScanPress: () => void;
}

export default function BottomNav({ onScanPress }: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  const navColor = (href: string) => isActive(href) ? '#F2894F' : '#9193A0';

  const navItem = {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: '6px 0',
    textDecoration: 'none',
    minWidth: 52,
    flex: 1,
  };

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white',
      borderTop: '1px solid rgba(220,221,220,0.5)', zIndex: 40,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', maxWidth: 480, margin: '0 auto', height: 60 }}>
        {/* Einkauf */}
        <Link href="/einkaufsliste" style={navItem}>
          <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={navColor("/einkaufsliste")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          <span style={{ fontSize: 9, marginTop: 3, color: navColor("/einkaufsliste"), fontWeight: isActive("/einkaufsliste") ? 600 : 400, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Einkauf</span>
        </Link>

        {/* Planer */}
        <Link href="/kalender" style={navItem}>
          <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={navColor("/kalender")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
          </svg>
          <span style={{ fontSize: 9, marginTop: 3, color: navColor("/kalender"), fontWeight: isActive("/kalender") ? 600 : 400, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Planer</span>
        </Link>

        {/* Center FAB */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={onScanPress}
            style={{
              width: 52, height: 52, borderRadius: '50%', backgroundColor: '#F2894F', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(242,137,79,0.35)', cursor: 'pointer',
              marginTop: -24, position: 'relative',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="M12 5v14" />
            </svg>
          </button>
        </div>

        {/* Rezepte */}
        <Link href="/rezepte" style={navItem}>
          <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={navColor("/rezepte")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
            <line x1="6" y1="17" x2="18" y2="17" />
          </svg>
          <span style={{ fontSize: 9, marginTop: 3, color: navColor("/rezepte"), fontWeight: isActive("/rezepte") ? 600 : 400, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Rezepte</span>
        </Link>

        {/* Entdecken */}
        <Link href="/entdecken" style={navItem}>
          <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={navColor("/entdecken")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
          <span style={{ fontSize: 9, marginTop: 3, color: navColor("/entdecken"), fontWeight: isActive("/entdecken") ? 600 : 400, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Entdecken</span>
        </Link>
      </div>
    </nav>
  );
}
