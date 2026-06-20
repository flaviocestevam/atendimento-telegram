# Deixar a plataforma pronta para a primeira vendedora

## Contexto
- A página **Configurações** já está completa (abas Perfil, Telegram, Cakto, Grok, Voz, Plataforma).
- A UI já mostra URLs de webhook por-perfil, mas **essas rotas dinâmicas ainda não existem** — só existem as globais (`/api/public/telegram/webhook` e `/api/public/cakto/webhook`).
- Não há tela de onboarding nem indicador visual de "está tudo conectado".
- Como combinado, **não vou mexer em roles/permissões** (admin único acessa tudo).

## O que vou fazer

### 1. Webhooks dinâmicos por-perfil
**Telegram** — nova rota `src/routes/api/public/telegram/webhook.$botId.ts`
- Recebe o id do `seller_bots` na URL.
- Resolve `telegram_bot_token` daquele perfil (não usa o conector global).
- Mesmo fluxo de upsert/comandos do webhook global, mas usando o token direto da Telegram Bot API (`https://api.telegram.org/bot<token>/<method>`).
- Marca todos os registros com o `seller_profile_id` correto.

**Cakto** — nova rota `src/routes/api/public/cakto/webhook.$profileId.ts`
- Valida HMAC com `cakto_webhook_secret` daquele perfil (lido em `seller_cakto_settings`).
- Grava `seller_profile_id` nos `cakto_events` / `cakto_webhook_events`.
- Resto do fluxo idêntico ao global (vincular payment, liberar acesso).

### 2. Card "Status das Integrações" no Dashboard
Card novo no topo do `/dashboard` mostrando 4 pílulas para o perfil ativo:
- **Telegram bot**: ok se `seller_bots.telegram_bot_token` existe e último teste foi `active`.
- **Cakto**: ok se `seller_cakto_settings.cakto_api_key` + `cakto_webhook_secret` existem.
- **Grok/IA**: ok se chave (perfil ou global) disponível.
- **Pelo menos 1 plano ou conteúdo ativo**: ok se `plans.is_active` ou `contents.is_active`.

Cada pílula vermelha tem botão "Configurar" levando para a aba certa de `/configuracoes`.

### 3. Wizard de onboarding `/perfis/novo`
Fluxo guiado em 5 passos numa única página com stepper:
1. **Dados básicos** → cria `seller_profiles` (nome, username, avatar, bio).
2. **Telegram** → grava `seller_bots` (token) + botão "Testar bot".
3. **Cakto** → grava `seller_cakto_settings` (chave + secret) + exibe URL do webhook para colar no painel Cakto.
4. **Pelo menos 1 plano** → form simples (nome, descrição, preço em centavos, duração) → insere em `plans`.
5. **IA (opcional)** → grava `seller_grok_settings` (chave + system_prompt + modo `auto_by_funnel`).

Ao concluir: marca `seller_profiles.status = 'active'`, define como perfil ativo, e redireciona para `/dashboard`.

A página `/perfis` ganha botão **"+ Nova vendedora"** no topo levando para `/perfis/novo`.

## Não-objetivos
- Não mexer em roles ou RLS multi-tenant (confirmado pelo usuário).
- Não criar UI nova para ElevenLabs/voz (já está em Configurações).
- Não tocar nos webhooks globais existentes — continuam funcionando como fallback.

## Detalhes técnicos
- TanStack file-based: arquivos `webhook.$botId.ts` para parâmetro dinâmico.
- Healthcheck no dashboard: 1 server fn `getIntegrationStatus({ profileId })` que retorna `{ telegram, cakto, grok, catalog }` — evita 4 queries no client.
- Wizard usa `useState` com índice de passo + `react-hook-form` por passo (já é dependência).
