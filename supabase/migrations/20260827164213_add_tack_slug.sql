-- 1. Add the column as nullable so existing rows remain valid.
alter table public.tacks
  add column slug text default '';


-- 2. Generate slugs for existing rows.
with slug_bases as (
  select
    id,
    user_id,
    created_at,
    coalesce(
      nullif(
        trim(
          both '-' from regexp_replace(
            lower(title),
            '[^a-z0-9]+',
            '-',
            'g'
          )
        ),
        ''
      ),
      'tack'
    ) as base_slug
  from public.tacks
),

numbered_slugs as (
  select
    id,
    base_slug,
    row_number() over (
      partition by user_id, base_slug
      order by created_at, id
    ) as duplicate_number
  from slug_bases
)

update public.tacks as tack
set slug =
  case
    when numbered_slugs.duplicate_number = 1
      then numbered_slugs.base_slug
    else
      numbered_slugs.base_slug
      || '-'
      || numbered_slugs.duplicate_number
  end
from numbered_slugs
where tack.id = numbered_slugs.id;


-- 3. Require valid, unique slugs.
alter table public.tacks
  alter column slug set not null;

alter table public.tacks
  add constraint tacks_slug_format_check
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table public.tacks
  add constraint tacks_user_id_slug_key
  unique (user_id, slug);


-- 4. Create the automatic slug-generation function.
create or replace function public.set_tack_slug()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  base_slug text;
  candidate_slug text;
  suffix integer := 1;
begin
  base_slug := coalesce( nullif(pg_catalog.btrim(new.slug), ''), new.title );

  base_slug := coalesce(
    nullif(
      trim(
        both '-' from pg_catalog.regexp_replace(
          pg_catalog.lower(base_slug),
          '[^a-z0-9]+',
          '-',
          'g'
        )
      ),
      ''
    ),
    'tack'
  );

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended( new.user_id::text || ':' || base_slug, 0 ));

  candidate_slug := base_slug;

  while exists (
    select 1 from public.tacks
    where user_id = new.user_id
      and slug = candidate_slug
  ) loop
    suffix := suffix + 1;
    candidate_slug := base_slug || '-' || suffix::text;
  end loop;

  new.slug := candidate_slug;

  return new;
end;
$$;


-- 5. Run the function before every new tack is inserted.
create trigger tacks_set_slug
before insert on public.tacks
for each row
execute function public.set_tack_slug();