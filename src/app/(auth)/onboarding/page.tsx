"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ============================================================
// SnapShop Logo Component
// ============================================================
function Logo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width="56" height="75" viewBox="0 0 81 109" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M24.1218 6.7171C25.2449 2.0201 29.9733 -0.879592 34.683 0.240449L70.0729 8.6567C74.7827 9.77675 77.6902 14.4924 76.5671 19.1894L74.0867 29.5634C72.9636 34.2604 68.2352 37.1601 63.5255 36.0401L30.2764 28.133C28.5361 27.7191 26.865 29.035 26.865 30.8192C26.865 31.8321 27.421 32.7637 28.3136 33.2466L74.0059 57.9682C78.3158 60.3001 81 64.7978 81 69.6879V76.0267C81 80.8554 77.075 84.7698 72.2332 84.7698H63.717C59.5766 84.7698 56.0006 87.6587 55.1411 91.698L52.9341 102.07C51.929 106.794 47.2747 109.81 42.5384 108.808L6.94873 101.276C2.21243 100.273 -0.812319 95.6316 0.192766 90.9081L2.37661 80.6449C3.38169 75.9214 8.03601 72.9048 12.7723 73.9072L50.9098 81.9784C52.636 82.3437 54.2613 81.0307 54.2613 79.2708C54.2613 78.2557 53.704 77.322 52.8093 76.8379L7.12036 52.1181C2.81042 49.7863 0.126259 45.2885 0.126259 40.3984V33.4039C0.126259 28.5752 4.05129 24.6608 8.89307 24.6608H12.9093C16.9677 24.6608 20.4956 21.8828 21.437 17.9457L24.1218 6.7171Z" fill="url(#onb_logo)"/>
        <defs>
          <linearGradient id="onb_logo" x1="40.5631" y1="2.14683" x2="40.5631" y2="107.501" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFD5D5"/>
            <stop offset="1" stopColor="#F2894F"/>
          </linearGradient>
        </defs>
      </svg>
      <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 28, fontWeight: 700, color: "#F2894F" }}>
        Snapshop
      </span>
    </div>
  );
}

// ============================================================
// Slide Data
// ============================================================
interface Slide {
  icon: string;
  title: string;
  description: string;
  bgGradient: string;
  iconColor: string;
}

const slides: Slide[] = [
  {
    icon: "camera",
    title: "Rezepte scannen",
    description: "Fotografiere Rezepte aus deinen Lieblings\u00ADkochb\u00FCchern. Unsere AI erkennt Zutaten, Mengen und Schritte automatisch.",
    bgGradient: "linear-gradient(135deg, #F2894F 0%, #E67A3C 100%)",
    iconColor: "#F2894F",
  },
  {
    icon: "link",
    title: "Online Rezepte speichern",
    description: "Finde ein tolles Rezept online? Kopiere einfach den Link und SnapShop extrahiert alle Details f\u00FCr dich.",
    bgGradient: "linear-gradient(135deg, #4B164C 0%, #6B2A6E 100%)",
    iconColor: "#4B164C",
  },
  {
    icon: "shopping",
    title: "Smarte Einkaufsliste",
    description: "Mit einem Tipp landen alle Zutaten auf deiner Einkaufsliste. Automatisch sortiert nach Kategorien.",
    bgGradient: "linear-gradient(135deg, #2E8D92 0%, #1E6B6F 100%)",
    iconColor: "#2E8D92",
  },
  {
    icon: "calendar",
    title: "Wochenplaner",
    description: "Plane deine Mahlzeiten f\u00FCr die ganze Woche. Fr\u00FChst\u00FCck, Mittag, Abendessen \u2014 alles an einem Ort.",
    bgGradient: "linear-gradient(135deg, #4674EB 0%, #3458C5 100%)",
    iconColor: "#4674EB",
  },
  {
    icon: "discover",
    title: "Lass dich inspirieren",
    description: "Entdecke neue Rezepte von Betty Bossi, Migusto und Swissmilk. Filter nach Ern\u00E4hrungsweise und Aufwand.",
    bgGradient: "linear-gradient(135deg, #E91E63 0%, #C2185B 100%)",
    iconColor: "#E91E63",
  },
];

