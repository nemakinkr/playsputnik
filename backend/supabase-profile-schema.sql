-- PlaySputnik private profile storage for Supabase Auth + Postgres RLS.
-- Run in a dedicated Supabase project. Never expose a service_role key.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile_id text not null,
  revision bigint not null check (revision > 0),
  fingerprint text not null,
  envelope jsonb not null,
  updated_at timestamptz not null default now(),
  constraint profile_envelope_size check (octet_length(envelope::text) <= 2097152),
  constraint profile_envelope_format check (envelope ->> 'format' = 'playsputnik-profile-envelope'),
  constraint profile_envelope_version check ((envelope ->> 'envelopeVersion')::integer = 1)
);

alter table public.user_profiles enable row level security;
alter table public.user_profiles force row level security;

revoke all on public.user_profiles from anon;
grant select, insert, update, delete on public.user_profiles to authenticated;

create policy "read own profile"
  on public.user_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "insert own profile"
  on public.user_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "update own profile"
  on public.user_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "delete own profile"
  on public.user_profiles for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.save_profile_envelope(
  p_expected_revision bigint,
  p_envelope jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_current public.user_profiles%rowtype;
  v_profile_id text := p_envelope ->> 'profileId';
  v_revision bigint := (p_envelope ->> 'revision')::bigint;
  v_fingerprint text := p_envelope ->> 'fingerprint';
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_envelope ->> 'format' <> 'playsputnik-profile-envelope'
    or (p_envelope ->> 'envelopeVersion')::integer <> 1
    or coalesce(v_profile_id, '') = ''
    or coalesce(v_fingerprint, '') = ''
    or v_revision < 1
    or octet_length(p_envelope::text) > 2097152 then
    raise exception 'invalid_profile_envelope';
  end if;

  select * into v_current
    from public.user_profiles
    where user_id = v_user_id
    for update;

  if not found then
    if coalesce(p_expected_revision, 0) <> 0 then
      return jsonb_build_object('status', 'conflict', 'reason', 'remote_missing');
    end if;
    insert into public.user_profiles (user_id, profile_id, revision, fingerprint, envelope)
      values (v_user_id, v_profile_id, v_revision, v_fingerprint, p_envelope);
    return jsonb_build_object('status', 'saved', 'revision', v_revision, 'envelope', p_envelope);
  end if;

  if v_current.revision <> coalesce(p_expected_revision, 0) then
    return jsonb_build_object('status', 'conflict', 'reason', 'revision_changed', 'envelope', v_current.envelope);
  end if;
  if v_current.profile_id <> v_profile_id then
    return jsonb_build_object('status', 'conflict', 'reason', 'different_profile', 'envelope', v_current.envelope);
  end if;

  update public.user_profiles
    set revision = v_revision, fingerprint = v_fingerprint, envelope = p_envelope, updated_at = now()
    where user_id = v_user_id;
  return jsonb_build_object('status', 'saved', 'revision', v_revision, 'envelope', p_envelope);
end;
$$;

create or replace function public.delete_profile_memory() returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  delete from public.user_profiles where user_id = v_user_id;
  return jsonb_build_object('status', 'deleted');
end;
$$;

revoke all on function public.save_profile_envelope(bigint, jsonb) from public, anon;
revoke all on function public.delete_profile_memory() from public, anon;
grant execute on function public.save_profile_envelope(bigint, jsonb) to authenticated;
grant execute on function public.delete_profile_memory() to authenticated;
