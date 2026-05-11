// Script one-shot : import prospects architectes d'intérieur indépendants
// Usage: npx tsx src/scripts/import-archi-prospects.ts

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Prospects triés : architectes d'intérieur indépendants uniquement
// Dédupliqués par domaine wix de base, exclut : agences multi-personnes, étudiants en recherche,
// enseignants, blogueurs, personnes hors France, portfolios sans activité réelle
const prospects: { entreprise: string; site_url: string }[] = [
  { entreprise: "Anaïs Pleimelding", site_url: "https://anaispleimeldingpro.wixsite.com/website" },
  { entreprise: "Laure Diot Design", site_url: "https://laurediot.wixsite.com/design" },
  { entreprise: "KB3Design", site_url: "https://agencekb3design.wixsite.com/monsite" },
  { entreprise: "VD Designer", site_url: "https://vdimartino68.wixsite.com/vddesigner" },
  { entreprise: "Christopher Raveleau", site_url: "https://christopherraveleau.wixsite.com/architecture-design" },
  { entreprise: "Antoine Dury", site_url: "https://antoinedury.wixsite.com/architecture" },
  { entreprise: "SV Designer d'Espace", site_url: "https://svdesignerespace.wixsite.com/home" },
  { entreprise: "Elodie Charrier", site_url: "https://charrierelodie1.wixsite.com/helloditcreation" },
  { entreprise: "Amélie Perez", site_url: "https://amelieprz.wixsite.com/architectedinterieur" },
  { entreprise: "Cécile Ramon", site_url: "https://cecileramon.wixsite.com/cecile-r" },
  { entreprise: "SF Architecte d'intérieur (Sarah Farsy)", site_url: "https://sarahfarsy.wixsite.com/sfai" },
  { entreprise: "Marie Gaillard - Decor&Vous", site_url: "https://decor-et-vous.wixsite.com/mariegaillard" },
  { entreprise: "CR intérieur - Céline Krecek", site_url: "https://cr1terieur.wixsite.com/crinterieur" },
  { entreprise: "Ludivine Sala", site_url: "https://salaludivine.wixsite.com/site" },
  { entreprise: "Camille Genty", site_url: "https://camillegenty.wixsite.com/architecte" },
  { entreprise: "Alexia Carriere", site_url: "https://alexiaarchitecture.wixsite.com/millau" },
  { entreprise: "Julie Delavacherie - Ju.de", site_url: "https://judearchi.wixsite.com/judearchi" },
  { entreprise: "Amandine Dallard", site_url: "https://amandinedallard.wixsite.com/architectedinterieur" },
  { entreprise: "Caroline CDesign", site_url: "https://carolinecdesign05.wixsite.com/cd05" },
  { entreprise: "Marie Chevallier Branchereau", site_url: "https://7archideco.wixsite.com/mariecb" },
  { entreprise: "Décolistique - Sandrine Sirieix", site_url: "https://decolistique.wixsite.com/website" },
  { entreprise: "Valérie Martin", site_url: "https://valeriemartin66.wixsite.com/decoratriceinterieur" },
  { entreprise: "Laurence Aumaitre", site_url: "https://loaumaitre.wixsite.com/laurenceaumaitre" },
  { entreprise: "Marine Gilant", site_url: "https://marinegilantarchi.wixsite.com/marinegilant" },
  { entreprise: "Nelly Pansier", site_url: "https://nellypansier.wixsite.com/architectedinterieur" },
  { entreprise: "ArchiTerrae", site_url: "https://architerrae.wixsite.com/my-site" },
  { entreprise: "Thierry Bobin Interior Design", site_url: "https://thi9183.wixsite.com/tbinteriordesign" },
  { entreprise: "Camille Bessonneau", site_url: "https://camillebessonneau.wixsite.com/portfolio" },
  { entreprise: "Sacha Goutorbe", site_url: "https://sachagoutorbe.wixsite.com/architecte-interieur" },
  { entreprise: "Camille Bernard", site_url: "https://camillebernardarchi.wixsite.com/my-site-1" },
  { entreprise: "Samuel Petit", site_url: "https://samuelfpetit.wixsite.com/samuelpetit" },
  { entreprise: "Olivia Martin Déco", site_url: "https://oliviamartindeco.wixsite.com/site" },
  { entreprise: "Marine Vallé", site_url: "https://marinevalle.wixsite.com/monsite" },
  { entreprise: "Andrea De Busni", site_url: "https://debusniandrea.wixsite.com/andreadebusni" },
  { entreprise: "Scaena", site_url: "https://scaena.wixsite.com/archi" },
  { entreprise: "Marcoux - Ulrike Gritschke", site_url: "https://ugmarcoux.wixsite.com/interior-design" },
  { entreprise: "Fabienne Ferec", site_url: "https://fabienneferec.wixsite.com/archi" },
  { entreprise: "Les Landes Bleues - Muriel Cadiou", site_url: "https://architecte-landes.wixsite.com/architecte-interieur" },
  { entreprise: "Cynthia Alleon", site_url: "https://cynthiaalleon.wixsite.com/conception" },
  { entreprise: "Anna-Louise Lavigne", site_url: "https://allavigne.wixsite.com/annalouiselavigne" },
  { entreprise: "Emeline Clouet", site_url: "https://emelineclouet.wixsite.com/architecteinterieur" },
  { entreprise: "Ambre Moura", site_url: "https://ambremoura.wixsite.com/website" },
  { entreprise: "Justine Doucey Studio", site_url: "https://justinedouceystudio.wixsite.com/architecture" },
  { entreprise: "Alice Berger - IceBerg Concept Design", site_url: "https://icebergconceptdesi.wixsite.com/ibcd" },
  { entreprise: "MCM Architecture 33", site_url: "https://mcmarchitecture33.wixsite.com/mcma33" },
  { entreprise: "Damien Lesvenan", site_url: "https://damienlesvenan.wixsite.com/home" },
  { entreprise: "Christophe Debec - Autre Territoire", site_url: "https://autreterritoire.wixsite.com/autreterritoire" },
  { entreprise: "Idaline Cenier", site_url: "https://idaline-cenier.wixsite.com/interieurs" },
  { entreprise: "Léa Christen", site_url: "https://leachristen-archi.wixsite.com/portfolio" },
  { entreprise: "Bertille Bazoge", site_url: "https://bertillebazoge.wixsite.com/bertillebazoge" },
  { entreprise: "Agathe Ferrand", site_url: "https://agatheferrand.wixsite.com/architectedinterieur" },
  { entreprise: "Gwladys Parra", site_url: "https://gwladysparra.wixsite.com/gwladysparra" },
  { entreprise: "Sonia Brechotteau", site_url: "https://sbrechotteau.wixsite.com/book" },
  { entreprise: "Manon Gaillard", site_url: "https://mggaillard452.wixsite.com/monsite" },
  { entreprise: "Anaïs Blanchet - Abarchi", site_url: "https://abarchidesigner.wixsite.com/abarchi" },
  { entreprise: "Morgane Cherruault", site_url: "https://cherruaultm.wixsite.com/monsite" },
  { entreprise: "Mathilde Glatigny - MGAI", site_url: "https://mathildeglatigny.wixsite.com/mgai" },
  { entreprise: "Charlène Guillart", site_url: "https://guillartcharlene.wixsite.com/cgde" },
  { entreprise: "Laurent Beaulieu - l'ADN", site_url: "https://lbarchi.wixsite.com/ladnbeaulieu" },
  { entreprise: "ALEPH - Hetty", site_url: "https://hettyaleph.wixsite.com/agencealeph" },
  { entreprise: "IMAGINE - Nathalie", site_url: "https://imaginearchinathal.wixsite.com/website" },
  { entreprise: "Maud Le Meitour", site_url: "https://maudlm.wixsite.com/maud" },
  { entreprise: "Pauline Bouyat", site_url: "https://paulinebouyatai.wixsite.com/architecteinterieur" },
  { entreprise: "Chrysalide Archi - Mathilde Forni", site_url: "https://chrysalidearchi.wixsite.com/architecte-interieur" },
  { entreprise: "Valérie Cobert", site_url: "https://valeriecobert.wixsite.com/monsite" },
  { entreprise: "Pauline Genest", site_url: "https://paulinegenest.wixsite.com/architecteinterieur" },
  { entreprise: "Atelier I-L-N", site_url: "https://atelieriln.wixsite.com/atelieriln" },
  { entreprise: "Séverine Rommé", site_url: "https://severineromme.wixsite.com/cv-book" },
  { entreprise: "Jeanne Camoin", site_url: "https://grochkova-camoin.wixsite.com/jeannecamoin-fr" },
  { entreprise: "Emilie Guéguen", site_url: "https://egueguen825.wixsite.com/monsite" },
  { entreprise: "Décoreno by Steph", site_url: "https://decorenobysteph.wixsite.com/deco" },
  { entreprise: "Sabine Sené - Evidences Créations", site_url: "https://senesabine.wixsite.com/evidence-s-creations" },
  { entreprise: "Anne-Sophie Brasme", site_url: "https://brasmeannesophie.wixsite.com/architecteinterieur" },
  { entreprise: "Lucie Lachaume", site_url: "https://lucielachaume.wixsite.com/design" },
  { entreprise: "Annaïg Leroueille", site_url: "https://leroueille-a.wixsite.com/archinterieure" },
  { entreprise: "Aurélien Schwerdtfeger", site_url: "https://aureliensch.wixsite.com/aurelien-sch" },
  { entreprise: "Archiline", site_url: "https://archiline54.wixsite.com/archiline" },
  { entreprise: "Gaëlle Saint-Clair", site_url: "https://gaellesaintclair.wixsite.com/gaelle-saint-clair" },
  { entreprise: "Cap Design", site_url: "https://capdesign40.wixsite.com/capdesign" },
  { entreprise: "Nicolas Breton - Mise en Lumière", site_url: "https://bretonadvising.wixsite.com/miseenlumiere" },
  { entreprise: "Florence Brongniart - Agence B", site_url: "https://florencebrongniart.wixsite.com/agenceb" },
  { entreprise: "Pauline Jouanneau", site_url: "https://paulinejouanneau.wixsite.com/architecte" },
  { entreprise: "Natacha Brecy", site_url: "https://nbecodesign.wixsite.com/natachabrecy" },
  { entreprise: "Clémence Pottez Jouatte", site_url: "https://clemencepottez.wixsite.com/portfolio" },
  { entreprise: "Olivier Siller", site_url: "https://agence-digi.wixsite.com/oliviersiller" },
  { entreprise: "Eve-Lise Four", site_url: "https://fourevelise.wixsite.com/monsite" },
  { entreprise: "Pauline Paquet - Naibu Home", site_url: "https://paulinepaquet2615.wixsite.com/website" },
  { entreprise: "Home Idées", site_url: "https://homeidees.wixsite.com/homeidees" },
  { entreprise: "Lydie Corgnac", site_url: "https://lydiecorgnac.wixsite.com/lydiecorgnac" },
  { entreprise: "MKdesign", site_url: "https://mkdesignarchitecture.wixsite.com/website" },
  { entreprise: "Laurine Dublanc", site_url: "https://laurinedublanc.wixsite.com/monsite" },
  { entreprise: "Anne-Solenne Grison", site_url: "https://asgrison.wixsite.com/asgarchinterieur" },
  { entreprise: "Mona Faveyrial", site_url: "https://mfaveyrial.wixsite.com/monafaveyrial" },
  { entreprise: "Marine Aulagnier", site_url: "https://marineaulagnier.wixsite.com/architecteinterieur" },
  { entreprise: "Justine Mellaerts", site_url: "https://justinemellaerts.wixsite.com/architectedinterieur" },
  { entreprise: "Juliette Normand", site_url: "https://juliettenormand8.wixsite.com/website" },
  { entreprise: "Au Crayon Noir", site_url: "https://aucrayonnoir.wixsite.com/architecte" },
  { entreprise: "Cyrille Goix", site_url: "https://archicginterieur.wixsite.com/ubaye" },
  { entreprise: "Deborah B. Design", site_url: "https://brindeborah.wixsite.com/interieur" },
  { entreprise: "Charline Hecker", site_url: "https://charlineheckerpro.wixsite.com/architecture" },
  { entreprise: "Horizon Intérieurs", site_url: "https://retrographique.wixsite.com/horizoninterieurs" },
  { entreprise: "Mouna Gotty", site_url: "https://mouna-gotty.wixsite.com/abomb" },
  { entreprise: "Marie Hoog - MPP Décoration", site_url: "https://mppdecoration.wixsite.com/mpp-decoration" },
  { entreprise: "Créations d'Intérieurs by Doriane", site_url: "https://creationsdinterieu1.wixsite.com/ations-d" },
  { entreprise: "NM I-Design", site_url: "https://nmidesigner.wixsite.com/nm-i-design" },
  { entreprise: "Pauline Bouquet", site_url: "https://paulinebouquet9332.wixsite.com/website" },
  { entreprise: "Henrick Istasse Davidson", site_url: "https://istassedavidson.wixsite.com/davidsondesign" },
  { entreprise: "IOVA Design", site_url: "https://iovadesign.wixsite.com/iovadesign" },
  { entreprise: "Benjamin Kerleau", site_url: "https://bkerleau.wixsite.com/lagencemetamorphose" },
  { entreprise: "Studio HJM", site_url: "https://studiohjm.wixsite.com/studio-hjm" },
  { entreprise: "Mélina Stadelmann - Le Sens Du Détail", site_url: "https://lesensdudetailms.wixsite.com/website" },
  { entreprise: "Roxane Francisco", site_url: "https://roxane-francisco.wixsite.com/homesweethome" },
  { entreprise: "Paré Intérieurs", site_url: "https://pareinterieurs.wixsite.com/pare" },
  { entreprise: "Amandine Jaffres", site_url: "https://amandinejaffres.wixsite.com/amandine" },
  { entreprise: "Justine Bouvet", site_url: "https://justinebouvet.wixsite.com/designer-espace" },
  { entreprise: "Homa Création - Anousheh Barzanooni", site_url: "https://barzanooni.wixsite.com/architecte" },
  { entreprise: "As.mi Design Studio", site_url: "https://asmidesignstudio.wixsite.com/website" },
  { entreprise: "Séverine Courcoux", site_url: "https://severinecourcoux.wixsite.com/monsite" },
  { entreprise: "Emilia Porée - Atelier Maison", site_url: "https://ateliermaisonemili.wixsite.com/maisonemiliaporee" },
  { entreprise: "Bénita Bandeira Studio", site_url: "https://benitabandeirastudio.wixsite.com/my-site" },
  { entreprise: "JAVA Décorateurs", site_url: "https://java-decorateurs-68.wixsite.com/java-decorateur" },
  { entreprise: "Virginie Tonda", site_url: "https://virginietonda.wixsite.com/tondavirginie" },
  { entreprise: "Aline Delabroy", site_url: "https://alinedelabroy.wixsite.com/aline-delabroy-" },
  { entreprise: "Lauriane Roupioz", site_url: "https://roupiozlauriane.wixsite.com/designerinterieur" },
  { entreprise: "Margaux Multon - MM Architecture", site_url: "https://margauxmulton.wixsite.com/monsite" },
  { entreprise: "Dzvigalo Tetyana", site_url: "https://dzvdesign.wixsite.com/archi" },
  { entreprise: "Emeline Boujon", site_url: "https://emeline-b.wixsite.com/portfolio" },
  { entreprise: "Emmanuelle Morlière", site_url: "https://emmanuellemorliere.wixsite.com/archi-interieur" },
  { entreprise: "Sylvie Descamps - Archi'tech d'intérieur", site_url: "https://descampssylviekl.wixsite.com/website" },
  { entreprise: "Christophe Rota-Negroni", site_url: "https://chrisrota74.wixsite.com/portfolio" },
  { entreprise: "Bénédicte Montussac", site_url: "https://bmontussac.wixsite.com/montussac-benedicte" },
  { entreprise: "Camille Gillot", site_url: "https://gillotcamille.wixsite.com/design-espace" },
  { entreprise: "La Cabane à Projets", site_url: "https://lacabaneaprojets.wixsite.com/design" },
  { entreprise: "Sarah Hamdi", site_url: "https://sarahhamdi97.wixsite.com/website" },
  { entreprise: "Katell Le Noac'h", site_url: "https://katell-lenoach.wixsite.com/architecte-interieur" },
  { entreprise: "Théo Martin", site_url: "https://martin-theo.wixsite.com/architecture" },
  { entreprise: "Aymeric W. Riley", site_url: "https://aymericriley.wixsite.com/design" },
  { entreprise: "Laura Guyon", site_url: "https://guyonlaura.wixsite.com/architecture" },
];

async function main() {
  // Detect app_user_id (use 1 as default, same as getActiveProfileId default)
  const APP_USER_ID = 1;

  console.log(`📋 ${prospects.length} prospects à importer (niche: archi_interieur)`);

  const payload = prospects.map((p) => ({
    app_user_id: APP_USER_ID,
    entreprise: p.entreprise,
    site_url: p.site_url,
    telephone: null,
    gmb_url: null,
    notes: null,
    statut: "A_APPELER",
    niche: "archi_interieur",
  }));

  // Insert in batches of 50
  let total = 0;
  for (let i = 0; i < payload.length; i += 50) {
    const batch = payload.slice(i, i + 50);
    const { data, error } = await supabase.from("prospects").insert(batch).select("id");
    if (error) {
      console.error(`❌ Batch ${i / 50 + 1} error:`, error.message);
      continue;
    }
    total += (data || []).length;
    console.log(`✅ Batch ${i / 50 + 1}: ${(data || []).length} insérés`);
  }

  console.log(`\n🎉 Total importé: ${total}/${prospects.length} prospects`);
}

main().catch(console.error);
