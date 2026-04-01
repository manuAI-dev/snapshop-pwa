// Kalorien-Tracker Types

export interface CalorieEntry {
  id: string;
  userId: string;
  date: string;          // YYYY-MM-DD
  mealType: CalorieMealType;
  title: string;         // Name des Gerichts
  calories: number;      // kcal
  protein?: number;      // g
  carbs?: number;        // g
  fat?: number;          // g
  photoUrl?: string;     // Foto vom Gericht
  recipeId?: string;     // Verknüpfung mit gespeichertem Rezept
  note?: string;         // Notiz
  createdAt: string;
}

export type CalorieMealType = "frühstück" | "mittagessen" | "abendessen" | "snack";

export const calorieMealLabels: Record<CalorieMealType, string> = {
  frühstück: "Frühstück",
  mittagessen: "Mittagessen",
  abendessen: "Abendessen",
  snack: "Snack",
};

export const calorieMealIcons: Record<CalorieMealType, string> = {
  frühstück: "M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z M6 2v4 M10 2v4 M14 2v4",
  mittagessen: "M12 2a10 10 0 0 0 0 20 10 10 0 0 0 0-20z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10",
  abendessen: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7",
  snack: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
};

// Tages-Zusammenfassung
export interface DaySummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  entries: CalorieEntry[];
}
