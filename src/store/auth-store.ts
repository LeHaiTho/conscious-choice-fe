import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session, User } from "@supabase/supabase-js";

export interface AdminProfile {
  id: string;
  full_name: string;
  role: "super_admin" | "admin" | "content_editor" | "content_reviewer";
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: AdminProfile | null;
  isAuthenticated: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: AdminProfile | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      profile: null,
      isAuthenticated: false,
      setSession: (session) =>
        set({
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session,
        }),
      setProfile: (profile) => set({ profile }),
      logout: () =>
        set({
          session: null,
          user: null,
          profile: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "conscious-choice-auth",
    }
  )
);
