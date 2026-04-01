"use client";

import { useRouter } from "next/navigation";
import { useRecipeStore } from "@/stores/recipe-store";
import { useShoppingStore } from "@/stores/shopping-store";
import { useState } from "react";
import { getTotalTime } from "@/types";

export default function RecipePreviewPage() {
  const router = useRouter();
  const { currentRecipe, saveRecipe } = useRecipeStore();
  const { addRecipe: addToShopping } = useShoppingStore();
  const [saving, setSaving] = useState(false);
  const [servings, setServings] = useState(currentRecipe?.servings || 2);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  if (!currentRecipe) {
    return (
      <div className="px-5 pt-16 text-center py-16">
        <p style={{ color: '#9193A0' }}>Kein Rezept vorhanden.</p>
        <button onClick={() => router.push("/rezepte")} className="mt-4 font-semibold text-sm" style={{ color: '#F2894F' }}>
          Zurück zu Rezepten
        </button>
      </div>
    );
  }

  const recipe = currentRecipe;
  const multiplier = servings / (recipe.servings || 1);

  const handleSave = () => {
    setSaving(true);
    try {
      const saved = saveRecipe(recipe);
      router.push(`/rezepte/${saved.id}`);
    } catch { setSaving(false); }
  };

  const handleSaveAndAddToList = () => {
    setSaving(true);
    try {
      const adjustedRecipe = {
        ...recipe,
        servings: servings,
        ingredients: recipe.ingredients.map((ing) => ({
          ...ing,
          quantity: multiplier !== 1 ? adjustQuantity(ing.quantity, multiplier) : ing.quantity,
        })),
      };
      const saved = saveRecipe(adjustedRecipe);
      addToShopping(saved);
      router.push("/einkaufsliste");
    } catch { setSaving(false); }
  };

  return (
    <div className="pb-6" style={{ backgroundColor: '#FFF3EB', minHeight: '100vh' }}>
      {/* Back Button */}
      <div className="px-5 pt-14 pb-3">
        <button
          onClick={() => router.back()}
          style={{ width: 50, height: 50, borderRadius: '50%', border: '1px solid #DCDDDC', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#212022" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
        </button>
      </div>

      {/* Recipe Image Card — tap to view fullscreen */}
      <div className="px-5 mb-5">
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
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                {getTotalTime(recipe)} Minuten
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                {recipe.servings} Personen
              </span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>{recipe.dishName}</h1>
          </div>
        </div>
      </div>

      {/* Thumbnail row + add button — tap to view fullscreen */}
      <div className="px-5 mb-5" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {recipe.recipeImages?.slice(0, 3).map((img, i) => (
          <div
            key={i}
            onClick={() => setViewerImage(img)}
            style={{ width: 65, height: 65, borderRadius: 14, overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}
          >
            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
        <div style={{ width: 65, height: 65, borderRadius: 14, border: '2px dashed #DCDDDC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CDD0D8" strokeWidth="2"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
        </div>
      </div>

      {/* Zutaten Header + Portionen Pill */}
      <div className="px-5">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 22, fontWeight: 700, color: '#4B164C' }}>Zutaten</h2>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F2894F', borderRadius: 30, overflow: 'hidden' }}>
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 700, background: 'none', border: 'none' }}
            >
              −
            </button>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 600, minWidth: 80, textAlign: 'center' }}>
              {servings} Portionen
            </span>
            <button
              onClick={() => setServings(servings + 1)}
              style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 700, background: 'none', border: 'none' }}
            >
              +
            </button>
          </div>
        </div>

        {/* Ingredients list */}
        {recipe.ingredients.map((ing, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, paddingBottom: 14, borderBottom: idx < recipe.ingredients.length - 1 ? '1px solid rgba(220,221,220,0.5)' : 'none' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#212022' }}>{ing.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: '#9193A0' }}>
                {multiplier !== 1 ? adjustQuantity(ing.quantity, multiplier) : ing.quantity} {ing.unit}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CDD0D8" strokeWidth="2">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            </div>
          </div>
        ))}

        {/* Green "Zutaten in die Einkaufsliste" button */}
        <button
          onClick={handleSaveAndAddToList}
          disabled={saving}
          style={{ width: '100%', padding: '14px 0', borderRadius: 13, backgroundColor: '#4CAF50', color: 'white', fontWeight: 600, fontSize: 15, border: 'none', marginTop: 20, cursor: 'pointer' }}
        >
          {saving ? "Wird gespeichert..." : "Zutaten in die Einkaufsliste"}
        </button>
      </div>

      {/* Anleitung */}
      <div className="px-5" style={{ marginTop: 32 }}>
        <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 22, fontWeight: 700, color: '#4B164C', marginBottom: 4 }}>Anleitung</h2>
        <p style={{ fontSize: 12, color: '#9193A0', marginBottom: 20 }}>Step by Step Anleitung für Dein Rezept</p>

        {recipe.instructions.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#F2894F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>{idx + 1}</span>
            </div>
            <p style={{ fontSize: 13, color: '#525154', lineHeight: 1.6, paddingTop: 4, flex: 1 }}>{step}</p>
          </div>
        ))}
      </div>

      {/* Bottom: Notizen/Infos Tabs + Speichern Button */}
      <div className="px-5" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', backgroundColor: '#FCF7F2', borderRadius: 10, padding: 4, marginBottom: 16 }}>
          <button style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#9193A0', background: 'none', border: 'none' }}>
            Notizen
          </button>
          <button style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#9193A0', background: 'none', border: 'none' }}>
            Infos
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ width: '100%', padding: 16, borderRadius: 13, backgroundColor: '#F2894F', color: 'white', fontWeight: 600, fontSize: 18, border: 'none', cursor: 'pointer' }}
        >
          {saving ? "Wird gespeichert..." : "Speichern"}
        </button>
      </div>

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
