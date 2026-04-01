"use client";

import { create } from "zustand";
import { MealSlot, MealType, DayPlan } from "@/types/planner";
import { supabase } from "@/lib/supabase";
import { getUserHouseholdId } from "@/lib/utils";
import { HouseholdProfile } from "@/types/household";
import { Recipe } from "@/types";

export interface FeedRecipeForPlanner {
  title: string;
  source: string;
  imageUrl?: string | null;
  sourceUrl?: string;
}

// API gibt ein flaches Array zurück:
// [{date, recipeName, recipeId, description, cookTime, servings}, ...]
interface GeneratedMealFromAPI {
  date: string;
  recipeName: string;
  recipeId: string | null;
  description: string;
  cookTime: number;
  servings: number;
}

interface PlannerStore {
  slots: MealSlot[];
  isLoading: boolean;
  isGenerating: boolean;
  generateError: string | null;

  loadSlots: () => void;
  addMeal: (
    recipeId: string,
    recipeName: string,
    recipeImage: string | undefined,
    date: string,
    mealType: MealType,
    servings: number,
    sourceUrl?: string,
    sourceName?: string,
  ) => void;
  moveMeal: (id: string, newDate: string) => void;
  removeMeal: (id: string) => void;
  getDayPlans: (startDate: Date, numDays: number) => DayPlan[];
  generateAndApply: (startDate: string, numDays: number, profile: HouseholdProfile, existingRecipes: Recipe[], feedRecipes: FeedRecipeForPlanner[], preferences?: any) => Promise<void>;
}

const dayLabels = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDayLabel(d: Date): string {
  const today = new Date();
  if (formatDate(d) === formatDate(today)) return "Heute";
  return dayLabels[d.getDay()];
}

function dbToMealSlot(row: any): MealSlot {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    recipeName: row.recipe_name,
    recipeImage: row.recipe_image || undefined,
    sourceUrl: row.source_url || undefined,
    sourceName: row.source_name || undefined,
    date: row.date,
    mealType: row.meal_type,
    servings: row.servings,
    createdAt: row.created_at,
  };
}

export const usePlannerStore = create<PlannerStore>((set, get) => ({
  slots: [],
  isLoading: false,
  isGenerating: false,
  generateError: null,

  loadSlots: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { set({ slots: [], isLoading: false }); return; }

      const { data: slots, error } = await supabase
        .from("meal_slots")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (error) throw error;
      set({ slots: (slots || []).map(dbToMealSlot), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addMeal: async (recipeId, recipeName, recipeImage, date, mealType, servings, sourceUrl, sourceName) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const householdId = await getUserHouseholdId();
      const baseRow = {
        user_id: user.id, household_id: householdId,
        recipe_id: recipeId, recipe_name: recipeName, recipe_image: recipeImage,
        date, meal_type: mealType, servings,
      };

      // Versuche mit source-Spalten, Fallback ohne (falls Migration 004 fehlt)
      let result = await supabase
        .from("meal_slots")
        .insert([{ ...baseRow, source_url: sourceUrl || null, source_name: sourceName || null }])
        .select()
        .single();

      if (result.error?.message?.includes("source_")) {
        result = await supabase.from("meal_slots").insert([baseRow]).select().single();
      }
      if (result.error) throw result.error;
      set((state) => ({ slots: [...state.slots, dbToMealSlot(result.data)], isLoading: false }));
    } catch {
      set({ isLoading: false });
    }
  },

  removeMeal: async (id) => {
    const current = get().slots.find((s) => s.id === id);
    set((state) => ({ slots: state.slots.filter((s) => s.id !== id) }));

    try {
      const { error } = await supabase.from("meal_slots").delete().eq("id", id);
      if (error) throw error;
    } catch {
      if (current) set((state) => ({ slots: [...state.slots, current] }));
    }
  },

  moveMeal: async (id, newDate) => {
    const current = get().slots.find((s) => s.id === id);
    if (!current) return;
    // Optimistic update
    set((state) => ({
      slots: state.slots.map((s) => s.id === id ? { ...s, date: newDate } : s),
    }));
    try {
      const { error } = await supabase.from("meal_slots").update({ date: newDate }).eq("id", id);
      if (error) throw error;
    } catch {
      // Rollback
      set((state) => ({
        slots: state.slots.map((s) => s.id === id ? { ...s, date: current.date } : s),
      }));
    }
  },

  getDayPlans: (startDate, numDays) => {
    const { slots } = get();
    const plans: DayPlan[] = [];
    const today = formatDate(new Date());

    for (let i = 0; i < numDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = formatDate(d);
      plans.push({
        date: dateStr,
        dayLabel: getDayLabel(d),
        dayNumber: d.getDate(),
        isToday: dateStr === today,
        meals: slots.filter((s) => s.date === dateStr),
      });
    }
    return plans;
  },

  // === AI Wochenplan: Generate + direkt einfügen ===
  generateAndApply: async (startDate, numDays, profile, existingRecipes, feedRecipes, preferences) => {
    set({ isGenerating: true, generateError: null });
    try {
      // 1. API Call
      const response = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          numDays,
          profile,
          existingRecipes: existingRecipes.map((r) => ({
            id: r.id, dishName: r.dishName, cookTime: r.cookTime,
          })),
          feedRecipes,
          preferences,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Wochenplan-Generierung fehlgeschlagen");
      }

      const meals: GeneratedMealFromAPI[] = await response.json();

      // 2. Direkt in DB einfügen
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const householdId = await getUserHouseholdId();

      // Bilder aus gespeicherten Rezepten matchen
      const recipeMap = new Map(existingRecipes.map((r) => [r.id, r]));
      // Feed-Rezepte nach Name matchen (für Bilder + Quellen-Info)
      const feedMap = new Map(feedRecipes.map((r) => [r.title.toLowerCase(), r]));

      const baseSlotsToInsert = meals.map((m) => {
        const matched = m.recipeId ? recipeMap.get(m.recipeId) : null;
        const feedMatch = !matched ? feedMap.get(m.recipeName.toLowerCase()) : null;
        return {
          user_id: user.id,
          household_id: householdId,
          recipe_id: m.recipeId || `ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          recipe_name: m.recipeName,
          recipe_image: matched?.recipeImages?.[0] || feedMatch?.imageUrl || null,
          _sourceUrl: matched ? null : (feedMatch?.sourceUrl || null),
          _sourceName: matched ? null : (feedMatch?.source || null),
          date: m.date,
          meal_type: "abendessen" as MealType,
          servings: m.servings,
        };
      });

      // Versuche mit source-Spalten, Fallback ohne (falls Migration 004 fehlt)
      const withSource = baseSlotsToInsert.map(({ _sourceUrl, _sourceName, ...rest }) => ({
        ...rest, source_url: _sourceUrl, source_name: _sourceName,
      }));
      let result = await supabase.from("meal_slots").insert(withSource).select();

      if (result.error?.message?.includes("source_")) {
        const withoutSource = baseSlotsToInsert.map(({ _sourceUrl, _sourceName, ...rest }) => rest);
        result = await supabase.from("meal_slots").insert(withoutSource).select();
      }
      if (result.error) throw result.error;
      const inserted = result.data;

      const newSlots = (inserted || []).map(dbToMealSlot);
      set((state) => ({
        slots: [...state.slots, ...newSlots],
        isGenerating: false,
      }));
    } catch (err: any) {
      set({ generateError: err.message, isGenerating: false });
    }
  },
}));
