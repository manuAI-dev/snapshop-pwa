// Portiert aus: lib/features/recipe/data/models/recipe_model.dart
// und lib/core/shared/models/ingredient.dart

export type IngredientCategory =
  | "dairy"
  | "protein"
  | "grains"
  | "vegetables"
  | "fruits"
  | "spices"
  | "condiments"
  | "oils"
  | "beverages"
  | "other";

export type Difficulty = "easy" | "medium" | "hard";

export interface NutritionInfo {
  calories: number;    // kcal pro Portion
  protein: number;     // g pro Portion
  fat: number;         // g pro Portion
  carbs: number;       // g pro Portion
  fiber?: number;      // g pro Portion
  sugar?: number;      // g pro Portion
}

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  category: IngredientCategory;
  group?: string;   // Untergruppe z.B. "Sauce", "Teig", "Pochierte Eier"
  notes?: string;
  isSelected: boolean;
}

export interface Recipe {
  id?: string;
  dishName: string;
  cuisine: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  servings: number;
  prepTime: number; // in Minuten
  cookTime: number; // in Minuten
  difficulty: Difficulty;
  rating?: number;
  isFavorite?: boolean;
  nutrition?: NutritionInfo;
  recipeImages: string[];
  sourceUrl?: string;    // URL des Originalrezepts (z.B. fooby.ch Link)
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// GPT-4 Vision Response Struktur (aus generate_recipe_provider.dart)
export interface GPTRecipeResponse {
  dishName: string;
  cuisine: string;
  description: string;
  ingredients: {
    name: string;
    quantity: string;
    unit: string;
    category: string;
    notes?: string;
  }[];
  instructions: string[];
  servings: number;
  prepTime: number;
  cookTime: number;
  difficulty: string;
}

// Helper: Leeres Rezept erstellen
export function createEmptyRecipe(): Recipe {
  return {
    dishName: "",
    cuisine: "",
    description: "",
    ingredients: [],
    instructions: [],
    servings: 4,
    prepTime: 0,
    cookTime: 0,
    difficulty: "medium",
    recipeImages: [],
  };
}

// Helper: Gesamtzeit berechnen
export function getTotalTime(recipe: Recipe): number {
  return recipe.prepTime + recipe.cookTime;
}

// Helper: Zutaten nach Kategorie gruppieren
export function groupIngredientsByCategory(
  ingredients: Ingredient[]
): Record<IngredientCategory, Ingredient[]> {
  return ingredients.reduce(
    (groups, ingredient) => {
      const category = ingredient.category || "other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(ingredient);
      return groups;
    },
    {} as Record<IngredientCategory, Ingredient[]>
  );
}

// Kategorie-Labels (Deutsch)
export const categoryLabels: Record<IngredientCategory, string> = {
  dairy: "Milchprodukte",
  protein: "Fleisch & Protein",
  grains: "Getreide & Beilagen",
  vegetables: "Gemüse",
  fruits: "Obst",
  spices: "Gewürze",
  condiments: "Soßen & Würzmittel",
  oils: "Öle & Fette",
  beverages: "Getränke",
  other: "Sonstiges",
};
