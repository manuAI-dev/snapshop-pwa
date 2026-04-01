// Wochenplaner / Meal Planning Types

export interface MealSlot {
  id: string;
  recipeId: string;
  recipeName: string;
  recipeImage?: string; // first image from recipe
  sourceUrl?: string;   // URL zur Originalquelle (Feed)
  sourceName?: string;  // z.B. "Fooby", "Betty Bossi"
  date: string; // ISO date string YYYY-MM-DD
  mealType: MealType;
  servings: number;
  createdAt: string;
}

export type MealType = "frühstück" | "mittagessen" | "abendessen" | "snack";

export const mealTypeLabels: Record<MealType, string> = {
  frühstück: "Frühstück",
  mittagessen: "Mittagessen",
  abendessen: "Abendessen",
  snack: "Snack",
};

export interface DayPlan {
  date: string;
  dayLabel: string; // "Mo", "Di", etc.
  dayNumber: number;
  isToday: boolean;
  meals: MealSlot[];
}
