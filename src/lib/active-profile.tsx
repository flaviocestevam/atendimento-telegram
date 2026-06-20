import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SellerProfile = {
  id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  status: string;
};

type Ctx = {
  profileId: string | null;
  profile: SellerProfile | null;
  profiles: SellerProfile[];
  setProfileId: (id: string) => void;
  loading: boolean;
  refetch: () => void;
};

const ActiveProfileCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "activeSellerProfileId";

export function ActiveProfileProvider({ children }: { children: ReactNode }) {
  const [profileId, setProfileIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });

  const q = useQuery({
    queryKey: ["seller_profiles_list"],
    queryFn: async (): Promise<SellerProfile[]> => {
      const { data, error } = await supabase
        .from("seller_profiles")
        .select("id, display_name, username, avatar_url, status")
        .order("display_name");
      if (error) throw error;
      return (data ?? []) as SellerProfile[];
    },
  });

  const profiles = q.data ?? [];

  // Auto-pick first profile when none selected or selected is gone
  useEffect(() => {
    if (!profiles.length) return;
    const exists = profileId && profiles.some((p) => p.id === profileId);
    if (!exists) {
      const next = profiles[0].id;
      setProfileIdState(next);
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, [profiles, profileId]);

  const setProfileId = useCallback((id: string) => {
    setProfileIdState(id);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const profile = profiles.find((p) => p.id === profileId) ?? null;

  return (
    <ActiveProfileCtx.Provider
      value={{ profileId, profile, profiles, setProfileId, loading: q.isLoading, refetch: q.refetch }}
    >
      {children}
    </ActiveProfileCtx.Provider>
  );
}

export function useActiveProfile() {
  const ctx = useContext(ActiveProfileCtx);
  if (!ctx) throw new Error("useActiveProfile must be used inside <ActiveProfileProvider>");
  return ctx;
}
