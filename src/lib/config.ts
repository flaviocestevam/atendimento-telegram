// Feature flags globais da plataforma.
// Quando AUTH_ENABLED = true, o gate de /_authenticated volta a exigir login,
// e o /auth volta a ser usado. Hoje (modo demo) tudo abre direto.
export const AUTH_ENABLED = false;

// Status atual dos secrets opcionais. Lidos do bundle para mostrar
// "configurado/não configurado" nas telas — nunca expõem o valor real.
export const SECRETS_STATUS = {
  xai: !!import.meta.env.VITE_XAI_KEY_CONFIGURED,
  cakto: !!import.meta.env.VITE_CAKTO_CONFIGURED,
  telegram: !!import.meta.env.VITE_TELEGRAM_CONFIGURED,
};
