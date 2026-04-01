"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useFeedStore, FeedItem, AvailableSource } from "@/stores/feed-store";
import { useRecipeStore } from "@/stores/recipe-store";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { FILTER_OPTIONS, FilterOption } from "@/data/feed-sources";
import AppHeader from "@/components/ui/app-header";

// ============================================================
// Source Toggle Chip
// ============================================================

function SourceChip({
  source,
  enabled,
  onToggle,
}: {
  source: AvailableSource;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 14px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        border: enabled ? "none" : "1.5px solid #DCDDDC",
        backgroundColor: enabled ? source.color : "transparent",
        color: enabled ? "white" : "#9193A0",
        cursor: "pointer",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        transition: "all 0.2s",
        opacity: enabled ? 1 : 0.6,
      }}
    >
      {source.name}
      <span style={{ fontSize: 10, opacity: 0.7 }}>({source.recipeCount})</span>
    </button>
  );
}

// ============================================================
// Filter Chip
// ============================================================

function FilterChip({
  filter,
  active,
  onToggle,
}: {
  filter: FilterOption;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 12px",
        borderRadius: 16,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
        border: active ? "none" : "1.5px solid #E8E8E8",
        backgroundColor: active ? filter.color : "white",
        color: active ? "white" : "#777",
        cursor: "pointer",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        transition: "all 0.2s",
      }}
    >
      {filter.label}
    </button>
  );
}

// ============================================================
// Source Badge (on cards)
// ============================================================

function SourceBadge({ name, color }: { name: string; color: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.92)",
        borderRadius: 6,
        padding: "3px 8px",
        backdropFilter: "blur(4px)",
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 700, color: color, letterSpacing: 0.2 }}>
        {name}
      </span>
    </div>
  );
}

// ============================================================
// Preview Modal
// ============================================================

