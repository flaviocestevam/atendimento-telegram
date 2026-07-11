// Processador central de eventos Cakto.
// Usado por AMBOS webhooks (global e por-perfil) e pela função de reconciliação.
// server-only: importa client.server (service role, RLS bypass).
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const APPROVED = new Set(["approved", "paid", "payment_approved", "order_paid", "completed", "success"]);
const PENDING = new Set(["pending", "waiting_payment", "checkout_created"]);
const FAILED = new Set(["cancelled", "canceled", "failed", "refused", "expired"]);
const REFUND = new Set(["refunded", "chargeback"]);
const RENEWAL = new Set(["subscription_renewed", "renewal", "recurring_paid", "recurring_approved"]);
const SUB_CANCELED = new Set(["subscription_canceled", "subscription_cancelled", "subscription_ended"]);

export type CaktoNormalized =
  | "approved" | "pending" | "cancelled" | "refunded"
  | "subscription_renewed" | "subscription_canceled"
  | string;

export function normalizeStatus(raw: string): CaktoNormalized {
  const s = String(raw).toLowerCase();
  if (RENEWAL.has(s)) return "subscription_renewed";
  if (SUB_CANCELED.has(s)) return "subscription_canceled";
  if (APPROVED.has(s)) return "approved";
  if (PENDING.has(s)) return "pending";
  if (FAILED.has(s)) return "cancelled";
  if (REFUND.has(s)) return "refunded";
  return s;
}

export type ProcessInput = {
  payload: any;
  sellerProfileId?: string | null;  // vindo do path (/webhook/{profileId}) ou nulo no global
  rawEventId?: string | null;       // id em cakto_webhook_events (pra marcar processed)
};

