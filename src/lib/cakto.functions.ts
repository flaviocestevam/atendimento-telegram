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

// Botão "Evento de teste" na tela de Configurações.
export const sendCaktoTestEvent = createServerFn({ method: "POST" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const fakeId = `test_${Date.now()}`;
    await supabaseAdmin.from("cakto_events").insert({
      payload: { test: true, status: "approved", payment_id: fakeId, amount: 29.9 },
      buyer_email: "teste@exemplo.com",
      amount: 29.9,
      status: "approved",
      cakto_payment_id: fakeId,
      action: "pending",
    });
    return { ok: true, fakeId };
  });
