-- DopaTask OS - CRM migration V1.0
-- Remplace le Google Sheet CRM d'Aaron (Triva Media)

create type statut_prospect as enum (
  'A_APPELER',
  'REPONDEUR',
  'REFUS',
  'EXISTE_PAS',
  'RDV_BOOKE',
  'MAQUETTE_PRETE',
  'R1_EFFECTUE',
  'VENDU',
  'PERDU'
);

create type resultat_appel as enum (
  'DECROCHE',
  'REPONDEUR',
  'REFUS',
  'EXISTE_PAS',
  'RDV',
  'PAS_JOIGNABLE'
);

create table prospects (
  id uuid primary key default gen_random_uuid(),
  entreprise text not null,
  telephone text,
  gmb_url text,
  site_url text,
  statut statut_prospect not null default 'A_APPELER',
  date_rdv date,
  date_relance date,
  lien_maquette text,
  feedback text,
  notes text,
  niche text default 'menuisiers_suisse',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index prospects_statut_idx on prospects(statut) where archived = false;
create index prospects_archived_idx on prospects(archived);
create index prospects_date_relance_idx on prospects(date_relance) where archived = false;
create index prospects_created_at_idx on prospects(created_at desc);

create table calls (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  date timestamptz not null default now(),
  duree_s int,
  resultat resultat_appel not null,
  notes text,
  compte_mission boolean not null default true
);

create index calls_prospect_id_idx on calls(prospect_id);
create index calls_date_idx on calls(date desc);
create index calls_mission_idx on calls(date) where compte_mission = true;

create table revenus (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references prospects(id) on delete set null,
  montant numeric(10,2) not null,
  date_signature date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create index revenus_date_idx on revenus(date_signature desc);

create table config (
  id int primary key default 1,
  objectif_mensuel numeric(10,2) not null default 3000,
  deadline_date date not null default '2026-06-01',
  prix_site numeric(10,2) not null default 980,
  mission_daily_target int not null default 5,
  script_actif_id uuid,
  motivation_default text not null default 'Ne regarde pas la montagne. Prends ton telephone et passe juste 1 appel.',
  boule_a_z_message text not null default 'Si 0 EUR au 1er juin -> boule a Z le 2 juin.',
  constraint config_singleton check (id = 1)
);

insert into config (id) values (1) on conflict (id) do nothing;

create table scripts (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  niche text default 'menuisiers_suisse',
  ouverture text,
  corps text,
  objections jsonb default '[]'::jsonb,
  cloture text,
  version int not null default 1,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scripts_active_idx on scripts(is_active) where is_active = true;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger prospects_updated_at before update on prospects
  for each row execute function set_updated_at();

create trigger scripts_updated_at before update on scripts
  for each row execute function set_updated_at();

alter table prospects enable row level security;
alter table calls enable row level security;
alter table revenus enable row level security;
alter table config enable row level security;
alter table scripts enable row level security;

create policy "anon_all_prospects" on prospects for all using (true) with check (true);
create policy "anon_all_calls"     on calls     for all using (true) with check (true);
create policy "anon_all_revenus"   on revenus   for all using (true) with check (true);
create policy "anon_all_config"    on config    for all using (true) with check (true);
create policy "anon_all_scripts"   on scripts   for all using (true) with check (true);

create or replace view v_stats_mois as
select
  (select count(*) from calls
    where date_trunc('month', date) = date_trunc('month', now())
      and resultat in ('DECROCHE','REFUS','EXISTE_PAS','RDV','REPONDEUR','PAS_JOIGNABLE')
  ) as appels_total,
  (select count(*) from calls
    where date_trunc('month', date) = date_trunc('month', now())
      and resultat = 'RDV'
  ) as rdv_obtenus,
  (select count(*) from revenus
    where date_trunc('month', date_signature) = date_trunc('month', now())
  ) as sites_vendus,
  (select coalesce(sum(montant), 0) from revenus
    where date_trunc('month', date_signature) = date_trunc('month', now())
  ) as revenu_total,
  (select count(*) from calls
    where date::date = current_date
      and compte_mission = true
  ) as appels_du_jour;
