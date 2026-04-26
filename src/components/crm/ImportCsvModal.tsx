"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import { X, Upload, Check, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import { mapRow, normalizeHeader, detectSeparator, type MappedRow } from "@/lib/csvParser";
import { STATUT_LABEL } from "@/lib/crmLabels";
import StatutBadge from "./StatutBadge";

export default function ImportCsvModal({ onClose }: { onClose: () => void }) {
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<MappedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const importProspects = useCrmStore((s) => s.importProspects);

  const handleParse = (text: string) => {
    setRaw(text);
    if (!text.trim()) {
      setParsed([]);
      setErrors([]);
      setHeaders([]);
      return;
    }
    const separator = detectSeparator(text);
    const res = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      delimiter: separator,
      transformHeader: (h) => normalizeHeader(h),
    });
    const rows: MappedRow[] = [];
    const errs: string[] = [];
    res.data.forEach((r, idx) => {
      const mapped = mapRow(r);
      if (!mapped) {
        errs.push(`Ligne ${idx + 2} : entreprise manquante, ignoree`);
        return;
      }
      rows.push(mapped);
    });
    setHeaders(res.meta.fields || []);
    setParsed(rows);
    setErrors(errs);
  };

  const onFile = async (file: File) => {
    const text = await file.text();
    handleParse(text);
  };

  const runImport = async () => {
    setImporting(true);
    const toImport = parsed.map(p => ({ ...p, statut: p.statut || undefined }));
    const n = await importProspects(toImport);
    setDone(n);
    setImporting(false);
  };

  const preview = useMemo(() => parsed.slice(0, 8), [parsed]);
  const statutDetectes = useMemo(
    () => parsed.filter((p) => p.statut !== null).length,
    [parsed]
  );

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
          className="bg-surface-1 border border-surface-3 rounded-2xl shadow-elevated w-full max-w-4xl max-h-[88vh] overflow-hidden flex flex-col"
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
                <p className="text-[15px] font-semibold">{done} prospects ajoutes</p>
                {statutDetectes > 0 && (
                  <p className="text-[12px] text-t-secondary">
                    {statutDetectes} avec statut detecte automatiquement.
                  </p>
                )}
                <button
                  onClick={onClose}
                  className="mt-2 px-4 py-2 bg-dopa-green/10 text-dopa-green rounded-lg text-[13px] font-semibold hover:bg-dopa-green/20"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                <div className="rounded-lg bg-surface-2/60 border border-surface-3 p-3 text-[11.5px] text-t-secondary leading-relaxed">
                  <p className="font-semibold text-t-primary mb-1 flex items-center gap-1.5">
                    <FileSpreadsheet size={13} /> Colonnes reconnues (ordre libre, insensible accents)
                  </p>
                  <p><strong className="text-t-primary">Requis :</strong> entreprise (ou company, nom, raison_sociale)</p>
                  <p><strong className="text-t-primary">Optionnels :</strong> telephone, gmb_url, site_url, notes, <strong className="text-dopa-cyan">statut</strong>, niche</p>
                  <p className="text-t-tertiary mt-1">
                    Si la colonne <strong>statut</strong> est presente, elle est detectee automatiquement.
                    Sinon, si la note commence par un statut (ex: &quot;RDV Booke - Rappeler mardi&quot;), il est extrait sans polluer les notes.
                  </p>
                </div>

                <div>
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

                {headers.length > 0 && (
                  <div className="text-[11px] text-t-tertiary">
                    Colonnes detectees : <span className="font-mono text-t-secondary">{headers.join(", ")}</span>
                  </div>
                )}

                {parsed.length > 0 && (
                  <div>
                    <div className="flex items-center gap-4 text-[12px] text-t-secondary mb-2">
                      <span>
                        <span className="font-semibold text-t-primary">{parsed.length}</span> lignes valides
                      </span>
                      {statutDetectes > 0 && (
                        <span className="text-dopa-cyan">
                          {statutDetectes} avec statut detecte
                        </span>
                      )}
                      {errors.length > 0 && (
                        <span className="text-dopa-red inline-flex items-center gap-1">
                          <AlertTriangle size={11} /> {errors.length} ignoree(s)
                        </span>
                      )}
                    </div>
                    <div className="bg-surface-2 border border-surface-3 rounded-lg overflow-hidden">
                      <table className="w-full text-[12px]">
                        <thead className="bg-surface-3">
                          <tr>
                            <th className="text-left px-3 py-2 font-semibold">Entreprise</th>
                            <th className="text-left px-3 py-2 font-semibold">Telephone</th>
                            <th className="text-left px-3 py-2 font-semibold">Statut</th>
                            <th className="text-left px-3 py-2 font-semibold">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((r, i) => (
                            <tr key={i} className="border-t border-surface-3">
                              <td className="px-3 py-2 text-t-primary font-medium">{r.entreprise}</td>
                              <td className="px-3 py-2 text-t-secondary tabular-nums">{r.telephone || "-"}</td>
                              <td className="px-3 py-2">
                                {r.statut ? (
                                  <StatutBadge statut={r.statut} compact />
                                ) : (
                                  <span className="text-t-tertiary text-[11px]">{STATUT_LABEL.A_APPELER}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-t-tertiary truncate max-w-[240px]" title={r.notes || ""}>
                                {r.notes || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parsed.length > preview.length && (
                        <div className="px-3 py-2 text-[11px] text-t-tertiary border-t border-surface-3 bg-surface-1">
                          ... et {parsed.length - preview.length} autres
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
