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

async function flushWrite() {
  if (pendingData === null) return;
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
  window.addEventListener("beforeunload", () => {
    if (pendingData !== null) {
      // Use sendBeacon or sync XHR as a last resort
      const payload = pendingData;
      pendingData = null;
      try {
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${ROW_ID}`;
        const body = JSON.stringify({ data: JSON.parse(payload), updated_at: new Date().toISOString() });
        navigator.sendBeacon?.(
          url,
          new Blob([body], { type: "application/json" })
        );
      } catch {}
    }
  });
}
