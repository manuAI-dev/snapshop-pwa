"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useRecipeStore } from "@/stores/recipe-store";
import { useRecipeListStore } from "@/stores/recipe-list-store";
import { Recipe, getTotalTime } from "@/types";
import AppHeader from "@/components/ui/app-header";
import { PwaInstallPopup } from "@/components/ui/pwa-install-prompt";
import { LazyRecipeImage } from "@/components/ui/lazy-recipe-image";

type SortMode = "neuste" | "aelteste";
type FilterTag = "likes" | "stars" | "online" | "buch" | "fooby" | "bettybossi" | "migusto" | "swissmilk" | "eigene";
type ViewMode = "rezepte" | "listen";

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
  const { lists, createList, deleteList, renameList } = useRecipeListStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("neuste");
  const [activeFilters, setActiveFilters] = useState<FilterTag[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("rezepte");
  const [activeListId, setActiveListId] = useState<string | null>(null);

  // New list creation
  const [showNewListSheet, setShowNewListSheet] = useState(false);
  const [newListName, setNewListName] = useState("");
  const newListInputRef = useRef<HTMLInputElement>(null);

  // List editing & context menu
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editListName, setEditListName] = useState("");
  const [menuListId, setMenuListId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // DEBUG
  const [debugInfo, setDebugInfo] = useState("init");
  const mountTime = useRef(Date.now());

  useEffect(() => {
    const t0 = Date.now();
    loadRecipes();
    const interval = setInterval(() => {
      const r = useRecipeStore.getState();
      setDebugInfo(`r=${r.recipes.length} thumbs=${r.recipes.filter(x => x.thumbnail).length} load=${r.isLoading} t=${Date.now() - t0}ms`);
      if (!r.isLoading && r.recipes.length > 0) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, [loadRecipes]);

  useEffect(() => {
    if (showNewListSheet && newListInputRef.current) {
      newListInputRef.current.focus();
    }
  }, [showNewListSheet]);

  const toggleFilter = (tag: FilterTag) => {
    setActiveFilters((prev) =>
      prev.includes(tag) ? prev.filter((f) => f !== tag) : [...prev, tag]
    );
  };

  // When a list is tapped in Listen view, switch to Rezepte view filtered by that list
  const openListAsFilter = (listId: string) => {
    setActiveListId(listId);
    setViewMode("rezepte");
  };

  // Get the active list if one is selected
  const activeList = activeListId ? lists.find((l) => l.id === activeListId) : null;

  const filtered = recipes
    .filter((r) => !search || r.dishName.toLowerCase().includes(search.toLowerCase()))
    .filter((r) => {
      if (activeFilters.includes("likes") && !r.isFavorite) return false;
      if (activeFilters.includes("stars") && !(r.rating && r.rating >= 4)) return false;
      if (activeFilters.includes("eigene") && r.sourceUrl) return false;
      const sourceFilters = activeFilters.filter(f => ["fooby", "bettybossi", "migusto", "swissmilk"].includes(f));
      if (sourceFilters.length > 0) {
        const src = getSourceFromUrl(r.sourceUrl);
        if (!src || !sourceFilters.includes(src.id as FilterTag)) return false;
      }
      return true;
    })
    .filter((r) => {
      if (activeList) {
        return activeList.recipeIds.includes(r.id || "");
      }
      return true;
    })
    .sort((a, b) => {
      if (sortMode === "aelteste") return (a.createdAt || "").localeCompare(b.createdAt || "");
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });

  const handleCreateList = () => {
    if (newListName.trim()) {
      createList(newListName.trim());
      setNewListName("");
      setShowNewListSheet(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#FFF3EB', minHeight: '100vh', paddingBottom: 90 }}>
      {/* DEBUG — nach Fix entfernen */}
      <div style={{ position: 'fixed', bottom: 100, left: 8, right: 8, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.85)', color: '#0f0', fontSize: 11, padding: '6px 10px', borderRadius: 8, fontFamily: 'monospace', pointerEvents: 'none' }}>
        {debugInfo}
      </div>
      {/* PWA Install Popup */}
      <PwaInstallPopup />

      {/* Header */}
      <AppHeader title="Deine Rezepte" />

      {/* Segmented Toggle: Rezepte | Listen */}
      <div style={{ padding: '8px 20px 0' }}>
        <div style={{
          display: 'flex',
          backgroundColor: '#F5EDE6',
          borderRadius: 12,
          padding: 3,
          gap: 2,
        }}>
          {(["rezepte", "listen"] as ViewMode[]).map((mode) => {
            const isActive = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => {
                  setViewMode(mode);
                  if (mode === "listen") setActiveListId(null);
                }}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 10,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  backgroundColor: isActive ? 'white' : 'transparent',
                  color: isActive ? '#212022' : '#9193A0',
                  boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {mode === "rezepte" ? "Rezepte" : `Listen${lists.length > 0 ? ` (${lists.length})` : ""}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active list filter badge (when viewing recipes filtered by a list) */}
      {viewMode === "rezepte" && activeList && (
        <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 20,
            backgroundColor: activeList.color,
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>
            {activeList.name}
            <button
              onClick={() => setActiveListId(null)}
              style={{
                background: 'none', border: 'none', color: 'white', cursor: 'pointer',
                padding: 0, display: 'flex', alignItems: 'center', marginLeft: 2,
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <span style={{ fontSize: 12, color: '#9193A0', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {filtered.length} {filtered.length === 1 ? "Rezept" : "Rezepte"}
          </span>
        </div>
      )}

      {/* ====== REZEPTE VIEW ====== */}
      {viewMode === "rezepte" && (
        <>
          {/* Search Bar */}
          <div style={{ padding: '12px 20px 0' }}>
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

            <div style={{ width: 1, height: 28, backgroundColor: '#E0E0E0', flexShrink: 0, alignSelf: 'center' }} />

            {([
              { key: "likes" as FilterTag, label: "Likes", color: "#E91E63" },
              { key: "stars" as FilterTag, label: "Top", color: "#FF9800" },
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
                Reset
              </button>
            )}
          </div>

          {/* Recipe Cards */}
          <div style={{ padding: '0 20px' }}>
            {isLoading && filtered.length === 0 ? (
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
                  {search ? "Keine Treffer" : activeList ? "Keine Rezepte in dieser Liste" : activeFilters.length > 0 ? "Keine Rezepte für diesen Filter" : "Noch keine Rezepte"}
                </h3>
                <p style={{ fontSize: 14, color: '#9193A0', maxWidth: 260, margin: '0 auto' }}>
                  {search
                    ? `Kein Rezept passt zu "${search}".`
                    : activeList
                      ? "Füge Rezepte über das Lesezeichen-Icon im Rezept hinzu."
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
                    {recipe.thumbnail ? (
                      <img src={recipe.thumbnail} alt={recipe.dishName} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #F2894F 0%, #CC3D10 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                      </div>
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 40%, transparent 60%)' }} />

                    {/* Heart top-left */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (recipe.id) updateRecipe(recipe.id, { isFavorite: !recipe.isFavorite });
                      }}
                      style={{ position: 'absolute', top: 8, left: 8, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={recipe.isFavorite ? "#F2894F" : "none"} stroke={recipe.isFavorite ? "#F2894F" : "white"} strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                    </button>

                    {/* Source badge */}
                    {(() => {
                      const src = getSourceFromUrl(recipe.sourceUrl);
                      return src ? (
                        <div style={{
                          position: 'absolute', top: 12, left: 52,
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
        </>
      )}

      {/* ====== LISTEN VIEW ====== */}
      {viewMode === "listen" && (
        <div style={{ padding: '20px 20px 0' }}>
          {lists.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#F3EAF3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4B164C" strokeWidth="2"><path d="M3 6h18"/><path d="M3 12h12"/><path d="M3 18h18"/></svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#212022', marginBottom: 8, fontFamily: "'Montserrat', sans-serif" }}>
                Noch keine Listen
              </h3>
              <p style={{ fontSize: 14, color: '#9193A0', maxWidth: 260, margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Erstelle deine erste Liste, um Rezepte zu organisieren.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {lists.map((list) => {
                const count = list.recipeIds.length;
                // Get up to 4 recipe images for mosaic thumbnail
                const thumbRecipes = list.recipeIds.slice(0, 4).map(rid => recipes.find(r => r.id === rid));
                const images = thumbRecipes.map(r => r?.thumbnail || r?.recipeImages?.[0]).filter(Boolean) as string[];
                const isEditing = editingListId === list.id;

                return (
                  <div
                    key={list.id}
                    onClick={() => !isEditing && openListAsFilter(list.id)}
                    style={{
                      borderRadius: 16,
                      overflow: menuListId === list.id ? 'visible' : 'hidden',
                      backgroundColor: 'white',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                      cursor: isEditing ? 'default' : 'pointer',
                      transition: 'transform 0.15s',
                      position: 'relative',
                      zIndex: menuListId === list.id ? 61 : 'auto',
                    }}
                  >
                    {/* Thumbnail area */}
                    <div style={{
                      height: 120,
                      backgroundColor: list.color,
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      {images.length >= 4 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', width: '100%', height: '100%' }}>
                          {images.slice(0, 4).map((img, i) => (
                            <img key={i} src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ))}
                        </div>
                      ) : images.length > 0 ? (
                        <img src={images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"><path d="M3 6h18"/><path d="M3 12h12"/><path d="M3 18h18"/></svg>
                        </div>
                      )}
                      {/* Overlay gradient */}
                      {images.length > 0 && (
                        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${list.color}99 0%, transparent 60%)` }} />
                      )}
                      {/* Recipe count badge */}
                      <div style={{
                        position: 'absolute', bottom: 8, right: 8,
                        backgroundColor: 'rgba(0,0,0,0.35)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: 8,
                        padding: '3px 8px',
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'white',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}>
                        {count} {count === 1 ? "Rezept" : "Rezepte"}
                      </div>
                    </div>

                    {/* Name + actions */}
                    <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      {isEditing ? (
                        <form
                          onSubmit={(e) => { e.preventDefault(); if (editListName.trim()) { renameList(list.id, editListName.trim()); } setEditingListId(null); }}
                          style={{ flex: 1, display: 'flex', gap: 4 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            autoFocus
                            value={editListName}
                            onChange={(e) => setEditListName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Escape') setEditingListId(null); }}
                            style={{
                              flex: 1, padding: '4px 8px', borderRadius: 8, border: '1.5px solid #4B164C',
                              fontSize: 13, fontWeight: 600, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif",
                              color: '#212022', minWidth: 0,
                            }}
                          />
                          <button type="submit" style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: '#4B164C', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                          </button>
                        </form>
                      ) : (
                        <>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#212022', fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {list.name}
                          </p>
                          {/* Three-dot menu */}
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuListId(menuListId === list.id ? null : list.id);
                              }}
                              style={{
                                width: 26, height: 26, borderRadius: 6, border: 'none',
                                backgroundColor: menuListId === list.id ? '#F5EDE6' : 'transparent',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9193A0" strokeWidth="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                            </button>
                            {/* Dropdown */}
                            {menuListId === list.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute', top: 30, right: 0,
                                  backgroundColor: 'white', borderRadius: 12,
                                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                                  overflow: 'hidden', zIndex: 60, minWidth: 150,
                                  border: '1px solid #F0EBE6',
                                }}
                              >
                                <button
                                  onClick={() => {
                                    setEditingListId(list.id);
                                    setEditListName(list.name);
                                    setMenuListId(null);
                                  }}
                                  style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '11px 14px', border: 'none', backgroundColor: 'white',
                                    cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#212022',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9193A0" strokeWidth="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                                  Umbenennen
                                </button>
                                <div style={{ height: 1, backgroundColor: '#F5EDE6' }} />
                                <button
                                  onClick={() => {
                                    setConfirmDeleteId(list.id);
                                    setMenuListId(null);
                                  }}
                                  style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '11px 14px', border: 'none', backgroundColor: 'white',
                                    cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#E64949',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E64949" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                  Löschen
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating "+" Button — only on Listen view */}
      {viewMode === "listen" && (
        <button
          onClick={() => setShowNewListSheet(true)}
          style={{
            position: 'fixed',
            bottom: 100,
            right: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 18px',
            borderRadius: 50,
            border: 'none',
            backgroundColor: '#4B164C',
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(75,22,76,0.35)',
            zIndex: 50,
            transition: 'transform 0.15s',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Neue Liste
        </button>
      )}

      {/* Bottom Sheet — New List */}
      {showNewListSheet && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => { setShowNewListSheet(false); setNewListName(""); }}
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)',
              zIndex: 100, transition: 'opacity 0.2s',
            }}
          />
          {/* Sheet */}
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            backgroundColor: 'white',
            borderRadius: '20px 20px 0 0',
            padding: '20px 24px 36px',
            zIndex: 101,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          }}>
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', margin: '0 auto 18px' }} />
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#212022', marginBottom: 16, fontFamily: "'Montserrat', sans-serif" }}>
              Neue Rezeptliste
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateList(); }}>
              <input
                ref={newListInputRef}
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="z.B. Meal Prep, Grillen, Weihnachten..."
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '2px solid #F5EDE6',
                  fontSize: 15,
                  outline: 'none',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: '#212022',
                  backgroundColor: '#FEFBF8',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#4B164C'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#F5EDE6'; }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => { setShowNewListSheet(false); setNewListName(""); }}
                  style={{
                    flex: 1,
                    padding: '13px 0',
                    borderRadius: 14,
                    border: '1.5px solid #E0E0E0',
                    backgroundColor: 'white',
                    color: '#9193A0',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={!newListName.trim()}
                  style={{
                    flex: 1,
                    padding: '13px 0',
                    borderRadius: 14,
                    border: 'none',
                    backgroundColor: newListName.trim() ? '#4B164C' : '#E0E0E0',
                    color: newListName.trim() ? 'white' : '#9193A0',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: newListName.trim() ? 'pointer' : 'default',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: 'all 0.2s',
                  }}
                >
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Invisible backdrop to close dropdown menu */}
      {menuListId && (
        <div
          onClick={() => setMenuListId(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 55 }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (() => {
        const listToDelete = lists.find(l => l.id === confirmDeleteId);
        if (!listToDelete) return null;
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 110, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, maxWidth: 320, width: '100%', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#212022', marginBottom: 8, fontFamily: "'Montserrat', sans-serif" }}>
                Liste löschen?
              </h3>
              <p style={{ fontSize: 14, color: '#9193A0', marginBottom: 20, fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.5 }}>
                &bdquo;{listToDelete.name}&ldquo; mit {listToDelete.recipeIds.length} {listToDelete.recipeIds.length === 1 ? "Rezept" : "Rezepten"} wird gelöscht. Die Rezepte selbst bleiben erhalten.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 12,
                    border: '1.5px solid #E0E0E0', backgroundColor: 'white',
                    fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#525154',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    deleteList(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 12,
                    backgroundColor: '#E64949', color: 'white',
                    fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
