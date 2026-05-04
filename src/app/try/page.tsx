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
        }}>
          {/* Hero Image */}
          {preview && (
            <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
              <img src={preview} alt={recipe.dishName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)",
              }} />
              <div style={{
                position: "absolute", bottom: 16, left: 20, right: 20,
              }}>
                <h1 style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 24, fontWeight: 800, color: "white",
                  textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}>
                  {recipe.dishName}
                </h1>
              </div>
            </div>
          )}

          {/* Recipe Content */}
          <div style={{ padding: "16px 20px", flex: 1 }}>
            {/* Meta badges */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {recipe.prepTime + recipe.cookTime > 0 && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "6px 12px", borderRadius: 20,
                  backgroundColor: "#FEF1E8", fontSize: 12, fontWeight: 600, color: "#F2894F",
                }}>
                  {recipe.prepTime + recipe.cookTime} Min.
                </span>
              )}
              <span style={{
                padding: "6px 12px", borderRadius: 20,
                backgroundColor: "#FEF1E8", fontSize: 12, fontWeight: 600, color: "#F2894F",
              }}>
                {recipe.servings} Portionen
              </span>
              {recipe.difficulty && (
                <span style={{
                  padding: "6px 12px", borderRadius: 20,
                  backgroundColor: "#FEF1E8", fontSize: 12, fontWeight: 600, color: "#F2894F",
                }}>
                  {recipe.difficulty === "easy" ? "Einfach" : recipe.difficulty === "hard" ? "Anspruchsvoll" : "Mittel"}
                </span>
              )}
            </div>

            {/* Description */}
            {recipe.description && (
              <p style={{ fontSize: 14, color: "#555", lineHeight: 1.5, marginBottom: 20 }}>
                {recipe.description}
              </p>
            )}

            {/* Ingredients */}
            <h3 style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 16, fontWeight: 700, color: "#4B164C", marginBottom: 10,
            }}>
              Zutaten
            </h3>
            <div style={{
              backgroundColor: "white", borderRadius: 14, padding: 16,
              marginBottom: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
            }}>
              {recipe.ingredients.map((ing, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 0",
                  borderBottom: i < recipe.ingredients.length - 1 ? "1px solid #F5F5F5" : "none",
                }}>
                  <span style={{ fontSize: 14, color: "#333" }}>{ing.name}</span>
                  <span style={{ fontSize: 13, color: "#9193A0", fontWeight: 500 }}>
                    {ing.quantity} {ing.unit}
                  </span>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <h3 style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 16, fontWeight: 700, color: "#4B164C", marginBottom: 10,
            }}>
              Zubereitung
            </h3>
            <div style={{
              backgroundColor: "white", borderRadius: 14, padding: 16,
              marginBottom: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
            }}>
              {recipe.instructions.map((step, i) => (
                <div key={i} style={{
                  display: "flex", gap: 12, padding: "10px 0",
                  borderBottom: i < recipe.instructions.length - 1 ? "1px solid #F5F5F5" : "none",
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    backgroundColor: "#F2894F", color: "white",
                    fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 2,
                  }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: 14, color: "#333", lineHeight: 1.5, flex: 1 }}>
                    {step}
                  </p>
                </div>
              ))}
            </div>

            {/* ===== CTA: Rezept behalten ===== */}
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

            {/* Nochmal versuchen */}
            <button
              onClick={handleRetry}
              style={{
                marginTop: 16, width: "100%", padding: "12px",
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
