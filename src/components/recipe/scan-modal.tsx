"use client";

import { useState, useRef } from "react";
import { useRecipeStore } from "@/stores/recipe-store";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { useRouter } from "next/navigation";

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Phase = "input" | "analyzing" | "fridge-results" | "fridge-generating";
type InputTab = "foto" | "url" | "kuehlschrank" | "restaurant";

interface DetectedIngredient {
  name: string;
  quantity?: string;
  unit?: string;
  confidence: "high" | "medium" | "low";
}

interface FridgeRecipeSuggestion {
  dishName: string;
  description: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  ingredients: { name: string; quantity: string; unit: string; category: string }[];
  instructions: string[];
  cuisine: string;
  tags: string[];
}

export default function ScanModal({ isOpen, onClose }: ScanModalProps) {
  const [url, setUrl] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [phase, setPhase] = useState<Phase>("input");
  const [activeTab, setActiveTab] = useState<InputTab>("foto");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [detectedIngredients, setDetectedIngredients] = useState<DetectedIngredient[]>([]);
  const [fridgeRecipes, setFridgeRecipes] = useState<FridgeRecipeSuggestion[]>([]);
  const [fridgePrefs, setFridgePrefs] = useState("");
  const [fridgeError, setFridgeError] = useState<string | null>(null);
  const { generateFromImage, generateFromUrl, generateFromRestaurant, isGenerating, error, saveRecipe, recipes } = useRecipeStore();
  const { useFeature, checkGate } = useSubscriptionStore();
  const router = useRouter();

  if (!isOpen) return null;

  const resetAndClose = () => {
    setUrl("");
    setPreviews([]);
    setSelectedFiles([]);
    setPhase("input");
    setActiveTab("foto");
    setDetectedIngredients([]);
    setFridgeRecipes([]);
    setFridgePrefs("");
    setFridgeError(null);
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);
    // Generate previews for new files
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const compressImage = (file: File, maxWidth = 1600): Promise<{ file: File; base64: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, w, h);
        const base64 = canvas.toDataURL("image/jpeg", 0.85);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Compression failed"));
            const compressed = new File([blob], file.name, { type: "image/jpeg" });
            resolve({ file: compressed, base64 });
          },
          "image/jpeg",
          0.85
        );
      };
      img.onerror = reject;
      img.src = objUrl;
    });
  };

  const handleGenerateFromImage = async () => {
    if (selectedFiles.length === 0) return;
    // Gate: recipeImport (AI-Import) + recipeStore (Rezept-Limit)
    if (!useFeature("recipeImport")) return;
    if (!checkGate("recipeStore", recipes.length).allowed) {
      useFeature("recipeStore"); // triggers paywall
      return;
    }
    setPhase("analyzing");
    try {
      const compressed = await Promise.all(selectedFiles.map((f) => compressImage(f)));
      const files = compressed.map((c) => c.file);
      const base64s = compressed.map((c) => c.base64);
      const saved = await generateFromImage(files, base64s);
      resetAndClose();
      router.push(`/rezepte/${saved.id}`);
    } catch {
      setPhase("input");
    }
  };

  const handleGenerateFromUrl = async () => {
    if (!url) return;
    // Gate: recipeImport (AI-Import) + recipeStore (Rezept-Limit)
    if (!useFeature("recipeImport")) return;
    if (!checkGate("recipeStore", recipes.length).allowed) {
      useFeature("recipeStore");
      return;
    }
    setPhase("analyzing");
    try {
      const saved = await generateFromUrl(url);
      resetAndClose();
      router.push(`/rezepte/${saved.id}`);
    } catch {
      setPhase("input");
    }
  };

  // ====== Restaurant: Photo → Recipe ======
  const handleGenerateFromRestaurant = async () => {
    if (selectedFiles.length === 0) return;
    // Gate: recipeImport (AI-Import) + recipeStore (Rezept-Limit)
    if (!useFeature("recipeImport")) return;
    if (!checkGate("recipeStore", recipes.length).allowed) {
      useFeature("recipeStore");
      return;
    }
    setPhase("analyzing");
    try {
      const compressed = await Promise.all(selectedFiles.map((f) => compressImage(f)));
      const files = compressed.map((c) => c.file);
      const base64s = compressed.map((c) => c.base64);
      const saved = await generateFromRestaurant(files, base64s);
      resetAndClose();
      router.push(`/rezepte/${saved.id}`);
    } catch {
      setPhase("input");
    }
  };

  // ====== Fridge: Step 1 — Scan ingredients from photo ======
  const handleFridgeScan = async () => {
    if (selectedFiles.length === 0) return;
    // Gate: fridgeScan
    if (!useFeature("fridgeScan")) return;
    setPhase("analyzing");
    setFridgeError(null);
    try {
      const compressed = await Promise.all(selectedFiles.map((f) => compressImage(f)));
      const base64s = compressed.map((c) => c.base64);
      const res = await fetch("/api/recipe/fridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "scan", images: base64s }),
      });
      if (!res.ok) throw new Error("Scan fehlgeschlagen");
      const data = await res.json();
      setDetectedIngredients(data.ingredients || []);
      setPhase("fridge-results");
    } catch (err: any) {
      setFridgeError(err?.message || "Fehler beim Scannen");
      setPhase("input");
    }
  };

  // ====== Fridge: Step 2 — Generate recipes from ingredients ======
  const handleFridgeGenerate = async () => {
    setPhase("fridge-generating");
    setFridgeError(null);
    try {
      const ingredientNames = detectedIngredients.map((i) => i.name);
      const res = await fetch("/api/recipe/fridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "generate", ingredients: ingredientNames, preferences: fridgePrefs || undefined }),
      });
      if (!res.ok) throw new Error("Rezeptgenerierung fehlgeschlagen");
      const data = await res.json();
      setFridgeRecipes(data.recipes || []);
    } catch (err: any) {
      setFridgeError(err?.message || "Fehler beim Generieren");
      setPhase("fridge-results");
    }
  };

  // ====== Fridge: Save a recipe suggestion ======
  const handleSaveFridgeRecipe = async (recipe: FridgeRecipeSuggestion) => {
    // Gate: recipeStore (Rezept-Limit)
    if (!checkGate("recipeStore", recipes.length).allowed) {
      useFeature("recipeStore");
      return;
    }
    try {
      const saved = saveRecipe({
        dishName: recipe.dishName,
        description: recipe.description,
        servings: recipe.servings,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        difficulty: (recipe.difficulty as "easy" | "medium" | "hard") || "medium",
        cuisine: recipe.cuisine,
        instructions: recipe.instructions,
        ingredients: recipe.ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          category: (ing.category || "other") as import("@/types/recipe").IngredientCategory,
          isSelected: true,
        })),
        recipeImages: [],
        isFavorite: false,
      });
      resetAndClose();
      router.push(`/rezepte/${saved.id}`);
    } catch {
      setFridgeError("Speichern fehlgeschlagen");
    }
  };

  const removeIngredient = (index: number) => {
    setDetectedIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const addIngredient = (name: string) => {
    if (!name.trim()) return;
    setDetectedIngredients((prev) => [...prev, { name: name.trim(), confidence: "high" as const }]);
  };

  // ====== Fridge Results: Show detected ingredients ======
  if (phase === "fridge-results") {
    return (
      <FridgeResultsScreen
        ingredients={detectedIngredients}
        onRemove={removeIngredient}
        onAdd={addIngredient}
        preferences={fridgePrefs}
        onPrefsChange={setFridgePrefs}
        onGenerate={handleFridgeGenerate}
        onBack={() => { setPhase("input"); setDetectedIngredients([]); }}
        error={fridgeError}
      />
    );
  }

  // ====== Fridge Generating: Show recipe suggestions ======
  if (phase === "fridge-generating") {
    if (fridgeRecipes.length > 0) {
      return (
        <FridgeRecipesScreen
          recipes={fridgeRecipes}
          onSave={handleSaveFridgeRecipe}
          onBack={() => { setFridgeRecipes([]); setPhase("fridge-results"); }}
          onClose={resetAndClose}
        />
      );
    }
    // Still loading
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "#FFF3EB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #FFD5D5, #F2894F)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" /></svg>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: "#4B164C", fontFamily: "'Montserrat', sans-serif", marginBottom: 8 }}>Kreative Rezepte werden erstellt</h3>
        <p style={{ fontSize: 14, color: "#9193A0" }}>{detectedIngredients.length} Zutaten werden kombiniert...</p>
        <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#F2894F", animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`, opacity: 0.4 }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }`}</style>
      </div>
    );
  }

  // ====== Analyzing Phase ======
  if (phase === "analyzing") {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "#FFF3EB", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "60px 20px 24px" }}>
          <span style={{ fontSize: 20 }}>✨</span>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#212022", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AI Analyse</h2>
        </div>

        {previews.length > 0 && (
          <div style={{ padding: "0 40px", marginBottom: 40 }}>
            {previews.length === 1 ? (
              <div style={{ transform: "rotate(-3deg)", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", maxHeight: 320 }}>
                <img src={previews[0]} alt="Rezept" style={{ width: "100%", objectFit: "cover" }} />
              </div>
            ) : (
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                {previews.map((p, i) => (
                  <div key={i} style={{ transform: `rotate(${i % 2 === 0 ? -3 : 3}deg)`, borderRadius: 12, overflow: "hidden", boxShadow: "0 6px 16px rgba(0,0,0,0.15)", width: `${Math.min(140, 260 / previews.length)}px`, height: 180 }}>
                    <img src={p} alt={`Seite ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}
            <p style={{ textAlign: "center", fontSize: 12, color: "#9193A0", marginTop: 12 }}>
              {previews.length > 1 ? `${previews.length} Seiten werden kombiniert` : ""}
            </p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: previews.length > 0 ? 0 : 80 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#F2894F", animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`, opacity: 0.4 }} />
            ))}
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#212022", fontFamily: "'Montserrat', sans-serif" }}>
            {activeTab === "url" ? "Website wird analysiert" : activeTab === "restaurant" ? "Gericht wird erkannt" : "Foto wird analysiert"}
          </h3>
          <p style={{ fontSize: 13, color: "#9193A0" }}>Dies kann einen Moment dauern</p>

          {error && (
            <div style={{ backgroundColor: "rgba(230,73,73,0.1)", color: "#E64949", fontSize: 13, padding: "12px 20px", borderRadius: 10, marginTop: 12, maxWidth: 300, textAlign: "center" }}>
              {error}
              <button onClick={() => setPhase("input")} style={{ display: "block", margin: "8px auto 0", color: "#F2894F", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>
                Zurück
              </button>
            </div>
          )}
        </div>

        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }`}</style>
      </div>
    );
  }

  // ====== Input Phase ======
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "#FFF3EB", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "56px 20px 16px" }}>
        <button
          onClick={resetAndClose}
          style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid #DCDDDC", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#212022" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <h2 style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: 700, color: "#212022", marginLeft: -44, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Rezept hinzufügen
        </h2>
      </div>

      <div style={{ padding: "0 24px 40px" }}>
        {/* Tab Toggle */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#F0E6DB",
            borderRadius: 14,
            padding: 4,
            marginBottom: 24,
          }}
        >
          <button
            onClick={() => setActiveTab("foto")}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 11,
              border: "none",
              backgroundColor: activeTab === "foto" ? "white" : "transparent",
              color: activeTab === "foto" ? "#212022" : "#9193A0",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: activeTab === "foto" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeTab === "foto" ? "#F2894F" : "#9193A0"} strokeWidth="2">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" />
            </svg>
            Foto
          </button>
          <button
            onClick={() => setActiveTab("url")}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 11,
              border: "none",
              backgroundColor: activeTab === "url" ? "white" : "transparent",
              color: activeTab === "url" ? "#212022" : "#9193A0",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: activeTab === "url" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeTab === "url" ? "#F2894F" : "#9193A0"} strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            URL
          </button>
          <button
            onClick={() => setActiveTab("kuehlschrank")}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 11,
              border: "none",
              backgroundColor: activeTab === "kuehlschrank" ? "white" : "transparent",
              color: activeTab === "kuehlschrank" ? "#212022" : "#9193A0",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: activeTab === "kuehlschrank" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeTab === "kuehlschrank" ? "#F2894F" : "#9193A0"} strokeWidth="2">
              <path d="M5 2h14a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M4 10h16"/><path d="M9 6v0"/><path d="M9 14v2"/>
            </svg>
            Kreativ
          </button>
          <button
            onClick={() => setActiveTab("restaurant")}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 11,
              border: "none",
              backgroundColor: activeTab === "restaurant" ? "white" : "transparent",
              color: activeTab === "restaurant" ? "#212022" : "#9193A0",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: activeTab === "restaurant" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeTab === "restaurant" ? "#F2894F" : "#9193A0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
            </svg>
            Dish
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: "rgba(230,73,73,0.1)", color: "#E64949", fontSize: 13, padding: "12px 16px", borderRadius: 10, marginBottom: 16 }}>{error}</div>
        )}

        {/* ====== FOTO TAB ====== */}
        {activeTab === "foto" && (
          <>
            {previews.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                {/* Image Grid */}
                <div style={{ display: "grid", gridTemplateColumns: previews.length === 1 ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  {previews.map((p, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: 14, overflow: "hidden", height: previews.length === 1 ? 220 : 140 }}>
                      <img src={p} alt={`Seite ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        onClick={() => removeImage(i)}
                        style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                      </button>
                      <div style={{ position: "absolute", bottom: 6, left: 6, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 6, padding: "2px 8px", fontSize: 10, color: "white", fontWeight: 600 }}>
                        Seite {i + 1}
                      </div>
                    </div>
                  ))}
                  {/* Add More Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      borderRadius: 14,
                      height: previews.length === 1 ? 60 : 140,
                      border: "2px dashed #E0D5CA",
                      backgroundColor: "white",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      cursor: "pointer",
                      gridColumn: previews.length === 1 ? "1" : "auto",
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    <span style={{ fontSize: 11, color: "#9193A0", fontWeight: 600 }}>Weitere Seite</span>
                  </button>
                </div>

                {previews.length > 1 && (
                  <div style={{ backgroundColor: "#E8F5E9", borderRadius: 10, padding: "8px 14px", marginBottom: 12, fontSize: 12, color: "#2E7D32", display: "flex", alignItems: "center", gap: 6 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                    {previews.length} Seiten werden zu einem Rezept kombiniert
                  </div>
                )}

                <button
                  onClick={handleGenerateFromImage}
                  style={{ width: "100%", padding: 16, borderRadius: 14, backgroundColor: "#F2894F", color: "white", fontWeight: 700, fontSize: 16, border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                  AI Rezept erkennen
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: "100%",
                  backgroundColor: "white",
                  borderRadius: 20,
                  padding: "40px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  border: "2px dashed #E0D5CA",
                  cursor: "pointer",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    backgroundColor: "#FEF1E8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" />
                  </svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#212022" }}>Rezeptfoto hochladen</span>
                <span style={{ fontSize: 12, color: "#9193A0" }}>Ein oder mehrere Fotos auswählen</span>
              </button>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: "none" }} />

            {/* Tips */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: 16,
                padding: "16px 18px",
                marginTop: 4,
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 700, color: "#212022", marginBottom: 10 }}>So geht's:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: "1", text: "Rezept aus Kochbuch, Zeitschrift oder Zettel fotografieren" },
                  { icon: "2", text: "Geht das Rezept über mehrere Seiten? Einfach alle Seiten fotografieren!" },
                  { icon: "3", text: "Achte auf gute Belichtung — alle Zutaten und Schritte sollten lesbar sein" },
                ].map((tip) => (
                  <div key={tip.icon} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        backgroundColor: "#FEF1E8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#F2894F",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {tip.icon}
                    </div>
                    <span style={{ fontSize: 13, color: "#525154", lineHeight: 1.4 }}>{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ====== URL TAB ====== */}
        {activeTab === "url" && (
          <>
            <div
              style={{
                backgroundColor: "white",
                borderRadius: 20,
                padding: "28px 20px",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 16,
                  backgroundColor: "#FEF1E8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>

              <p style={{ fontSize: 14, color: "#525154", textAlign: "center", marginBottom: 20, lineHeight: 1.4 }}>
                Füge die URL eines Online-Rezepts ein (z.B. von bettybossi.ch, chefkoch.de, migusto.ch)
              </p>

              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://bettybossi.ch/rezepte/..."
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 12,
                  backgroundColor: "#F9F6F2",
                  border: url ? "2px solid rgba(242,137,79,0.3)" : "2px solid transparent",
                  outline: "none",
                  fontSize: 14,
                  color: "#212022",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              onClick={handleGenerateFromUrl}
              disabled={!url}
              style={{
                width: "100%",
                padding: 16,
                borderRadius: 14,
                backgroundColor: !url ? "#E0D5CA" : "#F2894F",
                color: !url ? "#9193A0" : "white",
                fontWeight: 700,
                fontSize: 16,
                border: "none",
                cursor: !url ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                marginBottom: 20,
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              Rezept importieren
            </button>

            {/* Tips */}
            <div style={{ backgroundColor: "white", borderRadius: 16, padding: "16px 18px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#212022", marginBottom: 10 }}>Unterstützte Seiten:</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["fooby.ch", "bettybossi.ch", "migusto.migros.ch", "swissmilk.ch", "chefkoch.de", "und viele mehr"].map((site) => (
                  <span
                    key={site}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 8,
                      backgroundColor: site === "und viele mehr" ? "transparent" : "#F9F6F2",
                      fontSize: 12,
                      color: site === "und viele mehr" ? "#9193A0" : "#525154",
                      fontStyle: site === "und viele mehr" ? "italic" : "normal",
                    }}
                  >
                    {site}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ====== KÜHLSCHRANK TAB ====== */}
        {activeTab === "kuehlschrank" && (
          <>
            {fridgeError && (
              <div style={{ backgroundColor: "rgba(230,73,73,0.1)", color: "#E64949", fontSize: 13, padding: "12px 16px", borderRadius: 10, marginBottom: 16 }}>{fridgeError}</div>
            )}

            {previews.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: previews.length === 1 ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  {previews.map((p, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: 14, overflow: "hidden", height: previews.length === 1 ? 220 : 140 }}>
                      <img src={p} alt={`Bild ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        onClick={() => removeImage(i)}
                        style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{ borderRadius: 14, height: previews.length === 1 ? 60 : 140, border: "2px dashed #E0D5CA", backgroundColor: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", gridColumn: previews.length === 1 ? "1" : "auto" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    <span style={{ fontSize: 11, color: "#9193A0", fontWeight: 600 }}>Weiteres Foto</span>
                  </button>
                </div>

                <button
                  onClick={handleFridgeScan}
                  style={{ width: "100%", padding: 16, borderRadius: 14, background: "linear-gradient(135deg, #4B164C, #7B2D7D)", color: "white", fontWeight: 700, fontSize: 16, border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(75,22,76,0.3)" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                  Zutaten erkennen
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ width: "100%", backgroundColor: "white", borderRadius: 20, padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, border: "2px dashed #E0D5CA", cursor: "pointer", marginBottom: 20 }}
              >
                <div style={{ width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg, #F3E5F5, #E1BEE7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7B2D7D" strokeWidth="2">
                    <path d="M5 2h14a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M4 10h16"/><path d="M9 6v0"/><path d="M9 14v2"/>
                  </svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#212022" }}>Kühlschrank fotografieren</span>
                <span style={{ fontSize: 12, color: "#9193A0", textAlign: "center" }}>Fotografiere deinen Kühlschrank oder Zutaten auf dem Tisch</span>
              </button>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: "none" }} />

            <div style={{ backgroundColor: "white", borderRadius: 16, padding: "16px 18px", marginTop: 4 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#212022", marginBottom: 10 }}>So geht's:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: "1", text: "Fotografiere deinen offenen Kühlschrank oder Zutaten auf der Arbeitsfläche" },
                  { icon: "2", text: "KI erkennt alle sichtbaren Lebensmittel automatisch" },
                  { icon: "3", text: "Du erhältst 3 kreative Rezeptvorschläge basierend auf deinen Zutaten" },
                ].map((tip) => (
                  <div key={tip.icon} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "#F3E5F5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#7B2D7D", flexShrink: 0, marginTop: 1 }}>
                      {tip.icon}
                    </div>
                    <span style={{ fontSize: 13, color: "#525154", lineHeight: 1.4 }}>{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ====== RESTAURANT TAB ====== */}
        {activeTab === "restaurant" && (
          <>
            {previews.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginBottom: 12 }}>
                  {previews.map((p, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: 14, overflow: "hidden", height: 220 }}>
                      <img src={p} alt={`Gericht ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        onClick={() => removeImage(i)}
                        style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.5)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleGenerateFromRestaurant}
                  style={{
                    width: "100%", padding: 16, borderRadius: 14,
                    background: "linear-gradient(135deg, #E65100, #F2894F)",
                    color: "white", fontWeight: 700, fontSize: 16, border: "none",
                    cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: "0 4px 16px rgba(230,81,0,0.3)",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                  Gericht erkennen & Rezept erstellen
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ width: "100%", backgroundColor: "white", borderRadius: 20, padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, border: "2px dashed #E0D5CA", cursor: "pointer", marginBottom: 20 }}
              >
                <div style={{ width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg, #FFE0B2, #F2894F)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
                  </svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#212022" }}>Restaurant-Gericht fotografieren</span>
                <span style={{ fontSize: 12, color: "#9193A0", textAlign: "center" }}>Fotografiere ein Gericht und erhalte das Rezept zum Nachkochen</span>
              </button>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />

            <div style={{ backgroundColor: "white", borderRadius: 16, padding: "16px 18px", marginTop: 4 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#212022", marginBottom: 10 }}>So geht's:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: "1", text: "Fotografiere das Gericht im Restaurant — am besten von oben, gut beleuchtet" },
                  { icon: "2", text: "KI erkennt das Gericht und erstellt ein Rezept zum Nachkochen" },
                  { icon: "3", text: "Inklusive Anrichte-Tipps für die Restaurant-Präsentation zuhause" },
                ].map((tip) => (
                  <div key={tip.icon} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "#FFF3E0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#E65100", flexShrink: 0, marginTop: 1 }}>
                      {tip.icon}
                    </div>
                    <span style={{ fontSize: 13, color: "#525154", lineHeight: 1.4 }}>{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Fridge Results Screen — Show detected ingredients
// ============================================================

function FridgeResultsScreen({ ingredients, onRemove, onAdd, preferences, onPrefsChange, onGenerate, onBack, error }: {
  ingredients: DetectedIngredient[];
  onRemove: (i: number) => void;
  onAdd: (name: string) => void;
  preferences: string;
  onPrefsChange: (v: string) => void;
  onGenerate: () => void;
  onBack: () => void;
  error: string | null;
}) {
  const [newIngredient, setNewIngredient] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "#FFF3EB", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "56px 20px 16px" }}>
        <button onClick={onBack} style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid #DCDDDC", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#212022" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <h2 style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: 700, color: "#212022", marginLeft: -44, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Erkannte Zutaten
        </h2>
      </div>

      <div style={{ padding: "0 24px 40px" }}>
        <p style={{ fontSize: 14, color: "#9193A0", textAlign: "center", marginBottom: 20 }}>
          {ingredients.length} Zutaten erkannt. Entferne oder ergänze nach Bedarf.
        </p>

        {error && (
          <div style={{ backgroundColor: "rgba(230,73,73,0.1)", color: "#E64949", fontSize: 13, padding: "12px 16px", borderRadius: 10, marginBottom: 16 }}>{error}</div>
        )}

        {/* Ingredient chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {ingredients.map((ing, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 12px", borderRadius: 20,
              backgroundColor: ing.confidence === "high" ? "#E8F5E9" : ing.confidence === "medium" ? "#FFF8E1" : "#FFF3E0",
              border: `1px solid ${ing.confidence === "high" ? "#A5D6A7" : ing.confidence === "medium" ? "#FFE082" : "#FFCC80"}`,
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#212022" }}>{ing.name}</span>
              {ing.quantity && <span style={{ fontSize: 12, color: "#9193A0" }}>{ing.quantity}{ing.unit ? ` ${ing.unit}` : ""}</span>}
              <button onClick={() => onRemove(i)} style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, marginLeft: 2 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="3"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
          ))}
        </div>

        {/* Add custom ingredient */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <input
            type="text"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            placeholder="Zutat ergänzen..."
            onKeyDown={(e) => { if (e.key === "Enter") { onAdd(newIngredient); setNewIngredient(""); } }}
            style={{ flex: 1, padding: "12px 16px", borderRadius: 12, backgroundColor: "white", border: "2px solid #E0D5CA", outline: "none", fontSize: 14, color: "#212022", fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: "border-box" }}
          />
          <button onClick={() => { onAdd(newIngredient); setNewIngredient(""); }} disabled={!newIngredient.trim()}
            style={{ padding: "12px 16px", borderRadius: 12, backgroundColor: newIngredient.trim() ? "#F2894F" : "#E0D5CA", color: "white", border: "none", fontWeight: 700, cursor: newIngredient.trim() ? "pointer" : "not-allowed" }}>
            +
          </button>
        </div>

        {/* Preferences */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#212022", marginBottom: 8 }}>Wünsche (optional)</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Schnell", "Vegetarisch", "Italienisch", "Asiatisch", "Low Carb", "Familienfreundlich"].map((pref) => {
              const isActive = preferences.toLowerCase().includes(pref.toLowerCase());
              return (
                <button key={pref} onClick={() => {
                  if (isActive) onPrefsChange(preferences.replace(new RegExp(pref + ",?\\s*", "i"), "").trim());
                  else onPrefsChange((preferences ? preferences + ", " : "") + pref);
                }} style={{
                  padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: isActive ? "2px solid #4B164C" : "2px solid #E0D5CA",
                  backgroundColor: isActive ? "#F3E5F5" : "white",
                  color: isActive ? "#4B164C" : "#525154",
                }}>
                  {pref}
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={onGenerate}
          disabled={ingredients.length === 0}
          style={{
            width: "100%", padding: 16, borderRadius: 14,
            background: ingredients.length > 0 ? "linear-gradient(135deg, #4B164C, #7B2D7D)" : "#E0D5CA",
            color: "white", fontWeight: 700, fontSize: 16, border: "none",
            cursor: ingredients.length > 0 ? "pointer" : "not-allowed",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: ingredients.length > 0 ? "0 4px 16px rgba(75,22,76,0.3)" : "none",
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
          3 Rezepte generieren
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Fridge Recipes Screen — Show 3 recipe suggestions
// ============================================================

function FridgeRecipesScreen({ recipes, onSave, onBack, onClose }: {
  recipes: FridgeRecipeSuggestion[];
  onSave: (r: FridgeRecipeSuggestion) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, backgroundColor: "#FFF3EB", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "56px 20px 16px" }}>
        <button onClick={onBack} style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid #DCDDDC", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#212022" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <h2 style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: 700, color: "#212022", marginLeft: -44, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Rezeptvorschläge
        </h2>
      </div>

      <div style={{ padding: "0 24px 40px" }}>
        <p style={{ fontSize: 14, color: "#9193A0", textAlign: "center", marginBottom: 20 }}>
          Wähle ein Rezept aus, um es zu speichern
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {recipes.map((recipe, i) => (
            <div key={i} style={{ backgroundColor: "white", borderRadius: 20, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#212022", fontFamily: "'Montserrat', sans-serif", marginBottom: 4 }}>{recipe.dishName}</h3>
                  <p style={{ fontSize: 13, color: "#9193A0", lineHeight: 1.4 }}>{recipe.description}</p>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #FFD5D5, #F2894F)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 12 }}>
                  <span style={{ fontSize: 20 }}>{["🍳", "🥗", "🍲"][i] || "🍽️"}</span>
                </div>
              </div>

              {/* Meta */}
              <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#525154", display: "flex", alignItems: "center", gap: 4 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  {recipe.prepTime + recipe.cookTime} Min.
                </span>
                <span style={{ fontSize: 12, color: "#525154" }}>{recipe.servings} Portionen</span>
                <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 6, backgroundColor: recipe.difficulty === "easy" ? "#E8F5E9" : recipe.difficulty === "medium" ? "#FFF8E1" : "#FFEBEE", color: recipe.difficulty === "easy" ? "#2E7D32" : recipe.difficulty === "medium" ? "#F57F17" : "#C62828" }}>
                  {recipe.difficulty === "easy" ? "Einfach" : recipe.difficulty === "medium" ? "Mittel" : "Anspruchsvoll"}
                </span>
              </div>

              {/* Tags */}
              {recipe.tags && recipe.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
                  {recipe.tags.map((tag) => (
                    <span key={tag} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, backgroundColor: "#F3E5F5", color: "#7B2D7D", fontWeight: 600 }}>{tag}</span>
                  ))}
                </div>
              )}

              {/* Ingredients preview */}
              <p style={{ fontSize: 12, color: "#9193A0", marginBottom: 14 }}>
                {recipe.ingredients.slice(0, 5).map((i) => i.name).join(", ")}
                {recipe.ingredients.length > 5 ? ` +${recipe.ingredients.length - 5} mehr` : ""}
              </p>

              {/* Save button */}
              <button
                onClick={() => onSave(recipe)}
                style={{ width: "100%", padding: 14, borderRadius: 12, backgroundColor: "#F2894F", color: "white", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8" /><path d="M7 3v5h8" /></svg>
                Rezept speichern
              </button>
            </div>
          ))}
        </div>

        <button onClick={onClose} style={{ width: "100%", padding: 14, marginTop: 16, background: "none", border: "none", color: "#9193A0", fontSize: 14, cursor: "pointer" }}>
          Schliessen
        </button>
      </div>
    </div>
  );
}