function PreviewModal({ onSaved }: { onSaved: (recipeId: string) => void }) {
  const {
    previewItem,
    previewData,
    isLoadingPreview,
    isSaving,
    closePreview,
    saveRecipeFromPreview,
  } = useFeedStore();
  const { recipes } = useRecipeStore();
  const { useFeature, checkGate } = useSubscriptionStore();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!previewItem) return null;

  const handleSave = async () => {
    // Gate: recipeImport (AI-Import) + recipeStore (Rezept-Limit)
    if (!useFeature("recipeImport")) return;
    if (!checkGate("recipeStore", recipes.length).allowed) {
      useFeature("recipeStore");
      return;
    }
    setError(null);
    try {
      const recipeId = await saveRecipeFromPreview();
      if (recipeId) {
        setSaved(true);
        setTimeout(() => {
          closePreview();
          setSaved(false);
          onSaved(recipeId);
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || "Import fehlgeschlagen");
    }
  };

  const imageUrl = previewData?.imageUrl || previewItem.imageUrl;
  const title = previewData?.title || previewItem.title;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      {/* Backdrop */}
      <div onClick={closePreview} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />

      {/* Sheet */}
      <div style={{ position: "relative", backgroundColor: "white", borderRadius: "24px 24px 0 0", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 8, flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0" }} />
        </div>

        {/* Image */}
        <div style={{ flexShrink: 0 }}>
          {imageUrl ? (
            <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
              <img src={imageUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 40%)" }} />
              <div style={{ position: "absolute", top: 12, left: 12 }}>
                <SourceBadge name={previewItem.sourceName} color={previewItem.sourceColor} />
              </div>
            </div>
          ) : (
            <div style={{ height: 100, background: `linear-gradient(135deg, ${previewItem.sourceColor} 0%, #333 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SourceBadge name={previewItem.sourceName} color={previewItem.sourceColor} />
            </div>
          )}
        </div>

        {/* Title + Buttons (always visible, sticky) */}
        <div style={{ padding: "16px 20px 12px", flexShrink: 0, borderBottom: "1px solid #F0F0F0" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#212022", marginBottom: 12, fontFamily: "'Montserrat', sans-serif", lineHeight: 1.25 }}>
            {title}
          </h2>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => window.open(previewItem.sourceUrl, "_blank")}
              style={{ flex: 1, padding: "12px 16px", borderRadius: 14, border: "1.5px solid #DCDDDC", backgroundColor: "white", fontSize: 14, fontWeight: 600, color: "#555", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
              Original
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || saved}
              style={{
                flex: 1.4, padding: "12px 16px", borderRadius: 14, border: "none",
                backgroundColor: saved ? "#4CAF50" : "#F2894F",
                fontSize: 14, fontWeight: 700, color: "white",
                cursor: isSaving ? "wait" : "pointer", opacity: isSaving ? 0.7 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "background-color 0.3s",
              }}
            >
              {saved ? (
                <><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>Gespeichert!</>
              ) : isSaving ? (
                <><div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 1s linear infinite" }} />Importiere...</>
              ) : (
                <><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>Rezept speichern</>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ overflow: "auto", padding: "16px 20px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
          {isLoadingPreview && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #FEF1E8", borderTopColor: "#F2894F", animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13, color: "#9193A0" }}>Rezeptdaten laden...</span>
            </div>
          )}

          {previewData && (
            <>
              {/* Meta pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {previewData.totalTime && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 20, backgroundColor: "#FEF1E8", fontSize: 12, fontWeight: 600, color: "#F2894F" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {previewData.totalTime}
                  </span>
                )}
                {previewData.servings && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 20, backgroundColor: "#FEF1E8", fontSize: 12, fontWeight: 600, color: "#F2894F" }}>
                    {previewData.servings} Portionen
                  </span>
                )}
              </div>

              {previewData.description && (
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.5, marginBottom: 16 }}>
                  {previewData.description.length > 200 ? previewData.description.substring(0, 200) + "…" : previewData.description}
                </p>
              )}

              {previewData.ingredients.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#212022", marginBottom: 8, fontFamily: "'Montserrat', sans-serif" }}>Zutaten</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {previewData.ingredients.slice(0, 12).map((ing, i) => (
                      <span key={i} style={{ padding: "4px 10px", borderRadius: 8, backgroundColor: "#F9F9F9", border: "1px solid #EAEAEA", fontSize: 12, color: "#444" }}>{ing}</span>
                    ))}
                    {previewData.ingredients.length > 12 && (
                      <span style={{ padding: "4px 10px", fontSize: 12, color: "#9193A0" }}>+{previewData.ingredients.length - 12} mehr</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 12, backgroundColor: "#FFF0F0", color: "#CC3D10", fontSize: 13 }}>{error}</div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function EntdeckenPage() {
  const router = useRouter();
  const {
    items, availableSources, enabledSources, activeFilters, isLoading, error,
    loadFeed, toggleSource, toggleFilter, clearFilters, loadEnabledSources, openPreview,
    filteredItems,
  } = useFeedStore();
  const { loadRecipes } = useRecipeStore();
  const displayItems = filteredItems();

  useEffect(() => {
    loadEnabledSources();
  }, [loadEnabledSources]);

  useEffect(() => {
    if (enabledSources.length > 0) loadFeed();
  }, [enabledSources, loadFeed]);

  const handleCardClick = useCallback((item: FeedItem) => openPreview(item), [openPreview]);

  const handleRecipeSaved = useCallback((recipeId: string) => {
    loadRecipes();
    router.push(`/rezepte/${recipeId}`);
  }, [loadRecipes, router]);

  return (
    <div style={{ backgroundColor: "#FFF3EB", minHeight: "100vh", paddingBottom: 90 }}>
      {/* Header with Logo + Account */}
      <AppHeader title="Entdecken" subtitle="Rezeptideen aus deinen Lieblingsquellen" />

      {/* Source Toggle Chips */}
      <div style={{ padding: "0 20px", marginBottom: 10, display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="no-scrollbar">
        {availableSources.map((source) => (
          <SourceChip
            key={source.id}
            source={source}
            enabled={enabledSources.includes(source.id)}
            onToggle={() => toggleSource(source.id)}
          />
        ))}
      </div>

      {/* Filter Chips */}
      <div style={{ padding: "0 20px", marginBottom: 16, display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, alignItems: "center" }} className="no-scrollbar">
        {FILTER_OPTIONS.map((filter) => (
          <FilterChip
            key={filter.id}
            filter={filter}
            active={activeFilters.includes(filter.id)}
            onToggle={() => toggleFilter(filter.id)}
          />
        ))}
        {activeFilters.length > 0 && (
          <button
            onClick={clearFilters}
            style={{
              display: "inline-flex", alignItems: "center", padding: "6px 10px",
              borderRadius: 16, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
              border: "none", backgroundColor: "transparent", color: "#F2894F",
              cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            ✕ Reset
          </button>
        )}
      </div>

      {/* Feed Grid */}
      <div style={{ padding: "0 20px" }}>
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ height: 200, backgroundColor: "#FCF7F2", borderRadius: 16, animation: "pulse 2s infinite" }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: "#FEF1E8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F2894F" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#212022", marginBottom: 8 }}>Feed nicht verfügbar</h3>
            <p style={{ fontSize: 13, color: "#9193A0", marginBottom: 20 }}>{error}</p>
            <button onClick={loadFeed} style={{ padding: "10px 24px", borderRadius: 12, backgroundColor: "#F2894F", color: "white", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Nochmal versuchen
            </button>
          </div>
        ) : displayItems.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <p style={{ fontSize: 14, color: "#9193A0" }}>
              {activeFilters.length > 0
                ? "Keine Rezepte für diese Filter. Versuche andere Kombinationen."
                : "Keine Rezepte gefunden. Aktiviere mindestens eine Quelle."}
            </p>
            {activeFilters.length > 0 && (
              <button onClick={clearFilters} style={{ marginTop: 12, padding: "8px 20px", borderRadius: 12, backgroundColor: "#F2894F", color: "white", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Filter zurücksetzen
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {displayItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                style={{ borderRadius: 16, overflow: "hidden", backgroundColor: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", cursor: "pointer" }}
              >
                {/* Image */}
                <div style={{ position: "relative", height: 130 }}>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      loading="lazy"
                      onError={(e) => {
                        // Hide broken images gracefully
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        if (target.parentElement) {
                          target.parentElement.style.background = `linear-gradient(135deg, ${item.sourceColor} 0%, #333 100%)`;
                        }
                      }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${item.sourceColor} 0%, #333 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" /><line x1="6" y1="17" x2="18" y2="17" /></svg>
                    </div>
                  )}
                  <div style={{ position: "absolute", top: 6, left: 6 }}>
                    <SourceBadge name={item.sourceName} color={item.sourceColor} />
                  </div>
                </div>

                {/* Title */}
                <div style={{ padding: "10px 10px 12px" }}>
                  <h3 style={{
                    fontSize: 13, fontWeight: 700, color: "#212022", lineHeight: 1.3,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {item.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PreviewModal onSaved={handleRecipeSaved} />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
