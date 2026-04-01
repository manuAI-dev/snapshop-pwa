import { create } from "zustand";
import { FeedPreview } from "@/types";
import { generateId } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

export interface FeedItem {
  id: string;
  title: string;
  imageUrl: string | null;
  sourceUrl: string;
  sourceId: string;
  sourceName: string;
  sourceColor: string;
  tags?: string[];
}

export interface AvailableSource {
  id: string;
  name: string;
  color: string;
  hostname: string;
  recipeCount: number;
}

// ============================================================
// localStorage helpers
// ============================================================

const ENABLED_SOURCES_KEY = "snapshop_feed_sources";

function getEnabledSources(): string[] {
  if (typeof window === "undefined") return ["fooby", "bettybossi", "migusto", "swissmilk"];
  try {
    const raw = window.localStorage.getItem(ENABLED_SOURCES_KEY);
    return raw ? JSON.parse(raw) : ["fooby", "bettybossi", "migusto", "swissmilk"];
  } catch {
    return ["fooby", "bettybossi", "migusto", "swissmilk"];
  }
}

function saveEnabledSources(sources: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ENABLED_SOURCES_KEY, JSON.stringify(sources));
}

// ============================================================
// Store
// ============================================================

interface FeedStore {
  items: FeedItem[];
  availableSources: AvailableSource[];
  enabledSources: string[];
  activeFilters: string[];
  isLoading: boolean;
  error: string | null;

  // Preview
  previewItem: FeedItem | null;
  previewData: FeedPreview | null;
  isLoadingPreview: boolean;
  isSaving: boolean;

  // Computed
  filteredItems: () => FeedItem[];

  // Actions
  loadFeed: () => Promise<void>;
  toggleSource: (sourceId: string) => void;
  toggleFilter: (filterId: string) => void;
  clearFilters: () => void;
  loadEnabledSources: () => void;

  // Preview actions
  openPreview: (item: FeedItem) => Promise<void>;
  closePreview: () => void;
  saveRecipeFromPreview: () => Promise<string | null>;
}

export const useFeedStore = create<FeedStore>((set, get) => ({
  items: [],
  availableSources: [],
  enabledSources: [],
  activeFilters: [],
  isLoading: false,
  error: null,

  previewItem: null,
  previewData: null,
  isLoadingPreview: false,
  isSaving: false,

  filteredItems: () => {
    const { items, activeFilters } = get();
    if (activeFilters.length === 0) return items;

    // Group active filters by category (type, diet, effort)
    // Within a category: OR logic (e.g. "Suppe" OR "Salat")
    // Between categories: AND logic (e.g. type=Suppe AND diet=vegetarisch)
    const { FILTER_OPTIONS } = require("@/data/feed-sources");
    const categoryMap: Record<string, string[]> = {};
    for (const f of activeFilters) {
      const opt = FILTER_OPTIONS.find((o: any) => o.id === f);
      const cat = opt?.category || "other";
      if (!categoryMap[cat]) categoryMap[cat] = [];
      categoryMap[cat].push(f);
    }

    return items.filter((item) => {
      const itemTags = item.tags || [];
      // Every category must have at least one match
      return Object.values(categoryMap).every((filtersInCat) =>
        filtersInCat.some((f) => itemTags.includes(f))
      );
    });
  },

  loadEnabledSources: () => {
    const sources = getEnabledSources();
    set({ enabledSources: sources });
  },

  loadFeed: async () => {
    const enabled = get().enabledSources;
    if (enabled.length === 0) return;

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/feed?sources=${enabled.join(",")}`);
      if (!response.ok) throw new Error("Feed konnte nicht geladen werden");
      const data = await response.json();
      set({
        items: data.items || [],
        availableSources: data.availableSources || [],
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  toggleSource: (sourceId) => {
    const current = get().enabledSources;
    const next = current.includes(sourceId)
      ? current.filter((s) => s !== sourceId)
      : [...current, sourceId];
    if (next.length === 0) return; // Mindestens eine Quelle aktiv
    saveEnabledSources(next);
    set({ enabledSources: next });
    // Reload feed with new sources
    setTimeout(() => get().loadFeed(), 0);
  },

  toggleFilter: (filterId) => {
    const current = get().activeFilters;
    const next = current.includes(filterId)
      ? current.filter((f) => f !== filterId)
      : [...current, filterId];
    set({ activeFilters: next });
  },

  clearFilters: () => {
    set({ activeFilters: [] });
  },

  openPreview: async (item) => {
    set({ previewItem: item, previewData: null, isLoadingPreview: true });

    try {
      const response = await fetch(`/api/feed?preview=${encodeURIComponent(item.sourceUrl)}`);
      if (!response.ok) throw new Error("Vorschau nicht verfügbar");
      const data = await response.json();

      set({
        previewData: {
          title: data.title || item.title,
          description: data.description || "",
          imageUrl: data.imageUrl || item.imageUrl,
          sourceUrl: item.sourceUrl,
          sourceName: item.sourceName,
          servings: data.servings,
          prepTime: data.prepTime,
          cookTime: data.cookTime,
          totalTime: data.totalTime,
          ingredients: data.ingredients || [],
          cuisine: data.cuisine,
          difficulty: data.difficulty,
        },
        isLoadingPreview: false,
      });
    } catch {
      set({
        previewData: {
          title: item.title,
          description: "",
          imageUrl: item.imageUrl,
          sourceUrl: item.sourceUrl,
          sourceName: item.sourceName,
          ingredients: [],
        },
        isLoadingPreview: false,
      });
    }
  },

  closePreview: () => {
    set({ previewItem: null, previewData: null, isLoadingPreview: false, isSaving: false });
  },

  saveRecipeFromPreview: async () => {
    const { previewItem } = get();
    if (!previewItem) return null;

    set({ isSaving: true });

    try {
      // Extract text + generate recipe via existing pipeline
      const extractResponse = await fetch(
        `/api/recipe/extract-text?url=${encodeURIComponent(previewItem.sourceUrl)}`
      );
      let pageText: string | undefined;
      let extractedImageUrl: string | undefined;
      if (extractResponse.ok) {
        const data = await extractResponse.json();
        pageText = data.text;
        extractedImageUrl = data.imageUrl;
      }

      const generateResponse = await fetch("/api/recipe/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: previewItem.sourceUrl, pageText }),
      });

      if (!generateResponse.ok) throw new Error("Rezept-Import fehlgeschlagen");

      const recipe = await generateResponse.json();

      // Add image
      const imgUrl = extractedImageUrl || previewItem.imageUrl;
      if (imgUrl) {
        const existing = recipe.recipeImages || [];
        if (!existing.includes(imgUrl)) {
          recipe.recipeImages = [imgUrl, ...existing];
        }
      }
      recipe.sourceUrl = previewItem.sourceUrl;

      // Save via Supabase using recipe-store
      const { supabase } = await import("@/lib/supabase");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const id = generateId();
      const { error: recipeError } = await supabase
        .from("recipes")
        .insert([{
          id,
          user_id: user.id,
          dish_name: recipe.dishName || recipe.title || "Rezept",
          cuisine: recipe.cuisine || "",
          description: recipe.description || "",
          instructions: recipe.instructions || [],
          servings: recipe.servings || 4,
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

      // Insert ingredients
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

      set({ isSaving: false });
      return id;
    } catch (err: any) {
      set({ isSaving: false });
      throw err;
    }
  },
}));