export async function processCaktoEvent(input: ProcessInput) {
  const { payload, sellerProfileId, rawEventId } = input;

  const externalRef = payload.external_reference ?? payload.metadata?.external_reference ?? null;
  const caktoPaymentId = payload.payment_id ?? payload.id ?? null;
  const caktoOrderId = payload.order_id ?? null;
  const caktoSubId = payload.subscription_id ?? payload.subscription?.id ?? null;
  const rawStatus = payload.event ?? payload.status ?? "pending";
  const normalized = normalizeStatus(rawStatus);
  const buyerEmail = payload.customer?.email ?? payload.buyer?.email ?? null;
  const amount = Number(payload.amount ?? payload.total ?? 0) || null;

  // 1) Evento "ativo" (tabela legada com vinculação — mantida para UI de reconciliação)
  const { data: event } = await supabaseAdmin
    .from("cakto_events")
    .insert({
      payload, buyer_email: buyerEmail, amount,
      status: normalized,
      external_reference: externalRef,
      cakto_payment_id: caktoPaymentId,
      seller_profile_id: sellerProfileId ?? null,
      action: "pending",
    })
    .select("id")
    .single();

  // 2) Renovação de assinatura → tratar SEPARADAMENTE (não vincula a um payment novo pelo id)
  if (normalized === "subscription_renewed" && caktoSubId) {
    const renewalRes = await handleRenewal({ subscriptionId: caktoSubId, payload, amount, sellerProfileId });
    if (rawEventId) await markRawProcessed(rawEventId, renewalRes.ok ? null : (renewalRes.error ?? null));
    if (event) await supabaseAdmin.from("cakto_events").update({ action: (renewalRes.ok ? "renewed" : "pending") as any }).eq("id", event.id);
    return { event_id: event?.id, kind: "renewal" as const, ...renewalRes };
  }

  // 3) Cancelamento de assinatura → grant continua ativo até expires_at
  if (normalized === "subscription_canceled" && caktoSubId) {
    const cancelRes = await handleSubscriptionCanceled({ subscriptionId: caktoSubId, payload, sellerProfileId });
    if (rawEventId) await markRawProcessed(rawEventId, cancelRes.ok ? null : (cancelRes.error ?? null));
    if (event) await supabaseAdmin.from("cakto_events").update({ action: "sub_canceled" as any }).eq("id", event.id);
    return { event_id: event?.id, kind: "sub_canceled" as const, ...cancelRes };
  }

  // 4) Fluxo comum: vincular ao payment
  let payment: any = null;
  if (caktoPaymentId) {
    const { data } = await supabaseAdmin.from("payments").select("*").eq("cakto_payment_id", caktoPaymentId).maybeSingle();
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
    if (rawEventId) await markRawProcessed(rawEventId, "payment_not_found");
    return { ok: true, linked: false, event_id: event?.id, kind: "unlinked" };
  }

  const updateData: any = {
    status: normalized,
    cakto_payment_id: caktoPaymentId ?? payment.cakto_payment_id,
    cakto_order_id: caktoOrderId ?? payment.cakto_order_id,
    cakto_subscription_id: caktoSubId ?? payment.cakto_subscription_id,
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

  if (event) await supabaseAdmin.from("cakto_events").update({ action: "linked", linked_payment_id: payment.id }).eq("id", event.id);

  let grantResult: any = null;
  if (normalized === "approved") {
    const { grantAccess } = await import("@/lib/access.functions");
    grantResult = await grantAccess({ data: { paymentId: payment.id, caktoSubscriptionId: caktoSubId } });
  }

  if (rawEventId) await markRawProcessed(rawEventId, null);

  return {
    ok: true, linked: true, event_id: event?.id, kind: "payment",
    payment_id: payment.id, normalized_status: normalized,
    grant: grantResult ? { ok: grantResult.ok, grant_id: grantResult.grantId } : null,
  };
}

async function markRawProcessed(rawEventId: string, err: string | null) {
  await supabaseAdmin.from("cakto_webhook_events").update({
    processed: true,
    processed_at: new Date().toISOString(),
    processing_error: err,
  }).eq("id", rawEventId);
}

// Renovação: extende expires_at do grant ativo, cria payment novo marcado is_renewal.
async function handleRenewal(args: { subscriptionId: string; payload: any; amount: number | null; sellerProfileId?: string | null }) {
  const { data: grant } = await supabaseAdmin
    .from("access_grants")
    .select("*, plans(duration_days, price_cents, seller_profile_id)")
    .eq("cakto_subscription_id", args.subscriptionId)
    .eq("status", "active")
    .maybeSingle();

  if (!grant) return { ok: false, error: "grant_not_found_for_subscription" };
  const plan: any = (grant as any).plans;
  const days = plan?.duration_days ?? 30;

  const base = grant.expires_at && new Date(grant.expires_at) > new Date() ? new Date(grant.expires_at) : new Date();
  const newExpires = new Date(base);
  newExpires.setDate(newExpires.getDate() + days);
  const nextCharge = new Date(newExpires);

  await supabaseAdmin.from("access_grants").update({
    expires_at: newExpires.toISOString(),
    next_charge_at: nextCharge.toISOString(),
    renewal_count: (grant.renewal_count ?? 0) + 1,
  }).eq("id", grant.id);

  // Payment histórico (informativo — sem order novo pra não duplicar catálogo)
  await supabaseAdmin.from("payments").insert({
    seller_profile_id: grant.seller_profile_id ?? plan?.seller_profile_id ?? args.sellerProfileId,
    order_id: grant.order_id,
    lead_id: grant.lead_id,
    provider: "cakto",
    method: "recurring",
    status: "approved",
    amount_cents: args.amount ? Math.round(args.amount * 100) : (plan?.price_cents ?? 0),
    approved_at: new Date().toISOString(),
    cakto_subscription_id: args.subscriptionId,
    is_renewal: true,
    event_payload: args.payload,
    raw_payload: args.payload,
  });

  await supabaseAdmin.from("activity_logs").insert({
    type: "subscription_renewed",
    description: `Assinatura renovada (+${days} dias)`,
    metadata: { grant_id: grant.id, subscription_id: args.subscriptionId, new_expires_at: newExpires.toISOString() },
  });

  return { ok: true, grant_id: grant.id, new_expires_at: newExpires.toISOString() };
}

// Cancelamento pelo provedor (assinante cancelou na Cakto ou não pagou renovação):
// mantém acesso até expires_at atual; marca grant como cancel_requested_at.
async function handleSubscriptionCanceled(args: { subscriptionId: string; payload: any; sellerProfileId?: string | null }) {
  const { data: grant } = await supabaseAdmin
    .from("access_grants")
    .select("id, seller_profile_id, lead_id, telegram_user_id")
    .eq("cakto_subscription_id", args.subscriptionId)
    .eq("status", "active")
    .maybeSingle();

  if (!grant) return { ok: false, error: "grant_not_found_for_subscription" };

  await supabaseAdmin.from("access_grants").update({
    cancel_requested_at: new Date().toISOString(),
    next_charge_at: null,
  }).eq("id", grant.id);

  await supabaseAdmin.from("cancellation_events").insert({
    seller_profile_id: grant.seller_profile_id,
    access_grant_id: grant.id,
    lead_id: grant.lead_id,
    telegram_user_id: grant.telegram_user_id,
    stage: "confirmed",
    outcome: "canceled_by_provider",
    metadata: args.payload,
  });

  await supabaseAdmin.from("activity_logs").insert({
    type: "subscription_canceled",
    description: "Assinatura cancelada — acesso continua até expirar",
    metadata: { grant_id: grant.id, subscription_id: args.subscriptionId },
  });

  return { ok: true, grant_id: grant.id };
}
