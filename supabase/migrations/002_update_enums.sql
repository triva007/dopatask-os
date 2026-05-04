-- Migration V2: Mise à jour des enums CRM
-- Ajoute RAPPEL_PLUS_TARD et PAS_MA_CIBLE aux enums
-- Supprime DECROCHE et PAS_JOIGNABLE (les données existantes sont migrées)

-- ═══════════════════════════════════════════════════════════════
-- 1. resultat_appel : ajouter les nouvelles valeurs
-- ═══════════════════════════════════════════════════════════════
ALTER TYPE resultat_appel ADD VALUE IF NOT EXISTS 'RAPPEL_PLUS_TARD';
ALTER TYPE resultat_appel ADD VALUE IF NOT EXISTS 'PAS_MA_CIBLE';

-- Note: PostgreSQL ne permet pas de DROP une valeur d'enum.
-- DECROCHE et PAS_JOIGNABLE restent dans l'enum mais ne seront plus utilisés.
-- On migre les données existantes vers leurs équivalents logiques.

UPDATE calls SET resultat = 'REPONDEUR' WHERE resultat = 'PAS_JOIGNABLE';
UPDATE calls SET resultat = 'REFUS' WHERE resultat = 'DECROCHE';

-- ═══════════════════════════════════════════════════════════════
-- 2. statut_prospect : ajouter PAS_MA_CIBLE
-- ═══════════════════════════════════════════════════════════════
ALTER TYPE statut_prospect ADD VALUE IF NOT EXISTS 'PAS_MA_CIBLE';

-- ═══════════════════════════════════════════════════════════════
-- 3. Mettre à jour la vue stats pour inclure les nouveaux résultats
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW v_stats_mois AS
SELECT
  (SELECT count(*) FROM calls
    WHERE date_trunc('month', date) = date_trunc('month', now())
  ) AS appels_total,
  (SELECT count(*) FROM calls
    WHERE date_trunc('month', date) = date_trunc('month', now())
      AND resultat = 'RDV'
  ) AS rdv_obtenus,
  (SELECT count(*) FROM revenus
    WHERE date_trunc('month', date_signature) = date_trunc('month', now())
  ) AS sites_vendus,
  (SELECT coalesce(sum(montant), 0) FROM revenus
    WHERE date_trunc('month', date_signature) = date_trunc('month', now())
  ) AS revenu_total,
  (SELECT count(*) FROM calls
    WHERE date::date = current_date
      AND compte_mission = true
  ) AS appels_du_jour;
