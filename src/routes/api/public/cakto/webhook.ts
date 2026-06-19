import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

// Webhook público da Cakto.
// - Valida HMAC SHA-256 do corpo com CAKTO_WEBHOOK_SECRET.
// - Grava todos os eventos em cakto_events (idempotente por cakto_payment_id).
// - Se conseguir vincular por external_reference, marca o payment como approved
//   e dispara liberação de acesso/entrega (a fazer quando Telegram estiver ativo).
export const Route = createFileRoute("/api/public/cakto/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.CAKTO_WEBHOOK_SECRET;
        const body = await request.text();

        if (secret) {
          const signature = request.headers.get("x-cakto-signature") ?? request.headers.get("x-signature") ?? "";
          const expected = createHmac("sha256", secret).update(body).digest("hex");
          const a = Buffer.from(signature);
          const b = Buffer.from(expected);
          if (a.length !== b.length || !timingSafeEqual(a, b)) {
            return new Response("Invalid signature", { status: 401 });
          }
        }

        let payload: any;
        try { payload = JSON.parse(body); } catch { return new Response("Bad JSON", { status: 400 }); }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const external_reference = payload.external_reference ?? payload.metadata?.external_reference ?? null;
        const cakto_payment_id = payload.payment_id ?? payload.id ?? null;
        const cakto_order_id = payload.order_id ?? null;
        const status = payload.status ?? payload.event ?? "pending";
        const buyer_email = payload.customer?.email ?? payload.buyer?.email ?? null;
        const amount = Number(payload.amount ?? payload.total ?? 0) || null;

        // 1. Registrar evento bruto
        const { data: eventRow } = await supabaseAdmin.from("cakto_events").insert({
          payload, buyer_email, amount, status, external_reference, cakto_payment_id,
        }).select("id").single();

        // 2. Tentar vincular ao pagamento existente
        let payment: any = null;
        if (cakto_payment_id) {
          const { data } = await supabaseAdmin.from("payments").select("*").eq("cakto_payment_id", cakto_payment_id).maybeSingle();
          payment = data;
        }
        if (!payment && external_reference) {
          const { data } = await supabaseAdmin.from("payments").select("*,orders!inner(external_reference)").eq("orders.external_reference", external_reference).maybeSingle();
          payment = data;
        }

        if (!payment) {
          // não bloqueia o webhook — fica em cakto_events para vinculação manual
          return Response.json({ ok: true, linked: false, event_id: eventRow?.id });
        }

        // 3. Atualizar status
        const newStatus = ["approved", "paid", "completed"].includes(String(status).toLowerCase()) ? "approved" : String(status);
        await supabaseAdmin.from("payments").update({
          status: newStatus,
          cakto_payment_id: cakto_payment_id ?? payment.cakto_payment_id,
          cakto_order_id: cakto_order_id ?? payment.cakto_order_id,
          event_payload: payload,
          approved_at: newStatus === "approved" ? new Date().toISOString() : payment.approved_at,
        }).eq("id", payment.id);

        await supabaseAdmin.from("cakto_events").update({ action: "linked", linked_payment_id: payment.id }).eq("id", eventRow!.id);

        // TODO: quando o Telegram estiver ativo: criar access_grant + enviar conteúdo/link de grupo.

        return Response.json({ ok: true, linked: true, payment_id: payment.id });
      },
    },
  },
});
