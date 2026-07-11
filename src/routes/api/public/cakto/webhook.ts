import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

// Webhook GLOBAL da Cakto (fallback quando o Cakto do vendedor não está por-perfil).
// Prefira usar /api/public/cakto/webhook/{profileId} — cada influenciadora tem seu secret.
export const Route = createFileRoute("/api/public/cakto/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.CAKTO_WEBHOOK_SECRET;
        const body = await request.text();

        if (secret) {
          const sig = request.headers.get("x-cakto-signature") ?? request.headers.get("x-signature") ?? "";
          const expected = createHmac("sha256", secret).update(body).digest("hex");
          const a = Buffer.from(sig);
          const b = Buffer.from(expected);
          if (a.length !== b.length || !timingSafeEqual(a, b)) {
            return new Response("Invalid signature", { status: 401 });
          }
        }

        let payload: any;
        try { payload = JSON.parse(body); } catch { return new Response("Bad JSON", { status: 400 }); }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: rawEvent } = await supabaseAdmin
          .from("cakto_webhook_events")
          .insert({
            event_id: payload.event_id ?? null,
            event_type: payload.event ?? payload.status ?? null,
            provider_order_id: payload.order_id ?? null,
            provider_payment_id: payload.payment_id ?? payload.id ?? null,
            payload,
          })
          .select("id")
          .single();

        const { processCaktoEvent } = await import("@/lib/cakto-processor.server");
        const result = await processCaktoEvent({ payload, sellerProfileId: null, rawEventId: rawEvent?.id ?? null });
        return Response.json(result);
      },
    },
  },
});
