// Lokale Speicherung als Ersatz für Appwrite

import { Recipe } from "@/types";
import { ShoppingItem } from "@/types/shopping";

// ============================================================
// Helpers
// ============================================================

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const data = window.localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setStorage<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(data));
}

// ============================================================
// Rezepte
// ============================================================

export function saveRecipeLocal(recipe: Recipe): Recipe {
  const saved = { ...recipe, id: recipe.id || generateId(), createdAt: new Date().toISOString() };
  const recipes = getStorage<Recipe>("snapshop_recipes");
  recipes.unshift(saved);
  setStorage("snapshop_recipes", recipes);
  return saved;
}

export function getRecipesLocal(): Recipe[] {
  return getStorage<Recipe>("snapshop_recipes");
}

export function getRecipeByIdLocal(id: string): Recipe | undefined {
  return getRecipesLocal().find((r) => r.id === id);
}

export function deleteRecipeLocal(id: string): void {
  const recipes = getRecipesLocal().filter((r) => r.id !== id);
  setStorage("snapshop_recipes", recipes);
  // Auch Shopping-Items dieses Rezepts entfernen
  const shopping = getShoppingItemsLocal().filter((s) => s.recipeId !== id);
  setStorage("snapshop_shopping_v2", shopping);
}

// ============================================================
// Einkaufsliste (v2 — flache Items)
// ============================================================

export function getShoppingItemsLocal(): ShoppingItem[] {
  // Migration: Falls alte Daten existieren, konvertieren
  const v2 = getStorage<ShoppingItem>("snapshop_shopping_v2");
  if (v2.length > 0) return v2;

  // Alte Daten migrieren (v1 hatte verschachtelte Items pro Rezept)
  const v1 = getStorage<any>("snapshop_shopping");
  if (v1.length > 0) {
    const migrated: ShoppingItem[] = [];
    for (const item of v1) {
      if (item.ingredients && Array.isArray(item.ingredients)) {
        for (const ing of item.ingredients) {
          migrated.push({
            id: generateId(),
            name: ing.name || "",
            quantity: ing.quantity || "",
            unit: ing.unit || "",
            category: ing.category || "other",
            notes: ing.notes,
            isChecked: ing.isSelected || false,
            recipeId: item.recipeId || item.id,
            recipeName: item.dishName,
            createdAt: item.createdAt || new Date().toISOString(),
          });
        }
      }
    }
    if (migrated.length > 0) {
      setStorage("snapshop_shopping_v2", migrated);
    }
    return migrated;
  }

  return [];
}

export function saveShoppingItemsLocal(items: ShoppingItem[]): void {
  setStorage("snapshop_shopping_v2", items);
}

export function addRecipeToShoppingLocal(recipe: Recipe): ShoppingItem[] {
  const existing = getShoppingItemsLocal();

  const newItems: ShoppingItem[] = recipe.ingredients.map((ing) => ({
    id: generateId(),
    name: ing.name,
    quantity: ing.quantity,
    unit: ing.unit,
    category: ing.category || "other",
    notes: ing.notes,
    isChecked: false,
    recipeId: recipe.id,
    recipeName: recipe.dishName,
    createdAt: new Date().toISOString(),
  }));

  const all = [...newItems, ...existing];
  saveShoppingItemsLocal(all);
  return all;
}

export function addCustomItemLocal(name: string, quantity: string, unit: string): ShoppingItem[] {
  const existing = getShoppingItemsLocal();
  const item: ShoppingItem = {
    id: generateId(),
    name,
    quantity,
    unit,
    category: "other",
    isChecked: false,
    createdAt: new Date().toISOString(),
  };
  const all = [item, ...existing];
  saveShoppingItemsLocal(all);
  return all;
}

export function toggleShoppingItemLocal(id: string): ShoppingItem[] {
  const items = getShoppingItemsLocal().map((item) =>
    item.id === id ? { ...item, isChecked: !item.isChecked } : item
  );
  saveShoppingItemsLocal(items);
  return items;
}

export function updateShoppingItemLocal(id: string, updates: Partial<Pick<ShoppingItem, 'name' | 'quantity' | 'unit'>>): ShoppingItem[] {
  const items = getShoppingItemsLocal().map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );
  saveShoppingItemsLocal(items);
  return items;
}

export function deleteShoppingItemLocal(id: string): ShoppingItem[] {
  const items = getShoppingItemsLocal().filter((item) => item.id !== id);
  saveShoppingItemsLocal(items);
  return items;
}

export function clearShoppingListLocal(): void {
  setStorage("snapshop_shopping_v2", []);
}

// ============================================================
// Rezept Update
// ============================================================

export function updateRecipeLocal(id: string, updates: Partial<Recipe>): Recipe | null {
  const recipes = getRecipesLocal();
  const idx = recipes.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const updated = { ...recipes[idx], ...updates, updatedAt: new Date().toISOString() };
  recipes[idx] = updated;
  setStorage("snapshop_recipes", recipes);
  return updated;
}

// ============================================================
// Wochenplaner / Meal Planning
// ============================================================

import { MealSlot, MealType } from "@/types/planner";

export function getMealSlotsLocal(): MealSlot[] {
  return getStorage<MealSlot>("snapshop_planner");
}

export function saveMealSlotsLocal(slots: MealSlot[]): void {
  setStorage("snapshop_planner", slots);
}

export function addMealSlotLocal(
  recipeId: string,
  recipeName: string,
  recipeImage: string | undefined,
  date: string,
  mealType: MealType,
  servings: number
): MealSlot[] {
  const existing = getMealSlotsLocal();
  const slot: MealSlot = {
    id: generateId(),
    recipeId,
    recipeName,
    recipeImage,
    date,
    mealType,
    servings,
    createdAt: new Date().toISOString(),
  };
  const all = [...existing, slot];
  saveMealSlotsLocal(all);
  return all;
}

export function removeMealSlotLocal(id: string): MealSlot[] {
  const slots = getMealSlotsLocal().filter((s) => s.id !== id);
  saveMealSlotsLocal(slots);
  return slots;
}

export function getMealSlotsForDateRange(startDate: string, endDate: string): MealSlot[] {
  return getMealSlotsLocal().filter((s) => s.date >= startDate && s.date <= endDate);
}

// ============================================================
// User (minimal, lokal)
// ============================================================

export function getLocalUser() {
  if (typeof window === "undefined") return null;
  const data = window.localStorage.getItem("snapshop_user");
  return data ? JSON.parse(data) : null;
}

export function setLocalUser(name: string, email: string) {
  const user = {
    id: generateId(),
    name,
    email,
    createdAt: new Date().toISOString(),
  };
  window.localStorage.setItem("snapshop_user", JSON.stringify(user));
  return user;
}

export function clearLocalUser() {
  window.localStorage.removeItem("snapshop_user");
}
