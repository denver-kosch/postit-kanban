create unique index tags_user_id_name_key
on public.tags (user_id, lower(name));

create or replace function public.create_tack_with_tags(
  p_title text, p_description text default '', p_due_date timestamptz default null,
  p_status public.tack_status default 'open', p_parent_tack_id uuid default null,
  p_group_id uuid default null, p_existing_tag_ids uuid[] default array[]::uuid[],
  p_new_tag_names text[] default array[]::text[]
)
returns public.tacks
language plpgsql
security invoker
set search_path = '' as $$
declare v_user_id uuid := auth.uid(); v_tack public.tacks%rowtype;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to create a tack';
  end if;

  -- Create the tack.
  insert into public.tacks (user_id, title, description, due_date, status, parent_tack_id, group_id)
  values ( v_user_id, pg_catalog.btrim(p_title), coalesce(p_description, ''), p_due_date, p_status, p_parent_tack_id, p_group_id )
  returning * into v_tack;

  -- Attach tags that already exist.
  insert into public.tack_tags (tack_id, tag_id)
  select v_tack.id, requested.tag_id
  from (
    select distinct tag_id
    from pg_catalog.unnest(coalesce(p_existing_tag_ids, array[]::uuid[])) as tag_id
  ) as requested
  on conflict do nothing;

  -- Create new tags or reuse matching tags.
  with requested_names as (
    select distinct pg_catalog.lower(pg_catalog.btrim(raw_name)) as name
    from pg_catalog.unnest(coalesce(p_new_tag_names, array[]::text[])) as input(raw_name)
    where pg_catalog.btrim(raw_name) <> ''
  ),
  upserted_tags as (
    insert into public.tags as existing_tag ( user_id, name )
    select v_user_id, requested_names.name
    from requested_names
    on conflict (user_id, pg_catalog.lower(name))
    do update set name = excluded.name
    returning existing_tag.id
  )
  insert into public.tack_tags (tack_id, tag_id)
  select v_tack.id, upserted_tags.id
  from upserted_tags
  on conflict do nothing;

  return v_tack;
end;
$$;

revoke all
on function public.create_tack_with_tags( text, text, timestamptz, public.tack_status, uuid, uuid, uuid[], text[] ) from public;

grant execute
on function public.create_tack_with_tags( text, text, timestamptz, public.tack_status, uuid, uuid, uuid[], text[] ) to authenticated;