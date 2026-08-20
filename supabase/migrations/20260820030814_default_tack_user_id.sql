ALTER TABLE public.tacks
ALTER COLUMN user_id SET DEFAULT auth.uid();