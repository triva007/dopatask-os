// src/lib/supabaseStorage.ts
// Zustand persist storage adapter backed by Supabase (table app_state).
// Mono-user: single row id=1, full state stored as JSONB.
// Writes are debounced to avoid hammering the DB.

import { type StateStorage } from "zustand/middleware";
import { supabase } from "./supabase";

const TABLE = "app_state";
const ROW_ID = 1;
const DEBOUNCE_MS = 1500; // write at most every 1.5s

let writeTimer: ReturnType<typeof setTimeout> | null = null;
let pendingData: string | null = null;
let flushInFlight = false;

async function flushWrite() {
  if (pendingData === null || flushInFlight) return;
  flushInFlight = true;
  const payload = pendingData;
  pendingData = null;
  try {
    await supabase
      .from(TABLE)
      .upsert(
        { id: ROW_ID, data: JSON.parse(payload), updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
  } catch (e) {
    console.error("[supabaseStorage] write failed:", e);
    pendingData = payload;
  } finally {
    flushInFlight = false;
  }
}

export const supabaseStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("data")
        .eq("id", ROW_ID)
        .maybeSingle();

      if (error) {
        console.error("[supabaseStorage] read error:", error);
        // Fallback to localStorage if Supabase fails
        if (typeof window !== "undefined") {
          return localStorage.getItem(name);
        }
        return null;
      }

      if (!data || !data.data || Object.keys(data.data).length === 0) {
        // No data in Supabase yet — try migrating from localStorage
        if (typeof window !== "undefined") {
          const local = localStorage.getItem(name);
          if (local) {
            console.info("[supabaseStorage] Migrating localStorage → Supabase");
            // Write to Supabase for future use
            try {
              await supabase
                .from(TABLE)
                .upsert(
                  { id: ROW_ID, data: JSON.parse(local), updated_at: new Date().toISOString() },
                  { onConflict: "id" }
                );
            } catch {}
            return local;
          }
        }
        return null;
      }

      // Return as stringified JSON (Zustand persist expects a string)
      return JSON.stringify(data.data);
    } catch (e) {
      console.error("[supabaseStorage] getItem exception:", e);
      // Fallback
      if (typeof window !== "undefined") {
        return localStorage.getItem(name);
      }
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    // Also write to localStorage as fast local cache
    if (typeof window !== "undefined") {
      try { localStorage.setItem(name, value); } catch {}
    }

    // Debounced write to Supabase
    pendingData = value;
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(() => {
      writeTimer = null;
      flushWrite();
    }, DEBOUNCE_MS);
  },

  removeItem: async (name: string): Promise<void> => {
    if (typeof window !== "undefined") {
      try { localStorage.removeItem(name); } catch {}
    }
    try {
      await supabase
        .from(TABLE)
        .update({ data: {}, updated_at: new Date().toISOString() })
        .eq("id", ROW_ID);
    } catch (e) {
      console.error("[supabaseStorage] removeItem error:", e);
    }
  },
};

// Flush pending writes before the page unloads
if (typeof window !== "undefined") {
  const flushWithKeepAlive = () => {
    if (pendingData === null) return;
    const payload = pendingData;
    pendingData = null;
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !anonKey) return;

      const url = `${supabaseUrl}/rest/v1/${TABLE}?id=eq.${ROW_ID}`;
      const body = JSON.stringify({ data: JSON.parse(payload), updated_at: new Date().toISOString() });
      void fetch(url, {
        method: "PATCH",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Prefer: "return=minimal",
        },
        body,
      });
    } catch (e) {
      console.error("[supabaseStorage] keepalive flush failed:", e);
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushWithKeepAlive();
  });

  window.addEventListener("beforeunload", () => {
    flushWithKeepAlive();
  });
}
