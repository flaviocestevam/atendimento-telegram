import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";
import { processTelegramUpdate } from "@/lib/telegram-bot-handler.server";

// Webhook por-perfil do Telegram.
// URL: /api/public/telegram/webhook/{botId} — onde botId = seller_bots.id
//
// O secret_token esperado é derivado do PRÓPRIO bot token (sha256 base64url).
// Assim cada bot tem seu próprio secret e não compartilha com o conector global.

export const Route = createFileRoute("/api/public/telegram/webhook/$botId")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: bot } = await supabaseAdmin
          .from("seller_bots")
          .select("id, seller_profile_id, telegram_bot_token")
          .eq("id", params.botId)
          .maybeSingle();

        if (!bot?.telegram_bot_token) {
          return new Response("Bot not configured", { status: 404 });
        }

        const expected = createHash("sha256")
          .update(`telegram-webhook:${bot.telegram_bot_token}`)
          .digest("base64url");
        const actual = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        const a = Buffer.from(actual);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = await request.json();

        // tgSend chama a Telegram Bot API diretamente com o token do perfil.
        const tgSend = async (method: string, body: unknown) => {
          const r = await fetch(`https://api.telegram.org/bot${bot.telegram_bot_token}/${method}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          return r.json().catch(() => null);
        };

        const result = await processTelegramUpdate({
          update,
          sellerProfileId: bot.seller_profile_id,
          tgSend,
        });
        return Response.json(result);
      },
    },
  },
});
