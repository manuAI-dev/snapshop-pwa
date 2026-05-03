"use client";

import { create } from "zustand";
import { Recipe, IngredientCategory, categoryLabels } from "@/types";
import { ShoppingItem, ShoppingCategory, ShoppingRecipeGroup } from "@/types/shopping";
import { supabase } from "@/lib/supabase";

// ─── Quantity Helpers ────────────────────────────────────────
// Parst "1", "1.5", "1,5", "1/2", "200" → Zahl
function parseQty(str: string): number {
  if (!str) return 0;
  str = str.trim();
  // Brüche: "1/2", "3/4"
  if (str.includes("/")) {
    const parts = str.split("/");
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    if (!isNaN(num) && !isNaN(den) && den !== 0) return num / den;
  }
  // Komma → Punkt
  str = str.replace(",", ".");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// Zahl → schöner String: 2 → "2", 1.5 → "1.5", 0.333 → "⅓"
function formatQty(num: number): string {
  if (num === 0) return "";
  if (Number.isInteger(num)) return String(num);
  // Max 2 Dezimalstellen, trailing zeros entfernen
  return String(Math.round(num * 100) / 100);
}

// ─── Store Types ─────────────────────────────────────────────
interface ShoppingStore {
  items: ShoppingItem[];
  isLoading: boolean;

  // batchCount pro Rezept (wie oft das Rezept in der Liste ist)
  recipeBatchCounts: Record<string, number>;

  // Abgeleitete Daten
  categories: ShoppingCategory[];
  recipeGroups: ShoppingRecipeGroup[];
  uncheckedItems: ShoppingItem[];
  checkedItems: ShoppingItem[];
  customItems: ShoppingItem[];

  // Aktionen
  loadShoppingList: () => void;
  addRecipe: (recipe: Recipe) => void;
  addRecipeBatch: (recipeId: string) => void;
  removeRecipeBatch: (recipeId: string) => void;
  removeAllRecipeItems: (recipeId: string) => void;
  addCustomItem: (name: string, quantity: string, unit: string) => void;
  toggleItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<Pick<ShoppingItem, "name" | "quantity" | "unit">>) => void;
  deleteItem: (id: string) => void;
  clearList: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────
function dbToShoppingItem(row: any): ShoppingItem {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity || "",
    unit: row.unit || "",
    category: row.category || "other",
    notes: row.notes || undefined,
    isChecked: row.is_checked || false,
    recipeId: row.recipe_id || undefined,
    recipeName: row.recipe_name || undefined,
    createdAt: row.created_at,
  };
}

