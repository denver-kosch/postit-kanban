-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

DROP EXTENSION pg_net;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

CREATE TYPE public.tack_status AS ENUM (
  'open',
  'active',
  'awaiting',
  'closed'
);

GRANT ALL ON TYPE public.tack_status TO authenticated;

CREATE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

GRANT ALL ON FUNCTION public.rls_auto_enable() TO anon;

GRANT ALL ON FUNCTION public.rls_auto_enable() TO authenticated;

GRANT ALL ON FUNCTION public.rls_auto_enable() TO service_role;

CREATE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

GRANT ALL ON FUNCTION public.set_updated_at() TO anon;

GRANT ALL ON FUNCTION public.set_updated_at() TO authenticated;

GRANT ALL ON FUNCTION public.set_updated_at() TO service_role;

CREATE FUNCTION public.validate_tack_hierarchy()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  selected_parent public.tacks;
begin
  -- A null parent means this is a top-level tack.
  if new.parent_tack_id is null then
    return new;
  end if;

  select *
  into selected_parent
  from public.tacks
  where id = new.parent_tack_id;

  if not found then
    raise exception 'Parent tack does not exist';
  end if;

  -- Users cannot attach their tack to another user's tack.
  if selected_parent.user_id <> new.user_id then
    raise exception 'Parent and child tacks must have the same owner';
  end if;

  -- A sub-tack cannot itself be used as a parent.
  if selected_parent.parent_tack_id is not null then
    raise exception 'Sub-tacks cannot have children';
  end if;

  -- Prevent turning an existing parent into a child while it has children.
  if exists (
    select 1
    from public.tacks
    where parent_tack_id = new.id
  ) then
    raise exception 'A tack with sub-tacks cannot become a sub-tack';
  end if;

  return new;
end;
$function$;

GRANT ALL ON FUNCTION public.validate_tack_hierarchy() TO anon;

GRANT ALL ON FUNCTION public.validate_tack_hierarchy() TO authenticated;

GRANT ALL ON FUNCTION public.validate_tack_hierarchy() TO service_role;

CREATE TABLE public.tack_groups (
  id         uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id    uuid                     NOT NULL,
  name       text                     NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.tack_groups
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tack_groups
  ADD CONSTRAINT tack_groups_name_check CHECK (char_length(TRIM(BOTH FROM name)) >= 1 AND char_length(TRIM(BOTH FROM name)) <= 60);

ALTER TABLE public.tack_groups
  ADD CONSTRAINT tack_groups_pkey PRIMARY KEY (id);

ALTER TABLE public.tack_groups
  ADD CONSTRAINT tack_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.tack_groups
  ADD CONSTRAINT tack_groups_user_id_name_key UNIQUE (user_id, name);

GRANT ALL ON public.tack_groups TO authenticated;

GRANT ALL ON public.tack_groups TO service_role;

CREATE INDEX tack_groups_user_id_idx ON public.tack_groups (user_id);

CREATE POLICY "Users manage their own tack groups" ON public.tack_groups
  TO authenticated
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE TABLE public.tack_tags (
  tack_id uuid NOT NULL,
  tag_id  uuid NOT NULL
);

ALTER TABLE public.tack_tags
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tack_tags
  ADD CONSTRAINT tack_tags_pkey PRIMARY KEY (tack_id, tag_id);

GRANT ALL ON public.tack_tags TO authenticated;

GRANT ALL ON public.tack_tags TO service_role;

CREATE INDEX tack_tags_tag_id_idx ON public.tack_tags (tag_id);

CREATE TABLE public.tacks (
  id             uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id        uuid                     NOT NULL,
  parent_tack_id uuid,
  group_id       uuid,
  title          text                     NOT NULL,
  description    text                     DEFAULT ''::text NOT NULL,
  status         public.tack_status       DEFAULT 'open'::public.tack_status NOT NULL,
  created_at     timestamp with time zone DEFAULT now() NOT NULL,
  updated_at     timestamp with time zone DEFAULT now() NOT NULL
);

CREATE POLICY "Users remove their own tack tags" ON public.tack_tags
  FOR DELETE
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM public.tacks
  WHERE ((tacks.id = tack_tags.tack_id) AND (tacks.user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Users view their own tack tags" ON public.tack_tags
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM public.tacks
  WHERE ((tacks.id = tack_tags.tack_id) AND (tacks.user_id = ( SELECT auth.uid() AS uid))))));

