alter table public.tack_groups
alter column user_id set default auth.uid();