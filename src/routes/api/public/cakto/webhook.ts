import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

// Webhook público da Cakto.
// - Valida HMAC SHA-256 do corpo com CAKTO_WEBHOOK_SECRET (se configurado).
// - Grava todos os eventos em `cakto_webhook_events` (eventos brutos) e `cakto_events` (legado).
// - Faz parser FLEXÍVEL de status (approved/paid/completed/cancelled/failed/refunded).
// - Se vincular a um payment: marca como approved e dispara `grantAccess()`.
// - NUNCA libera acesso sem payment.status='approved'.

const APPROVED_STATUSES = new Set(["approved", "paid", "payment_approved", "order_paid", "completed", "success"]);
const PENDING_STATUSES = new Set(["pending", "waiting_payment", "checkout_created"]);
const FAILED_STATUSES = new Set(["cancelled", "canceled", "failed", "refused", "expired"]);
const REFUND_STATUSES = new Set(["refunded", "chargeback"]);

function normalizeStatus(raw: string): string {
  const s = String(raw).toLowerCase();
  if (APPROVED_STATUSES.has(s)) return "approved";
  if (PENDING_STATUSES.has(s)) return "pending";
  if (FAILED_STATUSES.has(s)) return "cancelled";
  if (REFUND_STATUSES.has(s)) return "refunded";
  return s;
}

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

        const externalRef = payload.external_reference ?? payload.metadata?.external_reference ?? null;
        const caktoPaymentId = payload.payment_id ?? payload.id ?? null;
        const caktoOrderId = payload.order_id ?? null;
        const rawStatus = payload.status ?? payload.event ?? "pending";
        const normalized = normalizeStatus(rawStatus);
        const buyerEmail = payload.customer?.email ?? payload.buyer?.email ?? null;
        const amount = Number(payload.amount ?? payload.total ?? 0) || null;

        // 1. Evento bruto (tabela nova)
        const { data: rawEvent } = await supabaseAdmin
          .from("cakto_webhook_events")
          .insert({
            event_id: payload.event_id ?? null,
            event_type: rawStatus,
            provider_order_id: caktoOrderId,
            provider_payment_id: caktoPaymentId,
            payload,
          })
          .select("id")
          .single();

        // 2. Evento "ativo" (tabela existente, com vinculação)
        const { data: event } = await supabaseAdmin
          .from("cakto_events")
          .insert({
            payload, buyer_email: buyerEmail, amount,
            status: normalized,
            external_reference: externalRef,
            cakto_payment_id: caktoPaymentId,
            action: "pending",
          })
          .select("id")
          .single();

        // 3. Vincular ao payment
        let payment: any = null;
        if (caktoPaymentId) {
          const { data } = await supabaseAdmin
            .from("payments").select("*").eq("cakto_payment_id", caktoPaymentId).maybeSingle();
          payment = data;
        }
        if (!payment && externalRef) {
          const { data } = await supabaseAdmin
            .from("payments")
            .select("*,orders!inner(external_reference)")
            .eq("orders.external_reference", externalRef)
            .maybeSingle();
          payment = data;
        }

        if (!payment) {
          await supabaseAdmin.from("cakto_webhook_events")
            .update({ processed: true, processing_error: "payment_not_found", processed_at: new Date().toISOString() })
            .eq("id", rawEvent!.id);
          return Response.json({ ok: true, linked: false, event_id: event?.id });
        }

        // 4. Atualiza status do payment + order
        const updateData: any = {
          status: normalized,
          cakto_payment_id: caktoPaymentId ?? payment.cakto_payment_id,
          cakto_order_id: caktoOrderId ?? payment.cakto_order_id,
          event_payload: payload,
          raw_payload: payload,
        };
        if (normalized === "approved") updateData.approved_at = new Date().toISOString();
        await supabaseAdmin.from("payments").update(updateData).eq("id", payment.id);

        if (normalized === "approved" && payment.order_id) {
          await supabaseAdmin.from("orders").update({
            status: "paid",
            paid_at: new Date().toISOString(),
          }).eq("id", payment.order_id);
        }

        await supabaseAdmin.from("cakto_events").update({
          action: "linked", linked_payment_id: payment.id,
        }).eq("id", event!.id);

        // 5. Liberar acesso se aprovado
        let grantResult: any = null;
        if (normalized === "approved") {
          const { grantAccess } = await import("@/lib/access.functions");
          grantResult = await grantAccess({ data: { paymentId: payment.id } });
        }

        await supabaseAdmin.from("cakto_webhook_events")
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq("id", rawEvent!.id);

        return Response.json({
          ok: true,
          linked: true,
          payment_id: payment.id,
          normalized_status: normalized,
          grant: grantResult ? { ok: grantResult.ok, grant_id: grantResult.grantId } : null,
        });
      },
    },
  },
});