function deriveState(items: ShoppingItem[], recipeBatchCounts: Record<string, number>) {
  const uncheckedItems = items.filter((i) => !i.isChecked);
  const checkedItems = items.filter((i) => i.isChecked);
  const customItems = items.filter((i) => !i.recipeId);

  // Nach Kategorie gruppieren (nur unchecked)
  const catMap: Record<string, ShoppingItem[]> = {};
  for (const item of uncheckedItems) {
    const cat = item.category || "other";
    if (!catMap[cat]) catMap[cat] = [];
    catMap[cat].push(item);
  }
  const categories: ShoppingCategory[] = Object.entries(catMap)
    .map(([category, catItems]) => ({
      category: category as IngredientCategory,
      label: categoryLabels[category as IngredientCategory] || "Sonstiges",
      items: catItems,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // Nach Rezept gruppieren (nur unchecked)
  const recipeMap: Record<string, ShoppingItem[]> = {};
  for (const item of uncheckedItems) {
    if (item.recipeId) {
      const key = item.recipeId;
      if (!recipeMap[key]) recipeMap[key] = [];
      recipeMap[key].push(item);
    }
  }
  const recipeGroups: ShoppingRecipeGroup[] = Object.entries(recipeMap).map(([recipeId, rItems]) => ({
    recipeId,
    recipeName: rItems[0]?.recipeName || "Unbekannt",
    items: rItems,
    batchCount: recipeBatchCounts[recipeId] || 1,
  }));

  return { categories, recipeGroups, uncheckedItems, checkedItems, customItems };
}

// ─── Store ───────────────────────────────────────────────────
export const useShoppingStore = create<ShoppingStore>((set) => ({
  items: [],
  isLoading: false,
  recipeBatchCounts: {},
  categories: [],
  recipeGroups: [],
  uncheckedItems: [],
  checkedItems: [],
  customItems: [],

  loadShoppingList: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ items: [], isLoading: false, recipeBatchCounts: {}, ...deriveState([], {}) });
        return;
      }

      const { data: items, error } = await supabase
        .from("shopping_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const shoppingItems = (items || []).map(dbToShoppingItem);

      // batchCounts initialisieren: aus bestehenden Counts übernehmen, Default = 1
      const prevCounts = get().recipeBatchCounts;
      const batchCounts: Record<string, number> = {};
      for (const item of shoppingItems) {
        if (item.recipeId && !batchCounts[item.recipeId]) {
          batchCounts[item.recipeId] = prevCounts[item.recipeId] || 1;
        }
      }

      set({ items: shoppingItems, isLoading: false, recipeBatchCounts: batchCounts, ...deriveState(shoppingItems, batchCounts) });
    } catch (err: any) {
      set({ isLoading: false });
    }
  },

  addRecipe: async (recipe) => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        set({ isLoading: false });
        return;
      }

      const itemsToInsert = (recipe.ingredients || []).map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        category: ing.category,
        notes: ing.notes,
        recipe_id: recipe.id,
        recipe_name: recipe.dishName,
      }));

      if (itemsToInsert.length === 0) {
        set({ isLoading: false });
        return;
      }

      const res = await fetch("/api/shopping/batch-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToInsert, userId: session.user.id }),
      });
      if (!res.ok) {
        set({ isLoading: false });
        return;
      }

      const { items: inserted } = await res.json();
      const shoppingItems = (inserted || []).map(dbToShoppingItem);
      set((state) => {
        const allItems = [...state.items, ...shoppingItems];
        // batchCount = 1 für neues Rezept
        const batchCounts = { ...state.recipeBatchCounts };
        if (recipe.id) batchCounts[recipe.id] = 1;
        return { items: allItems, isLoading: false, recipeBatchCounts: batchCounts, ...deriveState(allItems, batchCounts) };
      });
    } catch (err: any) {
      set({ isLoading: false });
    }
  },

  // +1: Mengen aller Rezept-Zutaten erhöhen (z.B. 1→2, 200→400)
  addRecipeBatch: async (recipeId) => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        set({ isLoading: false });
        return;
      }

      const state = get();
      const existingItems = state.items.filter((i) => i.recipeId === recipeId && !i.isChecked);
      if (existingItems.length === 0) {
        set({ isLoading: false });
        return;
      }

      const currentBatch = state.recipeBatchCounts[recipeId] || 1;
      const newBatch = currentBatch + 1;

      // Neue Mengen berechnen: qty * (newBatch / currentBatch)
      const updates: Array<{ id: string; quantity: string }> = [];
      const updatedItems: ShoppingItem[] = [];

      for (const item of existingItems) {
        const currentQty = parseQty(item.quantity);
        if (currentQty > 0) {
          const baseQty = currentQty / currentBatch;
          const newQty = baseQty * newBatch;
          const newQtyStr = formatQty(newQty);
          updates.push({ id: item.id, quantity: newQtyStr });
          updatedItems.push({ ...item, quantity: newQtyStr });
        } else {
          // Nicht-numerische Menge (z.B. "eine Prise") — nicht ändern
          updatedItems.push(item);
        }
      }

      // Optimistic Update
      const newBatchCounts = { ...state.recipeBatchCounts, [recipeId]: newBatch };
      set((s) => {
        const allItems = s.items.map((item) => {
          const upd = updatedItems.find((u) => u.id === item.id);
          return upd || item;
        });
        return { items: allItems, isLoading: false, recipeBatchCounts: newBatchCounts, ...deriveState(allItems, newBatchCounts) };
      });

      // DB Update
      if (updates.length > 0) {
        const res = await fetch("/api/shopping/batch-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates, userId: session.user.id }),
        });
        if (!res.ok) {
          // Rollback
          const oldBatchCounts = { ...newBatchCounts, [recipeId]: currentBatch };
          set((s) => {
            const allItems = s.items.map((item) => {
              const orig = existingItems.find((o) => o.id === item.id);
              return orig || item;
            });
            return { items: allItems, recipeBatchCounts: oldBatchCounts, ...deriveState(allItems, oldBatchCounts) };
          });
        }
      }
    } catch (err: any) {
      set({ isLoading: false });
      get().loadShoppingList();
    }
  },

  // -1: Mengen reduzieren. Bei batchCount=1 → alles löschen
  removeRecipeBatch: async (recipeId) => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        set({ isLoading: false });
        return;
      }

      const state = get();
      const existingItems = state.items.filter((i) => i.recipeId === recipeId && !i.isChecked);
      if (existingItems.length === 0) {
        set({ isLoading: false });
        return;
      }

      const currentBatch = state.recipeBatchCounts[recipeId] || 1;

      // Bei batchCount 1 → alles löschen
      if (currentBatch <= 1) {
        set({ isLoading: false });
        get().removeAllRecipeItems(recipeId);
        return;
      }

      const newBatch = currentBatch - 1;

      // Neue Mengen berechnen
      const updates: Array<{ id: string; quantity: string }> = [];
      const updatedItems: ShoppingItem[] = [];

      for (const item of existingItems) {
        const currentQty = parseQty(item.quantity);
        if (currentQty > 0) {
          const baseQty = currentQty / currentBatch;
          const newQty = baseQty * newBatch;
          const newQtyStr = formatQty(newQty);
          updates.push({ id: item.id, quantity: newQtyStr });
          updatedItems.push({ ...item, quantity: newQtyStr });
        } else {
          updatedItems.push(item);
        }
      }

      // Optimistic Update
      const newBatchCounts = { ...state.recipeBatchCounts, [recipeId]: newBatch };
      set((s) => {
        const allItems = s.items.map((item) => {
          const upd = updatedItems.find((u) => u.id === item.id);
          return upd || item;
        });
        return { items: allItems, isLoading: false, recipeBatchCounts: newBatchCounts, ...deriveState(allItems, newBatchCounts) };
      });

      // DB Update
      if (updates.length > 0) {
        const res = await fetch("/api/shopping/batch-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates, userId: session.user.id }),
        });
        if (!res.ok) {
          // Rollback
          const oldBatchCounts = { ...newBatchCounts, [recipeId]: currentBatch };
          set((s) => {
            const allItems = s.items.map((item) => {
              const orig = existingItems.find((o) => o.id === item.id);
              return orig || item;
            });
            return { items: allItems, recipeBatchCounts: oldBatchCounts, ...deriveState(allItems, oldBatchCounts) };
          });
        }
      }
    } catch (err: any) {
      set({ isLoading: false });
      get().loadShoppingList();
    }
  },

  // Alle Items eines Rezepts komplett löschen
  removeAllRecipeItems: async (recipeId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const allItems = get().items.filter((i) => i.recipeId === recipeId);
      const ids = allItems.map((i) => i.id);
      if (ids.length === 0) return;

      // Optimistic Update
      set((state) => {
        const remaining = state.items.filter((i) => i.recipeId !== recipeId);
        const batchCounts = { ...state.recipeBatchCounts };
        delete batchCounts[recipeId];
        return { items: remaining, recipeBatchCounts: batchCounts, ...deriveState(remaining, batchCounts) };
      });

      const res = await fetch("/api/shopping/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, userId: session.user.id }),
      });

      if (!res.ok) {
        // Rollback
        set((state) => {
          const restored = [...state.items, ...allItems];
          const batchCounts = { ...state.recipeBatchCounts, [recipeId]: 1 };
          return { items: restored, recipeBatchCounts: batchCounts, ...deriveState(restored, batchCounts) };
        });
      }
    } catch {
      // silent
    }
  },

  addCustomItem: async (name, quantity, unit) => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const res = await fetch("/api/shopping/batch-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          items: [{ name, quantity, unit, category: "other" }],
        }),
      });

      if (!res.ok) throw new Error("Insert failed");

      const { items: inserted } = await res.json();
      const item = dbToShoppingItem(inserted[0]);
      set((state) => {
        const allItems = [...state.items, item];
        return { items: allItems, isLoading: false, ...deriveState(allItems, state.recipeBatchCounts) };
      });
    } catch (err: any) {
      set({ isLoading: false });
    }
  },

  toggleItem: async (id) => {
    const current = get().items.find((i) => i.id === id);
    if (!current) return;

    const toggled = { ...current, isChecked: !current.isChecked };
    set((state) => {
      const allItems = state.items.map((i) => (i.id === id ? toggled : i));
      return { items: allItems, ...deriveState(allItems, state.recipeBatchCounts) };
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const res = await fetch("/api/shopping/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: session.user.id, updates: { is_checked: toggled.isChecked } }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch {
      set((state) => {
        const allItems = state.items.map((i) => (i.id === id ? current : i));
        return { items: allItems, ...deriveState(allItems, state.recipeBatchCounts) };
      });
    }
  },

  updateItem: async (id, updates) => {
    const current = get().items.find((i) => i.id === id);
    if (!current) return;

    const updated = { ...current, ...updates };
    set((state) => {
      const allItems = state.items.map((i) => (i.id === id ? updated : i));
      return { items: allItems, ...deriveState(allItems, state.recipeBatchCounts) };
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;

      const res = await fetch("/api/shopping/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: session.user.id, updates: dbUpdates }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch {
      set((state) => {
        const allItems = state.items.map((i) => (i.id === id ? current : i));
        return { items: allItems, ...deriveState(allItems, state.recipeBatchCounts) };
      });
    }
  },

  deleteItem: async (id) => {
    const current = get().items.find((i) => i.id === id);
    set((state) => {
      const allItems = state.items.filter((i) => i.id !== id);
      return { items: allItems, ...deriveState(allItems, state.recipeBatchCounts) };
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const res = await fetch("/api/shopping/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], userId: session.user.id }),
      });
      if (!res.ok) throw new Error("Delete failed");
    } catch {
      if (current) {
        set((state) => {
          const allItems = [...state.items, current];
          return { items: allItems, ...deriveState(allItems, state.recipeBatchCounts) };
        });
      }
    }
  },

  clearList: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const ids = get().items.map((i) => i.id);
      if (ids.length === 0) { set({ isLoading: false }); return; }

      const res = await fetch("/api/shopping/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, userId: session.user.id }),
      });
      if (!res.ok) throw new Error("Delete failed");

      set({
        items: [],
        categories: [],
        recipeGroups: [],
        uncheckedItems: [],
        checkedItems: [],
        customItems: [],
        recipeBatchCounts: {},
        isLoading: false,
      });
    } catch (err: any) {
      set({ isLoading: false });
    }
  },
}));

// Helper to get current state in async functions
function get() {
  return useShoppingStore.getState();
}
