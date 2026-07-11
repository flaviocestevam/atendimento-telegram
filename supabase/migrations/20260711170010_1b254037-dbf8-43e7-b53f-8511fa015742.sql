
DO $$
BEGIN
  ALTER TYPE public.cakto_action ADD VALUE IF NOT EXISTS 'renewed';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE public.cakto_action ADD VALUE IF NOT EXISTS 'sub_canceled';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
