"use client";

import { create } from "zustand";
import { User, AuthState } from "@/types";
import { supabase } from "@/lib/supabase";

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Login failed");

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      const user: User = {
        id: data.user.id,
        name: profile?.name || "User",
        email: data.user.email || email,
        profilePicture: profile?.profile_image || undefined,
        createdAt: data.user.created_at,
      };
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const msg = err?.message?.includes("Invalid login")
        ? "E-Mail oder Passwort falsch"
        : err?.message || "Login fehlgeschlagen";
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Registration failed");

      // If email confirmation is enabled, session will be null
      if (!data.session) {
        set({ isLoading: false, error: null });
        throw new Error("CONFIRM_EMAIL");
      }

      const user: User = {
        id: data.user.id,
        name,
        email,
        createdAt: data.user.created_at,
      };
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      if (err?.message === "CONFIRM_EMAIL") {
        set({ isLoading: false });
        throw err;
      }
      const msg = err?.message?.includes("already registered")
        ? "Diese E-Mail ist bereits registriert"
        : err?.message || "Registrierung fehlgeschlagen";
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        const user: User = {
          id: session.user.id,
          name: profile?.name || "User",
          email: session.user.email || "",
          profilePicture: profile?.profile_image || undefined,
          createdAt: session.user.created_at,
        };
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
