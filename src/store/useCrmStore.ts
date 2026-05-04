// src/store/useCrmStore.ts
// Store Zustand pour le CRM : cache prospects/calls/revenus/config.
// Pas de persist — données source de vérité = Supabase.

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import type { Prospect, Call, Revenu, Config, Script, ResultatAppel } from "@/lib/crmTypes";
import { buildFeedbackLine, statutFromResultat, shouldArchive, resultatCompteMission } from "@/lib/crmLogic";
import { extractStatutFromNotes } from "@/lib/csvParser";
import { celebrate } from "@/lib/dopamineFeedback";
import { useAppStore } from "@/store/useAppStore";
import { getActiveProfileId } from "@/lib/supabaseStorage";

type CrmState = {
  prospects: Prospect[];
  calls: Call[];
  revenus: Revenu[];
  config: Config | null;
  scripts: Script[];
  loading: boolean;
  error: string | null;
  loaded: boolean;

  // actions
  loadAll: () => Promise<void>;
  createProspect: (data: Partial<Prospect> & { entreprise: string }) => Promise<Prospect | null>;
  updateProspect: (id: string, patch: Partial<Prospect>) => Promise<void>;
  importProspects: (rows: Array<Partial<Prospect> & { entreprise: string }>) => Promise<number>;
  logCall: (prospectId: string, resultat: ResultatAppel, notes?: string, rappelDate?: string, duree_s?: number) => Promise<void>;
  addRevenu: (prospectId: string | null, montant: number, notes?: string) => Promise<void>;
  updateConfig: (patch: Partial<Config>) => Promise<void>;
  repairProspectsFromNotes: () => Promise<{ fixed: number; scanned: number }>;
  deleteProspect: (id: string) => Promise<void>;
  bulkUpdateProspects: (ids: string[], patch: Partial<Prospect>) => Promise<number>;
  bulkDeleteProspects: (ids: string[]) => Promise<number>;
};

