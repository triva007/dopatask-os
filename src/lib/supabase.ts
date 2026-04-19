// src/lib/supabase.ts
// Client Supabase browser — V1 mono-user Aaron, RLS ouvert.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // On logge mais on ne throw pas — évite de casser le build si env manquant
  // (Sentry l'attrapera en runtime)
  // eslint-disable-next-line no-console
  console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL ou ANON_KEY manquant");
}

export const supabase = createClient(url || "http://localhost", anonKey || "anon", {
  auth: { persistSession: false },
});
