"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, CheckCircle2, RefreshCw, Unplug, Loader2, AlertCircle } from "lucide-react";
import { syncAll } from "@/lib/googleSync";
import { useAppStore } from "@/store/useAppStore";

interface Status {
  connected: boolean;
  email: string | null;
}

export default function GoogleSyncSection() {
  const [status, setStatus]     = useState<Status>({ connected: false, email: null });
  const [loading, setLoading]   = useState(true);
  const [syncing, setSyncing]   = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const addToast = useAppStore((s) => s.addToast);

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/google/status", { cache: "no-store" });
      const data = (await r.json()) as Status;
      setStatus(data);
    } catch {
      setStatus({ connected: false, email: null });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConnect = () => {
    window.location.href = "/api/google/auth";
  };

  const handleDisconnect = async () => {
    await fetch("/api/google/disconnect", { method: "POST" });
    setStatus({ connected: false, email: null });
    addToast("Google deconnecte", "info");
  };

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const result = await syncAll();
      const total =
        result.tasks.pulled +
        result.tasks.pushed +
        result.tasks.updated +
        result.calendar.pulled +
        result.calendar.pushed;
      setLastSync(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
      if (total === 0) {
        addToast("Tout est deja a jour", "info");
      } else {
        const imported = result.tasks.pulled + result.calendar.pulled;
        const sent     = result.tasks.pushed + result.calendar.pushed;
        addToast(
          "Sync OK - " + imported + " importes, " + sent + " envoyes, " + result.tasks.updated + " mis a jour",
          "success"
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "erreur inconnue";
      if (msg === "UNAUTHENTICATED") {
        setError("Session Google expiree. Reconnecte-toi.");
        setStatus({ connected: false, email: null });
      } else {
        setError(msg);
        addToast("Erreur de sync", "error");
      }
    } finally {
      setSyncing(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "connected") {
      addToast("Google connecte ! Premiere sync...", "success");
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => { handleSync(); }, 800);
    }
    if (params.get("google") === "error") {
      const reason = params.get("reason") || "inconnue";
      setError("Connexion refusee : " + reason);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchStatus, addToast, handleSync]);

  useEffect(() => {
    if (!autoSync || !status.connected) return;
    const interval = setInterval(() => { handleSync(); }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoSync, status.connected, handleSync]);

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-widest px-1">
        Google - Calendar et Tasks
      </p>

      <div className="rounded-3xl bg-surface border border-b-primary p-5 space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b border-b-primary">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--accent-blue)12" }}>
            <Calendar size={15} style={{ color: "var(--accent-blue)" }} />
          </div>
          <div className="flex-1">
            <p className="text-[13.5px] font-semibold text-[var(--text-primary)]">Sync Google</p>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {loading
                ? "Chargement..."
                : status.connected
                  ? "Connecte - " + (status.email || "compte Google")
                  : "Non connecte"}
            </p>
          </div>
          {status.connected && (
            <CheckCircle2 size={16} className="text-accent-green shrink-0" />
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--accent-red-light)] text-[var(--accent-red)] text-[12px]">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!status.connected ? (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-accent-blue text-white rounded-xl text-[13.5px] font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
          >
            <Calendar size={15} />
            Connecter mon compte Google
          </button>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-blue text-white rounded-xl text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {syncing ? "Sync en cours..." : "Synchroniser"}
              </button>
              <button
                onClick={handleDisconnect}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-empty-bg text-[var(--text-primary)] rounded-xl text-[13px] font-semibold hover:bg-[var(--surface-2)] transition-all"
              >
                <Unplug size={14} />
                Deconnecter
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-b-primary">
              <div>
                <p className="text-[12.5px] text-[var(--text-primary)]">Sync auto (5 min)</p>
                <p className="text-[10.5px] text-[var(--text-secondary)] mt-0.5">
                  {lastSync ? "Derniere sync : " + lastSync : "Pas encore synchronise"}
                </p>
              </div>
              <button
                onClick={() => setAutoSync(!autoSync)}
                className={"w-11 h-6 rounded-full transition-all flex items-center p-0.5 " + (autoSync ? "bg-accent-blue" : "bg-empty-bg")}
              >
                <div className={"w-5 h-5 bg-white rounded-full transition-all " + (autoSync ? "translate-x-5" : "")} />
              </button>
            </div>

            <p className="text-[10.5px] text-[var(--text-secondary)] leading-relaxed">
              Tes tasks Google sont importees dans DopaTask. Les events Google apparaissent dans la timeline. Modifications synchro dans les deux sens.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
