import { IngredientCategory } from "./recipe";

// Flaches Shopping-Item — jede Zutat einzeln mit eigener ID
export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category: IngredientCategory;
  notes?: string;
  isChecked: boolean;
  // Herkunft
  recipeId?: string;    // leer = manuell hinzugefügt
  recipeName?: string;
  // Meta
  createdAt: string;
}

// Gruppiert nach Kategorie für die Ansicht
export interface ShoppingCategory {
  category: IngredientCategory;
  label: string;
  items: ShoppingItem[];
}

// Gruppiert nach Rezept
export interface ShoppingRecipeGroup {
  recipeId: string;
  recipeName: string;
  items: ShoppingItem[];
  batchCount: number; // Wie oft das Rezept hinzugefügt wurde
}

// Legacy type exports for compatibility
export type { ShoppingItem as ShoppingIngredient };
export type { ShoppingItem as ShoppingListItem };
export type { ShoppingItem as CustomArticle };
