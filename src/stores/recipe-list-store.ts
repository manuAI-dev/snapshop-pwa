"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecipeList {
  id: string;
  name: string;
  color: string; // accent color
  recipeIds: string[];
  createdAt: string;
}

interface RecipeListStore {
  lists: RecipeList[];
  createList: (name: string, color?: string) => RecipeList;
  deleteList: (listId: string) => void;
  renameList: (listId: string, newName: string) => void;
  addRecipeToList: (listId: string, recipeId: string) => void;
  removeRecipeFromList: (listId: string, recipeId: string) => void;
  getListsForRecipe: (recipeId: string) => RecipeList[];
}

// Default colors to cycle through
const DEFAULT_COLORS = ["#F2894F", "#4B164C", "#2E8D92", "#4674EB", "#E91E63", "#00A651"];

export const useRecipeListStore = create<RecipeListStore>()(
  persist(
    (set, get) => ({
      lists: [],

      createList: (name, color) => {
        const newList: RecipeList = {
          id: crypto.randomUUID(),
          name,
          color: color || DEFAULT_COLORS[get().lists.length % DEFAULT_COLORS.length],
          recipeIds: [],
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          lists: [...state.lists, newList],
        }));

        return newList;
      },

      deleteList: (listId) => {
        set((state) => ({
          lists: state.lists.filter((l) => l.id !== listId),
        }));
      },

      renameList: (listId, newName) => {
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId ? { ...l, name: newName } : l
          ),
        }));
      },

      addRecipeToList: (listId, recipeId) => {
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  recipeIds: l.recipeIds.includes(recipeId)
                    ? l.recipeIds
                    : [...l.recipeIds, recipeId],
                }
              : l
          ),
        }));
      },

      removeRecipeFromList: (listId, recipeId) => {
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  recipeIds: l.recipeIds.filter((id) => id !== recipeId),
                }
              : l
          ),
        }));
      },

      getListsForRecipe: (recipeId) => {
        return get().lists.filter((l) => l.recipeIds.includes(recipeId));
      },
    }),
    {
      name: "recipe-list-store",
      version: 1,
    }
  )
);
