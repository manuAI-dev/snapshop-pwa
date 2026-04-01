// ============================================================
// SnapShop Subscription & Feature-Gate Konfiguration
// ============================================================
// Pricing: Free (Honeymoon) → Pro (CHF 4.90/Monat oder CHF 39.–/Jahr)
//
// Strategie: "Honeymoon Phase"
// - Alles offen bis 10 gespeicherte Rezepte
// - Ab Rezept 11 → Paywall für unbegrenzte Rezepte
// - AI-Features: je 1x gratis testen, danach Pro
// - Soft-Limits gegen Missbrauch (30 Imports/Monat etc.)

import { supabase } from "@/lib/supabase";

export type SubscriptionTier = "free" | "pro";

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  label: string;
  priceMonthly: number;   // CHF
  priceYearly: number;    // CHF
  features: string[];
}

export const PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    tier: "free",
    label: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "Bis zu 10 Rezepte speichern",
      "Entdecken-Feed uneingeschränkt",
      "Einkaufsliste",
      "1 AI-Wochenplan",
      "1 Kühlschrank-Scan",
      "3 Kalorien-Fotos",
    ],
  },
  pro: {
    tier: "pro",
    label: "Pro",
    priceMonthly: 4.90,
    priceYearly: 39.00,
    features: [
      "Unbegrenzte Rezepte",
      "Unbegrenzte AI-Wochenpläne",
      "Kochmodus",
      "Kalorien-Tracker",
      "Kühlschrank-Scanner",
      "Zutaten-Alternativen (AI)",
      "Nährwert-Analyse (AI)",
      "Haushaltsprofil mit Allergien",
    ],
  },
};

// ============================================================
// Feature-Gate Definitionen
// ============================================================

export interface FeatureGate {
  key: string;
  label: string;
  freeLimit: number | null;  // null = unbegrenzt im Free-Tier
  softLimit: number;          // Pro-User Soft-Limit pro Monat
}

export const FEATURE_GATES: Record<string, FeatureGate> = {
  recipeStore: {
    key: "recipe_count",
    label: "Gespeicherte Rezepte",
    freeLimit: 10,
    softLimit: 999,
  },
  aiPlanner: {
    key: "ai_planner",
    label: "AI Wochenplan",
    freeLimit: 1,
    softLimit: 15,
  },
  recipeImport: {
    key: "recipe_import",
    label: "Rezept-Import (AI)",
    freeLimit: 3,
    softLimit: 30,
  },
  fridgeScan: {
    key: "fridge_scan",
    label: "Kühlschrank-Scanner",
    freeLimit: 1,
    softLimit: 20,
  },
  caloriePhoto: {
    key: "calorie_photo",
    label: "Kalorien-Foto",
    freeLimit: 3,
    softLimit: 100,
  },
  ingredientAlt: {
    key: "ingredient_alt",
    label: "Zutaten-Alternativen",
    freeLimit: 2,
    softLimit: 30,
  },
  cookingMode: {
    key: "cooking_mode",
    label: "Kochmodus",
    freeLimit: 1,
    softLimit: 999,
  },
};

// ============================================================
// Supabase-backed Subscription Helpers
// ============================================================

const USAGE_PREFIX = "snapshop_usage_";
const SUB_KEY = "snapshop_subscription";

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// --- localStorage Fallback (schnell, offline-fähig) ---

interface MonthlyUsage {
  month: string;
  counts: Record<string, number>;
}

function getLocalUsage(): MonthlyUsage {
  if (typeof window === "undefined") return { month: getCurrentMonth(), counts: {} };
  try {
    const raw = localStorage.getItem(USAGE_PREFIX + "monthly");
    if (raw) {
      const data: MonthlyUsage = JSON.parse(raw);
      if (data.month !== getCurrentMonth()) {
        return { month: getCurrentMonth(), counts: {} };
      }
      return data;
    }
  } catch { /* ignore */ }
  return { month: getCurrentMonth(), counts: {} };
}

function saveLocalUsage(usage: MonthlyUsage): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USAGE_PREFIX + "monthly", JSON.stringify(usage));
}

/** Get current count for a feature this month (localStorage) */
export function getFeatureUsage(featureKey: string): number {
  return getLocalUsage().counts[featureKey] || 0;
}

