import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";
import { processTelegramUpdate } from "@/lib/telegram-bot-handler.server";

// Webhook GLOBAL do Telegram (bot configurado no conector Lovable).
// Mantido para retro-compatibilidade. Cada perfil deve preferir o webhook por-perfil.

const GATEWAY = "https://connector-gateway.lovable.dev/telegram";

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.TELEGRAM_API_KEY;
        const lovableKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Telegram not configured", { status: 503 });

        const expected = createHash("sha256").update(`telegram-webhook:${apiKey}`).digest("base64url");
        const actual = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        const a = Buffer.from(actual);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = await request.json();

        const tgSend = async (method: string, body: unknown) => {
          if (!lovableKey) return null;
          return fetch(`${GATEWAY}/${method}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "X-Connection-Api-Key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }).then((r) => r.json()).catch(() => null);
        };

        const result = await processTelegramUpdate({ update, sellerProfileId: null, tgSend });
        return Response.json(result);
      },
    },
  },
});
