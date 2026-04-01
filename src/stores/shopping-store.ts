"use client";

import { create } from "zustand";
import { Recipe, IngredientCategory, categoryLabels } from "@/types";
import { ShoppingItem, ShoppingCategory, ShoppingRecipeGroup } from "@/types/shopping";
import { supabase } from "@/lib/supabase";
import { getUserHouseholdId } from "@/lib/utils";

interface ShoppingStore {
  items: ShoppingItem[];
  isLoading: boolean;

  // Abgeleitete Daten
  categories: ShoppingCategory[];
  recipeGroups: ShoppingRecipeGroup[];
  uncheckedItems: ShoppingItem[];
  checkedItems: ShoppingItem[];
  customItems: ShoppingItem[];

  // Aktionen
  loadShoppingList: () => void;
  addRecipe: (recipe: Recipe) => void;
  removeRecipeBatch: (recipeId: string) => void;
  addCustomItem: (name: string, quantity: string, unit: string) => void;
  toggleItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<Pick<ShoppingItem, "name" | "quantity" | "unit">>) => void;
  deleteItem: (id: string) => void;
  clearList: () => void;
}

// Helper: Convert DB row to ShoppingItem
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

function deriveState(items: ShoppingItem[]) {
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
    .map(([category, items]) => ({
      category: category as IngredientCategory,
      label: categoryLabels[category as IngredientCategory] || "Sonstiges",
      items,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // Nach Rezept gruppieren (nur unchecked) + Batch-Count berechnen
  const recipeMap: Record<string, ShoppingItem[]> = {};
  for (const item of uncheckedItems) {
    if (item.recipeId) {
      const key = item.recipeId;
      if (!recipeMap[key]) recipeMap[key] = [];
      recipeMap[key].push(item);
    }
  }
  const recipeGroups: ShoppingRecipeGroup[] = Object.entries(recipeMap).map(([recipeId, items]) => {
    // Batches erkennen: Distinct created_at Zeitstempel (selbe Sekunde = 1 Batch)
    const timestamps = new Set(items.map((i) => i.createdAt?.slice(0, 19))); // bis Sekunde
    return {
      recipeId,
      recipeName: items[0]?.recipeName || "Unbekannt",
      items,
      batchCount: Math.max(1, timestamps.size),
    };
  });

  return { categories, recipeGroups, uncheckedItems, checkedItems, customItems };
}

export const useShoppingStore = create<ShoppingStore>((set) => ({
  items: [],
  isLoading: false,
  categories: [],
  recipeGroups: [],
  uncheckedItems: [],
  checkedItems: [],
  customItems: [],

  loadShoppingList: async () => {
    set({ isLoading: true });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        set({ items: [], isLoading: false, ...deriveState([]) });
        return;
      }

      // RLS Policy zeigt automatisch eigene + Haushalt-Items
      const { data: items, error } = await supabase
        .from("shopping_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const shoppingItems = (items || []).map(dbToShoppingItem);
      set({ items: shoppingItems, isLoading: false, ...deriveState(shoppingItems) });
    } catch (err: any) {
      set({ isLoading: false });
    }
  },

  addRecipe: async (recipe) => {
    set({ isLoading: true });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Convert ingredients to shopping items
      const householdId = await getUserHouseholdId();
      const itemsToInsert = (recipe.ingredients || []).map((ing) => ({
        user_id: user.id,
        household_id: householdId,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        category: ing.category,
        notes: ing.notes,
        is_checked: false,
        recipe_id: recipe.id,
        recipe_name: recipe.dishName,
      }));

      const { data: inserted, error } = await supabase
        .from("shopping_items")
        .insert(itemsToInsert)
        .select();

      if (error) throw error;

      const shoppingItems = (inserted || []).map(dbToShoppingItem);
      set((state) => {
        const allItems = [...state.items, ...shoppingItems];
        return { items: allItems, isLoading: false, ...deriveState(allItems) };
      });
    } catch (err: any) {
      set({ isLoading: false });
    }
  },

  removeRecipeBatch: async (recipeId) => {
    set({ isLoading: true });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Alle Items für dieses Rezept holen, nach Timestamp gruppieren
      const allItems = get().items.filter((i) => i.recipeId === recipeId && !i.isChecked);
      const timestampGroups: Record<string, ShoppingItem[]> = {};
      for (const item of allItems) {
        const ts = item.createdAt?.slice(0, 19) || "unknown";
        if (!timestampGroups[ts]) timestampGroups[ts] = [];
        timestampGroups[ts].push(item);
      }

      const batches = Object.entries(timestampGroups).sort(([a], [b]) => b.localeCompare(a)); // neueste zuerst
      if (batches.length <= 1) {
        // Letzter Batch → alle Items für dieses Rezept löschen
        const ids = allItems.map((i) => i.id);
        if (ids.length > 0) {
          const { error } = await supabase
            .from("shopping_items")
            .delete()
            .in("id", ids);
          if (error) throw error;
        }
      } else {
        // Neuesten Batch löschen
        const [, newestBatchItems] = batches[0];
        const ids = newestBatchItems.map((i) => i.id);
        const { error } = await supabase
          .from("shopping_items")
          .delete()
          .in("id", ids);
        if (error) throw error;
      }

      // State aktualisieren
      set((state) => {
        const remaining = state.items.filter((i) => {
          if (i.recipeId !== recipeId || i.isChecked) return true;
          const ts = i.createdAt?.slice(0, 19) || "unknown";
          if (batches.length <= 1) return false; // alle weg
          return ts !== batches[0][0]; // neuesten Batch entfernen
        });
        return { items: remaining, isLoading: false, ...deriveState(remaining) };
      });
    } catch (err: any) {
      set({ isLoading: false });
    }
  },

  addCustomItem: async (name, quantity, unit) => {
    set({ isLoading: true });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const householdId = await getUserHouseholdId();
      const { data: inserted, error } = await supabase
        .from("shopping_items")
        .insert([
          {
            user_id: user.id,
            household_id: householdId,
            name,
            quantity,
            unit,
            category: "other",
            is_checked: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const item = dbToShoppingItem(inserted);
      set((state) => {
        const allItems = [...state.items, item];
        return { items: allItems, isLoading: false, ...deriveState(allItems) };
      });
    } catch (err: any) {
      set({ isLoading: false });
    }
  },

  toggleItem: async (id) => {
    // Optimistic Update: Sofort lokal umschalten, dann DB sync
    const current = get().items.find((i) => i.id === id);
    if (!current) return;

    const toggled = { ...current, isChecked: !current.isChecked };
    set((state) => {
      const allItems = state.items.map((i) => (i.id === id ? toggled : i));
      return { items: allItems, ...deriveState(allItems) };
    });

    // DB im Hintergrund synchronisieren
    try {
      const { error } = await supabase
        .from("shopping_items")
        .update({ is_checked: toggled.isChecked })
        .eq("id", id);

      if (error) throw error;
    } catch {
      // Rollback bei Fehler
      set((state) => {
        const allItems = state.items.map((i) => (i.id === id ? current : i));
        return { items: allItems, ...deriveState(allItems) };
      });
    }
  },

  updateItem: async (id, updates) => {
    // Optimistic Update
    const current = get().items.find((i) => i.id === id);
    if (!current) return;

    const updated = { ...current, ...updates };
    set((state) => {
      const allItems = state.items.map((i) => (i.id === id ? updated : i));
      return { items: allItems, ...deriveState(allItems) };
    });

    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;

      const { error } = await supabase
        .from("shopping_items")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;
    } catch {
      // Rollback
      set((state) => {
        const allItems = state.items.map((i) => (i.id === id ? current : i));
        return { items: allItems, ...deriveState(allItems) };
      });
    }
  },

  deleteItem: async (id) => {
    // Optimistic Delete
    const current = get().items.find((i) => i.id === id);
    set((state) => {
      const allItems = state.items.filter((i) => i.id !== id);
      return { items: allItems, ...deriveState(allItems) };
    });

    try {
      const { error } = await supabase
        .from("shopping_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch {
      // Rollback
      if (current) {
        set((state) => {
          const allItems = [...state.items, current];
          return { items: allItems, ...deriveState(allItems) };
        });
      }
    }
  },

  clearList: async () => {
    set({ isLoading: true });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Lösche alle sichtbaren Items (eigene + Haushalt via RLS)
      const ids = get().items.map((i) => i.id);
      if (ids.length === 0) { set({ isLoading: false }); return; }
      const { error } = await supabase.from("shopping_items").delete().in("id", ids);

      if (error) throw error;

      set({
        items: [],
        categories: [],
        recipeGroups: [],
        uncheckedItems: [],
        checkedItems: [],
        customItems: [],
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
