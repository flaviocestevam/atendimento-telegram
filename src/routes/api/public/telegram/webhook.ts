import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";

// Webhook público do Telegram.
// Valida o X-Telegram-Bot-Api-Secret-Token derivado do TELEGRAM_API_KEY (conector).
// Cria/atualiza o lead em telegram_users, a conversa e grava a mensagem recebida.
export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.TELEGRAM_API_KEY;
        if (!apiKey) return new Response("Telegram not configured", { status: 503 });

        const expected = createHash("sha256").update(`telegram-webhook:${apiKey}`).digest("base64url");
        const actual = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        const a = Buffer.from(actual);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = await request.json();
        const msg = update.message ?? update.edited_message ?? update.callback_query?.message;
        if (!msg?.chat?.id) return Response.json({ ok: true, ignored: true });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const tgId = String(msg.from?.id ?? msg.chat.id);
        // upsert lead
        const { data: lead } = await supabaseAdmin
          .from("telegram_users")
          .upsert({
            telegram_id: tgId,
            first_name: msg.from?.first_name ?? null,
            last_name: msg.from?.last_name ?? null,
            username: msg.from?.username ?? null,
          }, { onConflict: "telegram_id" })
          .select("id")
          .single();

        if (!lead) return Response.json({ ok: false }, { status: 500 });

        // upsert conversa
        const { data: conv } = await supabaseAdmin
          .from("conversations")
          .upsert({
            telegram_user_id: lead.id,
            last_message_at: new Date().toISOString(),
          }, { onConflict: "telegram_user_id" })
          .select("id")
          .single();

        if (conv) {
          await supabaseAdmin.from("messages").insert({
            conversation_id: conv.id,
            telegram_user_id: lead.id,
            direction: "inbound",
            sender: "lead",
            sender_type: "user",
            kind: msg.text ? "text" : msg.photo ? "image" : msg.document ? "file" : msg.voice ? "audio" : "text",
            text: msg.text ?? msg.caption ?? "",
            payload: msg,
          });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
