-- 1. Supprimer la restriction qui force id = 1 dans la table app_state
ALTER TABLE app_state DROP CONSTRAINT IF EXISTS app_state_id_check;

-- 2. Créer la table des utilisateurs (système de connexion)
CREATE TABLE IF NOT EXISTS app_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Désactiver RLS sur la nouvelle table
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
