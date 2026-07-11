CREATE TABLE public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  telegram_group_id UUID REFERENCES public.telegram_groups(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  sent_at TIMESTAMPTZ,
  error TEXT,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_posts TO authenticated;
GRANT ALL ON public.scheduled_posts TO service_role;

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage scheduled_posts"
  ON public.scheduled_posts FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX idx_scheduled_posts_due ON public.scheduled_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_scheduled_posts_profile ON public.scheduled_posts(seller_profile_id);

CREATE TRIGGER set_scheduled_posts_updated_at
  BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();