"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import type { User as SupabaseUser } from "@supabase/supabase-js";

export function useHeaderUser() {
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return user;
}
