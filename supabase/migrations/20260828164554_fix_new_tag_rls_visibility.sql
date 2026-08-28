create or replace function public.create_tack_with_tags(
  p_title text,
  p_description text default '',
  p_due_date timestamptz default null,
  p_status public.tack_status default 'open',
  p_parent_tack_id uuid default null,
  p_group_id uuid default null,
  p_existing_tag_ids uuid[] default array[]::uuid[],
  p_new_tag_names text[] default array[]::text[]
)
returns public.tacks
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_tack public.tacks%rowtype;
  v_tag_name text;
  v_tag_id uuid;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to create a tack';
  end if;

  insert into public.tacks (
    user_id,
    title,
    description,
    due_date,
    status,
    parent_tack_id,
    group_id
  )
  values (
    v_user_id,
    pg_catalog.btrim(p_title),
    coalesce(p_description, ''),
    p_due_date,
    p_status,
    p_parent_tack_id,
    p_group_id
  )
  returning *
  into v_tack;

  -- Attach tags that already exist.
  insert into public.tack_tags (tack_id, tag_id)
  select
    v_tack.id,
    requested.tag_id
  from (
    select distinct tag_id
    from pg_catalog.unnest(
      coalesce(p_existing_tag_ids, array[]::uuid[])
    ) as tag_id
  ) as requested
  on conflict do nothing;

  -- Create/reuse each new tag first, then attach it in
  -- a separate statement so the RLS policy can see it.
  for v_tag_name in
    select distinct
      pg_catalog.lower(pg_catalog.btrim(raw_name))
    from pg_catalog.unnest(
      coalesce(p_new_tag_names, array[]::text[])
    ) as input(raw_name)
    where pg_catalog.btrim(raw_name) <> ''
  loop
    insert into public.tags as existing_tag (
      user_id,
      name
    )
    values (
      v_user_id,
      v_tag_name
    )
    on conflict (user_id, pg_catalog.lower(name))
    do update
      set name = excluded.name
    returning existing_tag.id
    into v_tag_id;

    insert into public.tack_tags (
      tack_id,
      tag_id
    )
    values (
      v_tack.id,
      v_tag_id
    )
    on conflict do nothing;
  end loop;

  return v_tack;
end;
$$;