ALTER TABLE public.tacks
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tacks
  ADD CONSTRAINT tacks_check CHECK (parent_tack_id IS NULL OR parent_tack_id <> id);

ALTER TABLE public.tacks
  ADD CONSTRAINT tacks_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.tack_groups(id) ON DELETE SET NULL;

ALTER TABLE public.tacks
  ADD CONSTRAINT tacks_pkey PRIMARY KEY (id);

ALTER TABLE public.tack_tags
  ADD CONSTRAINT tack_tags_tack_id_fkey FOREIGN KEY (tack_id) REFERENCES public.tacks(id) ON DELETE CASCADE;

ALTER TABLE public.tacks
  ADD CONSTRAINT tacks_parent_tack_id_fkey FOREIGN KEY (parent_tack_id) REFERENCES public.tacks(id) ON DELETE CASCADE;

ALTER TABLE public.tacks
  ADD CONSTRAINT tacks_title_check CHECK (char_length(TRIM(BOTH FROM title)) >= 1 AND char_length(TRIM(BOTH FROM title)) <= 120);

ALTER TABLE public.tacks
  ADD CONSTRAINT tacks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

GRANT ALL ON public.tacks TO authenticated;

GRANT ALL ON public.tacks TO service_role;

CREATE INDEX tacks_status_idx ON public.tacks (status);

CREATE INDEX tacks_parent_tack_id_idx ON public.tacks (parent_tack_id);

CREATE INDEX tacks_group_id_idx ON public.tacks (group_id);

CREATE INDEX tacks_parent_wall_idx ON public.tacks (user_id, created_at DESC)
  WHERE parent_tack_id IS NULL;

CREATE INDEX tacks_user_id_idx ON public.tacks (user_id);

CREATE TRIGGER tacks_set_updated_at
  BEFORE UPDATE ON public.tacks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER validate_tack_hierarchy_trigger
  BEFORE INSERT OR UPDATE OF parent_tack_id, user_id ON public.tacks
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_tack_hierarchy();

CREATE POLICY "Users create their own tacks" ON public.tacks
  FOR INSERT
  TO authenticated
  WITH CHECK (((( SELECT auth.uid() AS uid) = user_id) AND ((group_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.tack_groups
  WHERE ((tack_groups.id = tacks.group_id) AND (tack_groups.user_id = ( SELECT auth.uid() AS uid))))))));

CREATE POLICY "Users delete their own tacks" ON public.tacks
  FOR DELETE
  TO authenticated
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users read their own tacks" ON public.tacks
  FOR SELECT
  TO authenticated
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users update their own tacks" ON public.tacks
  FOR UPDATE
  TO authenticated
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK (((( SELECT auth.uid() AS uid) = user_id) AND ((group_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.tack_groups
  WHERE ((tack_groups.id = tacks.group_id) AND (tack_groups.user_id = ( SELECT auth.uid() AS uid))))))));

CREATE TABLE public.tags (
  id         uuid                     DEFAULT gen_random_uuid() NOT NULL,
  user_id    uuid                     NOT NULL,
  name       text                     NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE POLICY "Users attach their own tags" ON public.tack_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (((EXISTS ( SELECT 1
   FROM public.tacks
  WHERE ((tacks.id = tack_tags.tack_id) AND (tacks.user_id = ( SELECT auth.uid() AS uid))))) AND (EXISTS ( SELECT 1
   FROM public.tags
  WHERE ((tags.id = tack_tags.tag_id) AND (tags.user_id = ( SELECT auth.uid() AS uid)))))));

ALTER TABLE public.tags
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tags
  ADD CONSTRAINT tags_name_check CHECK (char_length(TRIM(BOTH FROM name)) >= 1 AND char_length(TRIM(BOTH FROM name)) <= 40);

ALTER TABLE public.tags
  ADD CONSTRAINT tags_pkey PRIMARY KEY (id);

ALTER TABLE public.tack_tags
  ADD CONSTRAINT tack_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;

ALTER TABLE public.tags
  ADD CONSTRAINT tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

GRANT ALL ON public.tags TO authenticated;

GRANT ALL ON public.tags TO service_role;

CREATE UNIQUE INDEX tags_user_name_unique_idx ON public.tags (user_id, lower(name));

CREATE INDEX tags_user_id_idx ON public.tags (user_id);

CREATE POLICY "Users manage their own tags" ON public.tags
  TO authenticated
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE EVENT TRIGGER ensure_rls
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION public.rls_auto_enable();
