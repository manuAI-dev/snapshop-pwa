"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRecipeStore } from "@/stores/recipe-store";
import { useRecipeListStore } from "@/stores/recipe-list-store";
import { useShoppingStore } from "@/stores/shopping-store";
import { usePlannerStore } from "@/stores/planner-store";
import { useAuthStore } from "@/stores/auth-store";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { Recipe, Ingredient, getTotalTime, NutritionInfo } from "@/types";

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { recipes, currentRecipe, deleteRecipe, updateRecipe, loadRecipes } = useRecipeStore();
  const { addRecipe: addToShopping } = useShoppingStore();
  const { addMeal } = usePlannerStore();
  const { user } = useAuthStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addedToList, setAddedToList] = useState(false);
  const [servings, setServings] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false); // initialized from recipe in useEffect
  const [rating, setRating] = useState(0);
  const [editingIngIdx, setEditingIngIdx] = useState<number | null>(null);
  const [editIngData, setEditIngData] = useState({ name: "", quantity: "", unit: "" });
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [altIngIdx, setAltIngIdx] = useState<number | null>(null);
  const [altLoading, setAltLoading] = useState(false);
  const [altData, setAltData] = useState<{ originalIngredient: string; isExotic: boolean; alternatives: { name: string; ratio: string; note: string }[]; tip?: string } | null>(null);
  const [cookingMode, setCookingMode] = useState(false);
  const [cookingStep, setCookingStep] = useState(0);
  const [editingSource, setEditingSource] = useState(false);
  const [sourceInput, setSourceInput] = useState("");
  const [showListModal, setShowListModal] = useState(false);
  const [newListInput, setNewListInput] = useState("");
  const { useFeature: useSubFeature } = useSubscriptionStore();
  const { lists, addRecipeToList, removeRecipeFromList, createList, getListsForRecipe } = useRecipeListStore();

  const startCookingMode = (step: number) => {
    // Gate: cookingMode
    if (!useSubFeature("cookingMode")) return;
    setCookingStep(step);
    setCookingMode(true);
  };

  useEffect(() => {
    if (recipes.length === 0) loadRecipes();
  }, [recipes.length, loadRecipes]);

  const recipe: Recipe | undefined =
    recipes.find((r) => r.id === params.id) ||
    (currentRecipe?.id === params.id ? currentRecipe : undefined);

  useEffect(() => {
    if (recipe && servings === 0) {
      setServings(recipe.servings);
      setRating(recipe.rating || 0);
      setIsFavorite(recipe.isFavorite || false);
    }
  }, [recipe, servings]);

  if (!recipe) {
    return (
      <div style={{ padding: '64px 20px', textAlign: 'center' }}>
        <p style={{ color: '#9193A0' }}>Rezept nicht gefunden.</p>
        <button onClick={() => router.push("/rezepte")} style={{ marginTop: 16, color: '#F2894F', fontWeight: 600, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>
          Zurück zu Rezepten
        </button>
      </div>
    );
  }

  const multiplier = servings / (recipe.servings || 1);

  const handleAddToShoppingList = () => {
    const adjustedRecipe: Recipe = {
      ...recipe,
      ingredients: recipe.ingredients.map((ing) => ({
        ...ing,
        quantity: multiplier !== 1 ? adjustQuantity(ing.quantity, multiplier) : ing.quantity,
      })),
    };
    addToShopping(adjustedRecipe);
    setAddedToList(true);
    setTimeout(() => setAddedToList(false), 2000);
  };

  const handleDelete = async () => {
    if (recipe.id) {
      deleteRecipe(recipe.id);
      router.push("/rezepte");
    }
  };

  const handleToggleFavorite = () => {
    const newVal = !isFavorite;
    setIsFavorite(newVal);
    if (recipe.id) {
      updateRecipe(recipe.id, { isFavorite: newVal });
    }
  };

  const handleSetRating = (stars: number) => {
    setRating(stars);
    if (recipe.id) {
      updateRecipe(recipe.id, { rating: stars });
    }
  };

  const handleAddToCalendar = () => {
    if (recipe.id) {
      addMeal(
        recipe.id,
        recipe.dishName,
        recipe.recipeImages?.[0],
        calendarDate,
        "abendessen",
        servings
      );
      setShowCalendarPicker(false);
    }
  };

  const handleShowAlternatives = async (idx: number) => {
    if (altIngIdx === idx && altData) { setAltIngIdx(null); setAltData(null); return; } // toggle off
    // Gate: ingredientAlt
    if (!useSubFeature("ingredientAlt")) return;
    const ing = recipe.ingredients[idx];
    setAltIngIdx(idx);
    setAltData(null);
    setAltLoading(true);
    try {
      const context = recipe.ingredients.map((i) => i.name).join(", ");
      const res = await fetch("/api/recipe/alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredient: ing.name, recipeName: recipe.dishName, recipeContext: context }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAltData(data);
    } catch {
      setAltData({ originalIngredient: ing.name, isExotic: false, alternatives: [], tip: "Alternativen konnten nicht geladen werden." });
    } finally {
      setAltLoading(false);
    }
  };

  const handleEditIngredient = (idx: number) => {
    const ing = recipe.ingredients[idx];
    setEditIngData({ name: ing.name, quantity: ing.quantity, unit: ing.unit });
    setEditingIngIdx(idx);
  };

  const handleSaveIngredient = () => {
    if (editingIngIdx === null || !recipe.id) return;
    const newIngredients = [...recipe.ingredients];
    newIngredients[editingIngIdx] = {
      ...newIngredients[editingIngIdx],
      name: editIngData.name,
      quantity: editIngData.quantity,
      unit: editIngData.unit,
    };
    updateRecipe(recipe.id, { ingredients: newIngredients });
    setEditingIngIdx(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !recipe.id) return;
    try {
      const { compressImage } = await import("@/utils/compress-image");
      const base64 = await compressImage(file, 1200, 0.75);
      const images = [...(recipe.recipeImages || []), base64];
      updateRecipe(recipe.id!, { recipeImages: images });
    } catch (err) {
      console.error("Image compression failed:", err);
    }
    e.target.value = "";
  };

  const RoundBtn = ({ children, onClick, size = 44 }: { children: React.ReactNode; onClick?: () => void; size?: number }) => (
    <button
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: '50%',
        border: '1px solid #E8E0D8', backgroundColor: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ backgroundColor: '#FFF3EB', minHeight: '100vh', paddingBottom: 160 }}>
      {/* Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '56px 20px 12px' }}>
        <RoundBtn onClick={() => router.back()} size={50}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#212022" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
        </RoundBtn>
        <div style={{ flex: 1 }} />
        {/* Calendar - navigate to calendar with recipe context */}
        <RoundBtn onClick={() => router.push(`/kalender?addRecipe=${recipe.id}`)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#525154" strokeWidth="2"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
        </RoundBtn>
        {/* Cart - add to shopping */}
        <RoundBtn onClick={handleAddToShoppingList}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={addedToList ? "#4CAF50" : "#525154"} strokeWidth="2"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
        </RoundBtn>
        {/* Heart - favorite toggle */}
        <RoundBtn onClick={handleToggleFavorite}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill={isFavorite ? "#F2894F" : "none"}
            stroke={isFavorite ? "#F2894F" : "#525154"} strokeWidth="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </RoundBtn>
        {/* Bookmark - add to list */}
        <RoundBtn onClick={() => setShowListModal(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#525154" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10l5 5v11a2 2 0 0 1-2 2z" /></svg>
        </RoundBtn>
        {/* Delete */}
        <RoundBtn onClick={() => setShowDeleteConfirm(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9193A0" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
        </RoundBtn>
      </div>

      {/* Profile Row with interactive stars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#F2894F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>{user?.name?.charAt(0)?.toUpperCase() || "?"}</span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#212022' }}>{user?.name || "User"}</p>
          <p style={{ fontSize: 11, color: '#9193A0' }}>{recipes.length} Rezepte</p>
        </div>
        {/* Interactive star rating */}
        <div style={{ display: 'flex', gap: 2 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleSetRating(star)}
              style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill={star <= rating ? "#F2894F" : "#DCDDDC"}
                stroke={star <= rating ? "#F2894F" : "#DCDDDC"} strokeWidth="1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Recipe Image Card — tap to view fullscreen */}
      <div style={{ padding: '0 20px', marginBottom: 12 }}>
        <div
          onClick={() => recipe.recipeImages?.[0] && setViewerImage(recipe.recipeImages[0])}
          style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', height: 220, background: 'linear-gradient(135deg, #F2894F 0%, #CC3D10 100%)', cursor: recipe.recipeImages?.[0] ? 'pointer' : 'default' }}
        >
          {recipe.recipeImages?.[0] && (
            <img src={recipe.recipeImages[0]} alt={recipe.dishName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' }} />
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                {getTotalTime(recipe)} Minuten
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

      {/* Thumbnail row + upload button — tap to view fullscreen */}
      <div style={{ padding: '0 20px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        {recipe.recipeImages?.slice(0, 3).map((img, i) => (
          <div
            key={i}
            onClick={() => setViewerImage(img)}
            style={{ width: 65, height: 65, borderRadius: 14, overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}
          >
            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
        {/* + Upload button */}
        <button
          onClick={() => imageInputRef.current?.click()}
          style={{ width: 65, height: 65, borderRadius: 14, border: '2px dashed #DCDDDC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'none', cursor: 'pointer' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CDD0D8" strokeWidth="2"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
        </button>
        <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
      </div>

      {/* Meta-Chips: Zeit, Schwierigkeit, Quelle */}
      <div style={{ padding: '0 20px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {getTotalTime(recipe) > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, backgroundColor: 'white', fontSize: 12, fontWeight: 600, color: '#525154', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            {getTotalTime(recipe)} Min.
          </span>
        )}
        {recipe.difficulty && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, backgroundColor: 'white', fontSize: 12, fontWeight: 600, color: '#525154', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838.838-2.872a2 2 0 0 1 .506-.855z"/></svg>
            {recipe.difficulty === "easy" ? "Einfach" : recipe.difficulty === "medium" ? "Mittel" : recipe.difficulty === "hard" ? "Anspruchsvoll" : recipe.difficulty}
          </span>
        )}
        {/* Quelle — URL (klickbar) oder manueller Name */}
        {(() => {
          const src = recipe.sourceUrl || "";
          const isUrl = src.startsWith("http");
          const sourceName = isUrl
            ? (src.includes("fooby.ch") ? "Fooby" : src.includes("bettybossi.ch") ? "Betty Bossi" : src.includes("migusto.migros.ch") ? "Migusto" : src.includes("swissmilk.ch") ? "Swissmilk" : null)
            : null;
          const sourceColor = isUrl
            ? (src.includes("fooby.ch") ? "#00A651" : src.includes("bettybossi.ch") ? "#D4145A" : src.includes("migusto.migros.ch") ? "#FF6600" : src.includes("swissmilk.ch") ? "#0077B6" : "#F2894F")
            : "#8C7060";

          // Editing mode — inline input
          if (editingSource) {
            return (
              <form onSubmit={(e) => { e.preventDefault(); const val = sourceInput.trim(); updateRecipe(recipe.id, { sourceUrl: val || undefined }); setEditingSource(false); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <input
                  autoFocus
                  value={sourceInput}
                  onChange={(e) => setSourceInput(e.target.value)}
                  placeholder="z.B. Mein Kochbuch"
                  style={{ padding: '6px 12px', borderRadius: 20, border: '2px solid #F2894F', fontSize: 12, fontWeight: 600, color: '#212022', outline: 'none', width: 160, fontFamily: "'Plus Jakarta Sans', sans-serif", backgroundColor: 'white' }}
                />
                <button type="submit" style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#F2894F', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                </button>
                <button type="button" onClick={() => setEditingSource(false)} style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#F5F0EC', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9193A0" strokeWidth="2.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              </form>
            );
          }

          // Known URL source (Fooby, Betty Bossi, etc.)
          if (isUrl && sourceName) {
            return (
              <a href={src} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, backgroundColor: 'white', fontSize: 12, fontWeight: 700, color: sourceColor, textDecoration: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={sourceColor} strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                {sourceName}
              </a>
            );
          }

          // Unknown URL source
          if (isUrl) {
            return (
              <a href={src} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, backgroundColor: 'white', fontSize: 12, fontWeight: 600, color: '#F2894F', textDecoration: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                Originalrezept
              </a>
            );
          }

          // Manual source name (not a URL)
          if (src) {
            return (
              <button onClick={() => { setSourceInput(src); setEditingSource(true); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, backgroundColor: 'white', fontSize: 12, fontWeight: 600, color: sourceColor, border: 'none', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={sourceColor} strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                {src}
              </button>
            );
          }

          // No source — show "add source" button
          return (
            <button onClick={() => { setSourceInput(""); setEditingSource(true); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, backgroundColor: 'white', fontSize: 12, fontWeight: 500, color: '#C4B8AC', border: '1px dashed #D4C9BF', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C4B8AC" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
              + Quelle
            </button>
          );
        })()}
      </div>

      {/* Beschreibung / Einleitungstext */}
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

      {/* Nährwerte Card */}
      {recipe.nutrition && recipe.nutrition.calories > 0 && (
        <NutritionCard nutrition={recipe.nutrition} servings={servings} originalServings={recipe.servings} />
      )}

      {/* Zutaten — Weisse Karte */}
      <div style={{ padding: '0 16px', marginTop: 8 }}>
        <div style={{
          backgroundColor: 'white', borderRadius: 20, padding: '20px 16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 700, color: '#4B164C', margin: 0 }}>Zutaten</h2>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F2894F', borderRadius: 30 }}>
              <button onClick={() => setServings(Math.max(1, servings - 1))} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>−</button>
              <span style={{ color: 'white', fontSize: 12, fontWeight: 600, minWidth: 70, textAlign: 'center' }}>{servings} Pers.</span>
              <button onClick={() => setServings(servings + 1)} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>+</button>
            </div>
          </div>

          {recipe.ingredients.map((ing, idx) => {
            const prevGroup = idx > 0 ? recipe.ingredients[idx - 1].group : "";
            const showGroupHeader = ing.group && ing.group !== prevGroup;

            return (
              <div key={idx}>
                {showGroupHeader && (
                  <p style={{
                    fontFamily: "'Montserrat', sans-serif", fontSize: 11, fontWeight: 700,
                    color: '#F2894F', textTransform: 'uppercase', letterSpacing: 1.2,
                    paddingTop: idx === 0 ? 0 : 14, paddingBottom: 6, margin: 0,
                  }}>
                    {ing.group}
                  </p>
                )}
                <div style={{
                  display: 'flex', alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: idx < recipe.ingredients.length - 1 ? '1px solid #F5F0EB' : 'none',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#212022', flex: 1, lineHeight: 1.4 }}>{ing.name}</span>
                  <span style={{ fontSize: 13, color: '#9193A0', fontWeight: 500, whiteSpace: 'nowrap', marginRight: 4 }}>
                    {multiplier !== 1 ? adjustQuantity(ing.quantity, multiplier) : ing.quantity} {ing.unit}
                  </span>
                  <button
                    onClick={() => handleShowAlternatives(idx)}
                    style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                    title="Alternativen anzeigen"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={altIngIdx === idx ? "#F2894F" : "#D4C9BF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3l4 4-4 4"/><path d="M20 7H4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/></svg>
                  </button>
                  <button
                    onClick={() => handleEditIngredient(idx)}
                    style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4C9BF" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                  </button>
                </div>
              {/* Alternatives Overlay */}
              {altIngIdx === idx && (
                <div style={{ padding: '12px 16px', marginBottom: 4, backgroundColor: '#FCF7F2', borderRadius: 12, animation: 'fadeIn 0.2s ease' }}>
                  {altLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 16, height: 16, border: '2px solid #E0D5CA', borderTopColor: '#F2894F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span style={{ fontSize: 13, color: '#9193A0' }}>Alternativen werden gesucht...</span>
                    </div>
                  ) : altData ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#4B164C', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {altData.isExotic ? '🌍 Exotische Zutat' : '💡 Alternativen'}
                        </span>
                        <button onClick={() => { setAltIngIdx(null); setAltData(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9193A0" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                      {altData.alternatives.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {altData.alternatives.map((alt, ai) => (
                            <div key={ai} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><path d="M16 3l4 4-4 4"/><path d="M20 7H4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/></svg>
                              <div>
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#212022' }}>{alt.name}</span>
                                <span style={{ fontSize: 12, color: '#F2894F', marginLeft: 6, fontWeight: 500 }}>{alt.ratio}</span>
                                <p style={{ fontSize: 12, color: '#9193A0', lineHeight: 1.4, marginTop: 2 }}>{alt.note}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: 13, color: '#9193A0' }}>Keine passenden Alternativen gefunden.</p>
                      )}
                      {altData.tip && (
                        <p style={{ fontSize: 12, color: '#7B2D7D', marginTop: 8, padding: '8px 10px', backgroundColor: '#F3E5F5', borderRadius: 8, lineHeight: 1.4 }}>{altData.tip}</p>
                      )}
                    </div>
                  ) : null}
                  <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}
            </div>
          );
        })}

        </div>{/* /Zutaten Karte */}
      </div>

      {/* Zubereitung */}
      <div style={{ padding: '0 16px', marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 4, paddingRight: 4, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 700, color: '#4B164C', margin: 0 }}>Zubereitung</h2>
            <p style={{ fontSize: 12, color: '#9193A0', marginTop: 2 }}>{recipe.instructions.length} Schritte</p>
          </div>
          {/* Kochmodus-Button */}
          <button
            onClick={() => startCookingMode(0)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 20,
              backgroundColor: '#4B164C', color: 'white',
              fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 8 6 4-6 4Z"/></svg>
            Kochmodus
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recipe.instructions.map((step, idx) => (
            <div key={idx} onClick={() => startCookingMode(idx)} style={{
              backgroundColor: 'white', borderRadius: 16, padding: '14px 16px',
              boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
              display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer',
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

      {/* === KOCHMODUS === */}
      {cookingMode && recipe.instructions.length > 0 && (
        <CookingModeOverlay
          steps={recipe.instructions}
          currentStep={cookingStep}
          dishName={recipe.dishName}
          onStepChange={setCookingStep}
          onClose={() => setCookingMode(false)}
        />
      )}

      {/* Sticky CTA: Zutaten in die Einkaufsliste */}
      <div style={{
        position: 'fixed', bottom: 72, left: 0, right: 0,
        padding: '12px 20px', zIndex: 50,
        background: 'linear-gradient(to top, #FFF3EB 70%, transparent)',
      }}>
        <button
          onClick={handleAddToShoppingList}
          style={{
            width: '100%', padding: 16, borderRadius: 16,
            backgroundColor: addedToList ? '#4CAF50' : '#F2894F',
            color: 'white', fontWeight: 700, fontSize: 16, border: 'none',
            cursor: 'pointer', fontFamily: "'Montserrat', sans-serif",
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'background-color 0.3s',
          }}
        >
          {addedToList ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
              Zur Einkaufsliste hinzugefügt
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
              Zutaten in die Einkaufsliste
            </>
          )}
        </button>
      </div>

      {/* Edit Ingredient Modal */}
      {editingIngIdx !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setEditingIngIdx(null)}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 700, color: '#4B164C', marginBottom: 20 }}>Zutat bearbeiten</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <input
                type="text" value={editIngData.name}
                onChange={e => setEditIngData({ ...editIngData, name: e.target.value })}
                placeholder="Name" autoFocus
                style={{ width: '100%', padding: '14px 16px', borderRadius: 12, backgroundColor: '#FCF7F2', border: '2px solid transparent', outline: 'none', fontSize: 14, color: '#212022', fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="text" value={editIngData.quantity}
                  onChange={e => setEditIngData({ ...editIngData, quantity: e.target.value })}
                  placeholder="Menge"
                  style={{ flex: 1, padding: '14px 16px', borderRadius: 12, backgroundColor: '#FCF7F2', border: '2px solid transparent', outline: 'none', fontSize: 14, color: '#212022', fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box' }}
                />
                <input
                  type="text" value={editIngData.unit}
                  onChange={e => setEditIngData({ ...editIngData, unit: e.target.value })}
                  placeholder="Einheit"
                  style={{ flex: 1, padding: '14px 16px', borderRadius: 12, backgroundColor: '#FCF7F2', border: '2px solid transparent', outline: 'none', fontSize: 14, color: '#212022', fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <button onClick={handleSaveIngredient} style={{ width: '100%', padding: 16, borderRadius: 13, backgroundColor: '#F2894F', color: 'white', fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer', marginBottom: 8 }}>
              Speichern
            </button>
            <button onClick={() => setEditingIngIdx(null)} style={{ width: '100%', padding: 12, background: 'none', border: 'none', color: '#9193A0', fontSize: 14, cursor: 'pointer' }}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {viewerImage && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            backgroundColor: 'rgba(0,0,0,0.95)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setViewerImage(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setViewerImage(null)}
            style={{
              position: 'absolute', top: 56, right: 20,
              width: 44, height: 44, borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.15)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 201,
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>

          {/* Image — pinch-to-zoom on iOS via touch-action */}
          <img
            src={viewerImage}
            alt="Vollbild"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '100%', maxHeight: '85vh',
              objectFit: 'contain', borderRadius: 4,
              touchAction: 'pinch-zoom',
            }}
          />

          {/* Navigation dots if multiple images */}
          {recipe.recipeImages && recipe.recipeImages.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {recipe.recipeImages.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setViewerImage(img); }}
                  style={{
                    width: 40, height: 40, borderRadius: 8, overflow: 'hidden',
                    border: viewerImage === img ? '2px solid #F2894F' : '2px solid transparent',
                    opacity: viewerImage === img ? 1 : 0.5,
                    cursor: 'pointer', padding: 0,
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add to List Modal */}
      {showListModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end' }}>
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowListModal(false);
            }}
            style={{ width: '100%', height: '100%', position: 'absolute' }}
          />
          <div style={{ position: 'relative', zIndex: 100, width: '100%', backgroundColor: 'white', borderRadius: '20px 20px 0 0', padding: '20px 20px 32px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#212022', margin: 0, fontFamily: "'Montserrat', sans-serif" }}>Zu Liste hinzufügen</h3>
              <button
                onClick={() => setShowListModal(false)}
                style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', backgroundColor: '#FCF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9193A0" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>

            {/* Lists with checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {lists.length === 0 ? (
                <p style={{ fontSize: 14, color: '#9193A0', textAlign: 'center', padding: '16px 0' }}>
                  Keine Listen vorhanden. Erstelle eine neue Liste.
                </p>
              ) : (
                lists.map((list) => {
                  const isInList = recipe.id ? list.recipeIds.includes(recipe.id) : false;
                  return (
                    <button
                      key={list.id}
                      onClick={() => {
                        if (recipe.id) {
                          if (isInList) {
                            removeRecipeFromList(list.id, recipe.id);
                          } else {
                            addRecipeToList(list.id, recipe.id);
                          }
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: `2px solid ${list.color}20`,
                        backgroundColor: isInList ? `${list.color}12` : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          border: `2px solid ${list.color}`,
                          backgroundColor: isInList ? list.color : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isInList && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                        )}
                      </div>
                      {/* List info */}
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#212022', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {list.name}
                        </p>
                        <p style={{ fontSize: 12, color: '#9193A0', margin: '2px 0 0', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {list.recipeIds.length} {list.recipeIds.length === 1 ? 'Rezept' : 'Rezepte'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Divider */}
            {lists.length > 0 && <div style={{ height: 1, backgroundColor: '#E8E0D8', marginBottom: 16 }} />}

            {/* New List Input Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#525154', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Neue Liste erstellen
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={newListInput}
                  onChange={(e) => setNewListInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newListInput.trim()) {
                      const newList = createList(newListInput.trim());
                      if (recipe.id) {
                        addRecipeToList(newList.id, recipe.id);
                      }
                      setNewListInput("");
                    }
                  }}
                  placeholder="z.B. Schnelle Rezepte"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #DCDDDC',
                    fontSize: 14,
                    outline: 'none',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                />
                <button
                  onClick={() => {
                    if (newListInput.trim()) {
                      const newList = createList(newListInput.trim());
                      if (recipe.id) {
                        addRecipeToList(newList.id, recipe.id);
                      }
                      setNewListInput("");
                    }
                  }}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#F2894F',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, maxWidth: 340, width: '100%' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#212022', marginBottom: 8 }}>Rezept löschen?</h3>
            <p style={{ fontSize: 14, color: '#9193A0', marginBottom: 20 }}>
              &ldquo;{recipe.dishName}&rdquo; wird unwiderruflich gelöscht.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid #525154', backgroundColor: 'white', fontWeight: 500, fontSize: 16, cursor: 'pointer' }}>
                Abbrechen
              </button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '12px 0', borderRadius: 10, backgroundColor: '#E64949', color: 'white', fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer' }}>
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Nutrition Card — 4 circular indicators
   ============================================================ */
function NutritionCard({ nutrition, servings, originalServings }: {
  nutrition: NutritionInfo;
  servings: number;
  originalServings: number;
}) {
  const [showInsight, setShowInsight] = useState(false);
  const m = servings / (originalServings || 1);
  const cal = Math.round(nutrition.calories * m);
  const protein = Math.round(nutrition.protein * m);
  const fat = Math.round(nutrition.fat * m);
  const carbs = Math.round(nutrition.carbs * m);

  // Tagesbedarf-Referenzwerte (Durchschnitt Erwachsene, basierend auf 2000 kcal)
  const dailyRef = { calories: 2000, protein: 50, fat: 65, carbs: 300 };

  const items = [
    { label: "Kalorien", value: cal, unit: "kcal", color: "#F2894F", daily: dailyRef.calories },
    { label: "Protein", value: protein, unit: "g", color: "#4CAF50", daily: dailyRef.protein },
    { label: "Fett", value: fat, unit: "g", color: "#FFB74D", daily: dailyRef.fat },
    { label: "Carbs", value: carbs, unit: "g", color: "#7C4DFF", daily: dailyRef.carbs },
  ];

  // Simple nutrition insight
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

        {/* Referenz-Hinweis */}
        <p style={{ fontSize: 10, color: '#C4C4C4', textAlign: 'center', marginTop: 12 }}>
          % vom Tagesbedarf (Basis: 2000 kcal)
        </p>

        {/* Aufklappbare Einschätzung */}
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

function adjustQuantity(quantity: string, multiplier: number): string {
  const num = parseFloat(quantity.replace(",", "."));
  if (isNaN(num)) return quantity;
  const adjusted = num * multiplier;
  if (adjusted === Math.floor(adjusted)) return String(adjusted);
  return adjusted.toFixed(1).replace(".", ",");
}

/* ============================================================
   Kochmodus — Fullscreen Step-by-Step mit Swipe
   ============================================================ */
function CookingModeOverlay({ steps, currentStep, dishName, onStepChange, onClose }: {
  steps: string[];
  currentStep: number;
  dishName: string;
  onStepChange: (step: number) => void;
  onClose: () => void;
}) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const total = steps.length;

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= total) return;
    setIsAnimating(true);
    setSwipeOffset(0);
    onStepChange(idx);
    setTimeout(() => setIsAnimating(false), 200);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    didSwipe.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) didSwipe.current = true;
    if (Math.abs(dx) > Math.abs(dy) + 10) {
      setSwipeOffset(dx * 0.4);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 60) goTo(currentStep - 1);
    else if (swipeOffset < -60) goTo(currentStep + 1);
    else setSwipeOffset(0);
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Tap handler — nur bei echtem Tap (kein Swipe)
  const handleTapZone = (zone: "left" | "right") => {
    if (didSwipe.current) return;
    if (zone === "left") goTo(currentStep - 1);
    else if (currentStep < total - 1) goTo(currentStep + 1);
    else onClose();
  };

  // Prevent body scroll when cooking mode is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      backgroundColor: '#1A1A1D',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
          fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0,
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          Schliessen
        </button>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600 }}>
          {dishName}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 20px', marginBottom: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {steps.map((_, i) => (
            <div key={i} onClick={() => goTo(i)} style={{
              flex: 1, height: 3, borderRadius: 2, cursor: 'pointer',
              backgroundColor: i <= currentStep ? '#F2894F' : 'rgba(255,255,255,0.15)',
              transition: 'background-color 0.3s',
            }} />
          ))}
        </div>
      </div>

      {/* Step content — swipeable + tap zones (Insta-Style) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '0 28px',
          transform: `translateX(${swipeOffset}px)`,
          transition: isAnimating ? 'transform 0.2s ease' : 'none',
          overflow: 'hidden', position: 'relative',
        }}
      >
        {/* Invisible tap zones — left = back, right = forward (Insta-Style) */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 1 }}>
          <div onClick={() => handleTapZone("left")} style={{ width: '30%', height: '100%', cursor: 'pointer' }} />
          <div style={{ flex: 1 }} />
          <div onClick={() => handleTapZone("right")} style={{ width: '70%', height: '100%', cursor: 'pointer' }} />
        </div>

        {/* Step number */}
        <div style={{ marginBottom: 20, position: 'relative', zIndex: 0 }}>
          <span style={{
            fontSize: 14, fontWeight: 700, color: '#F2894F',
            letterSpacing: 1, textTransform: 'uppercase',
          }}>
            Schritt {currentStep + 1} von {total}
          </span>
        </div>

        {/* Step text — large and readable */}
        <p style={{
          fontSize: 24, fontWeight: 500, color: 'white',
          lineHeight: 1.55, margin: 0, position: 'relative', zIndex: 0,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          {steps[currentStep]}
        </p>
      </div>

      {/* Bottom navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        flexShrink: 0,
      }}>
        <button
          onClick={() => goTo(currentStep - 1)}
          disabled={currentStep === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '12px 20px', borderRadius: 14,
            backgroundColor: currentStep === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
            color: currentStep === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)',
            fontSize: 14, fontWeight: 600, border: 'none', cursor: currentStep === 0 ? 'default' : 'pointer',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Zurück
        </button>

        {currentStep < total - 1 ? (
          <button
            onClick={() => goTo(currentStep + 1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '12px 24px', borderRadius: 14,
              backgroundColor: '#F2894F', color: 'white',
              fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
            }}
          >
            Weiter
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        ) : (
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '12px 24px', borderRadius: 14,
              backgroundColor: '#4CAF50', color: 'white',
              fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
            Fertig!
          </button>
        )}
      </div>
    </div>
  );
}
