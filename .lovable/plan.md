## Escopo
Atualização grande: ~30 tabelas (novas + adaptadas), 20+ edge/server functions, variáveis de ambiente, e dados mock. Vou executar em **4 fases sequenciais** para não estourar nenhuma chamada e permitir revisão entre etapas.

⚠️ **Importante**: o banco atual tem tabelas com **shapes diferentes** dos pedidos (ex.: `ai_settings` já tem `grok_global_mode`, `automation_rules` usa `trigger` enum, `cakto_events` já existe com colunas próprias, etc.). Para não quebrar o painel atual, vou **adicionar colunas faltantes** e **criar tabelas novas**, em vez de recriar. Onde os nomes batem mas o tipo difere, mantenho o existente e adiciono colunas paralelas só se necessário.

## Fase 1 — Migration de schema (esta etapa)

**Tabelas novas:**
`seller_profiles`, `funnel_steps`, `funnel_memberships`, `story_funnels`, `story_steps`, `story_funnel_memberships`, `story_funnel_metrics`, `commercial_profiles`, `commercial_events`, `emotional_profiles`, `emotional_memories`, `lead_memories`, `objection_types`, `objection_detections`, `response_performance`, `cakto_webhook_events`, `voice_settings`, `leads` (nova — separada de `telegram_users`).

**Tabelas adaptadas (ADD COLUMN IF NOT EXISTS):**
- `seller_profile_id` em todas as principais (telegram_users, telegram_groups, plans, contents, orders, payments, access_grants, conversations, messages, quick_replies, automation_rules, funnels, ai_settings, ai_learnings, cakto_events, knowledge_base, activity_logs).
- `telegram_users`: campos extras (language_code, is_blocked).
- `plans`: cakto_offer_id, cakto_checkout_url, external_reference, post_purchase_message, renewal_message, grok_can_offer, access_type, telegram_group_id.
- `contents`: delivery_type, delivery_payload, delivery_file_url, cakto_*, external_reference, access_duration_days, lifetime_access, post_purchase_message, upsell_*, grok_can_offer, tags.
- `orders`: lead_id, item_type, provider, provider_order_id, checkout_url, metadata, paid_at.
- `payments`: lead_id, provider, provider_payment_id, provider_order_id, method, checkout_url, raw_payload, approved_at.
- `access_grants`: lead_id, delivery_payload.
- `conversations`: lead_id, grok_enabled, grok_mode, assigned_to, last_message_at.
- `messages`: lead_id, direction, sender_type, text, raw_payload.
- `quick_replies`: reply_type, conversion_count.
- `automation_rules`: trigger_event (texto livre), condition_json, delay_minutes, action_type.
- `funnels`: goal, grok_mode.
- `ai_settings`: require_approval_for_offers, require_approval_for_funnel_changes, enable_auto_reply.
- `ai_learnings`: learning_type, title, description, confidence, suggested_action, approved_by_admin, approved_at.

**Criação automática:** 1 `seller_profile` padrão na própria migration; default backfill nos `seller_profile_id` das linhas existentes.

**Sem RLS estrita ainda** (modo demo ativo). Grants para `authenticated` e `service_role`. RLS habilitada com policy permissiva temporária (`USING true`) para não quebrar o painel demo.

## Fase 2 — Variáveis de ambiente
- Já existem: `SUPABASE_URL`, `SUPABASE_*_KEY`, `LOVABLE_API_KEY`.
- Vou solicitar via `add_secret`: `TELEGRAM_BOT_TOKEN`, `CAKTO_API_KEY`, `CAKTO_CLIENT_ID`, `CAKTO_CLIENT_SECRET`, `CAKTO_WEBHOOK_SECRET`, `XAI_API_KEY` (opcional), `XAI_MODEL`, `GROK_ENABLED`, `ELEVENLABS_API_KEY` (opcional), `APP_PUBLIC_URL`.
- Tudo é opcional em runtime: cada função checa `if (!process.env.X) return early`.

## Fase 3 — Server functions / endpoints
Vou criar como **TanStack server functions** (`createServerFn`) em `src/lib/*.functions.ts` e **server routes públicas** para webhooks em `src/routes/api/public/*`:

Webhooks/públicas:
- `cakto/webhook.ts` (já existe — vou estender com parser de status flexível e gravação em `cakto_webhook_events`)
- `telegram/webhook.ts` (já existe — vou estender com fluxo Grok manual/suggest/auto/paused)

Server functions (`src/lib/`):
- `cakto.functions.ts`: `createCaktoCheckout`
- `telegram.functions.ts`: `sendTelegramMessage`, `sendTelegramFile`, `createInviteLink`, `removeFromGroup`
- `access.functions.ts`: `grantAccess`, `revokeExpiredAccess`
- `delivery.functions.ts`: `sendContentDelivery`
- `automation.functions.ts`: `runAutomationRules`
- `funnel.functions.ts`: `moveLeadToFunnel`, `advanceFunnelStep`
- `story.functions.ts`: `moveLeadToStoryFunnel`, `advanceStoryStep`, `evaluateStoryPerformance`
- `grok.functions.ts`: `callGrok`, `generateGrokSuggestion`, `processGrokAutoReply` (no-op silencioso se `!XAI_API_KEY` ou `GROK_ENABLED=false`)
- `analysis.functions.ts`: `analyzeMessage`, `updateCommercialProfile`, `updateEmotionalProfile`, `detectObjection`
- `learnings.functions.ts`: `evaluateFunnelPerformance`

Cada função grava `activity_logs` quando relevante. **Nenhuma libera acesso sem `payment.status='approved'`**.

## Fase 4 — Mocks (via `supabase--insert`)
1 seller_profile, 4 planos, 6 conteúdos, 3 grupos, 20 leads, 12 conversas, 10 quick_replies, 8 automações, 6 funis, 6 histórias, 20 pagamentos, 10 access_grants, 10 lead_memories, 10 emotional_memories, 10 objection_detections, 10 ai_learnings. Nomes genéricos.

---

## O que NÃO mudo
- Layout, sidebar, cards, tabelas, identidade visual.
- Modo demo (login desligado).
- Tabelas existentes que já funcionam (só adiciono colunas).
- `src/integrations/supabase/*` auto-gerados.

## Ordem de execução
Fase 1 (migration) → você aprova → Fase 2 (secrets) → Fase 3 (functions) → Fase 4 (mocks). Cada fase confirma antes de seguir.

**Posso começar pela Fase 1 (migration de schema) agora?**