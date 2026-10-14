"use client";

// Route guard + hydration for all authed screens.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useZynth } from "@/lib/store";
import { getLocalUser } from "@/lib/db";

export function useRequireProfile() {
  const router = useRouter();
  const { profile, hydrated, hydrate } = useZynth();

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const user = getLocalUser();
    if (!user) router.replace("/auth");
    else if (!profile) router.replace("/onboarding");
  }, [hydrated, profile, router]);

  return { profile, hydrated };
}
