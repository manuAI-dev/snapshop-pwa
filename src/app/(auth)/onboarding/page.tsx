"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// ============================================================
// SnapShop Logo
// ============================================================
function Logo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width="42" height="57" viewBox="0 0 81 109" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M24.1218 6.7171C25.2449 2.0201 29.9733 -0.879592 34.683 0.240449L70.0729 8.6567C74.7827 9.77675 77.6902 14.4924 76.5671 19.1894L74.0867 29.5634C72.9636 34.2604 68.2352 37.1601 63.5255 36.0401L30.2764 28.133C28.5361 27.7191 26.865 29.035 26.865 30.8192C26.865 31.8321 27.421 32.7637 28.3136 33.2466L74.0059 57.9682C78.3158 60.3001 81 64.7978 81 69.6879V76.0267C81 80.8554 77.075 84.7698 72.2332 84.7698H63.717C59.5766 84.7698 56.0006 87.6587 55.1411 91.698L52.9341 102.07C51.929 106.794 47.2747 109.81 42.5384 108.808L6.94873 101.276C2.21243 100.273 -0.812319 95.6316 0.192766 90.9081L2.37661 80.6449C3.38169 75.9214 8.03601 72.9048 12.7723 73.9072L50.9098 81.9784C52.636 82.3437 54.2613 81.0307 54.2613 79.2708C54.2613 78.2557 53.704 77.322 52.8093 76.8379L7.12036 52.1181C2.81042 49.7863 0.126259 45.2885 0.126259 40.3984V33.4039C0.126259 28.5752 4.05129 24.6608 8.89307 24.6608H12.9093C16.9677 24.6608 20.4956 21.8828 21.437 17.9457L24.1218 6.7171Z" fill="url(#onb_logo)"/>
        <defs>
          <linearGradient id="onb_logo" x1="40.5631" y1="2.14683" x2="40.5631" y2="107.501" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFD5D5"/>
            <stop offset="1" stopColor="#F2894F"/>
          </linearGradient>
        </defs>
      </svg>
      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 24, fontWeight: 700, color: "#F2894F" }}>
        Snapshop
      </span>
    </div>
  );
}

// ============================================================
// Slide Data
// ============================================================
interface Slide {
  image: string;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
}

const slides: Slide[] = [
  {
    image: "/screenshots/andrej_liebemann_Rezeptbuch_close_up_steht_auf_in_der_Kche_auf__a8f47aa1-f29b-4fea-a01b-66e24eaa2008.png",
    title: "Rezepte scannen",
    subtitle: "Kochbuch aufschlagen, Foto machen — fertig.",
    description: "Unsere AI erkennt Zutaten, Mengen und Schritte automatisch aus jedem Foto.",
    accent: "#F2894F",
  },
  {
    image: "/screenshots/BOLD_scrolling_past_generic_food_photos_on_a_screen_--v_7_d5c58069-f4fd-43bc-8bea-3d80bf315924.png",
    title: "Online Rezepte speichern",
    subtitle: "Link einfügen — ohne Werbung & Chaos.",
    description: "SnapShop extrahiert alle Details aus Food-Blogs und speichert sie schön formatiert.",
    accent: "#4B164C",
  },
  {
    image: "/screenshots/noisesketch_Happy_woman_with_a_shopping_cart_at_the_supermarket_ce0b8d6b-f584-4740-b149-151d7da7f8ed.png",
    title: "Smarte Einkaufsliste",
    subtitle: "Alle Zutaten, automatisch sortiert.",
    description: "Wähle deine Rezepte — die Einkaufsliste erstellt sich von selbst, nach Kategorien sortiert.",
    accent: "#2E8D92",
  },
  {
    image: "/screenshots/kivokivo_top_down_view_of_a_female_taking_a_photo_of_kitchen_ta_4242bc3e-d221-43f0-bc20-a477ff141c1c.png",
    title: "AI-Wochenplaner",
    subtitle: "Deine Woche — geplant in Sekunden.",
    description: "Frühstück, Mittag, Abendessen — abgestimmt auf Vorlieben, Allergien und was im Kühlschrank ist.",
    accent: "#4674EB",
  },
  {
    image: "/screenshots/design4156_supermarket_products_spilling_onto_a_white_table_han_0c93c44f-a60e-45e9-8268-fad1d72dedbd.png",
    title: "Lass dich inspirieren",
    subtitle: "Tausende Rezepte entdecken.",
    description: "Ideen von Fooby, Betty Bossi, Migusto und Swissmilk — direkt in der App.",
    accent: "#E91E63",
  },
];

