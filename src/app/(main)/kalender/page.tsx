"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePlannerStore } from "@/stores/planner-store";
import { useRecipeStore } from "@/stores/recipe-store";
import { useHouseholdStore } from "@/stores/household-store";
import { useSubscriptionStore } from "@/stores/subscription-store";
// feed-store nicht mehr direkt genutzt — CalendarFeedPreview managed eigenen State
import { getMixedFeed } from "@/data/feed-sources";
import { Recipe } from "@/types";
import { MealType, MealSlot } from "@/types/planner";
import AppHeader from "@/components/ui/app-header";

const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getSourceColor(sourceName?: string): string {
  if (!sourceName) return "#2196F3";
  const n = sourceName.toLowerCase();
  if (n.includes("fooby")) return "#00A651";
  if (n.includes("betty")) return "#D4145A";
  if (n.includes("migusto")) return "#FF6600";
  if (n.includes("swissmilk")) return "#0077B6";
  return "#2196F3";
}

// === AI Plan Preferences ===
export interface AiPlanPreferences {
  healthiness: number;    // 0 = Soulfood ... 100 = Super gesund
  effort: number;         // 0 = Schnell & einfach ... 100 = Aufwändig & kreativ
  variety: number;        // 0 = Klassisch & vertraut ... 100 = Experimentierfreudig
  seasonal: boolean;      // Saisonale Zutaten bevorzugen
  budgetFriendly: boolean; // Budgetbewusst
  kidFriendly: boolean;   // Kindgerecht
  mealPrepFriendly: boolean; // Gut vorzubereiten (Meal Prep)
}

const defaultPrefs: AiPlanPreferences = {
  healthiness: 50,
  effort: 30,
  variety: 50,
  seasonal: true,
  budgetFriendly: false,
  kidFriendly: false,
  mealPrepFriendly: false,
};

