
# Plano: Plataforma de Atendimento/Venda via Telegram

Atualização incremental do projeto existente. **Mantém todo o visual atual** (sidebar, cards, tabelas, dark premium, tipografia, espaçamentos). Só altera lógica, conteúdo das telas, módulos novos, integrações e schema.

---

## 1. Modo demo (login desativado)

- Remover o gate de auth: `src/routes/_authenticated/route.tsx` deixa de redirecionar para `/auth`. Em vez disso, injeta um `user` mock de admin no contexto.
- Banner discreto no topo do layout: "Modo desenvolvimento: login desativado".
- Manter arquivos do Supabase Auth, `auth-middleware`, `auth-attacher` e `/auth` intactos para reativação futura (apenas uma flag `AUTH_ENABLED=false` em `src/lib/config.ts`).
- Server functions hoje protegidas com `requireSupabaseAuth` passam a usar um middleware `requireAdminOrDemo` que, com `AUTH_ENABLED=false`, devolve um `userId` fixo de demo.

## 2. Banco (migrations adicionais — não recriar o que já existe)

Adições às tabelas existentes e novas tabelas. RLS aberta enquanto em modo demo (policies `USING (true)` + GRANT a `authenticated` e `service_role`); preparada para apertar quando auth ligar.

Alterações:
- `plans`: + `cakto_offer_id`, `cakto_checkout_url`, `external_reference`, `post_purchase_message`, `renewal_message`, `grok_can_offer bool`.
- `contents`: + `delivery_type` (text/link/file/image/video/audio/private_area), `delivery_payload jsonb`, `cakto_offer_id`, `cakto_checkout_url`, `external_reference`, `upsell_content_id`, `grok_can_offer bool`.
- `payments`: + `cakto_order_id`, `cakto_payment_id`, `checkout_url`, `event_payload jsonb`, `approved_at`. Status enum estendido: pending, checkout_sent, approved, cancelled, expired, failed, refunded.
- `orders`: + `external_reference`, `cakto_order_id`.
- `access_grants`: + `expires_at` index, status enum.
- `conversations`: + `grok_mode` (off/suggest/auto), `needs_human bool`, `current_funnel_id`, `current_story_id`, `current_step`, `temperature`, `score_buy`, `score_relationship`, `last_interaction_at`.
- `messages`: + `sender` (lead/admin/bot/automation/grok), `kind` (text/audio/file/link/checkout/offer), `payload jsonb`.
- `telegram_users` (leads): + `score_buy`, `score_relationship`, `temperature`, `status` (enum acima), `tags text[]`, `total_spent`, `last_purchase_at`, `origin`.
- `automation_rules`: + `trigger` (enum), `actions jsonb`.
- `ai_settings`: + `grok_global_mode` (off/suggest/auto_per_funnel/auto_all), `xai_api_key_set bool`, `seller_profile jsonb` (tom, informalidade, gírias, mensagens curtas, pausas, horários, mensagens ausência/retorno, regras, promessas proibidas, prioridades, idioma).

Novas tabelas:
- `seller_profile` (singleton): nome exibido, avatar_url, bio, descrição, voice_tone, informality, use_slang, short_messages, split_messages, use_pauses, allow_typos, typo_rate, hours jsonb, away_msg, return_msg, commercial_rules text, emotional_rules text, forbidden_promises text[], priority_products uuid[], language.
- `funnels`: name, description, goal, type, status, ia_mode (off/suggest/auto), steps jsonb (message, delay, offer_id, action), metrics jsonb.
- `funnel_leads`: funnel_id, lead_id, current_step, entered_at, last_step_at, completed_at.
- `stories` (funis narrativos): name, category enum (curiosidade/proximidade/bastidores/transformação/confiança/urgência/reativação/upsell/educação/relacionamento), description, main_angle, emotional_angle, commercial_goal, main_product_id, subscription_id, upsell_id, steps jsonb, ia_mode, metrics jsonb.
- `story_leads`: story_id, lead_id, current_step, etc.
- `quick_replies`: title, category enum, body, type, active, usage_count, conversions.
- `memories`: lead_id, kind (commercial/emotional), content, tags, created_by (admin/grok).
- `objections`: lead_id, type enum (preço/desconfiança/vou_pensar/...), status (open/handled), suggested_reply, confidence, converted_after bool.
- `cakto_events`: payload jsonb, buyer_email, amount, status, received_at, linked_payment_id nullable, action (pending/linked/reprocessed/ignored).
- `ai_learnings`: kind, content, status (pending/approved/rejected), evidence jsonb.

## 3. Webhook Cakto + integração

- Server route público `src/routes/api/public/cakto/webhook.ts`: valida assinatura (secret `CAKTO_WEBHOOK_SECRET`), grava em `cakto_events`, tenta vincular por `external_reference`. Se vincular: atualiza `payments`, cria `access_grant`, dispara entrega (mensagem Telegram com conteúdo/link de grupo). Idempotente por `cakto_payment_id`.
- Server fn `createCaktoCheckout(planId|contentId, leadId)` que retorna `checkout_url` (template `${cakto_checkout_url}?ref=${external_reference}`).
- Secrets a pedir mais tarde: `CAKTO_WEBHOOK_SECRET`, `CAKTO_API_KEY` (se houver API).

## 4. Telegram

- Conector já documentado. Webhook em `src/routes/api/public/telegram/webhook.ts`: recebe updates, faz upsert do lead em `telegram_users`, cria/atualiza `conversation`, grava `message` (sender=lead), dispara automações por gatilho, e — se `grok_global_mode != off` e regras da conversa permitirem — chama Grok.
- Server fns: `sendTelegramMessage`, `sendTelegramFile`, `addToGroup`, `removeFromGroup`, `createInviteLink`.
- Entrega automática pós-pagamento via `sendTelegramMessage`/`sendTelegramFile`/`createInviteLink` conforme `delivery_type`.

