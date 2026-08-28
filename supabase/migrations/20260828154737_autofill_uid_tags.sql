alter table public.tags
alter column user_id set default auth.uid();