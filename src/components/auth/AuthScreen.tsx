"use client";

import { useState } from "react";
import { User, Lock, ArrowRight, UserPlus, LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";

async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function AuthScreen({ onLogin }: { onLogin: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const hashedPassword = await hashPassword(password);

      if (isLogin) {
        // LOGIN
        const { data, error } = await supabase
          .from("app_users")
          .select("id")
          .eq("username", username)
          .eq("password", hashedPassword)
          .single();

        if (error || !data) {
          setError("Nom d'utilisateur ou mot de passe incorrect.");
        } else {
          localStorage.setItem("dopatask_user_id", data.id.toString());
          onLogin();
        }
      } else {
        // SIGNUP
        // 1. Check if username exists
        const { data: existingUser } = await supabase
          .from("app_users")
          .select("id")
          .eq("username", username)
          .maybeSingle();

        if (existingUser) {
          setError("Ce nom d'utilisateur est déjà pris.");
          setLoading(false);
          return;
        }

        // 2. Astuce pour Aaron : Le tout premier compte créé obtiendra l'ID 1
        // (qui correspond aux données existantes de l'app). Les suivants (le frère) auront ID 2, 3...
        const { count } = await supabase
          .from("app_users")
          .select("*", { count: "exact", head: true });

        const payload: any = { username, password: hashedPassword };
        if (count === 0) {
          payload.id = 1; // Force ID 1 pour récupérer les anciennes données
        }

        const { data: newUser, error: insertError } = await supabase
          .from("app_users")
          .insert(payload)
          .select("id")
          .single();

        if (insertError) {
          setError("Erreur lors de la création du compte.");
          console.error(insertError);
        } else if (newUser) {
          localStorage.setItem("dopatask_user_id", newUser.id.toString());
          onLogin();
        }
      }
    } catch (err) {
      console.error(err);
      setError("Une erreur inattendue s'est produite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-0)] p-4 font-sans">
      <div className="max-w-md w-full bg-[var(--surface-1)] p-8 rounded-3xl border border-[var(--border-subtle)] shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            {isLogin ? <LogIn size={32} /> : <UserPlus size={32} />}
          </div>
          <h1 className="text-2xl font-bold mb-2 text-[var(--t-primary)]">
            {isLogin ? "Bon retour !" : "Créer un compte"}
          </h1>
          <p className="text-[var(--t-secondary)] text-sm">
            {isLogin
              ? "Connectez-vous pour accéder à votre espace."
              : "Créez votre propre espace de travail indépendant."}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--t-secondary)] mb-1.5 ml-1">
              Nom d'utilisateur
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--t-secondary)]">
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--t-primary)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
                placeholder="Ex: Aaron"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--t-secondary)] mb-1.5 ml-1">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--t-secondary)]">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--t-primary)] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[var(--brand-primary)] text-white font-medium hover:bg-[var(--brand-primary)]/90 transition-colors mt-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isLogin ? "Se connecter" : "S'inscrire"}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[var(--t-secondary)] text-sm">
            {isLogin ? "Pas encore de compte ?" : "Vous avez déjà un compte ?"}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="mt-2 text-[var(--brand-primary)] font-medium hover:underline"
          >
            {isLogin ? "Créer un compte maintenant" : "Connectez-vous ici"}
          </button>
        </div>
      </div>
    </div>
  );
}