// ============================================================
// Onboarding Page
// ============================================================
export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(-1); // -1 = welcome
  const [animKey, setAnimKey] = useState(0);

  const goToSlide = useCallback((index: number) => {
    setAnimKey(prev => prev + 1);
    setCurrentSlide(index);
  }, []);

  const handleNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      finishOnboarding();
    }
  }, [currentSlide, goToSlide]);

  const finishOnboarding = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("snapshop_onboarded", "true");
    }
    router.push("/rezepte");
  }, [router]);

  // ============================================================
  // Welcome Screen
  // ============================================================
  if (currentSlide === -1) {
    return (
      <div style={{
        minHeight: "100dvh",
        backgroundColor: "#FFF3EB",
        display: "flex", flexDirection: "column",
        position: "relative", overflow: "hidden",
      }}>
        {/* Hero image – capped height */}
        <div style={{
          flex: "0 0 auto", maxHeight: "35vh", position: "relative", overflow: "hidden",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/screenshots/andrej_liebemann_Rezeptbuch_close_up_steht_auf_in_der_Kche_auf__a8f47aa1-f29b-4fea-a01b-66e24eaa2008.png"
            alt="Kochbuch auf Küchenablage"
            style={{
              width: "100%", height: "35vh",
              objectFit: "cover",
              animation: "onb-zoom-in 0.8s ease-out both",
            }}
          />
          {/* Gradient fade to content */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
            background: "linear-gradient(to top, #FFF3EB 0%, transparent 100%)",
          }} />
        </div>

        {/* Content */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "0 24px", textAlign: "center",
          marginTop: -16,
        }}>
          <Logo />

          <h1 style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 26, fontWeight: 700, color: "#4B164C",
            marginTop: 20, marginBottom: 8, lineHeight: 1.25,
          }}>
            Deine smarte<br />Rezeptwelt
          </h1>

          <p style={{
            fontSize: 15, color: "#73503D", lineHeight: 1.6,
            maxWidth: 280, marginBottom: 24,
          }}>
            Fotografiere Rezepte, scanne Zutaten und koche smarter — mit AI.
          </p>
        </div>

        {/* CTA fixed at bottom */}
        <div style={{
          padding: "0 32px",
          paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))",
        }}>
          <button
            onClick={() => goToSlide(0)}
            style={{
              width: "100%",
              padding: "16px 32px", borderRadius: 16,
              background: "#F2894F", border: "none",
              color: "#fff", fontSize: 16, fontWeight: 700,
              fontFamily: "'Montserrat', sans-serif",
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(242,137,79,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            Entdecken
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        <style>{`
          @keyframes onb-zoom-in { from { opacity: 0; transform: scale(1.08); } to { opacity: 1; transform: scale(1); } }
        `}</style>
      </div>
    );
  }

  // ============================================================
  // Feature Slides
  // ============================================================
  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  return (
    <div style={{
      minHeight: "100dvh",
      backgroundColor: "#FFF3EB",
      display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden",
    }}>
      {/* Skip button */}
      <button
        onClick={finishOnboarding}
        style={{
          position: "absolute",
          top: "max(env(safe-area-inset-top, 12px), 48px)",
          right: 20, zIndex: 10,
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          border: "none", borderRadius: 20,
          padding: "6px 16px", fontSize: 13, fontWeight: 500,
          color: "#73503D", cursor: "pointer",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        Überspringen
      </button>

      {/* Image area – capped height */}
      <div style={{
        flex: "0 0 auto", maxHeight: "35vh", position: "relative", overflow: "hidden",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`img-${animKey}`}
          src={slide.image}
          alt={slide.title}
          style={{
            width: "100%", height: "35vh",
            objectFit: "cover",
            animation: "onb-img-in 0.5s ease-out both",
          }}
        />
        {/* Gradient fade */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
          background: "linear-gradient(to top, #FFF3EB 0%, transparent 100%)",
        }} />
        {/* Slide number badge */}
        <div style={{
          position: "absolute",
          top: "max(env(safe-area-inset-top, 12px), 48px)",
          left: 24,
          width: 40, height: 40, borderRadius: 12,
          background: slide.accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 800, fontSize: 18,
          fontFamily: "'Montserrat', sans-serif",
          boxShadow: `0 4px 16px ${slide.accent}44`,
        }}>
          {currentSlide + 1}
        </div>
      </div>

      {/* Content area */}
      <div
        key={`content-${animKey}`}
        style={{
          flex: "1 1 auto", display: "flex", flexDirection: "column",
          justifyContent: "center",
          padding: "0 32px",
          overflow: "hidden",
          animation: "onb-fade-up 0.5s ease-out both",
        }}
      >
        {/* Accent line */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: slide.accent, marginBottom: 16,
        }} />

        <h2 style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 26, fontWeight: 800, color: "#4B164C",
          marginBottom: 8, lineHeight: 1.2,
        }}>
          {slide.title}
        </h2>

        <p style={{
          fontSize: 16, fontWeight: 600, color: slide.accent,
          marginBottom: 12, lineHeight: 1.4,
        }}>
          {slide.subtitle}
        </p>

        <p style={{
          fontSize: 14, color: "#8C7060", lineHeight: 1.65,
          maxWidth: 300,
        }}>
          {slide.description}
        </p>
      </div>

      {/* Bottom navigation – always visible */}
      <div style={{
        flexShrink: 0,
        padding: "16px 32px",
        paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        {/* Progress bar (clickable) */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {slides.map((_, i) => (
            <div
              key={i}
              onClick={() => goToSlide(i)}
              style={{
                flex: i === currentSlide ? 3 : 1,
                height: 4, borderRadius: 2,
                background: i === currentSlide
                  ? slide.accent
                  : i < currentSlide
                    ? `${slide.accent}66`
                    : "#E8D5C8",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        {/* Button row */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {currentSlide > 0 && (
            <button
              onClick={() => goToSlide(currentSlide - 1)}
              style={{
                width: 52, height: 52, borderRadius: 16,
                border: "2px solid #E8D5C8", background: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B164C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}

          <button
            onClick={handleNext}
            style={{
              flex: 1, padding: "16px 32px", borderRadius: 16,
              background: isLast ? "#4B164C" : slide.accent,
              border: "none", color: "#fff",
              fontSize: 16, fontWeight: 700,
              fontFamily: "'Montserrat', sans-serif",
              cursor: "pointer",
              boxShadow: isLast
                ? "0 8px 24px rgba(75,22,76,0.3)"
                : `0 8px 24px ${slide.accent}55`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {isLast ? "Jetzt starten" : "Weiter"}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes onb-img-in { from { opacity: 0; transform: scale(1.05); } to { opacity: 1; transform: scale(1); } }
        @keyframes onb-fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
