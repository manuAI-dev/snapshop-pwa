"use client";

import { create } from "zustand";
import { Household, HouseholdMember, HouseholdInvite, HouseholdProfile } from "@/types/household";
import { supabase } from "@/lib/supabase";

interface HouseholdStore {
  household: Household | null;
  members: HouseholdMember[];
  invites: HouseholdInvite[];
  isLoading: boolean;
  error: string | null;

  // Aktionen
  loadHousehold: () => Promise<void>;
  createHousehold: (name: string) => Promise<Household>;
  updateHouseholdName: (name: string) => Promise<void>;
  updateHouseholdProfile: (profile: Partial<HouseholdProfile>) => Promise<void>;
  deleteHousehold: () => Promise<void>;
  inviteByEmail: (email: string) => Promise<HouseholdInvite>;
  generateInviteLink: () => Promise<string>;
  joinByCode: (code: string) => Promise<void>;
  joinByToken: (token: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
  clearError: () => void;
}

// DB → App Type Converter
function dbToHousehold(row: any): Household {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    inviteCode: row.invite_code,
    createdAt: row.created_at,
    profile: {
      adults: row.adults ?? 2,
      children: row.children ?? 0,
      dietary: row.dietary ?? [],
      allergies: row.allergies ?? [],
      cookingTimeWeekday: row.cooking_time_weekday ?? 30,
      cookingTimeWeekend: row.cooking_time_weekend ?? 60,
    },
  };
}

function dbToMember(row: any): HouseholdMember {
  return {
    id: row.id,
    householdId: row.household_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
    name: row.profiles?.name || undefined,
    email: row.profiles?.email || undefined,
    profileImage: row.profiles?.profile_image || undefined,
  };
}

