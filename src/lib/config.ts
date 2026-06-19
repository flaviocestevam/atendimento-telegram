// Feature flags globais.
// AUTH_ENABLED = false → modo demo (login desativado, admin demo abre direto).
export const AUTH_ENABLED = false;

// Status dos secrets opcionais (lidos do bundle, nunca expõem o valor real).
// Cada flag VITE_* é populada via .env durante o build quando o segredo correspondente está configurado.
export const SECRETS_STATUS = {
  telegram: !!import.meta.env.VITE_TELEGRAM_CONFIGURED,
  caktoApiKey: !!import.meta.env.VITE_CAKTO_API_KEY_CONFIGURED,
  caktoClientId: !!import.meta.env.VITE_CAKTO_CLIENT_ID_CONFIGURED,
  caktoClientSecret: !!import.meta.env.VITE_CAKTO_CLIENT_SECRET_CONFIGURED,
  caktoWebhookSecret: !!import.meta.env.VITE_CAKTO_CONFIGURED,
  xai: !!import.meta.env.VITE_XAI_KEY_CONFIGURED,
  elevenlabs: !!import.meta.env.VITE_ELEVENLABS_CONFIGURED,
};

// Aviso global: o sistema funciona inteiro mesmo com Grok desligado.
export const GROK_OPTIONAL_NOTE =
  "Com Grok desligado, o sistema continua funcionando com atendimento manual, respostas rápidas, automações, funis, Cakto e Telegram.";
