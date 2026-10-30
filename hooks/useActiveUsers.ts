"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

/**
 * Tracks the number of active users on the site using Supabase Realtime Presence.
 * Each browser tab that loads this hook joins the "site_presence" channel with a
 * random session key. The count reflects all currently connected sessions.
 *
 * Falls back to null when Supabase is not configured (dev / offline mode).
 */
export function useActiveUsers(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    // Unique key for this browser tab session
    const sessionKey = Math.random().toString(36).slice(2);

    const channel = supabase.channel("site_presence", {
      config: { presence: { key: sessionKey } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        // Each key in presenceState is one connected session
        setCount(Object.keys(state).length);
      })
      .on("presence", { event: "join" }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .on("presence", { event: "leave" }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.untrack().then(() => supabase!.removeChannel(channel));
    };
  }, []);

  return count;
}
