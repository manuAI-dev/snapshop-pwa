"use client";

import { create } from "zustand";
import { CalorieEntry, CalorieMealType, DaySummary } from "@/types/calorie";
import { supabase } from "@/lib/supabase";

interface CalorieStore {
  entries: CalorieEntry[];
  isLoading: boolean;
  dbAvailable: boolean; // tracks if calorie_entries table exists

  loadEntries: (startDate: string, endDate: string) => void;
  addEntry: (entry: Omit<CalorieEntry, "id" | "userId" | "createdAt">) => Promise<CalorieEntry | null>;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, updates: Partial<CalorieEntry>) => void;
  getDaySummary: (date: string) => DaySummary;
  getWeekSummary: (startDate: string) => DaySummary[];
}

function dbToEntry(row: any): CalorieEntry {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    mealType: row.meal_type,
    title: row.title,
    calories: row.calories || 0,
    protein: row.protein || undefined,
    carbs: row.carbs || undefined,
    fat: row.fat || undefined,
    photoUrl: row.photo_url || undefined,
    recipeId: row.recipe_id || undefined,
    note: row.note || undefined,
    createdAt: row.created_at,
  };
}

// Local fallback: generate a temp ID
function tempId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export const useCalorieStore = create<CalorieStore>((set, get) => ({
  entries: [],
  isLoading: false,
  dbAvailable: true,

  loadEntries: async (startDate, endDate) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { set({ isLoading: false }); return; }

      const { data, error } = await supabase
        .from("calorie_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("created_at", { ascending: true });

      if (error) {
        // Table doesn't exist yet → keep local entries, mark db as unavailable
        console.warn("calorie_entries table not available:", error.message);
        set({ isLoading: false, dbAvailable: false });
        return;
      }

      // Merge: keep local-only entries (local_xxx IDs) + replace DB entries
      const dbEntries = (data || []).map(dbToEntry);
      const localOnly = get().entries.filter(e => e.id.startsWith("local_"));
      // Dedupe: if a local entry has same date+title+mealType as a DB entry, drop the local one
      const dedupedLocal = localOnly.filter((le: CalorieEntry) =>
        !dbEntries.some((de: CalorieEntry) => de.date === le.date && de.title === le.title && de.mealType === le.mealType)
      );
      set({ entries: [...dbEntries, ...dedupedLocal], isLoading: false, dbAvailable: true });
    } catch {
      set({ isLoading: false });
    }
  },

  addEntry: async (entry) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Try DB insert
      if (get().dbAvailable) {
        const { data: inserted, error } = await supabase
          .from("calorie_entries")
          .insert([{
            user_id: user.id,
            date: entry.date,
            meal_type: entry.mealType,
            title: entry.title,
            calories: entry.calories,
            protein: entry.protein || null,
            carbs: entry.carbs || null,
            fat: entry.fat || null,
            photo_url: entry.photoUrl || null,
            recipe_id: entry.recipeId || null,
            note: entry.note || null,
          }])
          .select()
          .single();

        if (!error && inserted) {
          const newEntry = dbToEntry(inserted);
          set((state) => ({ entries: [...state.entries, newEntry] }));
          return newEntry;
        }
        // If DB fails, fall through to local
        console.warn("DB insert failed, using local fallback:", error?.message);
      }

      // Local fallback
      const localEntry: CalorieEntry = {
        id: tempId(),
        userId: user.id,
        date: entry.date,
        mealType: entry.mealType,
        title: entry.title,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        photoUrl: entry.photoUrl,
        recipeId: entry.recipeId,
        note: entry.note,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ entries: [...state.entries, localEntry] }));
      return localEntry;
    } catch {
      return null;
    }
  },

  removeEntry: async (id) => {
    const current = get().entries.find(e => e.id === id);
    set((state) => ({ entries: state.entries.filter(e => e.id !== id) }));

    // Only delete from DB if it's a real DB entry
    if (!id.startsWith("local_")) {
      try {
        const { error } = await supabase.from("calorie_entries").delete().eq("id", id);
        if (error) throw error;
      } catch {
        if (current) set((state) => ({ entries: [...state.entries, current] }));
      }
    }
  },

  updateEntry: async (id, updates) => {
    const current = get().entries.find(e => e.id === id);
    if (!current) return;

    set((state) => ({
      entries: state.entries.map(e => e.id === id ? { ...e, ...updates } : e),
    }));

    if (!id.startsWith("local_")) {
      try {
        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.calories !== undefined) dbUpdates.calories = updates.calories;
        if (updates.protein !== undefined) dbUpdates.protein = updates.protein;
        if (updates.carbs !== undefined) dbUpdates.carbs = updates.carbs;
        if (updates.fat !== undefined) dbUpdates.fat = updates.fat;
        if (updates.photoUrl !== undefined) dbUpdates.photo_url = updates.photoUrl;
        if (updates.note !== undefined) dbUpdates.note = updates.note;

        const { error } = await supabase.from("calorie_entries").update(dbUpdates).eq("id", id);
        if (error) throw error;
      } catch {
        set((state) => ({
          entries: state.entries.map(e => e.id === id ? current : e),
        }));
      }
    }
  },

  getDaySummary: (date) => {
    const entries = get().entries.filter(e => e.date === date);
    return {
      date,
      totalCalories: entries.reduce((sum, e) => sum + e.calories, 0),
      totalProtein: entries.reduce((sum, e) => sum + (e.protein || 0), 0),
      totalCarbs: entries.reduce((sum, e) => sum + (e.carbs || 0), 0),
      totalFat: entries.reduce((sum, e) => sum + (e.fat || 0), 0),
      entries,
    };
  },

  getWeekSummary: (startDate) => {
    const summaries: DaySummary[] = [];
    const start = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      summaries.push(get().getDaySummary(`${y}-${m}-${day}`));
    }
    return summaries;
  },
}));
