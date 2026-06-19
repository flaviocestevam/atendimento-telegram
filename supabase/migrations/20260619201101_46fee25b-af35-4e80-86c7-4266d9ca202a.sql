DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP POLICY IF EXISTS "Users see own roles" ON public.user_roles;