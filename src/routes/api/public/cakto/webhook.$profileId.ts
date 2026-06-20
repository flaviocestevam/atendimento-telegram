import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

// Webhook por-perfil da Cakto.
// URL: /api/public/cakto/webhook/{profileId}
// - Lê o secret HMAC do seller_cakto_settings desse perfil.
// - Grava `seller_profile_id` em todos os registros.

const APPROVED = new Set(["approved", "paid", "payment_approved", "order_paid", "completed", "success"]);
const PENDING = new Set(["pending", "waiting_payment", "checkout_created"]);
const FAILED = new Set(["cancelled", "canceled", "failed", "refused", "expired"]);
const REFUND = new Set(["refunded", "chargeback"]);

function normalizeStatus(raw: string): string {
  const s = String(raw).toLowerCase();
  if (APPROVED.has(s)) return "approved";
  if (PENDING.has(s)) return "pending";
  if (FAILED.has(s)) return "cancelled";
  if (REFUND.has(s)) return "refunded";
  return s;
}

export const Route = createFileRoute("/api/public/cakto/webhook/$profileId")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const profileId = params.profileId;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: cfg } = await supabaseAdmin
          .from("seller_cakto_settings")
          .select("cakto_webhook_secret")
          .eq("seller_profile_id", profileId)
          .maybeSingle();

        const body = await request.text();
        const secret = cfg?.cakto_webhook_secret || process.env.CAKTO_WEBHOOK_SECRET;

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

        const externalRef = payload.external_reference ?? payload.metadata?.external_reference ?? null;
        const caktoPaymentId = payload.payment_id ?? payload.id ?? null;
        const caktoOrderId = payload.order_id ?? null;
        const rawStatus = payload.status ?? payload.event ?? "pending";
        const normalized = normalizeStatus(rawStatus);
        const buyerEmail = payload.customer?.email ?? payload.buyer?.email ?? null;
        const amount = Number(payload.amount ?? payload.total ?? 0) || null;

        const { data: rawEvent } = await supabaseAdmin
          .from("cakto_webhook_events")
          .insert({
            event_id: payload.event_id ?? null,
            event_type: rawStatus,
            provider_order_id: caktoOrderId,
            provider_payment_id: caktoPaymentId,
            seller_profile_id: profileId,
            payload,
          })
          .select("id")
          .single();

        const { data: event } = await supabaseAdmin
          .from("cakto_events")
          .insert({
            payload, buyer_email: buyerEmail, amount,
            status: normalized,
            external_reference: externalRef,
            cakto_payment_id: caktoPaymentId,
            seller_profile_id: profileId,
            action: "pending",
          })
          .select("id")
          .single();

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