/** Increment usage count for a feature (localStorage + Supabase sync) */
export function incrementFeatureUsage(featureKey: string): number {
  // 1. Sofort localStorage aktualisieren (schnell, optimistisch)
  const usage = getLocalUsage();
  usage.counts[featureKey] = (usage.counts[featureKey] || 0) + 1;
  saveLocalUsage(usage);

  // 2. Async Supabase sync (fire-and-forget)
  syncUsageToSupabase(featureKey, usage.counts[featureKey]);

  return usage.counts[featureKey];
}

/** Sync usage to Supabase (non-blocking) */
async function syncUsageToSupabase(featureKey: string, count: number): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const month = getCurrentMonth();
    const { error } = await supabase
      .from("feature_usage")
      .upsert(
        { user_id: user.id, feature_key: featureKey, month, count },
        { onConflict: "user_id,feature_key,month" }
      );

    if (error) console.warn("Usage sync failed:", error.message);
  } catch {
    // Offline oder DB noch nicht migriert — kein Problem
  }
}

// --- Tier Helpers (Supabase-primary, localStorage-cache) ---

/** Get saved subscription tier (localStorage cache) */
export function getSavedTier(): SubscriptionTier {
  if (typeof window === "undefined") return "free";
  try {
    const raw = localStorage.getItem(SUB_KEY);
    if (raw === "pro") return "pro";
  } catch { /* ignore */ }
  return "free";
}

/** Save subscription tier to localStorage cache */
export function saveTier(tier: SubscriptionTier): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SUB_KEY, tier);
}

/** Load tier from Supabase (single source of truth) */
export async function loadTierFromSupabase(): Promise<SubscriptionTier> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return getSavedTier();

    const { data, error } = await supabase
      .from("subscriptions")
      .select("tier, status, current_period_end")
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      // Kein Subscription-Eintrag → erstellen
      await supabase.from("subscriptions").upsert(
        { user_id: user.id, tier: "free" },
        { onConflict: "user_id" }
      );
      saveTier("free");
      return "free";
    }

    // Check ob Pro noch gültig ist
    if (data.tier === "pro" && data.status === "active") {
      if (data.current_period_end) {
        const endDate = new Date(data.current_period_end);
        if (endDate < new Date()) {
          // Abgelaufen → downgrade
          saveTier("free");
          return "free";
        }
      }
      saveTier("pro");
      return "pro";
    }

    const tier = (data.tier as SubscriptionTier) || "free";
    saveTier(tier);
    return tier;
  } catch {
    // Fallback zu localStorage wenn DB nicht erreichbar
    return getSavedTier();
  }
}

/** Load usage from Supabase and sync to localStorage */
export async function loadUsageFromSupabase(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const month = getCurrentMonth();
    const { data, error } = await supabase
      .from("feature_usage")
      .select("feature_key, count")
      .eq("user_id", user.id)
      .eq("month", month);

    if (error || !data) return;

    // Merge mit localStorage (höherer Wert gewinnt)
    const usage = getLocalUsage();
    for (const row of data) {
      const currentLocal = usage.counts[row.feature_key] || 0;
      usage.counts[row.feature_key] = Math.max(currentLocal, row.count);
    }
    usage.month = month;
    saveLocalUsage(usage);
  } catch {
    // Offline — localStorage ist Fallback
  }
}

/** Get Stripe Customer ID for user (or create one) */
export async function getStripeCustomerId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    return data?.stripe_customer_id || null;
  } catch {
    return null;
  }
}

// ============================================================
// Gate-Check: Darf der User dieses Feature nutzen?
// ============================================================

export interface GateResult {
  allowed: boolean;
  reason?: "paywall" | "soft_limit";
  currentUsage?: number;
  limit?: number;
  featureLabel?: string;
}

export function checkFeatureAccess(
  featureKey: string,
  tier: SubscriptionTier,
  currentCount?: number,
): GateResult {
  const gate = FEATURE_GATES[featureKey];
  if (!gate) return { allowed: true };

  const usage = currentCount ?? getFeatureUsage(gate.key);

  if (tier === "free") {
    if (gate.freeLimit !== null && usage >= gate.freeLimit) {
      return {
        allowed: false,
        reason: "paywall",
        currentUsage: usage,
        limit: gate.freeLimit,
        featureLabel: gate.label,
      };
    }
    return { allowed: true, currentUsage: usage, limit: gate.freeLimit ?? undefined };
  }

  // Pro-Tier: Check soft limit
  if (usage >= gate.softLimit) {
    return {
      allowed: false,
      reason: "soft_limit",
      currentUsage: usage,
      limit: gate.softLimit,
      featureLabel: gate.label,
    };
  }

  return { allowed: true, currentUsage: usage, limit: gate.softLimit };
}
