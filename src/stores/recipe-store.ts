"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Recipe, Ingredient } from "@/types";
import { supabase } from "@/lib/supabase";
import { generateId, getUserHouseholdId } from "@/lib/utils";
import { generateThumbnail } from "@/utils/compress-image";

// IDs von Rezepten die gerade gelöscht werden — verhindert dass loadRecipes sie wieder zeigt
const pendingDeletes = new Set<string>();

// Helper: SSE-Stream von Anthropic lesen und Rezept-JSON parsen
async function parseRecipeFromSSEStream(response: Response): Promise<Recipe> {
  if (!response.ok) {
    let errMsg = "Rezepterkennung fehlgeschlagen";
    try { const errData = await response.json(); errMsg = errData.error || errMsg; } catch {}
    throw new Error(`API ${response.status}: ${errMsg}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Kein Response-Stream");

  const decoder = new TextDecoder();
  let fullText = "";
  let sseBuffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    sseBuffer += decoder.decode(value, { stream: true });
    const lines = sseBuffer.split("\n");
    sseBuffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const event = JSON.parse(jsonStr);
        if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
          fullText += event.delta.text;
        }
      } catch { /* skip */ }
    }
  }

  if (!fullText) throw new Error("Keine Antwort von der KI erhalten");

  // JSON extrahieren (Claude wrappet manchmal in ```json...```)
  let jsonString = fullText.trim();
  const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonString = jsonMatch[1].trim();

  const recipeJson = JSON.parse(jsonString);

  // Normalisieren
  const rawNutrition = recipeJson.nutrition;
  const nutrition = rawNutrition
    ? {
        calories: Math.round(Number(rawNutrition.calories) || 0),
        protein: Math.round(Number(rawNutrition.protein) || 0),
        fat: Math.round(Number(rawNutrition.fat) || 0),
        carbs: Math.round(Number(rawNutrition.carbs) || 0),
        fiber: Math.round(Number(rawNutrition.fiber) || 0),
        sugar: Math.round(Number(rawNutrition.sugar) || 0),
      }
    : undefined;

  return {
    dishName: recipeJson.dishName || recipeJson.dish_name || "Unbekanntes Rezept",
    cuisine: recipeJson.cuisine || "International",
    description: recipeJson.description || "",
    ingredients: (recipeJson.ingredients || []).map((ing: any) => ({
      name: ing.name || "",
      quantity: String(ing.quantity || ""),
      unit: ing.unit || "",
      category: ing.category || "other",
      group: ing.group || "",
      notes: ing.notes || "",
      isSelected: false,
    })),
    instructions: recipeJson.instructions || [],
    servings: recipeJson.servings || 4,
    prepTime: recipeJson.prepTime || recipeJson.prep_time || 0,
    cookTime: recipeJson.cookTime || recipeJson.cook_time || 0,
    difficulty: (recipeJson.difficulty || "medium").toLowerCase(),
    nutrition,
    recipeImages: [],
  } as Recipe;
}

interface RecipeStore {
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  loadRecipes: () => void;
  setCurrentRecipe: (recipe: Recipe | null) => void;
  loadRecipeImages: (recipeId: string) => Promise<string[]>;
  loadRecipeDetail: (recipeId: string) => Promise<void>;
  saveRecipe: (recipe: Recipe) => Recipe;
  updateRecipe: (recipeId: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (recipeId: string) => void;
  generateFromImage: (imageFiles: File | File[], previewBase64s?: string | string[]) => Promise<Recipe>;
  generateFromUrl: (url: string) => Promise<Recipe>;
  generateFromRestaurant: (imageFiles: File | File[], previewBase64s?: string | string[]) => Promise<Recipe>;
  clearError: () => void;
}

// Helper: Convert DB row to Recipe type
function dbToRecipe(row: any, ingredients: any[]): Recipe {
  return {
    id: row.id,
    dishName: row.dish_name,
    cuisine: row.cuisine || "",
    description: row.description || "",
    ingredients: ingredients.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity || "",
      unit: ing.unit || "",
      category: ing.category || "other",
      group: ing.group_name || undefined,
      notes: ing.notes || undefined,
      isSelected: ing.is_selected ?? true,
    })),
    instructions: row.instructions || [],
    servings: row.servings || 4,
    prepTime: row.prep_time || 0,
    cookTime: row.cook_time || 0,
    difficulty: row.difficulty || "medium",
    rating: row.rating || undefined,
    isFavorite: row.is_favorite || false,
    nutrition: row.nutrition || undefined,
    recipeImages: row.recipe_images || [],
    thumbnail: row.thumbnail || undefined,
    sourceUrl: row.source_url || undefined,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper: Convert Recipe to DB format
function recipeToDB(recipe: Recipe) {
  return {
    dish_name: recipe.dishName,
    cuisine: recipe.cuisine,
    description: recipe.description,
    instructions: recipe.instructions,
    servings: recipe.servings,
    prep_time: recipe.prepTime,
    cook_time: recipe.cookTime,
    difficulty: recipe.difficulty,
    rating: recipe.rating,
    is_favorite: recipe.isFavorite || false,
    nutrition: recipe.nutrition,
    recipe_images: recipe.recipeImages,
    source_url: recipe.sourceUrl,
  };
}

// Helper: Convert DB row to Recipe type (MINIMAL — nur für Listenansicht)
function dbToRecipeLight(row: any): Recipe {
  return {
    id: row.id,
    dishName: row.dish_name,
    cuisine: row.cuisine || "",
    description: row.description || "",
    ingredients: [],          // Nicht in Liste benötigt
    instructions: [],         // Nicht in Liste benötigt
    servings: row.servings || 4,
    prepTime: row.prep_time || 0,
    cookTime: row.cook_time || 0,
    difficulty: row.difficulty || "medium",
    rating: row.rating || undefined,
    isFavorite: row.is_favorite || false,
    recipeImages: [],         // Nicht in Liste benötigt — Thumbnail reicht
    thumbnail: row.thumbnail || undefined,
    sourceUrl: row.source_url || undefined,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper: Convert Ingredient to DB format
function ingredientToDB(ing: Ingredient, recipeId: string) {
  return {
    recipe_id: recipeId,
    name: ing.name,
    quantity: ing.quantity,
    unit: ing.unit,
    category: ing.category,
    group_name: ing.group,
    notes: ing.notes,
    is_selected: ing.isSelected,
  };
}

export const useRecipeStore = create<RecipeStore>()(
  persist(
    (set, get) => ({
  recipes: [],
  currentRecipe: null,
  isLoading: false,
  isGenerating: false,
  error: null,

  loadRecipes: async () => {
    // Cache da? → kein Spinner, stilles Refresh im Hintergrund
    const hasCached = get().recipes.length > 0;
    if (!hasCached) {
      set({ isLoading: true, error: null });
    }

    try {
      // getSession() = lokal (0ms) vs getUser() = Netzwerk (1-2s)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        set({ recipes: [], isLoading: false });
        return;
      }

      // Schlanker Query: nur Listenfelder, KEIN ingredients-JOIN, KEINE Bilder
      const { data: recipes, error } = await supabase
        .from("recipes")
        .select(`
          id, dish_name, cuisine, description, servings,
          prep_time, cook_time, difficulty, rating, is_favorite,
          thumbnail, source_url, user_id, created_at, updated_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // pendingDeletes rausfiltern — verhindert dass gelöschte Rezepte wieder auftauchen
      const recipeList: Recipe[] = (recipes || [])
        .filter(r => !pendingDeletes.has(r.id))
        .map(dbToRecipeLight);
      set({ recipes: recipeList, isLoading: false });

      // Einmaliger Reset: Thumbnails neu generieren (v4 = URL-safe + CORS fix)
      const THUMB_VERSION = "v4";
      if (typeof window !== "undefined" && !localStorage.getItem(`thumb-${THUMB_VERSION}`)) {
        localStorage.setItem(`thumb-${THUMB_VERSION}`, "1");
        // Zustand persist cache leeren → keine alten unscharfen Thumbnails mehr
        localStorage.removeItem("snapshop-recipes");
        // Alle Thumbnails in DB zurücksetzen → werden unten neu generiert
        fetch("/api/recipe/generate-thumbnails", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resetAll: true, userId: session?.user?.id }),
        }).catch(() => {});
        // Alle Rezepte als "ohne Thumbnail" markieren für Neugenerierung
        recipeList.forEach(r => { r.thumbnail = undefined; });
        set({ recipes: [...recipeList] });
      }

      // Thumbnails im Hintergrund generieren für Rezepte ohne Thumbnail
      const missing = recipeList.filter(r => r.id && !r.thumbnail);
      if (missing.length > 0) {
        (async () => {
          for (const recipe of missing) {
            try {
              const { data } = await supabase
                .from("recipes")
                .select("recipe_images")
                .eq("id", recipe.id!)
                .single();

              const firstImg = data?.recipe_images?.[0];
              if (!firstImg) continue;

              let thumb: string;

              // URL-Bilder (z.B. von Fooby/Betty Bossi) können nicht via Canvas
              // verkleinert werden (CORS). Direkt als Thumbnail verwenden.
              if (firstImg.startsWith("http")) {
                thumb = firstImg;
              } else {
                // Base64-Bilder via Canvas verkleinern
                thumb = await generateThumbnail(firstImg, 800, 0.7);
              }

              // Sofort im UI zeigen
              set((state) => ({
                recipes: state.recipes.map(r =>
                  r.id === recipe.id ? { ...r, thumbnail: thumb } : r
                ),
              }));

              // In DB speichern
              fetch("/api/recipe/generate-thumbnails", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipeId: recipe.id, thumbnail: thumb }),
              }).catch(() => {});
            } catch {
              // Weiter mit nächstem
            }
          }
        })();
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setCurrentRecipe: (recipe) => set({ currentRecipe: recipe }),

  // Bilder nachladen für ein einzelnes Rezept
  loadRecipeImages: async (recipeId: string) => {
    try {
      const { data } = await supabase
        .from("recipes")
        .select("recipe_images")
        .eq("id", recipeId)
        .single();

      if (data?.recipe_images?.length) {
        set((state) => ({
          recipes: state.recipes.map((r) =>
            r.id === recipeId ? { ...r, recipeImages: data.recipe_images } : r
          ),
          currentRecipe: state.currentRecipe?.id === recipeId
            ? { ...state.currentRecipe, recipeImages: data.recipe_images }
            : state.currentRecipe,
        }));
        return data.recipe_images as string[];
      }
      return [];
    } catch {
      return [];
    }
  },

  // ALLE Detaildaten nachladen (ingredients, instructions, images, nutrition)
  // Wird aufgerufen wenn Detailseite geöffnet wird
  loadRecipeDetail: async (recipeId: string) => {
    try {
      const { data: row } = await supabase
        .from("recipes")
        .select(`
          id, dish_name, cuisine, description, instructions, servings,
          prep_time, cook_time, difficulty, rating, is_favorite,
          nutrition, thumbnail, source_url, recipe_images,
          user_id, household_id, created_at, updated_at,
          ingredients(*)
        `)
        .eq("id", recipeId)
        .single();

      if (!row) return;

      const fullRecipe = dbToRecipe(row, row.ingredients || []);

      set((state) => ({
        recipes: state.recipes.map((r) =>
          r.id === recipeId ? fullRecipe : r
        ),
        currentRecipe: fullRecipe,
      }));
    } catch {
      // Silent fail — Listenversion bleibt erhalten
    }
  },

  saveRecipe: (recipe) => {
    // This is a sync method, but we need async behavior
    // The app should call this and handle the async nature
    // For now, return the recipe with a generated ID (optimistic)
    const id = recipe.id || generateId();
    const saved = { ...recipe, id };

    // Do async save in background
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const dbRecipe = recipeToDB(recipe);
        const householdId = await getUserHouseholdId();

        // Thumbnail generieren/setzen
        let thumbnail: string | null = null;
        if (recipe.recipeImages?.[0]) {
          try {
            const img = recipe.recipeImages[0];
            thumbnail = img.startsWith("http") ? img : await generateThumbnail(img, 800, 0.7);
          } catch { /* Silent fail */ }
        }

        const { data: insertedRecipe, error: recipeError } = await supabase
          .from("recipes")
          .insert([{ ...dbRecipe, id, user_id: user.id, household_id: householdId, thumbnail }])
          .select()
          .single();

        if (recipeError) throw recipeError;

        // Insert ingredients
        if (recipe.ingredients && recipe.ingredients.length > 0) {
          const ingredientsToInsert = recipe.ingredients.map((ing) =>
            ingredientToDB(ing, insertedRecipe.id)
          );
          const { error: ingError } = await supabase
            .from("ingredients")
            .insert(ingredientsToInsert);
          if (ingError) throw ingError;
        }

        // Update local state with server data
        set((state) => ({
          recipes: [saved, ...state.recipes.filter((r) => r.id !== saved.id)],
          currentRecipe: state.currentRecipe?.id === id ? saved : state.currentRecipe,
        }));
      } catch (err: any) {
        set({ error: err.message });
      }
    })();

    set((state) => ({
      recipes: [saved, ...state.recipes.filter((r) => r.id !== saved.id)],
      currentRecipe: saved,
    }));

    return saved;
  },

  updateRecipe: (recipeId, updates) => {
    set({ isLoading: true, error: null });

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const dbUpdates = recipeToDB({ ...updates } as Recipe);

        // Thumbnail aktualisieren wenn Bilder geändert werden
        if (updates.recipeImages?.[0]) {
          try {
            const img = updates.recipeImages[0];
            (dbUpdates as any).thumbnail = img.startsWith("http") ? img : await generateThumbnail(img, 800, 0.7);
          } catch { /* Silent fail */ }
        }

        const { data: updatedRecipe, error: updateError } = await supabase
          .from("recipes")
          .update(dbUpdates)
          .eq("id", recipeId)
          .eq("user_id", user.id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Update ingredients if provided
        if (updates.ingredients) {
          // Delete old ingredients
          await supabase.from("ingredients").delete().eq("recipe_id", recipeId);

          // Insert new ingredients
          const ingredientsToInsert = updates.ingredients.map((ing) =>
            ingredientToDB(ing, recipeId)
          );
          const { error: ingError } = await supabase
            .from("ingredients")
            .insert(ingredientsToInsert);
          if (ingError) throw ingError;
        }

        // Fetch updated recipe with ingredients
        const { data: ingredients } = await supabase
          .from("ingredients")
          .select("*")
          .eq("recipe_id", recipeId);

        const updated = dbToRecipe(updatedRecipe, ingredients || []);

        set((state) => ({
          recipes: state.recipes.map((r) => (r.id === recipeId ? updated : r)),
          currentRecipe: state.currentRecipe?.id === recipeId ? updated : state.currentRecipe,
          isLoading: false,
        }));
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
      }
    })();
  },

  deleteRecipe: (recipeId) => {
    // 1. Sofort aus UI entfernen (optimistic)
    pendingDeletes.add(recipeId);
    set((state) => ({
      recipes: state.recipes.filter((r) => r.id !== recipeId),
      currentRecipe: state.currentRecipe?.id === recipeId ? null : state.currentRecipe,
    }));

    // 2. Via API-Route löschen (Service Role Key umgeht RLS)
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const res = await fetch("/api/recipe/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId, userId: session.user.id }),
        });

        if (!res.ok) {
          console.error("Delete failed:", await res.text());
        }
      } catch (err) {
        console.error("Delete error:", err);
      } finally {
        // Nach ein paar Sekunden aus pendingDeletes entfernen
        setTimeout(() => pendingDeletes.delete(recipeId), 10000);
      }
    })();
  },

  generateFromImage: async (imageFiles, previewBase64s) => {
    set({ isGenerating: true, error: null });
    let step = "init";
    try {
      step = "prepare";
      const files = Array.isArray(imageFiles) ? imageFiles : [imageFiles];
      const previews = Array.isArray(previewBase64s)
        ? previewBase64s
        : previewBase64s
          ? [previewBase64s]
          : [];

      step = "formdata";
      const formData = new FormData();
      for (const file of files) {
        formData.append("image", file);
      }

      step = "fetch-ai";
      const response = await fetch("/api/recipe/generate", {
        method: "POST",
        body: formData,
      });

      step = "parse-json";
      const recipe: Recipe = await parseRecipeFromSSEStream(response);
      // Auto-add the scan image(s) as recipe images
      if (previews.length > 0) {
        const existing = recipe.recipeImages || [];
        recipe.recipeImages = [...previews, ...existing];
      }

      // Auto-save to Supabase
      step = "generate-id";
      const id = recipe.id || generateId();
      const saved = { ...recipe, id };

      step = "auth";
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      step = "save-recipe";
      const dbRecipe = recipeToDB(recipe);
      const householdId = await getUserHouseholdId();
      const { data: insertedRecipe, error: recipeError } = await supabase
        .from("recipes")
        .insert([{ ...dbRecipe, id, user_id: user.id, household_id: householdId }])
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Insert ingredients
      step = "save-ingredients";
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        const ingredientsToInsert = recipe.ingredients.map((ing) =>
          ingredientToDB(ing, insertedRecipe.id)
        );
        const { error: ingError } = await supabase
          .from("ingredients")
          .insert(ingredientsToInsert);
        if (ingError) throw ingError;
      }

      set((state) => ({
        recipes: [saved, ...state.recipes.filter((r) => r.id !== saved.id)],
        currentRecipe: saved,
        isGenerating: false,
      }));
      return saved;
    } catch (err: any) {
      const rawMsg = err?.message || String(err);
      // Benutzerfreundliche Meldung mit Debug-Info
      let msg = rawMsg;
      if (rawMsg === "Load failed" || rawMsg === "load failed") {
        msg = "Netzwerk-Timeout: Bitte versuche es erneut.";
      }
      // Step-Info für Debugging anhängen
      const fullMsg = `${msg} [Schritt: ${step}]`;
      console.error("generateFromImage error:", step, err);
      set({ error: fullMsg, isGenerating: false });
      throw new Error(fullMsg);
    }
  },

  generateFromUrl: async (url) => {
    set({ isGenerating: true, error: null });
    try {
      // Try to extract page text + image URL first
      let pageText: string | undefined;
      let extractedImageUrl: string | undefined;
      try {
        const proxyResponse = await fetch(`/api/recipe/extract-text?url=${encodeURIComponent(url)}`);
        if (proxyResponse.ok) {
          const data = await proxyResponse.json();
          pageText = data.text;
          extractedImageUrl = data.imageUrl;
        }
      } catch {
        // Fallback: let server handle it directly
      }

      const response = await fetch("/api/recipe/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, pageText }),
      });

      const recipe: Recipe = await parseRecipeFromSSEStream(response);
      // Add extracted image URL to recipe if available
      if (extractedImageUrl) {
        const existing = recipe.recipeImages || [];
        if (!existing.includes(extractedImageUrl)) {
          recipe.recipeImages = [extractedImageUrl, ...existing];
        }
      }
      // Store the source URL for "Zum Onlinerezept" link
      if (url) {
        recipe.sourceUrl = url;
      }

      // Auto-save to Supabase
      const id = recipe.id || generateId();
      const saved = { ...recipe, id };

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const dbRecipe = recipeToDB(recipe);
      const householdId = await getUserHouseholdId();
      const { data: insertedRecipe, error: recipeError } = await supabase
        .from("recipes")
        .insert([{ ...dbRecipe, id, user_id: user.id, household_id: householdId }])
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Insert ingredients
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        const ingredientsToInsert = recipe.ingredients.map((ing) =>
          ingredientToDB(ing, insertedRecipe.id)
        );
        const { error: ingError } = await supabase
          .from("ingredients")
          .insert(ingredientsToInsert);
        if (ingError) throw ingError;
      }

      set((state) => ({
        recipes: [saved, ...state.recipes.filter((r) => r.id !== saved.id)],
        currentRecipe: saved,
        isGenerating: false,
      }));
      return saved;
    } catch (err: any) {
      const msg = err.message === "Load failed" || err.message === "load failed"
        ? "Netzwerk-Timeout: Die KI-Verarbeitung hat zu lange gedauert. Bitte versuche es erneut."
        : err.message;
      set({ error: msg, isGenerating: false });
      throw new Error(msg);
    }
  },

  generateFromRestaurant: async (imageFiles, previewBase64s) => {
    set({ isGenerating: true, error: null });
    try {
      const files = Array.isArray(imageFiles) ? imageFiles : [imageFiles];
      const previews = Array.isArray(previewBase64s)
        ? previewBase64s
        : previewBase64s
          ? [previewBase64s]
          : [];

      const formData = new FormData();
      for (const file of files) {
        formData.append("image", file);
      }
      formData.append("mode", "restaurant");

      const response = await fetch("/api/recipe/generate", {
        method: "POST",
        body: formData,
      });

      const recipe: Recipe = await parseRecipeFromSSEStream(response);
      if (previews.length > 0) {
        const existing = recipe.recipeImages || [];
        recipe.recipeImages = [...previews, ...existing];
      }

      // Auto-save to Supabase
      const id = recipe.id || generateId();
      const saved = { ...recipe, id };

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const dbRecipe = recipeToDB(recipe);
      const householdId = await getUserHouseholdId();
      const { data: insertedRecipe, error: recipeError } = await supabase
        .from("recipes")
        .insert([{ ...dbRecipe, id, user_id: user.id, household_id: householdId }])
        .select()
        .single();

      if (recipeError) throw recipeError;

      if (recipe.ingredients && recipe.ingredients.length > 0) {
        const ingredientsToInsert = recipe.ingredients.map((ing) =>
          ingredientToDB(ing, insertedRecipe.id)
        );
        const { error: ingError } = await supabase
          .from("ingredients")
          .insert(ingredientsToInsert);
        if (ingError) throw ingError;
      }

      set((state) => ({
        recipes: [saved, ...state.recipes.filter((r) => r.id !== saved.id)],
        currentRecipe: saved,
        isGenerating: false,
      }));
      return saved;
    } catch (err: any) {
      const msg = err.message === "Load failed" || err.message === "load failed"
        ? "Netzwerk-Timeout: Die KI-Verarbeitung hat zu lange gedauert. Bitte versuche es erneut."
        : err.message;
      set({ error: msg, isGenerating: false });
      throw new Error(msg);
    }
  },

  clearError: () => set({ error: null }),
    }),
    {
      name: "snapshop-recipes",
      // Nur die Listenfelder cachen — keine Bilder, keine schweren Daten
      partialize: (state) => ({
        recipes: state.recipes.map((r) => ({
          ...r,
          recipeImages: [],
          ingredients: [],
          instructions: [],
        })),
      }),
    }
  )
);