export default function KalenderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { slots, loadSlots, addMeal, removeMeal, moveMeal, getDayPlans, isGenerating, generateError, generateAndApply } = usePlannerStore();
  const { recipes, loadRecipes } = useRecipeStore();
  const { household, loadHousehold } = useHouseholdStore();
  const [startDate, setStartDate] = useState(getToday);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showPicker, setShowPicker] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [viewDays, setViewDays] = useState<3 | 7>(3);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrefs, setAiPrefs] = useState<AiPlanPreferences>(defaultPrefs);

  // Recipe to add from detail page (via ?addRecipe=id)
  const addRecipeId = searchParams.get("addRecipe");
  const pendingRecipe = addRecipeId ? recipes.find(r => r.id === addRecipeId) : null;
  const [justAdded, setJustAdded] = useState<string | null>(null);

  // Swipe state
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Long-press drag state
  const [dragMeal, setDragMeal] = useState<MealSlot | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);
  const dayColumnRefs = useRef<Map<string, DOMRect>>(new Map());

  useEffect(() => { loadSlots(); loadRecipes(); loadHousehold(); }, [loadSlots, loadRecipes, loadHousehold]);

  // Auto-set kidFriendly from profile
  useEffect(() => {
    if (household?.profile?.children && household.profile.children > 0) {
      setAiPrefs(prev => ({ ...prev, kidFriendly: true }));
    }
  }, [household]);

  const dayPlans = useMemo(() => getDayPlans(startDate, viewDays), [startDate, slots, getDayPlans, viewDays]);

  const monthLabel = useMemo(() => {
    const midIdx = Math.floor(viewDays / 2);
    const mid = addDays(startDate, midIdx);
    return `${monthNames[mid.getMonth()]} ${mid.getFullYear()}`;
  }, [startDate, viewDays]);

  const navigate = useCallback((dir: number) => {
    setStartDate(prev => addDays(prev, dir * viewDays));
  }, [viewDays]);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating || isDragging.current) return;
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || isDragging.current) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    touchDeltaX.current = delta;
    setSwipeOffset(delta);
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || isDragging.current) return;
    touchStartX.current = null;
    const threshold = 60;
    if (touchDeltaX.current < -threshold) {
      setIsAnimating(true);
      setSwipeOffset(-window.innerWidth);
      setTimeout(() => { navigate(1); setSwipeOffset(0); setIsAnimating(false); }, 200);
    } else if (touchDeltaX.current > threshold) {
      setIsAnimating(true);
      setSwipeOffset(window.innerWidth);
      setTimeout(() => { navigate(-1); setSwipeOffset(0); setIsAnimating(false); }, 200);
    } else {
      setSwipeOffset(0);
    }
    touchDeltaX.current = 0;
  };

  const goToToday = () => setStartDate(getToday());

  // === Long-press drag handlers ===
  const handleMealTouchStart = (meal: MealSlot, e: React.TouchEvent) => {
    longPressTimer.current = setTimeout(() => {
      isDragging.current = true;
      setDragMeal(meal);
      document.querySelectorAll("[data-day-date]").forEach((el) => {
        const date = el.getAttribute("data-day-date")!;
        dayColumnRefs.current.set(date, el.getBoundingClientRect());
      });
      if (navigator.vibrate) navigator.vibrate(30);
    }, 400);
  };

  const handleMealTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !dragMeal) return;
    e.preventDefault();
    const touch = e.touches[0];
    let overDate: string | null = null;
    dayColumnRefs.current.forEach((rect, date) => {
      if (touch.clientX >= rect.left && touch.clientX <= rect.right) {
        overDate = date;
      }
    });
    setDragOverDate(overDate);
  };

  const handleMealTouchEnd = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    if (isDragging.current && dragMeal && dragOverDate && dragOverDate !== dragMeal.date) {
      moveMeal(dragMeal.id, dragOverDate);
    }
    isDragging.current = false;
    setDragMeal(null);
    setDragOverDate(null);
  };

  // Feed-Vorschau — direkt vom MealSlot
  const [previewMeal, setPreviewMeal] = useState<MealSlot | null>(null);

  // === Meal card click → navigate or preview ===
  const handleMealClick = (meal: MealSlot) => {
    if (isDragging.current) return;
    if (meal.recipeId && !meal.recipeId.startsWith("ai_")) {
      router.push(`/rezepte/${meal.recipeId}`);
    } else if (meal.sourceUrl) {
      setPreviewMeal(meal);
    }
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    if (!selectedDate) return;
    addMeal(recipe.id || Date.now().toString(), recipe.dishName, recipe.recipeImages?.[0], selectedDate, "abendessen" as MealType, recipe.servings);
    setShowPicker(false);
    setSelectedDate("");
  };

  const openPicker = (date: string) => {
    if (pendingRecipe) {
      addMeal(pendingRecipe.id || Date.now().toString(), pendingRecipe.dishName, pendingRecipe.recipeImages?.[0], date, "abendessen" as MealType, pendingRecipe.servings);
      setJustAdded(date);
      router.replace("/kalender", { scroll: false });
      setTimeout(() => setJustAdded(null), 2000);
    } else {
      setSelectedDate(date);
      setShowPicker(true);
    }
  };

  const { useFeature: useSubFeature, checkGate } = useSubscriptionStore();

  const handleGenerateAiPlan = async (planStartDate: Date, planNumDays: number) => {
    if (isGenerating) return;
    // Gate: aiPlanner
    if (!useSubFeature("aiPlanner")) return;
    setShowAiModal(false);

    const profile = household?.profile || {
      adults: 2, children: 0, dietary: [], allergies: [],
      cookingTimeWeekday: 30, cookingTimeWeekend: 60,
    };

    const feedItems = getMixedFeed(["fooby", "bettybossi", "migusto", "swissmilk"]);
    const feedForPlanner = feedItems
      .filter((item) => item.tags.includes("hauptgericht") || item.tags.includes("suppe") || item.tags.includes("salat"))
      .map((item) => ({
        title: item.title,
        source: item.sourceName,
        imageUrl: item.imageUrl,
        sourceUrl: item.sourceUrl,
      }));

    await generateAndApply(formatDate(planStartDate), planNumDays, profile, recipes, feedForPlanner, aiPrefs);

    setStartDate(planStartDate);
    setViewDays(planNumDays <= 3 ? 3 : 7);
    setAiSuccess(true);
    setTimeout(() => setAiSuccess(false), 3000);
  };

  return (
    <div style={{ backgroundColor: '#FFF3EB', minHeight: '100vh', paddingBottom: 90, overflow: 'hidden' }}>
      <AppHeader title="Kalender" />

      {/* Pending recipe banner */}
      {pendingRecipe && (
        <div style={{
          margin: '0 20px', padding: '12px 16px', borderRadius: 14,
          background: 'linear-gradient(135deg, #F2894F 0%, #E67A3C 100%)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {pendingRecipe.recipeImages?.[0] && (
            <img loading="lazy" decoding="async" src={pendingRecipe.recipeImages[0]} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'white', fontFamily: "'Montserrat', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pendingRecipe.dishName}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Tippe auf einen Tag oder +, um einzuplanen</p>
          </div>
          <button onClick={() => router.replace("/kalender", { scroll: false })} style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      )}

      {/* Feedback banners */}
      {justAdded && (
        <div style={{ margin: '8px 20px 0', padding: '10px 16px', borderRadius: 12, backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
          <span style={{ fontSize: 13, color: '#2E7D32', fontWeight: 600 }}>Eingeplant!</span>
        </div>
      )}
      {aiSuccess && (
        <div style={{ margin: '8px 20px 0', padding: '10px 16px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(123,45,125,0.1), rgba(242,137,79,0.1))', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B2D7D" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
          <span style={{ fontSize: 13, color: '#4B164C', fontWeight: 600 }}>Abendessen eingeplant!</span>
        </div>
      )}
      {generateError && !isGenerating && (
        <div style={{ margin: '8px 20px 0', padding: '10px 16px', borderRadius: 12, backgroundColor: 'rgba(230,73,73,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#E64949' }}>{generateError}</span>
        </div>
      )}

      {/* AI Wochenplan — subtiler CTA oben */}
      <div style={{ padding: '10px 20px 0' }}>
        <button
          onClick={() => setShowAiModal(true)}
          disabled={isGenerating}
          style={{
            width: '100%', padding: '10px 16px', borderRadius: 12,
            background: isGenerating
              ? 'linear-gradient(135deg, #C0C0C0, #A0A0A0)'
              : 'linear-gradient(135deg, rgba(75,22,76,0.08), rgba(242,137,79,0.08))',
            color: isGenerating ? 'white' : '#4B164C',
            fontWeight: 600, fontSize: 13, border: 'none',
            cursor: isGenerating ? 'wait' : 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {isGenerating ? (
            <>
              <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              AI plant deine Woche...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7B2D7D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              AI Wochenplan
            </>
          )}
        </button>
      </div>

      {/* Month + Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 20px 0' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 12, cursor: 'pointer' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#462F4D" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <button onClick={goToToday} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 400, color: '#1E1F28' }}>{monthLabel}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#462F4D" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
        </button>
        <button onClick={() => navigate(1)} style={{ background: 'none', border: 'none', padding: 12, cursor: 'pointer' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#462F4D" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>

      {/* 3-Day / 7-Day Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 20px 0' }}>
        <div style={{ display: 'inline-flex', borderRadius: 10, overflow: 'hidden', backgroundColor: '#EDE5DA' }}>
          <button
            onClick={() => setViewDays(3)}
            style={{
              padding: '6px 16px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              backgroundColor: viewDays === 3 ? '#4B164C' : 'transparent',
              color: viewDays === 3 ? 'white' : '#7A6E6E', transition: 'all 0.2s',
            }}
          >3 Tage</button>
          <button
            onClick={() => setViewDays(7)}
            style={{
              padding: '6px 16px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              backgroundColor: viewDays === 7 ? '#4B164C' : 'transparent',
              color: viewDays === 7 ? 'white' : '#7A6E6E', transition: 'all 0.2s',
            }}
          >Woche</button>
        </div>
      </div>

      {/* Day Grid */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={(e) => { handleTouchMove(e); handleMealTouchMove(e); }}
        onTouchEnd={() => { handleTouchEnd(); handleMealTouchEnd(); }}
        style={{
          display: 'grid', gridTemplateColumns: `repeat(${viewDays}, 1fr)`,
          marginTop: 8, minHeight: 'calc(100vh - 300px)',
          transform: `translateX(${swipeOffset}px)`,
          transition: isAnimating ? 'transform 0.2s ease-out' : (touchStartX.current !== null ? 'none' : 'transform 0.1s ease'),
        }}
      >
        {dayPlans.map((day) => (
          <div key={day.date} data-day-date={day.date} style={{
            padding: '0 2px',
            backgroundColor: dragOverDate === day.date ? 'rgba(242,137,79,0.12)' : 'transparent',
            transition: 'background-color 0.15s', borderRadius: 8,
          }}>
            {/* Day header */}
            <div
              onClick={() => pendingRecipe && openPicker(day.date)}
              style={{
                textAlign: 'center', padding: viewDays === 7 ? '8px 0 4px' : '12px 0 8px',
                cursor: pendingRecipe ? 'pointer' : 'default', borderRadius: 12,
                backgroundColor: justAdded === day.date ? 'rgba(76,175,80,0.1)' : (pendingRecipe ? 'rgba(242,137,79,0.05)' : 'transparent'),
                transition: 'background-color 0.3s',
              }}
            >
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: viewDays === 7 ? 10 : 13, color: day.isToday ? '#F2894F' : '#282828', fontWeight: day.isToday ? 700 : 400 }}>
                {day.dayLabel}
              </p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: viewDays === 7 ? 13 : 16, fontWeight: 500, color: day.isToday ? '#F2894F' : '#1E1F28', lineHeight: '20px' }}>
                {day.dayNumber}
              </p>
            </div>

            {/* Meal cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: viewDays === 7 ? 3 : 6, padding: '0 1px' }}>
              {day.meals.map((meal) => (
                <div
                  key={meal.id}
                  onTouchStart={(e) => handleMealTouchStart(meal, e)}
                  onClick={() => handleMealClick(meal)}
                  style={{
                    borderRadius: viewDays === 7 ? 10 : 14, overflow: 'hidden', position: 'relative',
                    aspectRatio: viewDays === 7 ? '3/4' : '1/1', width: '100%', cursor: 'pointer',
                    opacity: dragMeal?.id === meal.id ? 0.4 : 1, transition: 'opacity 0.15s',
                    WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none',
                  }}
                >
                  {meal.recipeImage ? (
                    <img loading="lazy" decoding="async" src={meal.recipeImage} alt={meal.recipeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #F2894F, #CC3D10)' }} />
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(58,38,27,0.85) 0%, rgba(115,80,61,0.13) 50%, rgba(115,80,61,0.13) 100%)' }} />

                  {/* Source badge */}
                  {meal.sourceName && (
                    <div style={{ position: 'absolute', top: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: viewDays === 7 ? '1px 4px' : '2px 6px' }}>
                      <span style={{ fontSize: viewDays === 7 ? 7 : 9, fontWeight: 700, color: 'white', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: 0.3, textTransform: 'uppercase' }}>
                        {meal.sourceName}
                      </span>
                    </div>
                  )}

                  <p style={{
                    position: 'absolute', bottom: viewDays === 7 ? 3 : 6, left: viewDays === 7 ? 3 : 6, right: viewDays === 7 ? 3 : 6,
                    fontFamily: "'Montserrat', sans-serif", fontSize: viewDays === 7 ? 8 : 11, fontWeight: 700,
                    color: '#FFF3EB', lineHeight: viewDays === 7 ? '10px' : '13px', letterSpacing: -0.24,
                  }}>
                    {meal.recipeName}
                  </p>

                  <button
                    onClick={(e) => { e.stopPropagation(); removeMeal(meal.id); }}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      width: viewDays === 7 ? 18 : 24, height: viewDays === 7 ? 18 : 24, borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.4)', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width={viewDays === 7 ? 8 : 12} height={viewDays === 7 ? 8 : 12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>
              ))}

              {/* Add meal */}
              <button
                onClick={() => openPicker(day.date)}
                style={{
                  aspectRatio: viewDays === 7 ? '3/2' : '1/1', width: '100%', borderRadius: viewDays === 7 ? 10 : 14,
                  border: '2px dashed #D4C9BF', backgroundColor: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0.6,
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width={viewDays === 7 ? 14 : 20} height={viewDays === 7 ? 14 : 20} viewBox="0 0 24 24" fill="none" stroke="#9193A0" strokeWidth="2"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Drag overlay */}
      {dragMeal && (
        <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(75,22,76,0.9)', borderRadius: 12, padding: '10px 20px', zIndex: 200 }}>
          <p style={{ fontSize: 12, color: 'white', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: 'nowrap' }}>
            {dragOverDate ? `Verschieben nach ${new Date(dragOverDate + "T12:00:00").toLocaleDateString("de-CH", { weekday: "short", day: "numeric" })}` : "Auf einen Tag ziehen..."}
          </p>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Feed Recipe Preview Modal */}
      {previewMeal && (
        <CalendarFeedPreview
          meal={previewMeal}
          onSaved={(recipeId) => {
            loadRecipes();
            setPreviewMeal(null);
            router.push(`/rezepte/${recipeId}`);
          }}
          onClose={() => setPreviewMeal(null)}
        />
      )}

      {/* AI Parameter Modal */}
      {showAiModal && (
        <AiPlanModal
          prefs={aiPrefs}
          onPrefsChange={setAiPrefs}
          onGenerate={handleGenerateAiPlan}
          onClose={() => setShowAiModal(false)}
          profile={household?.profile}
          currentStartDate={startDate}
        />
      )}

      {/* Recipe Picker Modal */}
      {showPicker && (
        <RecipePicker
          recipes={recipes}
          selectedDate={selectedDate}
          onSelect={handleSelectRecipe}
          onClose={() => { setShowPicker(false); setSelectedDate(""); }}
        />
      )}
    </div>
  );
}


/* ============================================================
   Calendar Feed Preview — Eigenständige Preview mit eigenem Fetch
   Zeigt sofort MealSlot-Daten + lädt Zusatzinfos via API
   ============================================================ */
function CalendarFeedPreview({ meal, onSaved, onClose }: {
  meal: MealSlot;
  onSaved: (recipeId: string) => void;
  onClose: () => void;
}) {
  const { useFeature: useSubFeature, checkGate } = useSubscriptionStore();
  const { recipes } = useRecipeStore();
  const [previewData, setPreviewData] = useState<{
    title?: string; description?: string; imageUrl?: string | null;
    totalTime?: string; servings?: number; difficulty?: string;
    ingredients: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceColor = getSourceColor(meal.sourceName);

  // Fetch preview data from API on mount
  useEffect(() => {
    if (!meal.sourceUrl) { setIsLoading(false); return; }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/feed?preview=${encodeURIComponent(meal.sourceUrl!)}`);
        if (!res.ok) throw new Error("Vorschau nicht verfügbar");
        const data = await res.json();
        if (!cancelled) {
          setPreviewData({
            title: data.title || meal.recipeName,
            description: data.description || "",
            imageUrl: data.imageUrl || meal.recipeImage || null,
            totalTime: data.totalTime,
            servings: data.servings || meal.servings,
            difficulty: data.difficulty,
            ingredients: data.ingredients || [],
          });
        }
      } catch {
        // Fallback: zeige was wir vom MealSlot haben
        if (!cancelled) {
          setPreviewData({
            title: meal.recipeName,
            description: "",
            imageUrl: meal.recipeImage || null,
            servings: meal.servings,
            ingredients: [],
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [meal]);

  // Save recipe — exakt gleiche Logik wie feed-store.saveRecipeFromPreview
  const handleSave = async () => {
    if (!meal.sourceUrl) return;
    // Gate: recipeImport (AI-Import) + recipeStore (Rezept-Limit)
    if (!useSubFeature("recipeImport")) return;
    if (!checkGate("recipeStore", recipes.length).allowed) {
      useSubFeature("recipeStore");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      // 1. Extract text from recipe page
      const extractRes = await fetch(`/api/recipe/extract-text?url=${encodeURIComponent(meal.sourceUrl)}`);
      let pageText: string | undefined;
      let extractedImageUrl: string | undefined;
      if (extractRes.ok) {
        const data = await extractRes.json();
        pageText = data.text;
        extractedImageUrl = data.imageUrl;
      }

      // 2. Generate recipe via AI
      const genRes = await fetch("/api/recipe/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: meal.sourceUrl, pageText }),
      });
      if (!genRes.ok) throw new Error("Rezept-Import fehlgeschlagen");
      const recipe = await genRes.json();

      // 3. Add image
      const imgUrl = extractedImageUrl || previewData?.imageUrl || meal.recipeImage;
      if (imgUrl) {
        const existing = recipe.recipeImages || [];
        if (!existing.includes(imgUrl)) recipe.recipeImages = [imgUrl, ...existing];
      }
      recipe.sourceUrl = meal.sourceUrl;

      // 4. Save to Supabase — gleiche Spalten wie feed-store
      const { supabase } = await import("@/lib/supabase");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { generateId } = await import("@/lib/utils");
      const id = generateId();
      const { error: recipeError } = await supabase.from("recipes").insert([{
        id,
        user_id: user.id,
        dish_name: recipe.dishName || recipe.title || meal.recipeName,
        cuisine: recipe.cuisine || "",
        description: recipe.description || "",
        instructions: recipe.instructions || [],
        servings: recipe.servings || meal.servings || 4,
        prep_time: recipe.prepTime || 0,
        cook_time: recipe.cookTime || 0,
        difficulty: recipe.difficulty || "medium",
        rating: recipe.rating || null,
        is_favorite: false,
        nutrition: recipe.nutrition || null,
        recipe_images: recipe.recipeImages || [],
        source_url: recipe.sourceUrl || null,
      }]);
      if (recipeError) throw recipeError;

      // 5. Insert ingredients in separate table
      if (recipe.ingredients?.length > 0) {
        const ingredients = recipe.ingredients.map((ing: any) => ({
          recipe_id: id,
          name: ing.name,
          quantity: ing.quantity || "",
          unit: ing.unit || "",
          category: ing.category || "other",
          group_name: ing.group || null,
          notes: ing.notes || null,
          is_selected: ing.isSelected ?? true,
        }));
        await supabase.from("ingredients").insert(ingredients);
      }

      setSaved(true);
      setIsSaving(false);
      setTimeout(() => onSaved(id), 1200);
    } catch (err: any) {
      console.error("CalendarFeedPreview save error:", err);
      setError(err.message || "Import fehlgeschlagen");
      setIsSaving(false);
    }
  };

  const imageUrl = previewData?.imageUrl || meal.recipeImage;
  const title = previewData?.title || meal.recipeName;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />

      <div onClick={(e) => e.stopPropagation()} style={{
        position: 'relative', backgroundColor: 'white', borderRadius: '24px 24px 0 0',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 8, flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0' }} />
        </div>

        {/* Image */}
        <div style={{ flexShrink: 0 }}>
          {imageUrl ? (
            <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
              <img loading="lazy" decoding="async" src={imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 40%)' }} />
              {meal.sourceName && (
                <div style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 6, padding: '3px 8px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: sourceColor, letterSpacing: 0.2 }}>{meal.sourceName}</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ height: 100, background: `linear-gradient(135deg, ${sourceColor} 0%, #333 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: 1 }}>{meal.sourceName || "Rezept"}</span>
            </div>
          )}
        </div>

        {/* Title + Buttons */}
        <div style={{ padding: '16px 20px 12px', flexShrink: 0, borderBottom: '1px solid #F0F0F0' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#212022', marginBottom: 4, fontFamily: "'Montserrat', sans-serif", lineHeight: 1.25 }}>
            {title}
          </h2>
          <p style={{ fontSize: 13, color: '#9193A0', marginBottom: 12 }}>
            {meal.sourceName ? `Rezept von ${meal.sourceName}` : "AI-Vorschlag"}
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => { if (meal.sourceUrl) window.open(meal.sourceUrl, "_blank", "noopener"); }}
              style={{ flex: 1, padding: '12px 16px', borderRadius: 14, border: '1.5px solid #DCDDDC', backgroundColor: 'white', fontSize: 14, fontWeight: 600, color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
              Original
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || saved}
              style={{
                flex: 1.4, padding: '12px 16px', borderRadius: 14, border: 'none',
                backgroundColor: saved ? '#4CAF50' : '#F2894F',
                fontSize: 14, fontWeight: 700, color: 'white',
                cursor: isSaving ? 'wait' : 'pointer', opacity: isSaving ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'background-color 0.3s',
              }}
            >
              {saved ? (
                <><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>Gespeichert!</>
              ) : isSaving ? (
                <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 1s linear infinite' }} />Importiere...</>
              ) : (
                <><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>Rezept speichern</>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Content — Details */}
        <div style={{ overflow: 'auto', padding: '16px 20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>
          {/* Meta pills — sofort sichtbar (aus MealSlot + API) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {previewData?.totalTime && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 20, backgroundColor: '#FEF1E8', fontSize: 12, fontWeight: 600, color: '#F2894F' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                {previewData.totalTime}
              </span>
            )}
            {(previewData?.servings || meal.servings) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 20, backgroundColor: '#FEF1E8', fontSize: 12, fontWeight: 600, color: '#F2894F' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                {previewData?.servings || meal.servings} Portionen
              </span>
            )}
            {previewData?.difficulty && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 20, backgroundColor: '#FEF1E8', fontSize: 12, fontWeight: 600, color: '#F2894F' }}>
                {previewData.difficulty}
              </span>
            )}
          </div>

          {/* Loading state */}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #FEF1E8', borderTopColor: '#F2894F', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13, color: '#9193A0' }}>Rezeptdaten laden...</span>
            </div>
          )}

          {/* Description */}
          {previewData?.description && (
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.5, marginBottom: 16 }}>
              {previewData.description.length > 200 ? previewData.description.substring(0, 200) + "…" : previewData.description}
            </p>
          )}

          {/* Ingredients */}
          {previewData && previewData.ingredients.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#212022', marginBottom: 8, fontFamily: "'Montserrat', sans-serif" }}>Zutaten</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {previewData.ingredients.slice(0, 12).map((ing, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: 8, backgroundColor: '#F9F9F9', border: '1px solid #EAEAEA', fontSize: 12, color: '#444' }}>{ing}</span>
                ))}
                {previewData.ingredients.length > 12 && (
                  <span style={{ padding: '4px 10px', fontSize: 12, color: '#9193A0' }}>+{previewData.ingredients.length - 12} mehr</span>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 12, backgroundColor: '#FFF0F0', color: '#CC3D10', fontSize: 13 }}>{error}</div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}


/* ============================================================
   AI Plan Parameter Modal
   ============================================================ */
function AiPlanModal({ prefs, onPrefsChange, onGenerate, onClose, profile, currentStartDate }: {
  prefs: AiPlanPreferences;
  onPrefsChange: (p: AiPlanPreferences) => void;
  onGenerate: (planStart: Date, planDays: number) => void;
  onClose: () => void;
  profile?: any;
  currentStartDate: Date;
}) {
  const [planDays, setPlanDays] = useState(7);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Smart date options
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextMonday = (() => {
    const d = new Date(today);
    const day = d.getDay();
    const diff = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
    d.setDate(d.getDate() + diff);
    return d;
  })();

  const [planStart, setPlanStart] = useState(() => {
    // Default: nächster Montag
    const d = new Date(currentStartDate);
    const day = d.getDay();
    const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
    d.setDate(d.getDate() + diff);
    return d;
  });

  // Check which quick option is active
  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const activeQuick = isSameDay(planStart, today) ? "today" : isSameDay(planStart, tomorrow) ? "tomorrow" : isSameDay(planStart, nextMonday) ? "monday" : "custom";

  // End date for preview
  const planEnd = new Date(planStart);
  planEnd.setDate(planEnd.getDate() + planDays - 1);

  const shortDay = (d: Date) => ["So","Mo","Di","Mi","Do","Fr","Sa"][d.getDay()];
  const shortDate = (d: Date) => `${d.getDate()}.${d.getMonth() + 1}.`;
  const shortMonthName = (d: Date) => ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"][d.getMonth()];

  const update = (key: keyof AiPlanPreferences, value: any) => {
    onPrefsChange({ ...prefs, [key]: value });
  };

  const healthLabel = prefs.healthiness <= 25 ? "Soulfood" : prefs.healthiness <= 50 ? "Ausgewogen" : prefs.healthiness <= 75 ? "Gesund" : "Super gesund";
  const effortLabel = prefs.effort <= 25 ? "Blitzschnell" : prefs.effort <= 50 ? "Einfach" : prefs.effort <= 75 ? "Etwas Aufwand" : "Kreativ & aufwändig";
  const varietyLabel = prefs.variety <= 25 ? "Klassiker" : prefs.variety <= 50 ? "Bekanntes" : prefs.variety <= 75 ? "Abwechslungsreich" : "Experimentell";

  const formatInputDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: '#FFF3EB', borderRadius: '24px 24px 0 0',
        padding: '24px 20px', width: '100%', maxWidth: 480,
        maxHeight: '85vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 700, color: '#462F4D', margin: 0 }}>
              AI Wochenplan
            </h3>
            <p style={{ fontSize: 12, color: '#9193A0', marginTop: 2 }}>Passe deinen Plan an deine Stimmung an</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9193A0" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* === ZEITRAUM — Visueller Bereich === */}
        <div style={{
          backgroundColor: 'white', borderRadius: 16, padding: '16px 14px',
          marginBottom: 16, border: '1px solid #F0E6DD',
        }}>
          {/* Start-Chips */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9193A0', marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Starten ab
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([
                { id: "today", label: "Heute", date: today },
                { id: "tomorrow", label: "Morgen", date: tomorrow },
                { id: "monday", label: `Mo, ${nextMonday.getDate()}.${nextMonday.getMonth()+1}.`, date: nextMonday },
              ] as const).map((opt) => (
                <button key={opt.id} onClick={() => { setPlanStart(new Date(opt.date)); }} style={{
                  padding: '7px 14px', borderRadius: 20,
                  border: activeQuick === opt.id ? '1.5px solid #4B164C' : '1.5px solid #E0D5CA',
                  backgroundColor: activeQuick === opt.id ? 'rgba(75,22,76,0.08)' : 'transparent',
                  color: activeQuick === opt.id ? '#4B164C' : '#7A6E6E',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.15s',
                }}>
                  {opt.label}
                </button>
              ))}
              {/* Custom date — label wraps hidden input so tap always opens native picker on iOS */}
              <label style={{
                padding: '7px 12px', borderRadius: 20,
                border: activeQuick === "custom" ? '1.5px solid #4B164C' : '1.5px solid #E0D5CA',
                backgroundColor: activeQuick === "custom" ? 'rgba(75,22,76,0.08)' : 'transparent',
                color: activeQuick === "custom" ? '#4B164C' : '#7A6E6E',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
                position: 'relative', overflow: 'hidden',
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                </svg>
                {activeQuick === "custom" ? `${shortDay(planStart)} ${shortDate(planStart)}` : "Andere"}
                <input
                  ref={dateInputRef}
                  type="date"
                  value={formatInputDate(planStart)}
                  onChange={(e) => {
                    if (e.target.value) {
                      setPlanStart(new Date(e.target.value + "T12:00:00"));
                    }
                  }}
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    opacity: 0, cursor: 'pointer',
                    // Make sure the input covers the whole label area for tap target
                    fontSize: 16, // prevents iOS zoom on focus
                  }}
                />
              </label>
            </div>
          </div>

          {/* Dauer-Chips */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9193A0', marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Dauer
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {([
                { days: 3, label: "3 Tage" },
                { days: 5, label: "5 Tage" },
                { days: 7, label: "1 Woche" },
                { days: 14, label: "2 Wochen" },
              ]).map((opt) => (
                <button key={opt.days} onClick={() => setPlanDays(opt.days)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 20,
                  border: planDays === opt.days ? '1.5px solid #4B164C' : '1.5px solid #E0D5CA',
                  backgroundColor: planDays === opt.days ? 'rgba(75,22,76,0.08)' : 'transparent',
                  color: planDays === opt.days ? '#4B164C' : '#7A6E6E',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.15s',
                }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Profile summary */}
        {profile && (
          <div style={{
            padding: '10px 14px', borderRadius: 12,
            backgroundColor: 'rgba(75,22,76,0.05)', marginBottom: 16,
          }}>
            <p style={{ fontSize: 11, color: '#7A6E6E', fontWeight: 600, marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif", textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Dein Haushalt
            </p>
            <p style={{ fontSize: 13, color: '#462F4D', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {profile.adults || 2} Erwachsene{profile.children > 0 ? ` + ${profile.children} Kind${profile.children > 1 ? "er" : ""}` : ""}
              {profile.dietary?.length > 0 ? ` · ${profile.dietary.join(", ")}` : ""}
              {profile.allergies?.length > 0 ? ` · Ohne: ${profile.allergies.join(", ")}` : ""}
            </p>
          </div>
        )}

        {/* === SLIDER: Gesund ↔ Soulfood === */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#462F4D', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Gesundheit</span>
            <span style={{ fontSize: 11, color: '#F2894F', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{healthLabel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, color: '#9193A0', minWidth: 52, textAlign: 'right' }}>Soulfood</span>
            <input type="range" min="0" max="100" value={prefs.healthiness} onChange={(e) => update("healthiness", Number(e.target.value))} style={{ flex: 1, accentColor: '#4B164C', height: 4 }} />
            <span style={{ fontSize: 10, color: '#9193A0', minWidth: 52 }}>Gesund</span>
          </div>
        </div>

        {/* === SLIDER: Aufwand === */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#462F4D', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Aufwand</span>
            <span style={{ fontSize: 11, color: '#F2894F', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{effortLabel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, color: '#9193A0', minWidth: 52, textAlign: 'right' }}>Schnell</span>
            <input type="range" min="0" max="100" value={prefs.effort} onChange={(e) => update("effort", Number(e.target.value))} style={{ flex: 1, accentColor: '#4B164C', height: 4 }} />
            <span style={{ fontSize: 10, color: '#9193A0', minWidth: 52 }}>Aufwändig</span>
          </div>
        </div>

        {/* === SLIDER: Abwechslung === */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#462F4D', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Abwechslung</span>
            <span style={{ fontSize: 11, color: '#F2894F', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{varietyLabel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, color: '#9193A0', minWidth: 52, textAlign: 'right' }}>Klassiker</span>
            <input type="range" min="0" max="100" value={prefs.variety} onChange={(e) => update("variety", Number(e.target.value))} style={{ flex: 1, accentColor: '#4B164C', height: 4 }} />
            <span style={{ fontSize: 10, color: '#9193A0', minWidth: 52 }}>Experimentell</span>
          </div>
        </div>

        {/* === TOGGLES === */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {[
            { key: "seasonal" as const, label: "Saisonal", icon: "M12 2a10 10 0 0 0-6.5 17.5L12 22l6.5-2.5A10 10 0 0 0 12 2Z" },
            { key: "budgetFriendly" as const, label: "Budget", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
            { key: "kidFriendly" as const, label: "Kindgerecht", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
            { key: "mealPrepFriendly" as const, label: "Meal Prep", icon: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7" },
          ].map((toggle) => (
            <button
              key={toggle.key}
              onClick={() => update(toggle.key, !prefs[toggle.key])}
              style={{
                padding: '8px 14px', borderRadius: 20,
                border: prefs[toggle.key] ? '1.5px solid #4B164C' : '1.5px solid #D4C9BF',
                backgroundColor: prefs[toggle.key] ? 'rgba(75,22,76,0.08)' : 'transparent',
                color: prefs[toggle.key] ? '#4B164C' : '#7A6E6E',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={toggle.icon} />
              </svg>
              {toggle.label}
            </button>
          ))}
        </div>

        {/* Generate button */}
        <button
          onClick={() => onGenerate(planStart, planDays)}
          style={{
            width: '100%', padding: '14px 20px', borderRadius: 16,
            background: 'linear-gradient(135deg, #7B2D7D 0%, #4B164C 100%)',
            color: 'white', fontWeight: 700, fontSize: 15,
            border: 'none', cursor: 'pointer',
            fontFamily: "'Montserrat', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 4px 16px rgba(75,22,76,0.3)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          {planDays} Tage planen
        </button>

        <div style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
      </div>
    </div>
  );
}


/* ============================================================
   Recipe Picker
   ============================================================ */
function RecipePicker({ recipes, selectedDate, onSelect, onClose }: {
  recipes: Recipe[];
  selectedDate: string;
  onSelect: (recipe: Recipe) => void;
  onClose: () => void;
}) {
  const dateLabel = new Date(selectedDate + "T12:00:00").toLocaleDateString("de-DE", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: '#FFF3EB', borderRadius: '20px 20px 0 0',
        padding: '24px 20px', width: '100%', maxWidth: 480,
        maxHeight: '70vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 700, color: '#462F4D', marginBottom: 4 }}>
          Rezept einplanen
        </h3>
        <p style={{ fontSize: 13, color: '#9193A0', marginBottom: 20 }}>
          Wähle ein Rezept für den {dateLabel}
        </p>

        {recipes.length === 0 ? (
          <p style={{ fontSize: 14, color: '#9193A0', textAlign: 'center', padding: 32 }}>
            Noch keine Rezepte gespeichert. Scanne zuerst ein Rezept!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recipes.map((recipe) => (
              <div
                key={recipe.id} role="button" tabIndex={0}
                onClick={() => onSelect(recipe)}
                onKeyDown={(e) => { if (e.key === 'Enter') onSelect(recipe); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  backgroundColor: '#FCF7F2', borderRadius: 16, padding: 12,
                  cursor: 'pointer', width: '100%',
                  WebkitTapHighlightColor: 'rgba(242,137,79,0.15)', transition: 'background-color 0.15s',
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg, #F2894F, #CC3D10)' }}>
                  {recipe.recipeImages?.[0] && <img loading="lazy" decoding="async" src={recipe.recipeImages[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#462F4D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {recipe.dishName}
                  </p>
                  <p style={{ fontSize: 12, color: '#9193A0', marginTop: 2, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {recipe.servings} Portionen · {(recipe.prepTime || 0) + (recipe.cookTime || 0)} Min.
                  </p>
                </div>
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#F2894F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={onClose} style={{ width: '100%', padding: 14, background: 'none', border: 'none', color: '#9193A0', fontSize: 14, cursor: 'pointer', marginTop: 16 }}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}
