"use client";

import { useState, useEffect } from "react";
import { User, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Profile {
  id: number;
  name: string;
}

export default function ProfileSelect({ onProfileSelected }: { onProfileSelected: () => void }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProfileName, setNewProfileName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("app_profiles").select("*").order("created_at", { ascending: true });
      if (!error && data) {
        setProfiles(data);
      }
    } catch (e) {
      console.error("Failed to fetch profiles", e);
    } finally {
      setLoading(false);
    }
  };

  const selectProfile = (id: number) => {
    localStorage.setItem("dopatask_active_profile_id", id.toString());
    onProfileSelected();
  };

  const createProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    
    // Generate a unique numeric ID based on timestamp
    const newId = Math.floor(Date.now() / 1000);
    
    try {
      await supabase.from("app_profiles").insert({ id: newId, name: newProfileName });
      selectProfile(newId);
    } catch (e) {
      console.error("Failed to create profile", e);
      // Fallback if the table doesn't exist yet (before migration)
      selectProfile(newId);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-0)] p-4 font-sans">
      <div className="max-w-md w-full bg-[var(--surface-1)] p-8 rounded-3xl border border-[var(--border-subtle)] shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Bienvenue sur l'App</h1>
          <p className="text-[var(--t-secondary)] text-sm">Sélectionnez votre profil pour continuer</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3">
              {profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => selectProfile(p.id)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)]">
                    <User size={20} />
                  </div>
                  <span className="font-medium flex-1 text-[var(--t-primary)]">{p.name}</span>
                </button>
              ))}
            </div>

            {isCreating ? (
              <form onSubmit={createProfile} className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
                <input
                  type="text"
                  placeholder="Nom du profil (ex: Frère)"
                  value={newProfileName}
                  onChange={e => setNewProfileName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--t-primary)] mb-3 focus:outline-none focus:border-[var(--brand-primary)]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsCreating(false)} className="flex-1 p-3 rounded-xl hover:bg-[var(--surface-3)] text-[var(--t-primary)] font-medium">Annuler</button>
                  <button type="submit" className="flex-1 p-3 rounded-xl bg-[var(--brand-primary)] text-white font-medium">Créer</button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-[var(--border-subtle)] hover:bg-[var(--surface-2)] transition-colors text-[var(--t-secondary)] mt-6"
              >
                <Plus size={18} />
                <span className="font-medium">Créer un compte</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
