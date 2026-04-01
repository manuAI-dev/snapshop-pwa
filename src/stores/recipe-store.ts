"use client";

import { create } from "zustand";
import { Recipe, Ingredient } from "@/types";
import { supabase } from "@/lib/supabase";
import { generateId, getUserHouseholdId } from "@/lib/utils";

interface RecipeStore {
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;

  loadRecipes: () => void;
  setCurrentRecipe: (recipe: Recipe | null) => void;
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

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipes: [],
  currentRecipe: null,
  isLoading: false,
  isGenerating: false,
  error: null,

  loadRecipes: async () => {
    set({ isLoading: true, error: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        set({ recipes: [], isLoading: false });
        return;
      }

      // RLS Policy zeigt automatisch eigene + Haushalt-Rezepte
      const { data: recipes, error } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch ingredients for each recipe
      const recipesWithIngredients: Recipe[] = [];
      for (const row of recipes || []) {
        const { data: ingredients } = await supabase
          .from("ingredients")
          .select("*")
          .eq("recipe_id", row.id);
        recipesWithIngredients.push(dbToRecipe(row, ingredients || []));
      }

      set({ recipes: recipesWithIngredients, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setCurrentRecipe: (recipe) => set({ currentRecipe: recipe }),

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
    set({ isLoading: true, error: null });

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Delete ingredients (cascade should handle this, but be explicit)
        await supabase.from("ingredients").delete().eq("recipe_id", recipeId);

        // Delete recipe
        const { error: deleteError } = await supabase
          .from("recipes")
          .delete()
          .eq("id", recipeId)
          .eq("user_id", user.id);

        if (deleteError) throw deleteError;

        set((state) => ({
          recipes: state.recipes.filter((r) => r.id !== recipeId),
          currentRecipe: state.currentRecipe?.id === recipeId ? null : state.currentRecipe,
          isLoading: false,
        }));
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
      }
    })();
  },

  generateFromImage: async (imageFiles, previewBase64s) => {
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

      const response = await fetch("/api/recipe/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Rezepterkennung fehlgeschlagen");
      }

      const recipe: Recipe = await response.json();
      // Auto-add the scan image(s) as recipe images
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
      set({ error: err.message, isGenerating: false });
      throw err;
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

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Rezept-Import fehlgeschlagen");
      }

      const recipe: Recipe = await response.json();
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
      set({ error: err.message, isGenerating: false });
      throw err;
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

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Restaurant-Erkennung fehlgeschlagen");
      }

      const recipe: Recipe = await response.json();
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
      set({ error: err.message, isGenerating: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
