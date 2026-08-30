-- Store a tack's position within its own board. Top-level tacks share the
-- null parent scope; sub-tacks are scoped to their parent tack.
alter table public.tacks
  add column sort_order integer;

with ranked_tacks as (
  select
    id,
    row_number() over (
      partition by user_id, parent_tack_id
      order by created_at, id
    ) - 1 as sort_order
  from public.tacks
)
update public.tacks as tack
set sort_order = ranked_tacks.sort_order
from ranked_tacks
where tack.id = ranked_tacks.id;

alter table public.tacks
  alter column sort_order set default 0,
  alter column sort_order set not null,
  add constraint tacks_sort_order_nonnegative_check
    check (sort_order >= 0),
  add constraint tacks_sibling_sort_order_key
    unique nulls not distinct (user_id, parent_tack_id, sort_order)
    deferrable initially deferred;

-- New tacks are appended to their board. The advisory lock serializes inserts
-- and reorders within the same board, including the null top-level board.
create or replace function public.set_tack_sort_order()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and new.parent_tack_id is not distinct from old.parent_tack_id
  then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      new.user_id::text || ':' || coalesce(new.parent_tack_id::text, 'root'),
      0
    )
  );

  select coalesce(max(tack.sort_order), -1) + 1
  into new.sort_order
  from public.tacks as tack
  where tack.user_id = new.user_id
    and tack.parent_tack_id is not distinct from new.parent_tack_id;

  return new;
end;
$$;

create trigger tacks_set_sort_order
before insert or update of parent_tack_id on public.tacks
for each row
execute function public.set_tack_sort_order();

-- Reorder the complete sibling set atomically. The deferred unique constraint
-- permits values such as 0 and 1 to exchange places inside this transaction.
create or replace function public.reorder_tacks(
  p_ordered_tack_ids uuid[],
  p_parent_tack_id uuid default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_requested_count integer := coalesce(pg_catalog.cardinality(p_ordered_tack_ids), 0);
  v_sibling_count integer;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to reorder tacks';
  end if;

  if v_requested_count <> (
    select count(distinct requested.id)
    from pg_catalog.unnest(coalesce(p_ordered_tack_ids, array[]::uuid[])) as requested(id)
  ) then
    raise exception 'The requested tack order contains duplicate IDs';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_user_id::text || ':' || coalesce(p_parent_tack_id::text, 'root'),
      0
    )
  );

  -- Lock in a deterministic order so concurrent requests cannot interleave.
  perform tack.id
  from public.tacks as tack
  where tack.user_id = v_user_id
    and tack.parent_tack_id is not distinct from p_parent_tack_id
  order by tack.id
  for update;

  select count(*)
  into v_sibling_count
  from public.tacks as tack
  where tack.user_id = v_user_id
    and tack.parent_tack_id is not distinct from p_parent_tack_id;

  if v_requested_count <> v_sibling_count then
    raise exception 'The requested order must include every tack on this board';
  end if;

  if exists (
    select 1
    from pg_catalog.unnest(coalesce(p_ordered_tack_ids, array[]::uuid[])) as requested(id)
    left join public.tacks as tack
      on tack.id = requested.id
      and tack.user_id = v_user_id
      and tack.parent_tack_id is not distinct from p_parent_tack_id
    where tack.id is null
  ) then
    raise exception 'The requested order includes a tack from another board';
  end if;

  with requested_order as (
    select
      requested.id,
      (requested.position - 1)::integer as sort_order
    from pg_catalog.unnest(p_ordered_tack_ids)
      with ordinality as requested(id, position)
  )
  update public.tacks as tack
  set sort_order = requested_order.sort_order
  from requested_order
  where tack.id = requested_order.id
    and tack.user_id = v_user_id;
end;
$$;

revoke all
on function public.reorder_tacks(uuid[], uuid)
from public;

grant execute
on function public.reorder_tacks(uuid[], uuid)
to authenticated;
