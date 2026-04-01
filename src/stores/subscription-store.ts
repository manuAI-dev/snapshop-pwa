import { create } from "zustand";
import {
  SubscriptionTier,
  GateResult,
  checkFeatureAccess,
  getFeatureUsage,
  incrementFeatureUsage,
  getSavedTier,
  saveTier,
  loadTierFromSupabase,
  loadUsageFromSupabase,
  FEATURE_GATES,
} from "@/lib/subscription";

// ============================================================
// Subscription Store — zentraler State für Paywall & Usage
// ============================================================

interface SubscriptionState {
  tier: SubscriptionTier;
  isLoaded: boolean;

  // Paywall-Modal
  showPaywall: boolean;
  paywallFeature: string | null;
  paywallGateResult: GateResult | null;

  // Actions
  loadSubscription: () => void;
  upgradeTo: (tier: SubscriptionTier) => void;

  // Gate-Checks
  checkGate: (featureKey: string, currentCount?: number) => GateResult;
  useFeature: (featureKey: string) => boolean;
  triggerPaywall: (featureKey: string, gateResult?: GateResult) => void;
  dismissPaywall: () => void;

  // Usage info
  getUsage: (featureKey: string) => number;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  tier: "free",
  isLoaded: false,
  showPaywall: false,
  paywallFeature: null,
  paywallGateResult: null,

  loadSubscription: () => {
    // 1. Sofort aus localStorage laden (instant UI)
    const cachedTier = getSavedTier();
    set({ tier: cachedTier, isLoaded: true });

    // 2. Async: Supabase als Source-of-Truth nachladen
    (async () => {
      try {
        const [dbTier] = await Promise.all([
          loadTierFromSupabase(),
          loadUsageFromSupabase(),
        ]);
        // Update nur wenn sich etwas geändert hat
        if (dbTier !== get().tier) {
          set({ tier: dbTier });
        }
      } catch {
        // Offline → localStorage-Cache reicht
      }
    })();
  },

  upgradeTo: (tier) => {
    saveTier(tier);
    set({ tier, showPaywall: false, paywallFeature: null, paywallGateResult: null });
  },

  checkGate: (featureKey, currentCount) => {
    return checkFeatureAccess(featureKey, get().tier, currentCount);
  },

  /**
   * Prüfe Gate + zähle Usage hoch wenn erlaubt.
   * Gibt true zurück wenn Feature genutzt werden darf.
   * Bei false → öffnet automatisch Paywall.
   */
  useFeature: (featureKey) => {
    const { tier } = get();
    const gate = checkFeatureAccess(featureKey, tier);

    if (!gate.allowed) {
      set({
        showPaywall: true,
        paywallFeature: featureKey,
        paywallGateResult: gate,
      });
      return false;
    }

    // Usage hochzählen (nur für monatlich getrackte Features)
    if (featureKey !== "recipeStore") {
      incrementFeatureUsage(FEATURE_GATES[featureKey]?.key || featureKey);
    }

    return true;
  },

  triggerPaywall: (featureKey, gateResult) => {
    const result = gateResult || checkFeatureAccess(featureKey, get().tier);
    set({
      showPaywall: true,
      paywallFeature: featureKey,
      paywallGateResult: result,
    });
  },

  dismissPaywall: () => {
    set({ showPaywall: false, paywallFeature: null, paywallGateResult: null });
  },

  getUsage: (featureKey) => {
    const gate = FEATURE_GATES[featureKey];
    return gate ? getFeatureUsage(gate.key) : 0;
  },
}));