function SlideIcon({ type, color }: { type: string; color: string }) {
  const size = 48;
  const props = { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (type) {
    case "camera":
      return (
        <svg {...props}>
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      );
    case "link":
      return (
        <svg {...props}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
    case "shopping":
      return (
        <svg {...props}>
          <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <path d="M8 2v4" /><path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" />
        </svg>
      );
    case "discover":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    default:
      return null;
  }
}

// ============================================================
// Onboarding Page
// ============================================================
export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(-1); // -1 = welcome screen

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  const finishOnboarding = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("snapshop_onboarded", "true");
    }
    router.push("/login");
  };

  // ============================================================
  // Welcome Screen (slide -1)
  // ============================================================
  if (currentSlide === -1) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#FFF3EB",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 32px",
        position: "relative",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: -80, left: -80,
          width: 320, height: 320, borderRadius: "50%",
          backgroundColor: "rgba(242,137,79,0.06)",
        }} />
        <div style={{
          position: "absolute", bottom: -60, right: -60,
          width: 240, height: 240, borderRadius: "50%",
          backgroundColor: "rgba(75,22,76,0.04)",
        }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <Logo />

          <h1 style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: "#4B164C",
            marginTop: 40,
            marginBottom: 12,
            lineHeight: 1.3,
          }}>
            Deine smarte Rezeptwelt
          </h1>

          <p style={{
            fontSize: 15,
            color: "#73503D",
            lineHeight: 1.6,
            maxWidth: 300,
            margin: "0 auto 48px",
          }}>
            Wandle Rezeptbilder direkt mit AI in digitale Rezepte mit Einkaufslisten um.
          </p>

          <button
            onClick={handleNext}
            style={{
              width: "100%",
              maxWidth: 320,
              padding: "16px 32px",
              borderRadius: 16,
              backgroundColor: "#F2894F",
              border: "none",
              color: "white",
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "'Montserrat', sans-serif",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(242,137,79,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            Los geht&apos;s
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
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
      minHeight: "100vh",
      backgroundColor: "#FFF3EB",
      display: "flex",
      flexDirection: "column",
      position: "relative",
    }}>
      {/* Skip button */}
      <button
        onClick={handleSkip}
        style={{
          position: "absolute",
          top: 56,
          right: 20,
          background: "none",
          border: "none",
          color: "#9193A0",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          zIndex: 2,
          padding: "8px 12px",
        }}
      >
        Überspringen
      </button>

      {/* Content */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 32px 40px",
      }}>
        {/* Icon Circle */}
        <div style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: slide.bgGradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 40,
          boxShadow: `0 8px 32px ${slide.iconColor}33`,
        }}>
          <SlideIcon type={slide.icon} color="white" />
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 26,
          fontWeight: 700,
          color: "#4B164C",
          textAlign: "center",
          marginBottom: 16,
          lineHeight: 1.3,
        }}>
          {slide.title}
        </h2>

        {/* Description */}
        <p style={{
          fontSize: 15,
          color: "#73503D",
          textAlign: "center",
          lineHeight: 1.65,
          maxWidth: 300,
        }}>
          {slide.description}
        </p>
      </div>

      {/* Bottom: Progress + Navigation */}
      <div style={{
        padding: "24px 32px",
        paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
      }}>
        {/* Progress Dots */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          marginBottom: 24,
        }}>
          {slides.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentSlide ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === currentSlide ? "#F2894F" : "#E8D5C8",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Next / Start Button */}
        <button
          onClick={handleNext}
          style={{
            width: "100%",
            padding: "16px 32px",
            borderRadius: 16,
            backgroundColor: isLast ? "#4B164C" : "#F2894F",
            border: "none",
            color: "white",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "'Montserrat', sans-serif",
            cursor: "pointer",
            boxShadow: isLast
              ? "0 4px 16px rgba(75,22,76,0.3)"
              : "0 4px 16px rgba(242,137,79,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {isLast ? "Jetzt starten" : "Weiter"}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
