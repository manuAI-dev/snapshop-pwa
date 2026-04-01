// Shopping Service — jetzt nur noch Hilfsfunktionen
// Hauptlogik ist in local-storage.ts und stores/shopping-store.ts

import { IngredientCategory, categoryLabels } from "@/types";
import { ShoppingItem, ShoppingCategory } from "@/types/shopping";

/**
 * Gruppiert Shopping-Items nach Kategorie
 */
export function getShoppingByCategory(items: ShoppingItem[]): ShoppingCategory[] {
  const catMap: Record<string, ShoppingItem[]> = {};

  for (const item of items) {
    const cat = item.category || "other";
    if (!catMap[cat]) catMap[cat] = [];
    catMap[cat].push(item);
  }

  return Object.entries(catMap)
    .map(([category, categoryItems]) => ({
      category: category as IngredientCategory,
      label: categoryLabels[category as IngredientCategory] || "Sonstiges",
      items: categoryItems,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
