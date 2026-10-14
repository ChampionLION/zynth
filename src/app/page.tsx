"use client";

// SPLASH — 1.8s auto-advance → auth check

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Particles } from "@/components/effects";
import { getLocalUser, loadProfile } from "@/lib/db";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(async () => {
      const user = getLocalUser();
      if (!user) return router.replace("/auth");
      const profile = await loadProfile(user.id);
      router.replace(profile ? "/dashboard" : "/onboarding");
    }, 1800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main
      className="relative flex min-h-dvh flex-col items-center justify-center"
      style={{ background: "#0A0A0F" }}
    >
      <Particles count={5} />
      <motion.h1
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-6xl font-bold tracking-[0.3em] text-amber"
      >
        ZYNTH
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mt-4 text-sm text-muted"
      >
        Synthesize yourself. Reach your zenith.
      </motion.p>
    </main>
  );
}
