"use client";

import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { getUserHouseholdId } from "@/lib/utils";

export interface RecipeList {
  id: string;
  name: string;
  color: string;
  recipeIds: string[];
  createdAt: string;
  userId?: string;
}

interface RecipeListStore {
  lists: RecipeList[];
  isLoading: boolean;
  loadLists: () => Promise<void>;
  createList: (name: string, color?: string) => Promise<RecipeList | null>;
  deleteList: (listId: string) => Promise<void>;
  renameList: (listId: string, newName: string) => Promise<void>;
  addRecipeToList: (listId: string, recipeId: string) => Promise<void>;
  removeRecipeFromList: (listId: string, recipeId: string) => Promise<void>;
  getListsForRecipe: (recipeId: string) => RecipeList[];
}

const DEFAULT_COLORS = ["#F2894F", "#4B164C", "#2E8D92", "#4674EB", "#E91E63", "#00A651"];

function dbToRecipeList(row: any): RecipeList {
  return {
    id: row.id,
    name: row.name,
    color: row.color || "#F2894F",
    recipeIds: row.recipe_ids || [],
    createdAt: row.created_at,
    userId: row.user_id,
  };
}

export const useRecipeListStore = create<RecipeListStore>((set, get) => ({
  lists: [],
  isLoading: false,

  loadLists: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { set({ lists: [], isLoading: false }); return; }

      // Server-API Route für Household-Support
      const res = await fetch(`/api/recipe-lists/load?userId=${user.id}`);
      if (!res.ok) throw new Error("Failed to load lists");
      const { lists } = await res.json();

      set({ lists: (lists || []).map(dbToRecipeList), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createList: async (name, color) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const householdId = await getUserHouseholdId();
      const newColor = color || DEFAULT_COLORS[get().lists.length % DEFAULT_COLORS.length];

      const { data, error } = await supabase
        .from("recipe_lists")
        .insert([{
          user_id: user.id,
          household_id: householdId,
          name,
          color: newColor,
          recipe_ids: [],
        }])
        .select()
        .single();

      if (error) throw error;

      const newList = dbToRecipeList(data);
      set((state) => ({ lists: [...state.lists, newList] }));
      return newList;
    } catch {
      return null;
    }
  },

  deleteList: async (listId) => {
    set((state) => ({ lists: state.lists.filter((l) => l.id !== listId) }));
    await supabase.from("recipe_lists").delete().eq("id", listId);
  },

  renameList: async (listId, newName) => {
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, name: newName } : l
      ),
    }));
    await supabase.from("recipe_lists").update({ name: newName }).eq("id", listId);
  },

  addRecipeToList: async (listId, recipeId) => {
    const list = get().lists.find((l) => l.id === listId);
    if (!list || list.recipeIds.includes(recipeId)) return;

    const newIds = [...list.recipeIds, recipeId];
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, recipeIds: newIds } : l
      ),
    }));
    await supabase.from("recipe_lists").update({ recipe_ids: newIds }).eq("id", listId);
  },

  removeRecipeFromList: async (listId, recipeId) => {
    const list = get().lists.find((l) => l.id === listId);
    if (!list) return;

    const newIds = list.recipeIds.filter((id) => id !== recipeId);
    set((state) => ({
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, recipeIds: newIds } : l
      ),
    }));
    await supabase.from("recipe_lists").update({ recipe_ids: newIds }).eq("id", listId);
  },

  getListsForRecipe: (recipeId) => {
    return get().lists.filter((l) => l.recipeIds.includes(recipeId));
  },
}));
