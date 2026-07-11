import { createServerFn } from "@tanstack/react-start";

// Cria um checkout Cakto:
// - prioriza cakto_checkout_url cadastrada na oferta (caminho mais simples e estável);
// - se CAKTO_API_KEY estiver configurada, futura integração via API entra aqui.
// Gera order + payment(pending → checkout_sent) e retorna a URL.
export const createCaktoCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: {
    leadId: string;
    telegramUserId: string;
    itemType: "plan" | "content";
    planId?: string;
    contentId?: string;
  }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const table = data.itemType === "plan" ? "plans" : "contents";
    const itemId = data.itemType === "plan" ? data.planId : data.contentId;
    if (!itemId) return { ok: false, error: "item_id_required" };

    const { data: item } = await supabaseAdmin
      .from(table)
      .select("*")
      .eq("id", itemId)
      .maybeSingle();
    if (!item) return { ok: false, error: "item_not_found" };

    const externalRef = `ord_${crypto.randomUUID()}`;

    // Cria order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        seller_profile_id: (item as any).seller_profile_id,
        lead_id: data.leadId,
        telegram_user_id: data.telegramUserId,
        item_type: data.itemType,
        plan_id: data.itemType === "plan" ? itemId : null,
        content_id: data.itemType === "content" ? itemId : null,
        amount_cents: (item as any).price_cents,
        status: "checkout_sent",
        provider: "cakto",
        external_reference: externalRef,
        checkout_url: (item as any).cakto_checkout_url,
      })
      .select("id")
      .single();
    if (orderErr || !order) return { ok: false, error: orderErr?.message ?? "order_failed" };

    // Cria payment vinculado
    const checkoutUrl = (item as any).cakto_checkout_url
      ? `${(item as any).cakto_checkout_url}${(item as any).cakto_checkout_url.includes("?") ? "&" : "?"}ref=${externalRef}`
      : null;

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .insert({
        seller_profile_id: (item as any).seller_profile_id,
        order_id: order.id,
        lead_id: data.leadId,
        provider: "cakto",
        method: "pix",
        status: "checkout_sent",
        amount_cents: (item as any).price_cents,
        checkout_url: checkoutUrl,
      })
      .select("id")
      .single();

    await supabaseAdmin.from("activity_logs").insert({
      type: "checkout_sent",
      telegram_user_id: data.telegramUserId,
      description: `Checkout Cakto enviado: ${(item as any).name}`,
      metadata: { order_id: order.id, payment_id: payment?.id, amount_cents: (item as any).price_cents },
    });

    return { ok: true, orderId: order.id, paymentId: payment?.id, checkoutUrl, item };
  });

// Botão "Evento de teste" — agora cria evento vinculado ao perfil ativo.
export const sendCaktoTestEvent = createServerFn({ method: "POST" })
  .inputValidator((input: { sellerProfileId?: string | null } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const fakeId = `test_${Date.now()}`;
    await supabaseAdmin.from("cakto_events").insert({
      seller_profile_id: data?.sellerProfileId ?? null,
      payload: { test: true, status: "approved", payment_id: fakeId, amount: 29.9 },
      buyer_email: "teste@exemplo.com",
      amount: 29.9,
      status: "approved",
      cakto_payment_id: fakeId,
      action: "pending",
    });
    return { ok: true, fakeId };
  });

// Reconcilia: reprocessa TODOS os eventos brutos ainda não processados (ou com erro) do perfil.
// Útil quando o webhook cair, ou pra "puxar" eventos que ficaram órfãos.
export const reconcileCakto = createServerFn({ method: "POST" })
  .inputValidator((input: { sellerProfileId?: string | null; limit?: number } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { processCaktoEvent } = await import("@/lib/cakto-processor.server");

    let qb = supabaseAdmin
      .from("cakto_webhook_events")
      .select("id, payload, seller_profile_id")
      .eq("processed", false)
      .order("created_at", { ascending: true })
      .limit(data?.limit ?? 50);
    if (data?.sellerProfileId) qb = qb.eq("seller_profile_id", data.sellerProfileId);

    const { data: pending } = await qb;
    if (!pending?.length) return { ok: true, processed: 0, results: [] };

    const results: any[] = [];
    for (const ev of pending) {
      try {
        const r = await processCaktoEvent({
          payload: ev.payload,
          sellerProfileId: (ev as any).seller_profile_id ?? data?.sellerProfileId ?? null,
          rawEventId: ev.id,
        });
        results.push({ id: ev.id, ok: (r as any).ok !== false, kind: (r as any).kind });
      } catch (err: any) {
        await supabaseAdmin.from("cakto_webhook_events").update({
          processed: true, processing_error: String(err?.message ?? err), processed_at: new Date().toISOString(),
        }).eq("id", ev.id);
        results.push({ id: ev.id, ok: false, error: String(err?.message ?? err) });
      }
    }
    return { ok: true, processed: results.length, results };
  });

// Registra um pedido de cancelamento vindo do bot ou do painel.
// Não cancela a assinatura na Cakto ainda — só registra pra fluxo de retenção.
export const requestCancellation = createServerFn({ method: "POST" })
  .inputValidator((input: { grantId: string; reason?: string | null }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: grant } = await supabaseAdmin
      .from("access_grants")
      .select("id, seller_profile_id, lead_id, telegram_user_id, plans(name, price_cents)")
      .eq("id", data.grantId)
      .maybeSingle();
    if (!grant) return { ok: false, error: "grant_not_found" };

    await supabaseAdmin.from("access_grants").update({
      cancel_requested_at: new Date().toISOString(),
    }).eq("id", grant.id);

    const { data: ev } = await supabaseAdmin.from("cancellation_events").insert({
      seller_profile_id: grant.seller_profile_id,
      access_grant_id: grant.id,
      lead_id: grant.lead_id,
      telegram_user_id: grant.telegram_user_id,
      stage: "requested",
      reason: data.reason ?? null,
    }).select("id").single();

    return { ok: true, cancellationEventId: ev?.id, plan: (grant as any).plans };
  });

// Registra que uma oferta de retenção foi mostrada / lead foi retido.
export const recordRetentionOutcome = createServerFn({ method: "POST" })
  .inputValidator((input: {
    cancellationEventId: string;
    offerShown?: string;
    outcome: "retained" | "canceled" | "no_response";
  }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("cancellation_events").update({
      stage: data.outcome === "retained" ? "retained" : "confirmed",
      offer_shown: data.offerShown ?? null,
      outcome: data.outcome,
    }).eq("id", data.cancellationEventId);
    return { ok: true };
  });

