"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Check, Star, ChevronDown, ArrowRight, Play, Briefcase, Building, Zap } from "lucide-react";
import { useState } from "react";

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="bg-surface-1 border border-b-primary rounded-2xl p-6 flex flex-col items-start gap-4 hover:border-accent-blue/50 transition-colors shadow-card"
  >
    <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-semibold text-t-primary">{title}</h3>
    <p className="text-t-secondary leading-relaxed">{description}</p>
  </motion.div>
);

const PricingCard = ({ title, price, features, recommended = false, icon: Icon }: any) => (
  <motion.div
    whileHover={{ y: -8 }}
    className={`relative rounded-3xl p-8 flex flex-col gap-6 ${
      recommended
        ? "bg-gradient-to-b from-surface-2 to-surface-1 border-2 border-accent-blue shadow-glow-cyan"
        : "bg-surface-1 border border-b-primary"
    }`}
  >
    {recommended && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent-blue text-white px-4 py-1 rounded-full text-sm font-semibold tracking-wide">
        Le plus populaire
      </div>
    )}
    
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${recommended ? 'bg-accent-blue/20 text-accent-blue' : 'bg-surface-2 text-t-secondary'}`}>
        <Icon size={24} />
      </div>
      <h3 className="text-2xl font-bold text-t-primary">{title}</h3>
    </div>
    
    <div className="flex items-baseline gap-1">
      <span className="text-4xl font-black text-t-primary">{price}</span>
      <span className="text-t-secondary">/mois</span>
    </div>
    
    <ul className="flex flex-col gap-3 flex-1">
      {features.map((feature: string, i: number) => (
        <li key={i} className="flex items-center gap-3 text-t-secondary">
          <Check size={18} className="text-accent-blue shrink-0" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    
    <button className={`w-full py-3 rounded-xl font-semibold transition-all ${
      recommended 
        ? "bg-accent-blue text-white hover:bg-accent-blue/90 shadow-lg shadow-accent-blue/25" 
        : "bg-surface-2 text-t-primary hover:bg-surface-3"
    }`}>
      Commencer l'essai
    </button>
  </motion.div>
);

const FAQItem = ({ question, answer }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-b-primary py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between text-left py-2 focus:outline-none"
      >
        <span className="text-lg font-medium text-t-primary">{question}</span>
        <ChevronDown size={20} className={`text-t-secondary transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        className="overflow-hidden"
      >
        <p className="text-t-secondary pt-4 pb-2">{answer}</p>
      </motion.div>
    </div>
  );
};

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <div className="min-h-screen bg-[#06080D] text-white selection:bg-accent-blue/30 font-sans overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-blue/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-purple/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#06080D]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-glow-cyan">
              <Zap size={18} className="text-white" />
            </div>
            <span>Aaron-OS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm font-medium text-white/70 hover:text-white transition-colors hidden md:block">
              Se connecter
            </a>
            <button className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-white/90 transition-colors">
              Essai gratuit
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-40 pb-20 px-6 max-w-5xl mx-auto text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm font-medium mb-8"
          >
            <Sparkles size={14} />
            <span>Nouveau : L'IA gère vos tâches</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Organisez votre vie. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-accent-purple to-accent-blue animate-gradient">
              Atteignez vos objectifs.
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            L'espace de travail conçu pour les cerveaux hyperactifs. Combinez tâches, CRM, calendrier et notes dans une interface calme et minimaliste.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-accent-blue text-white font-semibold text-lg hover:bg-accent-blue/90 shadow-[0_0_40px_rgba(34,211,238,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(34,211,238,0.6)] flex items-center justify-center gap-2">
              Commencer l'essai gratuit <ArrowRight size={20} />
            </button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex items-center gap-8 mt-10 text-sm text-white/50"
          >
            <div className="flex items-center gap-2"><Check size={16} className="text-accent-blue" /> Pas de carte requise</div>
            <div className="flex items-center gap-2"><Check size={16} className="text-accent-blue" /> 14 jours d'essai</div>
            <div className="flex items-center gap-2"><Check size={16} className="text-accent-blue" /> Annulation libre</div>
          </motion.div>
        </section>

        {/* Mockup Showcase */}
        <section className="py-10 px-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative rounded-[2rem] border border-white/10 bg-[#0A0C14]/80 backdrop-blur-xl p-2 md:p-4 shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#06080D] via-transparent to-transparent z-10" />
            <div className="rounded-[1.5rem] overflow-hidden border border-white/5 bg-[#0D0F18]">
              {/* Fake App Header */}
              <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
              </div>
              {/* Fake App Content */}
              <div className="p-6 md:p-10 flex flex-col gap-6 opacity-80">
                <div className="flex items-center justify-between">
                  <div className="w-48 h-8 rounded-lg bg-white/5" />
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5" />
                    <div className="w-24 h-8 rounded-lg bg-accent-blue/20" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="h-64 rounded-xl bg-white/5 border border-white/5" />
                  <div className="md:col-span-2 h-64 rounded-xl bg-white/5 border border-white/5" />
                </div>
                <div className="h-40 rounded-xl bg-white/5 border border-white/5" />
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features / Value Prop */}
        <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Multipliez vos revenus. Scalez votre business.</h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Une suite d'outils pensée pour réduire la friction et maximiser votre productivité, sans distraction.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Zap}
              title="Gestion des Tâches Rapide"
              description="Créez, organisez et priorisez vos tâches à la vitesse de la pensée. Interface fluide et raccourcis clavier."
              delay={0.1}
            />
            <FeatureCard 
              icon={Briefcase}
              title="CRM Intégré"
              description="Suivez vos prospects, de la première touche à la signature, directement depuis votre espace de travail."
              delay={0.2}
            />
            <FeatureCard 
              icon={Building}
              title="Projets & Objectifs"
              description="Décomposez vos grands projets en étapes actionnables. Ne perdez plus jamais de vue la vision globale."
              delay={0.3}
            />
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 px-6 max-w-6xl mx-auto relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[400px] bg-accent-blue/10 blur-[150px] rounded-full pointer-events-none" />
          
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Des plans adaptés à votre activité.</h2>
            <p className="text-white/60 text-lg">Commencez gratuitement, évoluez selon vos besoins.</p>
            
            <div className="inline-flex items-center gap-2 p-1 bg-white/5 rounded-full mt-8 border border-white/10">
              <button className="px-6 py-2 rounded-full bg-white text-black font-medium text-sm">Mensuel</button>
              <button className="px-6 py-2 rounded-full text-white/60 font-medium text-sm hover:text-white transition-colors">Annuel <span className="text-accent-blue ml-1">-20%</span></button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <PricingCard 
              icon={Play}
              title="Play"
              price="0€"
              features={[
                "Jusqu'à 3 projets",
                "Gestion des tâches basique",
                "Calendrier intégré",
                "Support communautaire"
              ]}
            />
            <PricingCard 
              icon={Zap}
              title="Business"
              price="29€"
              recommended={true}
              features={[
                "Projets illimités",
                "CRM complet",
                "Analyses avancées",
                "Mode focus",
                "Support prioritaire"
              ]}
            />
            <PricingCard 
              icon={Building}
              title="Agency"
              price="99€"
              features={[
                "Multi-utilisateurs",
                "Espaces de travail séparés",
                "Marque blanche",
                "API Accès",
                "Account Manager dédié"
              ]}
            />
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 px-6 bg-white/5 border-y border-white/5 relative overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center">Ils développent leur activité avec Aaron-OS.</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: "Julien M.", role: "Freelance UI/UX", text: "Depuis que j'utilise Aaron-OS, j'ai l'impression d'avoir regagné 2h par jour. L'interface est d'un calme absolu." },
                { name: "Sophie L.", role: "CEO Agence Web", text: "Le CRM intégré aux tâches a changé la donne pour mon équipe. On suit les leads sans quitter notre espace de travail." },
                { name: "Marc D.", role: "Développeur Fullstack", text: "Les raccourcis clavier et la rapidité de l'app sont incroyables. C'est le Notion des gens pressés." },
              ].map((t, i) => (
                <div key={i} className="p-6 rounded-2xl bg-[#0A0C14] border border-white/5 shadow-lg">
                  <div className="flex gap-1 mb-4 text-accent-blue">
                    {[...Array(5)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                  </div>
                  <p className="text-white/80 mb-6 text-sm leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple" />
                    <div>
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-xs text-white/50">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 px-6 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Questions fréquentes</h2>
          <div className="flex flex-col">
            <FAQItem 
              question="Est-ce que je peux utiliser Aaron-OS sur mon téléphone ?"
              answer="L'application est conçue en PWA, vous pouvez l'installer sur votre téléphone pour un accès rapide. Une application native iOS et Android est en cours de développement."
            />
            <FAQItem 
              question="Comment se passe la migration depuis Notion ?"
              answer="Nous proposons un outil d'importation CSV qui vous permet de récupérer toutes vos bases de données Notion en quelques clics."
            />
            <FAQItem 
              question="Puis-je annuler mon abonnement à tout moment ?"
              answer="Oui, sans aucun engagement. Vous pouvez annuler votre abonnement d'un simple clic depuis vos paramètres."
            />
            <FAQItem 
              question="Le mode hors-ligne est-il disponible ?"
              answer="Oui, Aaron-OS utilise un cache local qui vous permet de continuer à travailler même sans connexion. Vos données se synchroniseront automatiquement dès votre retour en ligne."
            />
          </div>
        </section>

        {/* CTA Bottom */}
        <section className="py-24 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center mx-auto mb-8 shadow-glow-cyan">
            <Zap size={32} className="text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Développez votre activité<br/>dès maintenant.</h2>
          <p className="text-white/60 mb-10 max-w-xl mx-auto">Rejoignez des milliers de professionnels qui ont choisi la sérénité et la performance avec Aaron-OS.</p>
          <button className="px-8 py-4 rounded-full bg-accent-blue text-white font-semibold text-lg hover:bg-accent-blue/90 shadow-[0_0_40px_rgba(34,211,238,0.4)] transition-all hover:scale-105">
            Commencer l'essai gratuit
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center text-white/40 text-sm flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <Zap size={16} />
          <span className="font-semibold text-white/80">Aaron-OS</span>
        </div>
        <div className="flex gap-6 mb-4 md:mb-0">
          <a href="#" className="hover:text-white transition-colors">Produit</a>
          <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
          <a href="#" className="hover:text-white transition-colors">CGV</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
        <div>© 2026 Aaron-OS. Tous droits réservés.</div>
      </footer>
    </div>
  );
}

// Sparkles Icon
function Sparkles({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