export const useCrmStore = create<CrmState>()(
  persist(
    (set, get) => ({
      prospects: [],
  calls: [],
  revenus: [],
  config: null,
  scripts: [],
  loading: false,
  error: null,
  loaded: false,

  loadAll: async () => {
    set({ loading: true, error: null });
    const userId = getActiveProfileId();
    if (userId === -1) return;

    try {
      const [pRes, cRes, rRes, cfRes, scRes] = await Promise.all([
        supabase.from("prospects").select("*").eq("app_user_id", userId).order("created_at", { ascending: false }),
        supabase.from("calls").select("*").eq("app_user_id", userId).order("date", { ascending: false }).limit(5000),
        supabase.from("revenus").select("*").eq("app_user_id", userId).order("date_signature", { ascending: false }),
        supabase.from("config").select("*").eq("id", 1).maybeSingle(),
        supabase.from("scripts").select("*").order("updated_at", { ascending: false }),
      ]);

      if (pRes.error) throw pRes.error;
      if (cRes.error) throw cRes.error;
      if (rRes.error) throw rRes.error;
      if (cfRes.error) throw cfRes.error;
      if (scRes.error) throw scRes.error;

      set({
        prospects: (pRes.data || []) as Prospect[],
        calls: (cRes.data || []) as Call[],
        revenus: (rRes.data || []) as Revenu[],
        config: (cfRes.data as Config) || null,
        scripts: (scRes.data || []) as Script[],
        loading: false,
        loaded: true,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ error: msg, loading: false });
    }
  },

  createProspect: async (data) => {
    const userId = getActiveProfileId();
    const { data: inserted, error } = await supabase
      .from("prospects")
      .insert({
        app_user_id: userId,
        entreprise: data.entreprise,
        telephone: data.telephone ?? null,
        gmb_url: data.gmb_url ?? null,
        site_url: data.site_url ?? null,
        notes: data.notes ?? null,
        statut: data.statut ?? "A_APPELER",
        niche: data.niche ?? "menuisiers_suisse",
      })
      .select("*")
      .single();
    if (error) {
      set({ error: error.message });
      return null;
    }
    set({ prospects: [inserted as Prospect, ...get().prospects] });
    return inserted as Prospect;
  },

  updateProspect: async (id, patch) => {
    const { data, error } = await supabase
      .from("prospects")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      set({ error: error.message });
      return;
    }
    set({
      prospects: get().prospects.map((p) => (p.id === id ? (data as Prospect) : p)),
    });
  },

  importProspects: async (rows) => {
    if (rows.length === 0) return 0;
    const userId = getActiveProfileId();
    const payload = rows.map((r) => ({
      app_user_id: userId,
      entreprise: r.entreprise,
      telephone: r.telephone ?? null,
      gmb_url: r.gmb_url ?? null,
      site_url: r.site_url ?? null,
      notes: r.notes ?? null,
      statut: r.statut ?? "A_APPELER",
      niche: r.niche ?? "menuisiers_suisse",
    }));
    const { data, error } = await supabase
      .from("prospects")
      .insert(payload)
      .select("*");
    if (error) {
      set({ error: error.message });
      return 0;
    }
    set({ prospects: [...((data || []) as Prospect[]), ...get().prospects] });
    return (data || []).length;
  },

  logCall: async (prospectId, resultat, notes, rappelDate, duree_s) => {
    const prospect = get().prospects.find((p) => p.id === prospectId);
    if (!prospect) return;
    const userId = getActiveProfileId();

    // 1. Insert call
    const { data: callRow, error: cErr } = await supabase
      .from("calls")
      .insert({
        app_user_id: userId,
        prospect_id: prospectId,
        resultat,
        notes: notes || null,
        compte_mission: resultatCompteMission(resultat),
        duree_s: duree_s || null,
      })
      .select("*")
      .single();
    if (cErr) {
      set({ error: cErr.message });
      return;
    }

    // 2. Update prospect : statut + feedback + archivage
    const newStatut = statutFromResultat(resultat, prospect.statut);
    const newFeedback = buildFeedbackLine({
      oldFeedback: prospect.feedback,
      resultat,
    });
    const archive = shouldArchive(newStatut);

    const patch: Partial<Prospect> = {
      statut: newStatut,
      feedback: newFeedback,
      archived: archive ? true : prospect.archived,
    };

    // Si note fournie → l'ajouter au champ notes du prospect (persistance)
    if (notes && notes.trim()) {
      const { formatDateFR } = await import("@/lib/crmLogic");
      const dateStr = formatDateFR(new Date());
      const noteEntry = `[${dateStr}] ${notes.trim()}`;
      const existing = prospect.notes ? prospect.notes.trim() : "";
      patch.notes = existing ? `${existing}\n${noteEntry}` : noteEntry;
    }

    // Si RAPPEL_PLUS_TARD → poser date_relance
    if (resultat === "RAPPEL_PLUS_TARD" && rappelDate) {
      patch.date_relance = rappelDate;
    }
    // Si répondeur simple, effacer date_relance préexistante (pas de date spécifique)
    if (resultat === "REPONDEUR") {
      patch.date_relance = null;
    }

    // Si RDV booké → on pose date_rdv à +3 jours ouvrés par défaut
    if (resultat === "RDV" && !prospect.date_rdv) {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      patch.date_rdv = d.toISOString().slice(0, 10);
    }

    await get().updateProspect(prospectId, patch);
    set({ calls: [callRow as Call, ...get().calls] });

    // 3. Si RDV → créer auto une tâche maquette dans DopaTask
    if (resultat === "RDV") {
      try {
        useAppStore.getState().addTask(
          `Maquette pour ${prospect.entreprise}`,
          "today",
          undefined,
          undefined,
          undefined,
          prospectId
        );
      } catch (e) {
        console.warn("addTask failed", e);
      }
    }

    // 4. Feedback dopamine
    if (resultat === "RDV") celebrate("critical");
    else celebrate("task-complete");
  },

  addRevenu: async (prospectId, montant, notes) => {
    const userId = getActiveProfileId();
    const { data, error } = await supabase
      .from("revenus")
      .insert({ app_user_id: userId, prospect_id: prospectId, montant, notes: notes || null })
      .select("*")
      .single();
    if (error) {
      set({ error: error.message });
      return;
    }
    set({ revenus: [data as Revenu, ...get().revenus] });
    // Si prospect fourni, le passer en VENDU
    if (prospectId) {
      await get().updateProspect(prospectId, { statut: "VENDU" });
    }
    celebrate("lucky-drop");
  },

  updateConfig: async (patch) => {
    const { data, error } = await supabase
      .from("config")
      .update(patch)
      .eq("id", 1)
      .select("*")
      .single();
    if (error) {
      set({ error: error.message });
      return;
    }
    set({ config: data as Config });
  },

  // Scan les prospects : si statut est defaut (A_APPELER) et notes commence
  // par un statut reconnu, on le deplace dans le champ statut et on nettoie la note.
  repairProspectsFromNotes: async () => {
    const list = get().prospects;
    let fixed = 0;
    for (const p of list) {
      if (p.statut !== "A_APPELER") continue;
      if (!p.notes) continue;
      const { statut, notes } = extractStatutFromNotes(p.notes);
      if (!statut) continue;
      const patch: Partial<Prospect> = { statut, notes };
      // Si statut deplace est terminal, on archive
      if (statut === "REFUS" || statut === "EXISTE_PAS" || statut === "PERDU") {
        patch.archived = true;
      }
      const { data, error } = await supabase
        .from("prospects")
        .update(patch)
        .eq("id", p.id)
        .select("*")
        .single();
      if (!error && data) {
        fixed += 1;
        set({
          prospects: get().prospects.map((x) => (x.id === p.id ? (data as Prospect) : x)),
        });
      }
    }
    return { fixed, scanned: list.length };
  },

  deleteProspect: async (id) => {
    const { error } = await supabase.from("prospects").delete().eq("id", id);
    if (error) {
      set({ error: error.message });
      return;
    }
    set({ prospects: get().prospects.filter((p) => p.id !== id) });
  },

  bulkUpdateProspects: async (ids, patch) => {
    if (ids.length === 0) return 0;
    const { data, error } = await supabase
      .from("prospects")
      .update(patch)
      .in("id", ids)
      .select("*");
    if (error) {
      set({ error: error.message });
      return 0;
    }
    const updated = (data || []) as Prospect[];
    const byId = new Map(updated.map((p) => [p.id, p]));
    set({
      prospects: get().prospects.map((p) => byId.get(p.id) || p),
    });
    return updated.length;
  },

  bulkDeleteProspects: async (ids) => {
    if (ids.length === 0) return 0;
    const { error } = await supabase.from("prospects").delete().in("id", ids);
    if (error) {
      set({ error: error.message });
      return 0;
    }
    const idSet = new Set(ids);
    set({
      prospects: get().prospects.filter((p) => !idSet.has(p.id)),
    });
    return ids.length;
  },
    }),
    {
      name: "dopatask-crm-storage",
      partialize: (state) => ({ prospects: state.prospects, calls: state.calls, revenus: state.revenus, config: state.config, scripts: state.scripts }),
    }
  )
);
