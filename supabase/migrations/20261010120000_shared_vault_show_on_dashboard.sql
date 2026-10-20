alter table public.personal_shared_vault_preferences
  add column if not exists show_on_dashboard boolean not null default true;
