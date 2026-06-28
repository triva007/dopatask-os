"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

type Script = { id: string; title: string; desc: string; text: string };

const SCRIPTS: Script[] = [
  {
    id: "post",
    title: "Post groupe Facebook",
    desc: "À publier dans les groupes thérapeutes. Filtre « cabinet » + ville (visibilité locale).",
    text: "Bonjour à tous,\n\nJe cherche à collaborer avec un(e) thérapeute qui reçoit ses patients en cabinet et qui aimerait être parmi les premiers qu'on trouve sur Google dans sa ville — pour avoir plus de demandes de rendez-vous.\n\nJ'ai mis ce système en place pour ma mère, thérapeute de couple, et ça lui a bien rempli son agenda.\n\nJ'aimerais le refaire avec un praticien motivé et en faire une belle étude de cas.\n\nSi ça vous parle, dites-le en commentaire (ou écrivez-moi) et je reviens vers vous en privé avec un aperçu de ce que ça donnerait chez vous.",
  },
  {
    id: "dm",
    title: "Message d'entrée (DM)",
    desc: "Ton 1er message privé. Remplace [Prénom].",
    text: "Bonjour [Prénom], super, merci pour votre message !\n\nPour faire simple : je fais en sorte que quand quelqu'un cherche un thérapeute dans votre ville, ce soit vous qu'on trouve en premier sur Google — donc plus de demandes de patients. C'est ce qui a bien rempli l'agenda de ma mère, thérapeute de couple.\n\nLe mieux c'est qu'on s'appelle 10-15 min : je vous prépare un aperçu concret de ce que ça donnerait chez vous, et on en discute.\n\nPour être transparent : l'aperçu et l'appel sont offerts, le travail est une collaboration payante (tarif réduit, vu que j'en fais une étude de cas).\n\nDites-moi juste votre ville et votre spécialité (et le lien de votre site si vous en avez un). Pour l'appel, je suis dispo lundi à partir de 14h ou mardi dans la journée — qu'est-ce qui vous arrange ?",
  },
  {
    id: "comment",
    title: "Réponse publique (commentaire)",
    desc: "Sous le commentaire d'un intéressé, pour qu'il accepte ton invitation.",
    text: "Bonjour [Prénom], super 🙂 je viens de vous envoyer une invitation, acceptez-la et je vous explique tout en privé juste après.",
  },
  {
    id: "relance",
    title: "Relance (a réagi, pas répondu)",
    desc: "Pour les ❤️ / 👍 sans réponse texte.",
    text: "Rebonjour [Prénom] 🙂 je vois que mon message vous a parlé ! Dites-moi juste votre ville et votre spécialité, je vous prépare l'aperçu. Et pour l'appel, vous préférez lundi après-midi ou mardi ?",
  },
];

export default function ScriptsHub() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1600);
    } catch (_e) {}
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[900px] mx-auto px-10 py-8 space-y-6">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Scripts &amp; Messages</h1>
          <p className="text-[12.5px] text-t-tertiary mt-1">Tes textes de prospection, prêts à copier-coller.</p>
        </div>

        <div className="space-y-4">
          {SCRIPTS.map((s) => (
            <div key={s.id} className="rounded-2xl glass-card p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-[15px] font-bold text-t-primary">{s.title}</h2>
                  <p className="text-[12px] text-t-tertiary mt-0.5">{s.desc}</p>
                </div>
                <button
                  onClick={() => copy(s.id, s.text)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold transition-all"
                  style={copied === s.id ? { background: "var(--accent-green-light)", color: "var(--accent-green)" } : { background: "var(--accent-purple-light)", color: "var(--accent-purple)" }}
                >
                  {copied === s.id ? (<><Check size={14} /> Copié</>) : (<><Copy size={14} /> Copier</>)}
                </button>
              </div>
              <pre className="text-[12.5px] leading-relaxed whitespace-pre-wrap font-sans rounded-xl p-4" style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border-primary)" }}>{s.text}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
