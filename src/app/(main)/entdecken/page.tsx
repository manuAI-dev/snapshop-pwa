"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFeedStore, FeedItem, AvailableSource } from "@/stores/feed-store";
import { useRecipeStore } from "@/stores/recipe-store";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { FILTER_OPTIONS, FILTER_GROUPS, FilterOption, getTopRecipes, FeedRecipeItem } from "@/data/feed-sources";
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
// Preview Modal (unchanged from original)
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
      <div onClick={closePreview} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", backgroundColor: "white", borderRadius: "24px 24px 0 0", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 8, flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0" }} />
        </div>
        <div style={{ flexShrink: 0 }}>
          {imageUrl ? (
            <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
              <img loading="lazy" decoding="async" src={imageUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
        <div style={{ padding: "16px 20px 12px", flexShrink: 0, borderBottom: "1px solid #F0F0F0" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#212022", marginBottom: 12, fontFamily: "'Montserrat', sans-serif", lineHeight: 1.25 }}>
            {title}
          </h2>
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
        <div style={{ overflow: "auto", padding: "16px 20px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
          {isLoadingPreview && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #FEF1E8", borderTopColor: "#F2894F", animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13, color: "#9193A0" }}>Rezeptdaten laden...</span>
            </div>
          )}
          {previewData && (
            <>
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
// Fullscreen Swipe Feed — Instagram-Style
// ============================================================

function SwipeFeed({ onClose, onOpenPreview }: { onClose: () => void; onOpenPreview: (item: FeedItem) => void }) {
  const [topRecipes] = useState<FeedRecipeItem[]>(() => getTopRecipes());
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [imgLoaded, setImgLoaded] = useState<Record<number, boolean>>({});

  const current = topRecipes[currentIndex];
  const next = topRecipes[currentIndex + 1];
  const prev = topRecipes[currentIndex - 1];

  if (!current) return null;

  const goTo = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= topRecipes.length || isAnimating) return;
    setIsAnimating(true);
    const direction = newIndex > currentIndex ? -1 : 1;
    setSwipeOffset(direction * window.innerHeight);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setSwipeOffset(0);
      setIsAnimating(false);
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isAnimating) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
    // Only vertical swipe
    if (deltaX > Math.abs(deltaY)) return;
    // Resistance at edges
    if ((currentIndex === 0 && deltaY > 0) || (currentIndex === topRecipes.length - 1 && deltaY < 0)) {
      setSwipeOffset(deltaY * 0.3);
    } else {
      setSwipeOffset(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (isAnimating) return;
    const threshold = window.innerHeight * 0.15;
    if (swipeOffset < -threshold && currentIndex < topRecipes.length - 1) {
      goTo(currentIndex + 1);
    } else if (swipeOffset > threshold && currentIndex > 0) {
      goTo(currentIndex - 1);
    } else {
      // Snap back
      setSwipeOffset(0);
    }
  };

  const handleSaveClick = (item: FeedRecipeItem) => {
    // Convert FeedRecipeItem to FeedItem shape for openPreview
    const feedItem: FeedItem = {
      id: item.id,
      title: item.title,
      imageUrl: item.imageUrl,
      sourceUrl: item.sourceUrl,
      sourceId: item.sourceId,
      sourceName: item.sourceName,
      sourceColor: item.sourceColor,
      tags: item.tags,
    };
    onOpenPreview(feedItem);
  };

  const renderSlide = (item: FeedRecipeItem, index: number) => {
    const loaded = imgLoaded[index];
    return (
      <div
        key={item.id}
        style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          backgroundColor: "#000",
        }}
      >
        {/* Fullscreen image */}
        <div style={{ position: "absolute", inset: 0 }}>
          {item.imageUrl ? (
            <>
              {!loaded && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: `linear-gradient(135deg, ${item.sourceColor}44 0%, #111 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "white", animation: "spin 1s linear infinite" }} />
                </div>
              )}
              <img
                src={item.imageUrl}
                alt={item.title}
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  opacity: loaded ? 1 : 0,
                  transition: "opacity 0.4s",
                }}
                onLoad={() => setImgLoaded((prev) => ({ ...prev, [index]: true }))}
                onError={() => setImgLoaded((prev) => ({ ...prev, [index]: true }))}
              />
            </>
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: `linear-gradient(135deg, ${item.sourceColor} 0%, #1a1a2e 100%)`,
            }} />
          )}
        </div>

        {/* Dark gradient overlay bottom */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
          pointerEvents: "none",
        }} />

        {/* Content overlay */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "0 20px", paddingBottom: "calc(100px + env(safe-area-inset-bottom, 0px))",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          {/* Source badge */}
          <div>
            <SourceBadge name={item.sourceName} color={item.sourceColor} />
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: 28, fontWeight: 800, color: "white", lineHeight: 1.2,
            fontFamily: "'Montserrat', sans-serif",
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}>
            {item.title}
          </h2>

          {/* Tags */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(item.tags || []).slice(0, 3).map((tag) => {
              const f = FILTER_OPTIONS.find((fo) => fo.id === tag);
              if (!f) return null;
              return (
                <span key={tag} style={{
                  padding: "4px 10px", borderRadius: 8,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(4px)",
                  fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.85)",
                }}>
                  {f.label}
                </span>
              );
            })}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              onClick={() => window.open(item.sourceUrl, "_blank")}
              style={{
                flex: 1, padding: "14px 16px", borderRadius: 14,
                border: "1.5px solid rgba(255,255,255,0.3)",
                backgroundColor: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
                fontSize: 14, fontWeight: 600, color: "white",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
              Ansehen
            </button>
            <button
              onClick={() => handleSaveClick(item)}
              style={{
                flex: 1.2, padding: "14px 16px", borderRadius: 14,
                border: "none", backgroundColor: "#F2894F",
                fontSize: 14, fontWeight: 700, color: "white",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
              Speichern
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        backgroundColor: "#000",
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      {/* Slides container — moves with swipe */}
      <div style={{
        position: "absolute", inset: 0,
        transform: `translateY(${swipeOffset}px)`,
        transition: isAnimating ? "transform 0.3s ease-out" : "none",
      }}>
        {/* Previous slide (above) */}
        {prev && (
          <div style={{ position: "absolute", top: "-100%", left: 0, right: 0, height: "100%" }}>
            {renderSlide(prev, currentIndex - 1)}
          </div>
        )}

        {/* Current slide */}
        {renderSlide(current, currentIndex)}

        {/* Next slide (below) */}
        {next && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, height: "100%" }}>
            {renderSlide(next, currentIndex + 1)}
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: "calc(12px + env(safe-area-inset-top, 44px))", left: 16,
          zIndex: 52, width: 44, height: 44, borderRadius: "50%",
          backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)",
          border: "none", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
      </button>

      {/* Progress indicator — right side dots */}
      <div style={{
        position: "absolute", right: 10,
        top: "50%", transform: "translateY(-50%)",
        zIndex: 52, display: "flex", flexDirection: "column", gap: 4, alignItems: "center",
      }}>
        {topRecipes.slice(
          Math.max(0, currentIndex - 3),
          Math.min(topRecipes.length, currentIndex + 4)
        ).map((_, i) => {
          const actualIndex = Math.max(0, currentIndex - 3) + i;
          const isCurrent = actualIndex === currentIndex;
          return (
            <div
              key={actualIndex}
              onClick={() => goTo(actualIndex)}
              style={{
                width: isCurrent ? 6 : 4,
                height: isCurrent ? 18 : 4,
                borderRadius: 3,
                backgroundColor: isCurrent ? "white" : "rgba(255,255,255,0.35)",
                transition: "all 0.3s",
                cursor: "pointer",
              }}
            />
          );
        })}
      </div>

      {/* Counter */}
      <div style={{
        position: "absolute", top: "calc(18px + env(safe-area-inset-top, 44px))", right: 16,
        zIndex: 52, padding: "4px 10px", borderRadius: 12,
        backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
          {currentIndex + 1} / {topRecipes.length}
        </span>
      </div>

      {/* Swipe hint (first time) */}
      {currentIndex === 0 && !isAnimating && swipeOffset === 0 && (
        <div style={{
          position: "absolute", bottom: "calc(170px + env(safe-area-inset-bottom, 0px))",
          left: "50%", transform: "translateX(-50%)",
          zIndex: 52, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          animation: "fadeInUp 0.5s ease-out, bounce 2s infinite 1s",
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
            <path d="m18 15-6-6-6 6" />
          </svg>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Swipe</span>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes bounce { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-8px); } }
      `}</style>
    </div>
  );
}

// ============================================================
// Main Page — Grid (default) + Feed Toggle
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
  const [showFeed, setShowFeed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  // Client-side search filter
  const searchFiltered = searchQuery.trim()
    ? displayItems.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayItems;

  return (
    <div style={{ backgroundColor: "#FFF3EB", minHeight: "100vh", paddingBottom: 90 }}>
      {/* Header */}
      <AppHeader title="Entdecken" subtitle="Rezeptideen aus deinen Lieblingsquellen" />

      {/* View Toggle: Stöbern / Feed */}
      <div style={{ padding: "0 20px", marginBottom: 12, display: "flex", gap: 0 }}>
        <div style={{
          display: "flex", backgroundColor: "#FCF7F2", borderRadius: 12, padding: 3, flex: 1,
        }}>
          <button
            onClick={() => setShowFeed(false)}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 10,
              fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              backgroundColor: !showFeed ? "white" : "transparent",
              color: !showFeed ? "#212022" : "#9193A0",
              boxShadow: !showFeed ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            Stöbern
          </button>
          <button
            onClick={() => setShowFeed(true)}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 10,
              fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              backgroundColor: showFeed ? "white" : "transparent",
              color: showFeed ? "#212022" : "#9193A0",
              boxShadow: showFeed ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Feed
          </button>
        </div>
      </div>

      {/* === GRID VIEW === */}
      {!showFeed && (
        <>
          {/* Search Bar */}
          <div style={{ padding: "0 20px", marginBottom: 10 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              backgroundColor: "white", borderRadius: 14, padding: "10px 14px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              border: searchQuery ? "1.5px solid #F2894F" : "1.5px solid #EAEAEA",
              transition: "border 0.2s",
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={searchQuery ? "#F2894F" : "#9193A0"} strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Rezept suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, border: "none", outline: "none", fontSize: 14, color: "#212022",
                  backgroundColor: "transparent", fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9193A0" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Source Toggle Chips */}
          <div style={{ padding: "0 20px", marginBottom: 8, display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="no-scrollbar">
            {availableSources.map((source) => (
              <SourceChip
                key={source.id}
                source={source}
                enabled={enabledSources.includes(source.id)}
                onToggle={() => toggleSource(source.id)}
              />
            ))}
          </div>

          {/* Filter Toggle Bar */}
          <div style={{ padding: "0 20px", marginBottom: 8 }}>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "10px 14px", borderRadius: 12,
                backgroundColor: activeFilters.length > 0 ? "#FEF1E8" : "white",
                border: activeFilters.length > 0 ? "1.5px solid #F2894F" : "1.5px solid #EAEAEA",
                cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: "all 0.2s",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={activeFilters.length > 0 ? "#F2894F" : "#9193A0"} strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="6" y1="12" x2="18" y2="12" />
                <line x1="8" y1="18" x2="16" y2="18" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: activeFilters.length > 0 ? "#F2894F" : "#555", flex: 1, textAlign: "left" }}>
                Filter{activeFilters.length > 0 ? ` (${activeFilters.length} aktiv)` : ""}
              </span>
              {activeFilters.length > 0 && (
                <span
                  onClick={(e) => { e.stopPropagation(); clearFilters(); }}
                  style={{ fontSize: 11, fontWeight: 600, color: "#F2894F", padding: "2px 8px", borderRadius: 8, backgroundColor: "rgba(242,137,79,0.15)" }}
                >
                  Reset
                </span>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9193A0" strokeWidth="2"
                style={{ transform: filtersOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>

          {/* Expandable Filter Groups */}
          {filtersOpen && (
            <div style={{
              padding: "0 20px", marginBottom: 12,
              animation: "slideDown 0.2s ease-out",
            }}>
              <div style={{
                backgroundColor: "white", borderRadius: 16, padding: "12px 14px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}>
                {FILTER_GROUPS.map((group) => (
                  <div key={group.category} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9193A0", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
                      {group.label}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {group.options.map((filter) => (
                        <FilterChip
                          key={filter.id}
                          filter={filter}
                          active={activeFilters.includes(filter.id)}
                          onToggle={() => toggleFilter(filter.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active filter pills (quick view when drawer closed) */}
          {!filtersOpen && activeFilters.length > 0 && (
            <div style={{ padding: "0 20px", marginBottom: 8, display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }} className="no-scrollbar">
              {activeFilters.map((filterId) => {
                const f = FILTER_OPTIONS.find((o) => o.id === filterId);
                if (!f) return null;
                return (
                  <button
                    key={filterId}
                    onClick={() => toggleFilter(filterId)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "5px 10px", borderRadius: 10,
                      backgroundColor: f.color, color: "white",
                      fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
                      border: "none", cursor: "pointer",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {f.label}
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                );
              })}
            </div>
          )}

          {/* Result count */}
          <div style={{ padding: "0 20px", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#9193A0", fontWeight: 500 }}>
              {searchFiltered.length} Rezepte
              {searchQuery && ` für "${searchQuery}"`}
            </span>
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
            ) : searchFiltered.length === 0 ? (
              <div style={{ textAlign: "center", paddingTop: 60 }}>
                <p style={{ fontSize: 14, color: "#9193A0" }}>
                  {searchQuery
                    ? `Kein Rezept für "${searchQuery}" gefunden.`
                    : activeFilters.length > 0
                    ? "Keine Rezepte für diese Filter. Versuche andere Kombinationen."
                    : "Keine Rezepte gefunden. Aktiviere mindestens eine Quelle."}
                </p>
                {(activeFilters.length > 0 || searchQuery) && (
                  <button onClick={() => { clearFilters(); setSearchQuery(""); }} style={{ marginTop: 12, padding: "8px 20px", borderRadius: 12, backgroundColor: "#F2894F", color: "white", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Alles zurücksetzen
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {searchFiltered.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleCardClick(item)}
                    style={{ borderRadius: 16, overflow: "hidden", backgroundColor: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", cursor: "pointer" }}
                  >
                    <div style={{ position: "relative", height: 130 }}>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          loading="lazy"
                          onError={(e) => {
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
        </>
      )}

      {/* === FEED VIEW — Fullscreen Swipe === */}
      {showFeed && (
        <SwipeFeed
          onClose={() => setShowFeed(false)}
          onOpenPreview={(item) => openPreview(item)}
        />
      )}

      <PreviewModal onSaved={handleRecipeSaved} />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
