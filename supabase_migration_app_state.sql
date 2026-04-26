-- Aaron-OS App State — migration Supabase
-- Exécute ce SQL dans l'éditeur SQL de ton Supabase Dashboard

-- Table unique pour stocker tout le state de l'app (mono-user)
CREATE TABLE IF NOT EXISTS app_state (
  id   INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- une seule ligne
  data JSONB   NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insère la ligne initiale (vide)
INSERT INTO app_state (id, data)
VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Désactive RLS (app mono-user, pas d'auth Supabase)
ALTER TABLE app_state DISABLE ROW LEVEL SECURITY;
