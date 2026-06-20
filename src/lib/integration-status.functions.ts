import { createServerFn } from "@tanstack/react-start";

// Status agregado das integrações de um perfil.
// Retorna pílulas verde/amarelo para o card no Dashboard.

export const getIntegrationStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { sellerProfileId: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const pid = data.sellerProfileId;

    const [bot, cakto, grok, voice, plansCount, contentsCount] = await Promise.all([
      supabaseAdmin.from("seller_bots").select("telegram_bot_token, status, last_error, bot_username").eq("seller_profile_id", pid).maybeSingle(),
      supabaseAdmin.from("seller_cakto_settings").select("cakto_api_key, cakto_webhook_secret").eq("seller_profile_id", pid).maybeSingle(),
      supabaseAdmin.from("seller_grok_settings").select("xai_api_key, enable_ai, global_mode, model").eq("seller_profile_id", pid).maybeSingle(),
      supabaseAdmin.from("seller_voice_settings").select("elevenlabs_api_key, enabled").eq("seller_profile_id", pid).maybeSingle(),
      supabaseAdmin.from("plans").select("id", { count: "exact", head: true }).eq("seller_profile_id", pid).eq("is_active", true),
      supabaseAdmin.from("contents").select("id", { count: "exact", head: true }).eq("seller_profile_id", pid).eq("is_active", true),
    ]);

    const hasGrokKey = !!grok.data?.xai_api_key || !!process.env.XAI_API_KEY;

    return {
      telegram: {
        configured: !!bot.data?.telegram_bot_token,
        status: bot.data?.status ?? "inactive",
        botUsername: bot.data?.bot_username ?? null,
        lastError: bot.data?.last_error ?? null,
      },
      cakto: {
        configured: !!cakto.data?.cakto_api_key,
        hasWebhookSecret: !!cakto.data?.cakto_webhook_secret,
      },
      grok: {
        configured: hasGrokKey,
        enabled: !!grok.data?.enable_ai,
        mode: grok.data?.global_mode ?? "off",
        model: grok.data?.model ?? "grok-4-latest",
      },
      voice: {
        configured: !!voice.data?.elevenlabs_api_key,
        enabled: !!voice.data?.enabled,
      },
      catalog: {
        plans: plansCount.count ?? 0,
        contents: contentsCount.count ?? 0,
        ok: (plansCount.count ?? 0) + (contentsCount.count ?? 0) > 0,
      },
    };
  });