function dbToInvite(row: any): HouseholdInvite {
  return {
    id: row.id,
    householdId: row.household_id,
    email: row.email,
    invitedBy: row.invited_by,
    token: row.token,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export const useHouseholdStore = create<HouseholdStore>((set, get) => ({
  household: null,
  members: [],
  invites: [],
  isLoading: false,
  error: null,

  loadHousehold: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { set({ isLoading: false }); return; }

      // Finde Haushalt des Users über membership
      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id, role")
        .eq("user_id", user.id)
        .single();

      if (!membership) {
        // User hat keinen Haushalt
        set({ household: null, members: [], invites: [], isLoading: false });
        return;
      }

      // Haushalt laden
      const { data: householdRow } = await supabase
        .from("households")
        .select("*")
        .eq("id", membership.household_id)
        .single();

      if (!householdRow) {
        set({ household: null, members: [], invites: [], isLoading: false });
        return;
      }

      const household = dbToHousehold(householdRow);

      // Mitglieder laden (mit Profil-Daten)
      let memberRows: any[] = [];
      const { data: mWithProfiles, error: mErr } = await supabase
        .from("household_members")
        .select("*, profiles(name, email, profile_image)")
        .eq("household_id", household.id)
        .order("joined_at", { ascending: true });

      if (!mErr && mWithProfiles) {
        memberRows = mWithProfiles;
      } else {
        // Fallback: Mitglieder ohne Profil-Join laden
        console.warn("[loadHousehold] Profile join failed, loading without profiles:", mErr);
        const { data: mBasic } = await supabase
          .from("household_members")
          .select("*")
          .eq("household_id", household.id)
          .order("joined_at", { ascending: true });
        memberRows = mBasic || [];
      }

      const members = memberRows.map(dbToMember);

      // Einladungen laden (nur pending)
      const { data: inviteRows } = await supabase
        .from("household_invites")
        .select("*")
        .eq("household_id", household.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      const invites = (inviteRows || []).map(dbToInvite);

      set({ household, members, invites, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createHousehold: async (name) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      // Prüfe ob User bereits in einem Haushalt ist
      const existing = get().household;
      if (existing) throw new Error("Du bist bereits in einem Haushalt");

      // Haushalt erstellen
      const { data: householdRow, error: hErr } = await supabase
        .from("households")
        .insert([{ name, owner_id: user.id }])
        .select()
        .single();

      if (hErr) throw hErr;

      // Owner als Mitglied hinzufügen
      const { error: mErr } = await supabase
        .from("household_members")
        .insert([{
          household_id: householdRow.id,
          user_id: user.id,
          role: "owner",
        }]);

      if (mErr) throw mErr;

      // Bestehende Daten dem Haushalt zuordnen
      await supabase.rpc("assign_user_data_to_household", {
        p_user_id: user.id,
        p_household_id: householdRow.id,
      });

      const household = dbToHousehold(householdRow);
      const members: HouseholdMember[] = [{
        id: "",
        householdId: household.id,
        userId: user.id,
        role: "owner",
        joinedAt: new Date().toISOString(),
        name: user.user_metadata?.name || "Du",
        email: user.email,
      }];

      set({ household, members, invites: [], isLoading: false });
      return household;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateHouseholdName: async (name) => {
    const hh = get().household;
    if (!hh) return;
    try {
      const { error } = await supabase
        .from("households")
        .update({ name })
        .eq("id", hh.id);
      if (error) throw error;
      set({ household: { ...hh, name } });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateHouseholdProfile: async (profile) => {
    const hh = get().household;
    if (!hh) return;

    // Optimistic update
    const oldProfile = hh.profile;
    const newProfile = { ...oldProfile, ...profile };
    set({ household: { ...hh, profile: newProfile } });

    try {
      const dbUpdates: any = {};
      if (profile.adults !== undefined) dbUpdates.adults = profile.adults;
      if (profile.children !== undefined) dbUpdates.children = profile.children;
      if (profile.dietary !== undefined) dbUpdates.dietary = profile.dietary;
      if (profile.allergies !== undefined) dbUpdates.allergies = profile.allergies;
      if (profile.cookingTimeWeekday !== undefined) dbUpdates.cooking_time_weekday = profile.cookingTimeWeekday;
      if (profile.cookingTimeWeekend !== undefined) dbUpdates.cooking_time_weekend = profile.cookingTimeWeekend;

      const { error } = await supabase
        .from("households")
        .update(dbUpdates)
        .eq("id", hh.id);

      if (error) throw error;
    } catch (err: any) {
      // Rollback
      set({ household: { ...hh, profile: oldProfile }, error: err.message });
    }
  },

  deleteHousehold: async () => {
    const hh = get().household;
    if (!hh) return;
    set({ isLoading: true });
    try {
      // Erst alle household_ids von Rezepten/Shopping entfernen
      await supabase.from("recipes").update({ household_id: null }).eq("household_id", hh.id);
      await supabase.from("shopping_items").update({ household_id: null }).eq("household_id", hh.id);

      const { error } = await supabase.from("households").delete().eq("id", hh.id);
      if (error) throw error;
      set({ household: null, members: [], invites: [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  inviteByEmail: async (email) => {
    const hh = get().household;
    if (!hh) throw new Error("Kein Haushalt vorhanden");
    set({ error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      const { data: inviteRow, error } = await supabase
        .from("household_invites")
        .insert([{
          household_id: hh.id,
          email: email.toLowerCase().trim(),
          invited_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      const invite = dbToInvite(inviteRow);
      set((state) => ({ invites: [invite, ...state.invites] }));
      return invite;
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  generateInviteLink: async () => {
    const hh = get().household;
    if (!hh) throw new Error("Kein Haushalt vorhanden");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      const { data: inviteRow, error } = await supabase
        .from("household_invites")
        .insert([{
          household_id: hh.id,
          invited_by: user.id,
          email: null, // Link-Einladung ohne E-Mail
        }])
        .select()
        .single();

      if (error) throw error;
      const invite = dbToInvite(inviteRow);
      set((state) => ({ invites: [invite, ...state.invites] }));

      // Link generieren
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      return `${baseUrl}/join?token=${invite.token}`;
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  joinByCode: async (code) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      if (get().household) throw new Error("Du bist bereits in einem Haushalt. Verlasse zuerst deinen aktuellen Haushalt.");

      // Haushalt über Code finden
      const { data: householdRow, error: hErr } = await supabase
        .from("households")
        .select("*")
        .eq("invite_code", code.trim().toLowerCase())
        .single();

      if (hErr || !householdRow) throw new Error("Ungültiger Einladungscode");

      // Mitglied hinzufügen
      const { error: mErr } = await supabase
        .from("household_members")
        .insert([{
          household_id: householdRow.id,
          user_id: user.id,
          role: "member",
        }]);

      if (mErr) {
        if (mErr.message?.includes("duplicate") || mErr.code === "23505") {
          throw new Error("Du bist bereits Mitglied dieses Haushalts");
        }
        throw mErr;
      }

      // Bestehende Daten zuordnen
      try {
        await supabase.rpc("assign_user_data_to_household", {
          p_user_id: user.id,
          p_household_id: householdRow.id,
        });
      } catch {} // Nicht kritisch

      await get().loadHousehold();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  joinByToken: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      if (get().household) throw new Error("Du bist bereits in einem Haushalt. Verlasse zuerst deinen aktuellen Haushalt.");

      // Einladung finden
      const { data: inviteRow, error: iErr } = await supabase
        .from("household_invites")
        .select("*")
        .eq("token", token)
        .eq("status", "pending")
        .single();

      if (iErr || !inviteRow) throw new Error("Ungültige oder abgelaufene Einladung");

      // Prüfe ob abgelaufen
      if (new Date(inviteRow.expires_at) < new Date()) {
        await supabase.from("household_invites").update({ status: "expired" }).eq("id", inviteRow.id);
        throw new Error("Diese Einladung ist abgelaufen");
      }

      // Mitglied hinzufügen
      const { error: mErr } = await supabase
        .from("household_members")
        .insert([{
          household_id: inviteRow.household_id,
          user_id: user.id,
          role: "member",
        }]);

      if (mErr) {
        if (mErr.message?.includes("duplicate") || mErr.code === "23505") {
          throw new Error("Du bist bereits Mitglied dieses Haushalts");
        }
        throw mErr;
      }

      // Einladung als akzeptiert markieren
      await supabase
        .from("household_invites")
        .update({ status: "accepted" })
        .eq("id", inviteRow.id);

      // Bestehende Daten zuordnen
      try {
        await supabase.rpc("assign_user_data_to_household", {
          p_user_id: user.id,
          p_household_id: inviteRow.household_id,
        });
      } catch {} // Nicht kritisch

      await get().loadHousehold();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  removeMember: async (userId) => {
    const hh = get().household;
    if (!hh) return;
    try {
      // Daten des entfernten Users aus Haushalt lösen
      await supabase.from("recipes").update({ household_id: null }).eq("household_id", hh.id).eq("user_id", userId);
      await supabase.from("shopping_items").update({ household_id: null }).eq("household_id", hh.id).eq("user_id", userId);

      const { error } = await supabase
        .from("household_members")
        .delete()
        .eq("household_id", hh.id)
        .eq("user_id", userId);

      if (error) throw error;
      set((state) => ({ members: state.members.filter((m) => m.userId !== userId) }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  leaveHousehold: async () => {
    const hh = get().household;
    if (!hh) return;
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      if (hh.ownerId === user.id) {
        throw new Error("Als Owner kannst du den Haushalt nicht verlassen. Lösche ihn oder übertrage die Rolle.");
      }

      // Eigene Daten aus Haushalt lösen
      await supabase.from("recipes").update({ household_id: null }).eq("household_id", hh.id).eq("user_id", user.id);
      await supabase.from("shopping_items").update({ household_id: null }).eq("household_id", hh.id).eq("user_id", user.id);

      const { error } = await supabase
        .from("household_members")
        .delete()
        .eq("household_id", hh.id)
        .eq("user_id", user.id);

      if (error) throw error;
      set({ household: null, members: [], invites: [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
