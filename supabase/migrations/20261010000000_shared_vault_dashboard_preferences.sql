alter table public.vaults
  add column if not exists show_shared_balances_on_dashboard boolean not null default true;

create table if not exists public.personal_shared_vault_preferences (
  personal_vault_id integer not null references public.vaults(id) on delete cascade,
  shared_vault_id integer not null references public.vaults(id) on delete cascade,
  include_in_safe_to_spend boolean not null default true,
  primary key (personal_vault_id, shared_vault_id)
);

create index if not exists idx_personal_shared_vault_preferences_shared
  on public.personal_shared_vault_preferences (shared_vault_id);
