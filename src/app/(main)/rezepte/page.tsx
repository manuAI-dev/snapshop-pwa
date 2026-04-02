"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRecipeStore } from "@/stores/recipe-store";
import { Recipe, getTotalTime } from "@/types";
import AppHeader from "@/components/ui/app-header";

type SortMode = "neuste" | "aelteste";
type FilterTag = "likes" | "stars" | "online" | "buch" | "fooby" | "bettybossi" | "migusto" | "swissmilk" | "eigene";

// Quelle aus sourceUrl ableiten
function getSourceFromUrl(url?: string): { id: string; name: string; color: string } | null {
  if (!url) return null;
  if (url.includes("fooby.ch")) return { id: "fooby", name: "Fooby", color: "#00A651" };
  if (url.includes("bettybossi.ch")) return { id: "bettybossi", name: "Betty Bossi", color: "#D4145A" };
  if (url.includes("migusto.migros.ch")) return { id: "migusto", name: "Migusto", color: "#FF6600" };
  if (url.includes("swissmilk.ch")) return { id: "swissmilk", name: "Swissmilk", color: "#0077B6" };
  return { id: "online", name: "Online", color: "#2196F3" };
}

export default function RezeptePage() {
  const { recipes, isLoading, loadRecipes, updateRecipe } = useRecipeStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("neuste");
  const [activeFilters, setActiveFilters] = useState<FilterTag[]>([]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const toggleFilter = (tag: FilterTag) => {
    setActiveFilters((prev) =>
      prev.includes(tag) ? prev.filter((f) => f !== tag) : [...prev, tag]
    );
  };

  const filtered = recipes
    .filter((r) => !search || r.dishName.toLowerCase().includes(search.toLowerCase()))
    .filter((r) => {
      if (activeFilters.includes("likes") && !r.isFavorite) return false;
      if (activeFilters.includes("stars") && !(r.rating && r.rating >= 4)) return false;
      if (activeFilters.includes("eigene") && r.sourceUrl) return false;
      // Source filters (OR logic — if multiple sources selected, show any match)
      const sourceFilters = activeFilters.filter(f => ["fooby", "bettybossi", "migusto", "swissmilk"].includes(f));
      if (sourceFilters.length > 0) {
        const src = getSourceFromUrl(r.sourceUrl);
        if (!src || !sourceFilters.includes(src.id as FilterTag)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortMode === "aelteste") return (a.createdAt || "").localeCompare(b.createdAt || "");
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });

  return (
    <div style={{ backgroundColor: '#FFF3EB', minHeight: '100vh', paddingBottom: 90 }}>
      {/* Header with Logo + Account */}
      <AppHeader title="Deine Rezepte" />

      {/* Search Bar */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {showSearch && (
            <button
              onClick={() => { setShowSearch(false); setSearch(""); }}
              style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid #DCDDDC', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#212022" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
            </button>
          )}
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setShowSearch(true)}
              placeholder={showSearch ? "Suche..." : ""}
              style={{
                width: '100%',
                padding: '12px 44px 12px 16px',
                borderRadius: 15,
                backgroundColor: showSearch ? 'white' : '#FCF7F2',
                border: showSearch ? '2px solid rgba(242,137,79,0.2)' : '2px solid transparent',
                outline: 'none',
                fontSize: 14,
                color: '#212022',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9193A0" strokeWidth="2" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Sort + Filter Chips */}
      <div style={{ padding: '0 20px', marginBottom: 20, display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
        {/* Sort Chips */}
        {([
          { key: "neuste" as SortMode, label: "Neuste" },
          { key: "aelteste" as SortMode, label: "Älteste" },
        ]).map((chip) => (
          <button
            key={chip.key}
            onClick={() => setSortMode(chip.key)}
            style={{
              padding: '7px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: sortMode === chip.key ? 'none' : '1.5px solid #DCDDDC',
              backgroundColor: sortMode === chip.key ? '#4B164C' : 'transparent',
              color: sortMode === chip.key ? 'white' : '#9193A0',
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {chip.label}
          </button>
        ))}

        {/* Divider */}
        <div style={{ width: 1, height: 28, backgroundColor: '#E0E0E0', flexShrink: 0, alignSelf: 'center' }} />

        {/* Filter Chips (toggleable) */}
        {([
          { key: "likes" as FilterTag, label: "♥ Likes", color: "#E91E63" },
          { key: "stars" as FilterTag, label: "★ Top", color: "#FF9800" },
          { key: "eigene" as FilterTag, label: "Eigene", color: "#795548" },
          { key: "fooby" as FilterTag, label: "Fooby", color: "#00A651" },
          { key: "bettybossi" as FilterTag, label: "Betty Bossi", color: "#D4145A" },
          { key: "migusto" as FilterTag, label: "Migusto", color: "#FF6600" },
          { key: "swissmilk" as FilterTag, label: "Swissmilk", color: "#0077B6" },
        ]).map((chip) => {
          const isActive = activeFilters.includes(chip.key);
          return (
            <button
              key={chip.key}
              onClick={() => toggleFilter(chip.key)}
              style={{
                padding: '7px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                border: isActive ? 'none' : '1.5px solid #DCDDDC',
                backgroundColor: isActive ? chip.color : 'transparent',
                color: isActive ? 'white' : '#9193A0',
                cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: 'all 0.2s',
              }}
            >
              {chip.label}
            </button>
          );
        })}

        {/* Reset */}
        {activeFilters.length > 0 && (
          <button
            onClick={() => setActiveFilters([])}
            style={{
              padding: '7px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#F2894F',
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            ✕ Reset
          </button>
        )}
      </div>

      {/* Recipe Cards */}
      <div style={{ padding: '0 20px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 200, backgroundColor: '#FCF7F2', borderRadius: 20, animation: 'pulse 2s infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#FEF1E8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" />
              </svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#212022', marginBottom: 8 }}>
              {search ? "Keine Treffer" : activeFilters.length > 0 ? "Keine Rezepte für diesen Filter" : "Noch keine Rezepte"}
            </h3>
            <p style={{ fontSize: 14, color: '#9193A0', maxWidth: 260, margin: '0 auto' }}>
              {search
                ? `Kein Rezept passt zu "${search}".`
                : activeFilters.length > 0
                  ? "Versuche andere Filter oder setze sie zurück."
                  : "Tippe auf den + Button, um dein erstes Rezept zu scannen."}
            </p>
            {activeFilters.length > 0 && (
              <button onClick={() => setActiveFilters([])} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 12, backgroundColor: '#F2894F', color: 'white', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Filter zurücksetzen
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => router.push(`/rezepte/${recipe.id}`)}
                style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', height: 200, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              >
                {/* Background */}
                {recipe.recipeImages?.[0] ? (
                  <img src={recipe.recipeImages[0]} alt={recipe.dishName} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #F2894F 0%, #CC3D10 100%)' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 40%, transparent 60%)' }} />

                {/* Heart top-left — toggleable */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (recipe.id) updateRecipe(recipe.id, { isFavorite: !recipe.isFavorite });
                  }}
                  style={{ position: 'absolute', top: 8, left: 8, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={recipe.isFavorite ? "#F2894F" : "none"} stroke={recipe.isFavorite ? "#F2894F" : "white"} strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                </button>

                {/* Source badge top-right */}
                {(() => {
                  const src = getSourceFromUrl(recipe.sourceUrl);
                  return src ? (
                    <div style={{
                      position: 'absolute', top: 12, left: 12,
                      backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 6, padding: '3px 8px',
                      backdropFilter: 'blur(4px)',
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: src.color, letterSpacing: 0.2 }}>{src.name}</span>
                    </div>
                  ) : null;
                })()}

                {/* Meta top-right */}
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'white', fontSize: 11, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', borderRadius: 20, padding: '4px 10px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {getTotalTime(recipe)} min
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'white', fontSize: 11, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', borderRadius: 20, padding: '4px 10px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                    {recipe.servings}
                  </span>
                </div>

                {/* Content bottom */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px' }}>
                  <h3 style={{ color: 'white', fontWeight: 700, fontSize: 17, lineHeight: 1.2, marginBottom: 6 }}>{recipe.dishName}</h3>
                  {/* Stars — only show if user has rated */}
                  {recipe.rating && recipe.rating > 0 ? (
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(i => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={i <= (recipe.rating || 0) ? "#F2894F" : "rgba(255,255,255,0.3)"} stroke={i <= (recipe.rating || 0) ? "#F2894F" : "rgba(255,255,255,0.3)"} strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      {recipe.cuisine || recipe.description?.substring(0, 40) || ''}
                    </div>
                  )}
                </div>

                {/* Camera icon bottom-right */}
                <div style={{ position: 'absolute', bottom: 12, right: 12, width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
