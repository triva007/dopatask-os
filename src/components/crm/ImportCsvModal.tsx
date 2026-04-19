"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import { X, Upload, Check } from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";

type Row = {
  entreprise: string;
  telephone?: string;
  gmb_url?: string;
  site_url?: string;
  notes?: string;
};

export default function ImportCsvModal({ onClose }: { onClose: () => void }) {
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<Row[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const importProspects = useCrmStore((s) => s.importProspects);

  const handleParse = (text: string) => {
    setRaw(text);
    if (!text.trim()) {
      setParsed([]);
      setErrors([]);
      return;
    }
    const res = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
    });
    const rows: Row[] = [];
    const errs: string[] = [];
    res.data.forEach((r, idx) => {
      const entreprise = (r.entreprise || r.company || r.nom || "").trim();
      if (!entreprise) {
        errs.push(`Ligne ${idx + 2} : entreprise manquante, ignorée`);
        return;
      }
      rows.push({
        entreprise,
        telephone: (r.telephone || r.tel || r.phone || "").trim() || undefined,
        gmb_url: (r.gmb_url || r.gmb || r.google_maps || "").trim() || undefined,
        site_url: (r.site_url || r.site || r.website || r.url || "").trim() || undefined,
        notes: (r.notes || r.note || "").trim() || undefined,
      });
    });
    setParsed(rows);
    setErrors(errs);
  };

  const onFile = async (file: File) => {
    const text = await file.text();
    handleParse(text);
  };

  const runImport = async () => {
    setImporting(true);
    const n = await importProspects(parsed);
    setDone(n);
    setImporting(false);
  };

  const preview = useMemo(() => parsed.slice(0, 5), [parsed]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 10 }}
          className="bg-surface-1 border border-surface-3 rounded-2xl shadow-elevated w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-3">
            <div className="flex items-center gap-2">
              <Upload size={16} className="text-dopa-cyan" />
              <h2 className="text-[15px] font-semibold">Importer des prospects (CSV)</h2>
            </div>
            <button onClick={onClose} className="text-t-tertiary hover:text-t-primary">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {done !== null ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-14 h-14 rounded-full bg-dopa-green/10 flex items-center justify-center">
                  <Check size={28} className="text-dopa-green" />
                </div>
                <p className="text-[15px] font-semibold">{done} prospects ajoutés</p>
                <button
                  onClick={onClose}
                  className="mt-2 px-4 py-2 bg-dopa-green/10 text-dopa-green rounded-lg text-[13px] font-semibold hover:bg-dopa-green/20"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-t-tertiary mb-2">
                    Colonnes attendues : entreprise, telephone, gmb_url, site_url, notes
                  </label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                    className="block w-full text-[13px] text-t-secondary file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[12px] file:font-semibold file:bg-dopa-cyan/10 file:text-dopa-cyan hover:file:bg-dopa-cyan/20 mb-3"
                  />
                  <textarea
                    value={raw}
                    onChange={(e) => handleParse(e.target.value)}
                    placeholder="...ou colle directement ton CSV ici"
                    className="w-full h-32 bg-surface-2 border border-surface-3 rounded-lg p-3 text-[12px] font-mono text-t-primary placeholder-t-tertiary focus:outline-none focus:border-dopa-cyan/50"
                  />
                </div>

                {parsed.length > 0 && (
                  <div>
                    <p className="text-[12px] text-t-secondary mb-2">
                      <span className="font-semibold text-t-primary">{parsed.length}</span> lignes valides.
                      {errors.length > 0 && (
                        <span className="text-dopa-red ml-2">
                          {errors.length} ignorée(s).
                        </span>
                      )}
                    </p>
                    <div className="bg-surface-2 border border-surface-3 rounded-lg overflow-hidden">
                      <table className="w-full text-[12px]">
                        <thead className="bg-surface-3">
                          <tr>
                            <th className="text-left px-3 py-2 font-semibold">Entreprise</th>
                            <th className="text-left px-3 py-2 font-semibold">Tél</th>
                            <th className="text-left px-3 py-2 font-semibold">GMB</th>
                            <th className="text-left px-3 py-2 font-semibold">Site</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((r, i) => (
                            <tr key={i} className="border-t border-surface-3">
                              <td className="px-3 py-2 text-t-primary">{r.entreprise}</td>
                              <td className="px-3 py-2 text-t-secondary">{r.telephone || "—"}</td>
                              <td className="px-3 py-2 text-t-secondary truncate max-w-[150px]">{r.gmb_url || "—"}</td>
                              <td className="px-3 py-2 text-t-secondary truncate max-w-[150px]">{r.site_url || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parsed.length > 5 && (
                        <div className="px-3 py-2 text-[11px] text-t-tertiary border-t border-surface-3 bg-surface-1">
                          ... et {parsed.length - 5} autres
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-surface-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-[13px] text-t-secondary hover:text-t-primary rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    disabled={parsed.length === 0 || importing}
                    onClick={runImport}
                    className="px-4 py-2 bg-dopa-cyan text-black text-[13px] font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-dopa-cyan/90"
                  >
                    {importing ? "Import..." : `Importer ${parsed.length} prospects`}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
