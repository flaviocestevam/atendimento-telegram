CREATE TABLE IF NOT EXISTS public.presentinho_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  suggested_message TEXT,
  image_url TEXT,
  emoji TEXT DEFAULT '💛',
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.presentinho_catalog TO authenticated;
GRANT ALL ON public.presentinho_catalog TO service_role;

ALTER TABLE public.presentinho_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage presentinho catalog" 
  ON public.presentinho_catalog FOR ALL 
  TO authenticated 
  USING (true) WITH CHECK (true);

INSERT INTO public.presentinho_catalog (name, description, price_cents, suggested_message, emoji, sort_order) VALUES
('Café da manhã surpresa', 'Para ela acordar feliz pensando nele', 1990, 'amor... se você quiser me acordar sorrindo hoje, tem um presentinho que é tipo um café da manhã gostoso que eu ia amar receber de você 💛', '☕', 1),
('Lingerie nova', 'Para ficar mais gostosa pra ele', 4970, 'tava aqui pensando em comprar uma lingerie bem safada pra te mandar foto... se quiser me ajudar com isso é só mandar um presentinho que eu fico toda feliz pra você 😈', '🩷', 2),
('Dia de Spa', 'Pra ela se cuidar e ficar ainda melhor pra ele', 9970, 'tô precisando me cuidar um pouco, tô toda estressada... se meu homem quiser me mimar com um dia de spa eu ia ficar derretida de tesão por você 💆‍♀️', '✨', 3),
('Presente Surpresa', 'Valor livre', 0, 'não precisa não amor... mas se quiser me fazer uma surpresa hoje e me deixar feliz, tem o botão de presentinho aqui. Qualquer coisinha já me deixa louca por você 💕', '🎁', 4);