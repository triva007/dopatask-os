-- Ajouter une colonne app_user_id aux tables du CRM pour séparer les prospects de chaque compte
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS app_user_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS app_user_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE revenus ADD COLUMN IF NOT EXISTS app_user_id INTEGER NOT NULL DEFAULT 1;

-- Créer des index pour optimiser les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_prospects_user_id ON prospects(app_user_id);
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(app_user_id);
CREATE INDEX IF NOT EXISTS idx_revenus_user_id ON revenus(app_user_id);
