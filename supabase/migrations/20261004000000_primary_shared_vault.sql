alter table public.vaults
  add column if not exists primary_shared_vault_id integer
    references public.vaults(id) on delete set null;

create or replace function public.validate_primary_shared_vault()
returns trigger
language plpgsql
as $$
begin
  if new.primary_shared_vault_id is null then
    return new;
  end if;

  if new.vault_type <> 'Individual' then
    raise exception 'Only Individual vaults can choose a primary shared vault.';
  end if;

  if not exists (
    select 1
    from public.vaults shared_vault
    where shared_vault.id = new.primary_shared_vault_id
      and shared_vault.vault_type = 'Shared'
  ) then
    raise exception 'Primary shared vault must be a Shared vault.';
  end if;

  if not exists (
    select 1
    from public.vault_shares share
    where share.individual_vault_id = new.id
      and share.shared_vault_id = new.primary_shared_vault_id
  ) then
    raise exception 'Primary shared vault must be connected to the Individual vault.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_primary_shared_vault on public.vaults;
create trigger validate_primary_shared_vault
before insert or update of primary_shared_vault_id, vault_type on public.vaults
for each row
execute function public.validate_primary_shared_vault();

create or replace function public.clear_primary_shared_vault_on_unshare()
returns trigger
language plpgsql
as $$
begin
  update public.vaults
  set primary_shared_vault_id = null
  where id = old.individual_vault_id
    and primary_shared_vault_id = old.shared_vault_id;

  return old;
end;
$$;

drop trigger if exists clear_primary_shared_vault_on_unshare on public.vault_shares;
create trigger clear_primary_shared_vault_on_unshare
after delete on public.vault_shares
for each row
execute function public.clear_primary_shared_vault_on_unshare();