## 5. IA / Grok (xAI) — opcional

- Provider helper `src/lib/grok.server.ts` usando `@ai-sdk/openai-compatible` apontando para `https://api.x.ai/v1` com header `Authorization: Bearer ${XAI_API_KEY}` (secret pedido somente quando o user ativar). Sem chave: feature flag `grok_available=false` em todas as telas.
- Server fns:
  - `grokSuggestReply(conversationId)` → retorna sugestão (não envia).
  - `grokAutoReply(conversationId)` → respeita `grok_global_mode`, `conversation.grok_mode`, regras de segurança (nunca liberar acesso sem `payments.status='approved'`, nunca inventar desconto/preço/garantia, etc.). Prompt-system constrói a partir de `seller_profile` + memórias + histórico + produtos + objeções.
- Toda chamada Grok grava `messages.sender='grok'` e atualiza métricas em `ai_settings`.

## 6. Telas (manter layout/cards/tabelas existentes; popular conteúdo + lógica)

Atualizar páginas já criadas e adicionar as ausentes. Cada uma usa os componentes existentes (`PageHeader`, `StatusBadge`, `Card`, `Table`, `Sidebar`):

- **Dashboard** (`dashboard.tsx`): cards listados + blocos "Atividade recente", "Funis top", "Histórias top", "Objeções comuns", "Aprendizados IA", "Precisam de humano".
- **Conversas** (`conversas.tsx`): inbox 3 colunas (lista filtrável, thread central com composer + botões: sugestão Grok, resposta rápida, oferecer plano/conteúdo, enviar checkout Cakto, mover funil/história, memória, áudio/arquivo, resolver; coluna direita com perfil do lead, status Grok, memórias, objeções, próxima ação, atalhos).
- **Leads** (nova `leads.tsx`): CRM tabular com filtros por status/tag/temperatura/funil; página do lead `/leads/$id` com abas Comercial/Emocional/Compras/Conversas/Funis/Memórias/Pagamentos/Acessos.
- **Perfil do Vendedor** (nova `perfil-vendedor.tsx`): formulário completo dos campos listados; alimenta o Grok.
- **Planos** (`planos.tsx`): CRUD com campos novos.
- **Conteúdos** (`conteudos.tsx`): CRUD + tipo de entrega + payload dinâmico.
- **Pagamentos** (`pagamentos.tsx`): tabela de pagamentos + aba "Eventos Cakto não vinculados" com ações vincular/reprocessar/ignorar.
- **Grupos** (`grupos.tsx`): CRUD + teste de conexão + gerar link + acessos ativos.
- **Respostas Rápidas** (nova `respostas-rapidas.tsx`).
- **Automações** (`automacao.tsx`): editor de regra (gatilho + ações encadeadas).
- **Funis** (nova `funis.tsx`): editor com etapas, delays, IA por funil, métricas.
- **Histórias** (nova `historias.tsx`): editor com categoria/ângulos/etapas/IA/métricas.
- **IA** (`ia.tsx`): seção Status (modo global Grok, XAI key configurada, custo, mensagens hoje, botão testar); Perfil IA (puxado do seller_profile); Regras; subseções Inteligência Comercial, Emocional, Objeções, Aprendizado.
- **Assinantes** (`assinantes.tsx`): adapta para mostrar acessos ativos/vencendo/vencidos.
- **Configurações** (`configuracoes.tsx`): toggle global Grok, modos, secrets status (Cakto, Telegram, xAI), AUTH_ENABLED.

Atualizar `AppSidebar` para incluir novos itens: Leads, Perfil do Vendedor, Respostas Rápidas, Funis, Histórias.

## 7. Regras e guards (mesmo com Grok desligado)

- Entrega/liberação de acesso só roda se `payments.status='approved'`.
- Função utilitária `assertPaid(orderId)` usada por todo handler de entrega.
- IA tem `safetyCheck(reply)` que rejeita respostas contendo padrões proibidos (preço/desconto/garantia/prova social não cadastrados).
- Resposta padrão se perguntarem "é IA?": texto fixo configurável.

## 8. Ordem de execução

1. Migrations (uma única, grande).
2. Desativar gate de auth + banner demo.
3. Atualizar AppSidebar + adicionar rotas novas (stubs).
4. Server fns: leads, planos, conteúdos, pagamentos, conversas, mensagens, funis, histórias, automações, memórias, objeções, quick replies, seller profile, ai settings.
5. Integrações: Cakto webhook + checkout; Telegram webhook + send; Grok provider + suggest/auto.
6. UIs completas (Dashboard, Conversas, Leads, Pagamentos, Perfil, Funis, Histórias, IA, etc.).
7. Seeds mínimos (uma seller_profile, alguns quick_replies e categorias de objeção) via migration.

## Observações

- **Não** vou tocar identidade visual: reuso `PageHeader`, `StatusBadge`, cards e tabelas atuais; só adiciono variantes de status quando o enum cresce.
- **Não** vou pedir secrets agora — só vou pedir `XAI_API_KEY`, `CAKTO_WEBHOOK_SECRET` e o conector Telegram quando você for ativar cada integração. Tudo funciona em modo manual sem isso.
- Tamanho real do trabalho: ~30 arquivos novos + ~15 editados + 1 migration grande. Vou executar em lotes, começando pela migration e pelo modo demo. Confirma?
