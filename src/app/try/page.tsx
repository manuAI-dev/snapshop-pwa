"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { parseRecipeJsonFromSSE } from "@/lib/parse-sse";

// ============================================================
// Try without Signup — öffentliche Demo-Page
// User fotografiert ein Rezept, sieht das AI-Ergebnis sofort.
// Kein Account nötig. Rezept wird in localStorage gespeichert.
// Nach Signup wird es automatisch in den Account übertragen.
// ============================================================

const GUEST_RECIPE_KEY = "snapshop_guest_recipe";

interface GuestRecipe {
  dishName: string;
  cuisine: string;
  description: string;
  ingredients: { name: string; quantity: string; unit: string; category: string; group?: string; notes?: string }[];
  instructions: string[];
  servings: number;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  nutrition?: any;
  recipeImages: string[];
  createdAt: string;
}

type Phase = "intro" | "capture" | "analyzing" | "result";

export default function TryPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [preview, setPreview] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<GuestRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Camera / File Select ----
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
      setPhase("capture");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAnalyze = async () => {
    if (!preview) return;
    setPhase("analyzing");
    setError(null);

    try {
      // Convert base64 to File
      const resp = await fetch(preview);
      const blob = await resp.blob();
      const file = new File([blob], "recipe.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("image", file);

      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch("/api/recipe/generate", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const recipeJson = await parseRecipeJsonFromSSE(response);

      const guestRecipe: GuestRecipe = {
        dishName: recipeJson.dishName || recipeJson.dish_name || "Rezept",
        cuisine: recipeJson.cuisine || "",
        description: recipeJson.description || "",
        ingredients: (recipeJson.ingredients || []).map((ing: any) => ({
          name: ing.name || "",
          quantity: String(ing.quantity || ""),
          unit: ing.unit || "",
          category: ing.category || "other",
          group: ing.group || undefined,
          notes: ing.notes || undefined,
        })),
        instructions: recipeJson.instructions || [],
        servings: recipeJson.servings || 4,
        prepTime: recipeJson.prepTime || recipeJson.prep_time || 0,
        cookTime: recipeJson.cookTime || recipeJson.cook_time || 0,
        difficulty: (recipeJson.difficulty || "medium").toLowerCase(),
        nutrition: recipeJson.nutrition || null,
        recipeImages: [preview],
        createdAt: new Date().toISOString(),
      };

      // In localStorage speichern
      localStorage.setItem(GUEST_RECIPE_KEY, JSON.stringify(guestRecipe));
      setRecipe(guestRecipe);
      setPhase("result");
    } catch (err: any) {
      setError(err.message || "Analyse fehlgeschlagen. Bitte nochmal versuchen.");
      setPhase("capture");
    }
  };

  const abortRef = useRef<AbortController | null>(null);

  const handleRetry = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPreview(null);
    setRecipe(null);
    setError(null);
    setPhase("intro");
  };

  const handleSkip = () => {
    window.location.href = "/landing.html";
  };

  const handleSignup = () => {
    router.push("/register");
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div style={{
      minHeight: "100dvh",
      backgroundColor: "#FFF3EB",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      {/* ====== PHASE: INTRO ====== */}
      {phase === "intro" && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "40px 24px", textAlign: "center",
        }}>
          {/* Logo */}
          <svg width="48" height="65" viewBox="0 0 81 109" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M24.1218 6.7171C25.2449 2.0201 29.9733 -0.879592 34.683 0.240449L70.0729 8.6567C74.7827 9.77675 77.6902 14.4924 76.5671 19.1894L74.0867 29.5634C72.9636 34.2604 68.2352 37.1601 63.5255 36.0401L30.2764 28.133C28.5361 27.7191 26.865 29.035 26.865 30.8192C26.865 31.8321 27.421 32.7637 28.3136 33.2466L74.0059 57.9682C78.3158 60.3001 81 64.7978 81 69.6879V76.0267C81 80.8554 77.075 84.7698 72.2332 84.7698H63.717C59.5766 84.7698 56.0006 87.6587 55.1411 91.698L52.9341 102.07C51.929 106.794 47.2747 109.81 42.5384 108.808L6.94873 101.276C2.21243 100.273 -0.812319 95.6316 0.192766 90.9081L2.37661 80.6449C3.38169 75.9214 8.03601 72.9048 12.7723 73.9072L50.9098 81.9784C52.636 82.3437 54.2613 81.0307 54.2613 79.2708C54.2613 78.2557 53.704 77.322 52.8093 76.8379L7.12036 52.1181C2.81042 49.7863 0.126259 45.2885 0.126259 40.3984V33.4039C0.126259 28.5752 4.05129 24.6608 8.89307 24.6608H12.9093C16.9677 24.6608 20.4956 21.8828 21.437 17.9457L24.1218 6.7171Z" fill="url(#try_logo)" />
            <defs>
              <linearGradient id="try_logo" x1="40.5" y1="2" x2="40.5" y2="108" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFD5D5" /><stop offset="1" stopColor="#F2894F" />
              </linearGradient>
            </defs>
          </svg>

          <h1 style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 28, fontWeight: 800, color: "#4B164C",
            marginTop: 16, lineHeight: 1.2,
          }}>
            Rezept abfotografieren.<br />Sofort digital.
          </h1>

          <p style={{
            fontSize: 15, color: "#73503D", lineHeight: 1.5,
            marginTop: 12, maxWidth: 320,
          }}>
            Fotografiere ein Rezept aus deinem Kochbuch — die AI erkennt Zutaten, Schritte und mehr. Kein Account nötig.
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              marginTop: 32, padding: "16px 40px", borderRadius: 16,
              border: "none", backgroundColor: "#F2894F",
              fontSize: 16, fontWeight: 700, color: "white",
              cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: "0 4px 16px rgba(242,137,79,0.4)",
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Rezept fotografieren
          </button>

          <p style={{ fontSize: 12, color: "#9193A0", marginTop: 16 }}>
            Kostenlos und ohne Registrierung
          </p>

          {/* Skip → Login/Register */}
          <button
            onClick={handleSkip}
            style={{
              marginTop: 32, padding: "12px 32px", borderRadius: 14,
              border: "1.5px solid #DCDDDC", backgroundColor: "white",
              fontSize: 14, fontWeight: 600, color: "#555",
              cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Überspringen
          </button>

          {/* Login link for existing users */}
          <button
            onClick={() => router.push("/login")}
            style={{
              marginTop: 12, background: "none", border: "none",
              fontSize: 13, color: "#9193A0", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              textDecoration: "underline",
            }}
          >
            Bereits einen Account? Einloggen
          </button>
        </div>
      )}

      {/* ====== PHASE: CAPTURE (preview + confirm) ====== */}
      {phase === "capture" && preview && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          padding: "24px 20px",
        }}>
          <h2 style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 20, fontWeight: 700, color: "#4B164C",
            marginBottom: 16,
          }}>
            Dein Foto
          </h2>

          <div style={{
            borderRadius: 16, overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            marginBottom: 16,
          }}>
            <img
              src={preview}
              alt="Rezeptfoto"
              style={{ width: "100%", maxHeight: 400, objectFit: "cover" }}
            />
          </div>

          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: 12,
              backgroundColor: "#FFF0F0", color: "#CC3D10",
              fontSize: 13, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleRetry}
              style={{
                flex: 1, padding: "14px 16px", borderRadius: 14,
                border: "1.5px solid #DCDDDC", backgroundColor: "white",
                fontSize: 14, fontWeight: 600, color: "#555",
                cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Nochmal
            </button>
            <button
              onClick={handleAnalyze}
              style={{
                flex: 1.4, padding: "14px 16px", borderRadius: 14,
                border: "none", backgroundColor: "#F2894F",
                fontSize: 14, fontWeight: 700, color: "white",
                cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 12 12 6" /><path d="M12 12 16 14" />
              </svg>
              Rezept erkennen
            </button>
          </div>
        </div>
      )}

      {/* ====== PHASE: ANALYZING ====== */}
      {phase === "analyzing" && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "40px 24px", textAlign: "center",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            border: "4px solid #FEF1E8", borderTopColor: "#F2894F",
            animation: "spin 1s linear infinite",
          }} />
          <h2 style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 20, fontWeight: 700, color: "#4B164C",
            marginTop: 24,
          }}>
            AI analysiert dein Rezept...
          </h2>
          <p style={{ fontSize: 14, color: "#9193A0", marginTop: 8 }}>
            Zutaten, Schritte und Nährwerte werden erkannt
          </p>
          <button
            onClick={handleRetry}
            style={{
              marginTop: 32, padding: "12px 32px", borderRadius: 14,
              border: "1.5px solid #DCDDDC", backgroundColor: "white",
              fontSize: 14, fontWeight: 600, color: "#555",
              cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Abbrechen
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* ====== PHASE: RESULT ====== */}
      {phase === "result" && recipe && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
          overflowY: "auto",
        }}>
          {/* Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '56px 20px 12px' }}>
            <button
              onClick={handleRetry}
              style={{
                width: 50, height: 50, borderRadius: '50%',
                border: '1px solid #E8E0D8', backgroundColor: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, cursor: 'pointer',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#212022" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <div style={{ flex: 1 }} />
            {/* Calendar */}
            <button
              onClick={handleSignup}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                border: '1px solid #E8E0D8', backgroundColor: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, cursor: 'pointer',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#525154" strokeWidth="2"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
            </button>
            {/* Cart */}
            <button
              onClick={handleSignup}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                border: '1px solid #E8E0D8', backgroundColor: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, cursor: 'pointer',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#525154" strokeWidth="2"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
            </button>
            {/* Heart */}
            <button
              onClick={handleSignup}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                border: '1px solid #E8E0D8', backgroundColor: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, cursor: 'pointer',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#525154" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
            </button>
            {/* Bookmark */}
            <button
              onClick={handleSignup}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                border: '1px solid #E8E0D8', backgroundColor: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, cursor: 'pointer',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#525154" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10l5 5v11a2 2 0 0 1-2 2z" /></svg>
            </button>
          </div>

          {/* Profile Row - Guest */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#F2894F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>G</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#212022' }}>Gast</p>
              <p style={{ fontSize: 11, color: '#9193A0' }}>Demo-Modus</p>
            </div>
            {/* Empty stars (non-interactive) */}
            <div style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                  fill="#DCDDDC" stroke="#DCDDDC" strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
          </div>

          {/* Recipe Image Card with overlay */}
          <div style={{ padding: '0 20px', marginBottom: 12 }}>
            <div
              style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', height: 220, background: 'linear-gradient(135deg, #F2894F 0%, #CC3D10 100%)' }}
            >
              {preview && (
                <img src={preview} alt={recipe.dishName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' }} />
              <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {recipe.prepTime + recipe.cookTime} Min.
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                    {recipe.servings} Personen
                  </span>
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: 'white', lineHeight: 1.2, fontFamily: "'Montserrat', sans-serif" }}>{recipe.dishName}</h1>
              </div>
            </div>
          </div>

          {/* Meta-Chips */}
          <div style={{ padding: '0 20px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {recipe.prepTime + recipe.cookTime > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, backgroundColor: 'white', fontSize: 12, fontWeight: 600, color: '#525154', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                {recipe.prepTime + recipe.cookTime} Min.
              </span>
            )}
            {recipe.difficulty && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, backgroundColor: 'white', fontSize: 12, fontWeight: 600, color: '#525154', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838.838-2.872a2 2 0 0 1 .506-.855z"/></svg>
                {recipe.difficulty === "easy" ? "Einfach" : recipe.difficulty === "medium" ? "Mittel" : recipe.difficulty === "hard" ? "Anspruchsvoll" : recipe.difficulty}
              </span>
            )}
          </div>

          {/* Description */}
          {recipe.description && (
            <div style={{ padding: '0 20px', marginBottom: 16 }}>
              <p style={{
                fontSize: 14, color: '#525154', lineHeight: 1.65,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontStyle: 'italic',
              }}>
                {recipe.description}
              </p>
            </div>
          )}

          {/* Nutrition Card with circular progress rings */}
          {recipe.nutrition && recipe.nutrition.calories > 0 && (
            <GuestNutritionCard nutrition={recipe.nutrition} servings={recipe.servings} />
          )}

          {/* Ingredients Card */}
          <div style={{ padding: '0 16px', marginTop: 8 }}>
            <div style={{
              backgroundColor: 'white', borderRadius: 20, padding: '20px 16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 700, color: '#4B164C', margin: 0 }}>Zutaten</h2>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F2894F', borderRadius: 30 }}>
                  <button onClick={() => {}} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>−</button>
                  <span style={{ color: 'white', fontSize: 12, fontWeight: 600, minWidth: 70, textAlign: 'center' }}>{recipe.servings} Pers.</span>
                  <button onClick={() => {}} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>+</button>
                </div>
              </div>

              {recipe.ingredients.map((ing, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: idx < recipe.ingredients.length - 1 ? '1px solid #F5F0EB' : 'none',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#212022', flex: 1, lineHeight: 1.4 }}>{ing.name}</span>
                  <span style={{ fontSize: 13, color: '#9193A0', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {ing.quantity} {ing.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div style={{ padding: '0 16px', marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 4, paddingRight: 4, marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 700, color: '#4B164C', margin: 0 }}>Zubereitung</h2>
                <p style={{ fontSize: 12, color: '#9193A0', marginTop: 2 }}>{recipe.instructions.length} Schritte</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recipe.instructions.map((step, idx) => (
                <div key={idx} style={{
                  backgroundColor: 'white', borderRadius: 16, padding: '14px 16px',
                  boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: '#D4C9BF',
                    fontFamily: "'Montserrat', sans-serif",
                    minWidth: 20, paddingTop: 1,
                  }}>{idx + 1}</span>
                  <p style={{
                    fontSize: 14, color: '#3A3A3C', lineHeight: 1.65, margin: 0,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ===== CTA: Account erstellen ===== */}
          <div style={{
            padding: '0 20px', marginTop: 24,
          }}>
            <div style={{
              backgroundColor: "#4B164C", borderRadius: 20, padding: "24px 20px",
              textAlign: "center",
            }}>
              <h3 style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 18, fontWeight: 700, color: "white",
                marginBottom: 8,
              }}>
                Rezept behalten?
              </h3>
              <p style={{
                fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.4,
                marginBottom: 20,
              }}>
                Erstell einen kostenlosen Account und speichere dieses Rezept dauerhaft — mit Wochenplaner und Einkaufsliste.
              </p>
              <button
                onClick={handleSignup}
                style={{
                  width: "100%", padding: "14px 24px", borderRadius: 14,
                  border: "none", backgroundColor: "#F2894F",
                  fontSize: 15, fontWeight: 700, color: "white",
                  cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: "0 4px 16px rgba(242,137,79,0.4)",
                }}
              >
                Kostenlos registrieren
              </button>
              <button
                onClick={() => router.push("/login")}
                style={{
                  marginTop: 10, width: "100%", background: "none", border: "none",
                  fontSize: 13, color: "rgba(255,255,255,0.6)",
                  cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Bereits einen Account? Einloggen
              </button>
            </div>

            {/* Anderes Rezept ausprobieren */}
            <button
              onClick={handleRetry}
              style={{
                marginTop: 16, marginBottom: 24, width: "100%", padding: "12px",
                background: "none", border: "1.5px solid #DCDDDC",
                borderRadius: 14, fontSize: 14, fontWeight: 600,
                color: "#555", cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Anderes Rezept ausprobieren
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Guest Nutrition Card — 4 circular progress rings
   ============================================================ */
function GuestNutritionCard({ nutrition, servings }: {
  nutrition: any;
  servings: number;
}) {
  const [showInsight, setShowInsight] = useState(false);
  const cal = Math.round(nutrition.calories || 0);
  const protein = Math.round(nutrition.protein || 0);
  const fat = Math.round(nutrition.fat || 0);
  const carbs = Math.round(nutrition.carbs || 0);

  const dailyRef = { calories: 2000, protein: 50, fat: 65, carbs: 300 };

  const items = [
    { label: "Kalorien", value: cal, unit: "kcal", color: "#F2894F", daily: dailyRef.calories },
    { label: "Protein", value: protein, unit: "g", color: "#4CAF50", daily: dailyRef.protein },
    { label: "Fett", value: fat, unit: "g", color: "#FFB74D", daily: dailyRef.fat },
    { label: "Carbs", value: carbs, unit: "g", color: "#7C4DFF", daily: dailyRef.carbs },
  ];

  const calPct = Math.round((cal / dailyRef.calories) * 100);
  const proteinPct = Math.round((protein / dailyRef.protein) * 100);
  const isHighProtein = proteinPct > 40;
  const isLowCal = calPct < 20;
  const isHighCal = calPct > 40;

  let insight = "";
  if (isHighProtein && !isHighCal) {
    insight = `Proteinreich (${proteinPct}% Tagesbedarf) bei moderaten Kalorien — gut für Muskelaufbau und Sättigung.`;
  } else if (isLowCal) {
    insight = `Leichte Mahlzeit mit nur ${calPct}% des Tagesbedarfs an Kalorien. Ideal als Vorspeise oder leichtes Abendessen.`;
  } else if (isHighCal) {
    insight = `Gehaltvollere Mahlzeit mit ${calPct}% des Tagesbedarfs. Ideal als Hauptmahlzeit — die anderen Mahlzeiten dürfen leichter ausfallen.`;
  } else {
    insight = `Ausgewogene Mahlzeit mit ${calPct}% des Tagesbedarfs an Kalorien und ${proteinPct}% des Proteins.`;
  }

  return (
    <div style={{ padding: '0 20px', marginBottom: 20 }}>
      <div style={{
        backgroundColor: 'white', borderRadius: 20, padding: '20px 16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}>
        <p style={{
          fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 700,
          color: '#F2894F', textTransform: 'uppercase', letterSpacing: 1.2,
          marginBottom: 16,
        }}>
          Nährwerte pro Portion
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {items.map((item) => {
            const pct = Math.min(100, (item.value / item.daily) * 100);
            const r = 28;
            const circ = 2 * Math.PI * r;
            const offset = circ - (pct / 100) * circ;
            return (
              <div key={item.label} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 8px' }}>
                  <svg width="64" height="64" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r={r} fill="none" stroke="#F0E8E1" strokeWidth="5" />
                    <circle
                      cx="32" cy="32" r={r} fill="none"
                      stroke={item.color} strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={circ}
                      strokeDashoffset={offset}
                      transform="rotate(-90 32 32)"
                      style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1E1F28', lineHeight: 1 }}>{item.value}</span>
                    <span style={{ fontSize: 9, color: '#9193A0', lineHeight: 1, marginTop: 1 }}>{item.unit}</span>
                  </div>
                </div>
                <span style={{ fontSize: 11, color: '#9193A0', fontWeight: 500 }}>{item.label}</span>
                <span style={{ fontSize: 9, color: '#C4C4C4', display: 'block', marginTop: 2 }}>{Math.round((item.value / item.daily) * 100)}%</span>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 10, color: '#C4C4C4', textAlign: 'center', marginTop: 12 }}>
          % vom Tagesbedarf (Basis: 2000 kcal)
        </p>

        <button
          onClick={() => setShowInsight(!showInsight)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', padding: '10px 0 0', marginTop: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            borderTop: '1px solid #F0E8E1',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
          </svg>
          <span style={{ fontSize: 12, color: '#F2894F', fontWeight: 600 }}>
            {showInsight ? "Einschätzung ausblenden" : "Einschätzung anzeigen"}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2.5">
            <path d={showInsight ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"} />
          </svg>
        </button>
        {showInsight && (
          <div style={{
            marginTop: 10, padding: '12px 14px', borderRadius: 12,
            backgroundColor: '#FEF8F4',
          }}>
            <p style={{ fontSize: 13, color: '#525154', lineHeight: 1.5, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {insight}
            </p>
            <p style={{ fontSize: 10, color: '#C4C4C4', marginTop: 8 }}>
              Nährwerte sind AI-geschätzt und dienen als Orientierung.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
